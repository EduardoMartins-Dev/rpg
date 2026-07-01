package com.portalrpg.rag;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.portalrpg.campaign.Campaign;
import com.portalrpg.campaign.CampaignRepository;
import com.portalrpg.common.ApiException;
import com.portalrpg.rag.DocumentChunkStore.RetrievedChunk;
import com.portalrpg.rag.dto.RagDtos.AskResponse;
import com.portalrpg.rag.dto.RagDtos.PowerTextResponse;
import com.portalrpg.rag.dto.RagDtos.SourceChunk;

/**
 * Consulta RAG escopada ao system_id da campanha. O filtro por system_id é o ponto
 * testado de isolamento entre sistemas (prompt §6). Sem chunks indexados ⇒ fallback
 * claro, sem alucinar de outro corpus.
 */
@Service
public class RagQueryService {

    static final String FALLBACK =
            "Não há material indexado para este sistema; não posso responder com base no livro.";
    // TOP_K alto p/ cobrir todos os poderes de uma disciplina (cada poder é um trecho). O
    // gerador (Gemini) tem contexto de 1M tokens, então não é mais o gargalo que era no Groq.
    private static final int TOP_K = 40;

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(RagQueryService.class);

    private final CampaignRepository campaigns;
    private final com.portalrpg.system.RpgSystemRepository systems;
    private final DocumentChunkStore store;
    private final EmbeddingModel embeddings;
    private final ChatModel chat;
    private final PowerExplanationStore explanations;

    public RagQueryService(CampaignRepository campaigns,
            com.portalrpg.system.RpgSystemRepository systems, DocumentChunkStore store,
            EmbeddingModel embeddings, ChatModel chat, PowerExplanationStore explanations) {
        this.campaigns = campaigns;
        this.systems = systems;
        this.store = store;
        this.embeddings = embeddings;
        this.chat = chat;
        this.explanations = explanations;
    }

    // Quantos trechos por poder no retrieval direcionado. 3 dá folga p/ nomes parecidos
    // (ex.: Draught of Elegance vs Draught of Endurance) — o corpo certo entra junto. */
    private static final int PER_POWER_K = 3;

    @Transactional(readOnly = true)
    public AskResponse ask(UUID campaignId, String question) {
        UUID systemId = systemOf(campaignId);
        List<RetrievedChunk> chunks = groundChunks(systemId, question);
        boolean grounded = !chunks.isEmpty();
        String answer = grounded ? chat.generate(question, chunks, systemId) : FALLBACK;
        List<SourceChunk> sources = chunks.stream()
                .map(c -> new SourceChunk(c.content(), c.systemId())).toList();
        return new AskResponse(campaignId, systemId, question, answer, grounded, sources);
    }

    /** Retrieval ancorado no sistema da campanha — usado pelo chat com histórico. */
    @Transactional(readOnly = true)
    public Grounding retrieve(UUID campaignId, String question) {
        UUID systemId = systemOf(campaignId);
        return new Grounding(systemId, groundChunks(systemId, question));
    }

    /** Retrieval combinado: (1) busca direcionada por poder da disciplina citada — garante o
     *  trecho de CADA poder mesmo com o índice poluído por outros livros — e (2) busca geral
     *  pela pergunta expandida. Junta sem duplicar (direcionados primeiro) e prepende o
     *  catálogo. Resolve o caso "liste os poderes e a mecânica de cada um", onde a query única
     *  trazia só 1-2 poderes e ruído. */
    private List<RetrievedChunk> groundChunks(UUID systemId, String question) {
        List<RetrievedChunk> targeted = targetedPowerChunks(systemId, question);
        List<RetrievedChunk> general =
                store.search(systemId, embeddings.embed(expandedQuery(systemId, question)), TOP_K);

        java.util.LinkedHashMap<String, RetrievedChunk> dedup = new java.util.LinkedHashMap<>();
        for (RetrievedChunk c : targeted) {
            dedup.putIfAbsent(c.content(), c); // direcionados primeiro = prioridade no contexto
        }
        for (RetrievedChunk c : general) {
            dedup.putIfAbsent(c.content(), c);
        }
        return withCatalog(systemId, question, new java.util.ArrayList<>(dedup.values()));
    }

