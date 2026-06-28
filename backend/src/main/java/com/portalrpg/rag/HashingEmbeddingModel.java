package com.portalrpg.rag;

import java.text.Normalizer;
import java.util.Locale;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Embedding lexical determinístico: term-frequency com hashing trick, dimensão 1024,
 * normalizado L2. Acentos removidos e caixa baixa, então "Vitalidade" no chunk casa
 * "vitalidade" na pergunta. Similaridade de cosseno (pgvector {@code <=>}) ranqueia
 * sobreposição de termos — suficiente para a recuperação testada nas fixtures, e sem
 * depender de modelo externo. Mesma entrada ⇒ mesmo vetor (idempotência da suíte).
 *
 * É o EmbeddingModel PADRÃO (tests/dev). Em prod, EMBEDDINGS_PROVIDER=jina ativa o
 * {@link JinaEmbeddingModel} (semântico). Ambos produzem dimensão 1024 — casa com
 * {@code vector(1024)} de document_chunks (V7).
 */
@Component
@ConditionalOnProperty(prefix = "app.embeddings", name = "provider", havingValue = "hashing", matchIfMissing = true)
public class HashingEmbeddingModel implements EmbeddingModel {

    public static final int DIM = 1024; // casa com vector(1024) (V7) e com a dim do jina-v3

    @Override
    public int dimension() {
        return DIM;
    }

    @Override
    public float[] embed(String text) {
        float[] v = new float[DIM];
        if (text == null || text.isBlank()) {
            return v;
        }
        String norm = Normalizer.normalize(text, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .toLowerCase(Locale.ROOT);
        for (String token : norm.split("[^a-z0-9]+")) {
            if (token.length() < 2) {
                continue;
            }
            int bucket = Math.floorMod(token.hashCode(), DIM);
            v[bucket] += 1.0f;
        }
        double norm2 = 0.0;
        for (float f : v) {
            norm2 += (double) f * f;
        }
        if (norm2 > 0) {
            float inv = (float) (1.0 / Math.sqrt(norm2));
            for (int i = 0; i < DIM; i++) {
                v[i] *= inv;
            }
        }
        return v;
    }
}
