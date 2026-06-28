package com.portalrpg.rag;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import com.portalrpg.common.ApiException;

/**
 * Embedding semântico via API da Jina (jina-embeddings-v3, multilíngue, bom em PT).
 * Ativado SOMENTE quando {@code app.embeddings.provider=jina} (env EMBEDDINGS_PROVIDER)
 * — assim tests/dev seguem no {@link HashingEmbeddingModel} sem depender de rede.
 * Dimensão 1024 (Matryoshka), casa com {@code vector(1024)} de document_chunks (V7).
 *
 * task=text-matching gera embeddings simétricos (mesma transformação p/ chunk e
 * pergunta), adequado à interface única {@link #embed(String)}.
 */
@Component
@ConditionalOnProperty(prefix = "app.embeddings", name = "provider", havingValue = "jina")
public class JinaEmbeddingModel implements EmbeddingModel {

    public static final int DIM = 1024;

    private final RestClient http;
    private final String model;

    public JinaEmbeddingModel(
            @Value("${app.embeddings.jina.base-url:https://api.jina.ai/v1}") String baseUrl,
            @Value("${app.embeddings.jina.api-key:}") String apiKey,
            @Value("${app.embeddings.jina.model:jina-embeddings-v3}") String model) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("app.embeddings.provider=jina requires JINA_API_KEY");
        }
        this.model = model;
        this.http = RestClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader("Authorization", "Bearer " + apiKey)
                .build();
    }

    @Override
    public int dimension() {
        return DIM;
    }

    @Override
    public float[] embed(String text) {
        String input = (text == null || text.isBlank()) ? " " : text;
        Map<String, Object> body = Map.of(
                "model", model,
                "task", "text-matching",
                "dimensions", DIM,
                "input", List.of(input));
        try {
            JinaResponse res = http.post()
                    .uri("/embeddings")
                    .body(body)
                    .retrieve()
                    .body(JinaResponse.class);
            if (res == null || res.data() == null || res.data().isEmpty()
                    || res.data().get(0).embedding() == null) {
                throw new ApiException(HttpStatus.BAD_GATEWAY, "empty embedding from Jina");
            }
            List<Double> e = res.data().get(0).embedding();
            float[] v = new float[e.size()];
            for (int i = 0; i < e.size(); i++) {
                v[i] = e.get(i).floatValue();
            }
            return v;
        } catch (ApiException ex) {
            throw ex;
        } catch (RuntimeException ex) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Jina embeddings error: " + ex.getMessage());
        }
    }

    // --- shape mínimo da resposta da Jina (compatível OpenAI) ---
    record JinaResponse(List<Data> data) {
    }

    record Data(List<Double> embedding) {
    }
}