    /** Busca o trecho de cada poder da(s) disciplina(s) citada(s). Combina:
     *  (a) busca por PALAVRA-CHAVE pelo nome do poder (inglês, que está colado no chunk) —
     *      determinística e essencial p/ poderes quase idênticos (Draught of Elegance vs
     *      Endurance), que a busca vetorial confunde; e
     *  (b) busca VETORIAL por poder, p/ pegar o trecho mesmo se o nome não casar exato.
     *  Um único embedAll (lote) evita N chamadas ao provedor de embeddings. */
    private List<RetrievedChunk> targetedPowerChunks(UUID systemId, String question) {
        if (!isV5(systemId)) {
            return List.of();
        }
        var powers = com.portalrpg.rules.V5CatalogText.powerKeywords(question);
        if (powers.isEmpty()) {
            return List.of();
        }
        List<RetrievedChunk> out = new java.util.ArrayList<>();
        // (a) keyword pelo nome em inglês (colado no início do corpo do poder)
        for (String en : powers) {
            out.addAll(store.searchByKeyword(systemId, en, 1));
        }
        // (b) vetorial por poder (nome PT + inglês)
        List<String> queries = com.portalrpg.rules.V5CatalogText.powerQueries(question);
        List<float[]> vectors = embeddings.embedAll(queries);
        for (float[] v : vectors) {
            out.addAll(store.search(systemId, v, PER_POWER_K));
        }
        return out;
    }

    /** Expande a query de busca (apenas v5) com os nomes dos poderes da disciplina citada,
     *  para que o trecho de cada poder seja recuperado mesmo quando seu texto não menciona a
     *  disciplina. Não altera a pergunta enviada ao gerador — só o vetor de busca. */
    private String expandedQuery(UUID systemId, String question) {
        if (!isV5(systemId)) {
            return question;
        }
        String ext = com.portalrpg.rules.V5CatalogText.retrievalExpansion(question);
        return ext.isBlank() ? question : question + " " + ext;
    }

    private boolean isV5(UUID systemId) {
        return systems.findById(systemId)
                .map(s -> "v5".equalsIgnoreCase(s.getRuleset()))
                .orElse(false);
    }

    /** Prepende a referência canônica V5 (se o sistema for v5) aos trechos do livro. O bloco
     *  é contextual à pergunta (só expande o clã/disciplina citado) para economizar tokens. */
    private List<RetrievedChunk> withCatalog(UUID systemId, String question,
            List<RetrievedChunk> chunks) {
        if (chunks.isEmpty()) {
            return chunks; // sem material indexado: mantém o fallback honesto (não injeta catálogo)
        }
        if (!isV5(systemId)) {
            return chunks;
        }
        List<RetrievedChunk> out = new java.util.ArrayList<>(chunks.size() + 1);
        out.add(new RetrievedChunk(
                com.portalrpg.rules.V5CatalogText.referenceBlock(question), systemId));
        out.addAll(chunks);
        return out;
    }

    /** Resultado do retrieval: o sistema e os chunks recuperados. */
    public record Grounding(UUID systemId, List<RetrievedChunk> chunks) {
    }

    /** E2E-SHEET-13 — texto integral de um poder de disciplina, lido do PDF indexado. */
    @Transactional(readOnly = true)
    public PowerTextResponse powerText(UUID campaignId, String power) {
        UUID systemId = systemOf(campaignId);
        List<RetrievedChunk> chunks = store.search(systemId, embeddings.embed(power), 5);
        String needle = normalize(power);
        RetrievedChunk best = chunks.stream()
                .filter(c -> normalize(c.content()).contains(needle))
                .findFirst()
                .orElseThrow(() -> ApiException.notFound(
                        "no indexed text found for power: " + power));
        return new PowerTextResponse(systemId, power, best.content());
    }

