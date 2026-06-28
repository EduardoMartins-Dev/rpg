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
        return request(List.of(input)).get(0);
    }

    @Override
    public List<float[]> embedAll(List<String> texts) {
        if (texts.isEmpty()) {
            return List.of();
        }
        // textos vazios quebram a API; troca por espaço (mantém a posição no lote).
        List<String> inputs = texts.stream()
                .map(t -> (t == null || t.isBlank()) ? " " : t)
                .toList();
        return request(inputs);
    }

    /** Uma chamada à Jina para N textos; devolve vetores na MESMA ordem da entrada. */
    private List<float[]> request(List<String> inputs) {
        Map<String, Object> body = Map.of(
                "model", model,
                "task", "text-matching",
                "dimensions", DIM,
                "input", inputs);
        try {
            JinaResponse res = http.post()
                    .uri("/embeddings")
                    .body(body)
                    .retrieve()
                    .body(JinaResponse.class);
            if (res == null || res.data() == null || res.data().size() != inputs.size()) {
                throw new ApiException(HttpStatus.BAD_GATEWAY, "unexpected embedding count from Jina");
            }
            float[][] ordered = new float[inputs.size()][];
            for (Data d : res.data()) {
                if (d.embedding() == null) {
                    throw new ApiException(HttpStatus.BAD_GATEWAY, "empty embedding from Jina");
                }
                int idx = d.index() == null ? 0 : d.index();
                float[] v = new float[d.embedding().size()];
                for (int i = 0; i < v.length; i++) {
                    v[i] = d.embedding().get(i).floatValue();
                }
                ordered[idx] = v;
            }
            return List.of(ordered);
        } catch (ApiException ex) {
            throw ex;
        } catch (RuntimeException ex) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "Jina embeddings error: " + ex.getMessage());
        }
    }

    // --- shape mínimo da resposta da Jina (compatível OpenAI) ---
    record JinaResponse(List<Data> data) {
    }

    record Data(Integer index, List<Double> embedding) {
    }
}
