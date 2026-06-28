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

    private final CampaignRepository campaigns;
    private final com.portalrpg.system.RpgSystemRepository systems;
    private final DocumentChunkStore store;
    private final EmbeddingModel embeddings;
    private final ChatModel chat;

    public RagQueryService(CampaignRepository campaigns,
            com.portalrpg.system.RpgSystemRepository systems, DocumentChunkStore store,
            EmbeddingModel embeddings, ChatModel chat) {
        this.campaigns = campaigns;
        this.systems = systems;
        this.store = store;
        this.embeddings = embeddings;
        this.chat = chat;
    }

    @Transactional(readOnly = true)
    public AskResponse ask(UUID campaignId, String question) {
        UUID systemId = systemOf(campaignId);
        List<RetrievedChunk> chunks = withCatalog(systemId, question,
                store.search(systemId, embeddings.embed(expandedQuery(systemId, question)), TOP_K));
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
        List<RetrievedChunk> chunks = withCatalog(systemId, question,
                store.search(systemId, embeddings.embed(expandedQuery(systemId, question)), TOP_K));
        return new Grounding(systemId, chunks);
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

    private UUID systemOf(UUID campaignId) {
        Campaign c = campaigns.findById(campaignId)
                .orElseThrow(() -> ApiException.notFound("campaign not found"));
        return c.getSystemId();
    }

    private static String normalize(String s) {
        return Normalizer.normalize(s, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "").toLowerCase(Locale.ROOT);
    }
}