    /** Explicação COMPLETA do poder em PT-BR: a IA traduz e organiza o trecho INTEGRAL do livro
     *  indexado, sem cortar nada relevante (funcionamento, custo, tipo de ação, parada de dados,
     *  sistema, duração, amálgama), ancorada só no trecho (AiPrompts.SYSTEM proíbe inventar).
     *  Cacheada por sistema+poder. Retorna null em `text` quando o poder não está no índice — o
     *  front cai para a descrição manual do catálogo (nunca fica vazio). */
    @Transactional
    public PowerTextResponse powerExplained(UUID campaignId, String power) {
        UUID systemId = systemOf(campaignId);
        String norm = normalize(power);
        // Cache persistente: gerado uma vez, servido do banco para sempre (poupa a cota diária).
        var cached = explanations.find(systemId, norm);
        if (cached.isPresent()) {
            return new PowerTextResponse(systemId, power, cached.get());
        }
        List<RetrievedChunk> ctx = chunksFor(systemId, power);
        if (ctx.isEmpty()) {
            return new PowerTextResponse(systemId, power, null); // não indexado → front usa a descrição do catálogo
        }
        String question = "Traduza e reorganize para PORTUGUÊS DO BRASIL a informação COMPLETA do "
                + "poder \"" + power + "\" de Vampiro: A Máscara (V5), usando SOMENTE o trecho "
                + "fornecido. NÃO resuma: traga TODOS os detalhes mecânicos presentes no trecho. "
                + "Responda em Markdown com as seções abaixo, cada rótulo em negrito; omita a seção "
                + "só se o trecho realmente não trouxer aquilo:\n"
                + "**Descrição:** (o que o poder é e faz, texto integral traduzido)\n"
                + "**Custo:** (ex.: um Rouse Check, gratuito, etc.)\n"
                + "**Tipo de ação:** (simples, livre, reflexa, prolongada…)\n"
                + "**Parada de dados:** (o teste/disputa exato, traduzido)\n"
                + "**Duração:** (passiva, uma cena, uma noite…)\n"
                + "**Sistema:** (passo a passo de como se usa, completo)\n"
                + "**Amálgama:** (se o trecho citar disciplina/nível exigidos)\n"
                + "Não repita o nome do poder como título/cabeçalho (ele já é exibido). "
                + "Não invente nada fora do trecho.";
        String answer;
        try {
            answer = chat.generate(question, ctx, systemId);
        } catch (ApiException e) {
            // Erro do provedor (ex.: 429 cota diária). Não cacheia e devolve mensagem curta —
            // nunca despeja o erro cru do provedor na tela; o front mantém a descrição do catálogo.
            log.warn("powerExplained: falha do provedor de IA para '{}': {}", power, e.getMessage());
            throw new ApiException(org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE,
                    "Serviço de tradução do livro indisponível no momento (limite temporário). "
                            + "Tente novamente mais tarde.");
        }
        explanations.save(systemId, norm, power, answer);
        return new PowerTextResponse(systemId, power, answer);
    }

    /** Trechos do poder: combina keyword pelo nome (preciso p/ nomes parecidos) e vetorial, sem
     *  duplicar. Traz mais de um chunk porque a entrada de um poder pode atravessar a fronteira
     *  de chunking — assim a explicação sai COMPLETA, não cortada no meio. */
    private List<RetrievedChunk> chunksFor(UUID systemId, String power) {
        java.util.LinkedHashMap<String, RetrievedChunk> dedup = new java.util.LinkedHashMap<>();
        for (RetrievedChunk c : store.searchByKeyword(systemId, power, 3)) {
            dedup.putIfAbsent(c.content(), c);
        }
        String needle = normalize(power);
        store.search(systemId, embeddings.embed(power), 6).stream()
                .filter(c -> normalize(c.content()).contains(needle))
                .forEach(c -> dedup.putIfAbsent(c.content(), c));
        return new java.util.ArrayList<>(dedup.values());
    }

    private UUID systemOf(UUID campaignId) {
        Campaign c = campaigns.findById(campaignId)
                .orElseThrow(() -> ApiException.notFound("campaign not found"));
        return c.getSystemId();
    }

    /** Normaliza p/ comparação de substring: tira acentos, funde apóstrofos (o PDF usa o curvo
     *  ’ e a busca o reto ') e colapsa espaços/quebras de linha — assim nomes possessivos
     *  (Baal's Caress) e nomes que o extrator quebrou entre linhas ainda casam. */
    private static String normalize(String s) {
        String n = Normalizer.normalize(s, Normalizer.Form.NFD).replaceAll("\\p{M}+", "");
        n = n.replaceAll("['’‘`´]", "");
        n = n.replaceAll("\\s+", " ").trim();
        return n.toLowerCase(Locale.ROOT);
    }
}
