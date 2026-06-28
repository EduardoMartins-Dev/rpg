package com.portalrpg.rag;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import com.portalrpg.common.ApiException;
import com.portalrpg.rag.DocumentChunkStore.RetrievedChunk;

/**
 * Geração real via API compatível com OpenAI (Groq por padrão). Ativada SOMENTE quando
 * {@code app.ai.provider=groq} (env AI_PROVIDER) — assim os testes continuam herméticos
 * (usam o {@link EchoChatModel}). A resposta é ANCORADA: o prompt instrui o modelo a
 * responder apenas com base nos chunks recuperados do sistema da campanha.
 */
@Component
@ConditionalOnProperty(prefix = "app.ai", name = "provider", havingValue = "groq")
public class GroqChatModel implements ChatModel {

    private static final String SYSTEM_PROMPT = """
            Você é um assistente de regras de RPG de mesa. Responda SEMPRE em português do
            Brasil, de forma objetiva, USANDO SOMENTE o contexto fornecido (trechos do livro
            do sistema da campanha e a REFERÊNCIA OFICIAL DO SISTEMA, quando presente). O
            contexto pode estar em inglês: traduza o conteúdo relevante para o português
            (mantenha nomes próprios de clãs, disciplinas e termos de jogo, mas explique em
            português). Quando houver uma REFERÊNCIA OFICIAL com listas canônicas (clãs,
            disciplinas, poderes por nível), use-a como verdade para os NOMES e NÍVEIS; os
            trechos do livro detalham custo/mecânica de cada item.

            REGRAS RÍGIDAS (anti-alucinação):
            - Cite poderes APENAS pelos nomes que aparecem no contexto (REFERÊNCIA OFICIAL ou
              trechos do livro). NUNCA invente nomes de poderes.
            - Na REFERÊNCIA OFICIAL, cada poder traz o nome em inglês entre colchetes, ex.:
              "N1 Graça Felina [Cat's Grace]". Os trechos do livro estão em inglês e cada poder
              começa com seu nome (ex.: "cat's grace", "fleetness"). Para descrever a MECÂNICA
              de um poder, use SOMENTE o trecho cujo nome (PT ou o inglês entre colchetes) é o
              mesmo poder. NUNCA pegue a mecânica de um poder e atribua a outro.
            - Se não houver um trecho do livro correspondente àquele poder específico, diga que
              a mecânica dele não está no material indexado — NÃO preencha com a mecânica de
              outro poder nem de cabeça (ex.: não confunda Graça Felina com Fugacidade).
            - NUNCA invente custos em pontos de experiência (XP). Só mencione um custo se ele
              estiver explícito no contexto; em V5 sobe-se o nível da Disciplina, não se
              "compra poder por poder" — não fabrique tabelas de XP.
            - Reproduza Custo, Sistema (Dice Pools/Difficulty) e Duração exatamente como no
              trecho do poder, traduzindo para o português.
            - Se o contexto não cobrir a pergunta, diga claramente que não há material
              indexado suficiente. NÃO use conhecimento de fora do contexto.

            FORMATO: responda em Markdown — use títulos (##), listas (-), negrito (**) e
            tabelas quando ajudar a organizar. Não envolva a resposta inteira em bloco de código.""";

    private final RestClient http;
    private final String model;

    public GroqChatModel(
            @Value("${app.ai.groq.base-url:https://api.groq.com/openai/v1}") String baseUrl,
            @Value("${app.ai.groq.api-key:}") String apiKey,
            @Value("${app.ai.groq.model:llama-3.3-70b-versatile}") String model) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("app.ai.provider=groq requires GROQ_API_KEY");
        }
        this.model = model;
        this.http = RestClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .build();
    }

    @Override
    public String generate(String question, List<RetrievedChunk> sources, UUID systemId, List<Turn> history) {
        String context = sources.stream().map(RetrievedChunk::content)
                .collect(Collectors.joining("\n---\n"));
        List<Map<String, Object>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", SYSTEM_PROMPT));
        // Histórico da conversa (turnos anteriores), para continuidade estilo ChatGPT.
        for (Turn t : history) {
            String role = "assistant".equals(t.role()) ? "assistant" : "user";
            messages.add(Map.of("role", role, "content", t.content()));
        }
        messages.add(Map.of("role", "user", "content",
                "Contexto (system_id=" + systemId + "):\n" + context
                        + "\n\nPergunta: " + question));
        Map<String, Object> body = Map.of(
                "model", model,
                "temperature", 0.2,
                "messages", messages);
        try {
            GroqResponse res = http.post()
                    .uri("/chat/completions")
                    .body(body)
                    .retrieve()
                    .body(GroqResponse.class);
            if (res == null || res.choices() == null || res.choices().isEmpty()) {
                throw new ApiException(HttpStatus.BAD_GATEWAY, "empty response from AI provider");
            }
            return res.choices().get(0).message().content();
        } catch (ApiException e) {
            throw e;
        } catch (RuntimeException e) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "AI provider error: " + e.getMessage());
        }
    }

    // --- minimal OpenAI-compatible response shape ---
    record GroqResponse(List<Choice> choices) {
    }

    record Choice(Message message) {
    }

    record Message(String content) {
    }
}
