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
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestClient;

import com.portalrpg.common.ApiException;
import com.portalrpg.rag.DocumentChunkStore.RetrievedChunk;

/**
 * Geração real via Google Gemini (generativelanguage API). Ativada SOMENTE quando
 * {@code app.ai.provider=gemini} (env AI_PROVIDER) — assim os testes seguem herméticos
 * (usam o {@link EchoChatModel}). Mesma âncora do Groq: o prompt instrui o modelo a
 * responder só com base nos chunks do sistema da campanha (ver {@link AiPrompts#SYSTEM}).
 * Tier free do Gemini tem cota diária bem maior que o Groq, sem cortar o contexto.
 */
@Component
@ConditionalOnProperty(prefix = "app.ai", name = "provider", havingValue = "gemini")
public class GeminiChatModel implements ChatModel {

    /** Teto generoso de saída — evita resposta gigante acidental sem truncar respostas reais. */
    private static final int MAX_OUTPUT_TOKENS = 2048;
    /** Retry para 429 (cota) e 5xx (ex.: 503 "high demand", comum no flash free). */
    private static final int MAX_RETRIES = 4;
    private static final long RETRY_WAIT_MS = 4_000;

    private final RestClient http;
    private final String model;

    public GeminiChatModel(
            @Value("${app.ai.gemini.base-url:https://generativelanguage.googleapis.com/v1beta}") String baseUrl,
            @Value("${app.ai.gemini.api-key:}") String apiKey,
            @Value("${app.ai.gemini.model:gemini-2.0-flash}") String model) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("app.ai.provider=gemini requires GEMINI_API_KEY");
        }
        this.model = model;
        this.http = RestClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader("x-goog-api-key", apiKey) // header evita vazar a key na URL
                .build();
    }

    @Override
    public String generate(String question, List<RetrievedChunk> sources, UUID systemId, List<Turn> history) {
        String context = sources.stream().map(RetrievedChunk::content)
                .collect(Collectors.joining("\n---\n"));

        List<Map<String, Object>> contents = new ArrayList<>();
        // Histórico da conversa — Gemini usa "user"/"model" (não "assistant").
        for (Turn t : history) {
            String role = "assistant".equals(t.role()) ? "model" : "user";
            contents.add(turn(role, t.content()));
        }
        contents.add(turn("user",
                "Contexto (system_id=" + systemId + "):\n" + context
                        + "\n\nPergunta: " + question));

        Map<String, Object> generationConfig = new java.util.HashMap<>();
        generationConfig.put("temperature", 0.2);
        generationConfig.put("maxOutputTokens", MAX_OUTPUT_TOKENS);
        // thinkingConfig só existe nos modelos 2.5+ (mandar p/ 2.0 dá erro "unknown field").
        if (model.contains("2.5")) {
            // desliga o "thinking": desnecessário p/ RAG, mais barato, e evita resposta vazia
            // quando o thinking consome todo o orçamento de saída.
            generationConfig.put("thinkingConfig", Map.of("thinkingBudget", 0));
        }
        Map<String, Object> body = Map.of(
                "system_instruction", Map.of("parts", List.of(Map.of("text", AiPrompts.SYSTEM))),
                "contents", contents,
                "generationConfig", generationConfig);

        RuntimeException last = null;
        for (int attempt = 0; attempt < MAX_RETRIES; attempt++) {
            try {
                GeminiResponse res = http.post()
                        .uri("/models/{model}:generateContent", model)
                        .body(body)
                        .retrieve()
                        .body(GeminiResponse.class);
                String text = firstText(res);
                if (text == null || text.isBlank()) {
                    throw new ApiException(HttpStatus.BAD_GATEWAY, "empty response from AI provider");
                }
                return text;
            } catch (HttpStatusCodeException e) {
                int code = e.getStatusCode().value();
                if ((code == 429 || code >= 500) && attempt < MAX_RETRIES - 1) {
                    last = e;
                    sleep(RETRY_WAIT_MS * (attempt + 1)); // backoff linear p/ overload transitório
                    continue;
                }
                throw new ApiException(HttpStatus.BAD_GATEWAY, "AI provider error: " + e.getMessage());
            } catch (ApiException e) {
                throw e;
            } catch (RuntimeException e) {
                throw new ApiException(HttpStatus.BAD_GATEWAY, "AI provider error: " + e.getMessage());
            }
        }
        throw new ApiException(HttpStatus.BAD_GATEWAY,
                "AI provider indisponível após retentativas: "
                        + (last == null ? "" : last.getMessage()));
    }

    private static void sleep(long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
            throw new ApiException(HttpStatus.BAD_GATEWAY, "interrupted waiting for AI provider");
        }
    }

    private static Map<String, Object> turn(String role, String text) {
        return Map.of("role", role, "parts", List.of(Map.of("text", text)));
    }

    private static String firstText(GeminiResponse res) {
        if (res == null || res.candidates() == null || res.candidates().isEmpty()) {
            return null;
        }
        Content c = res.candidates().get(0).content();
        if (c == null || c.parts() == null || c.parts().isEmpty()) {
            return null;
        }
        return c.parts().stream().map(Part::text).filter(t -> t != null)
                .collect(Collectors.joining());
    }

    // --- minimal Gemini generateContent response shape ---
    record GeminiResponse(List<Candidate> candidates) {
    }

    record Candidate(Content content) {
    }

    record Content(List<Part> parts) {
    }

    record Part(String text) {
    }
}
