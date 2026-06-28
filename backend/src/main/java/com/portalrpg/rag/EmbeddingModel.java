package com.portalrpg.rag;

/**
 * Produz embeddings para chunks e perguntas. Abstração própria (não Spring AI) para
 * manter a indexação/recuperação 100% local e determinística — sem chamadas externas,
 * sem segredos em CI. Um provedor real (OpenAI/Groq) poderia implementar esta interface
 * por trás de um profile, mas o RETRIEVAL validado nos testes usa o modelo local.
 */
public interface EmbeddingModel {

    /** Dimensão do vetor — deve casar com document_chunks.embedding vector(N). */
    int dimension();

    float[] embed(String text);

    /**
     * Embedding em lote (uma chamada para vários textos). O padrão itera {@link #embed},
     * mas provedores remotos sobrescrevem para mandar tudo num request — corta drasticamente
     * latência/rate-limit na indexação de documentos grandes. Saída na MESMA ordem da entrada.
     */
    default java.util.List<float[]> embedAll(java.util.List<String> texts) {
        java.util.List<float[]> out = new java.util.ArrayList<>(texts.size());
        for (String t : texts) {
            out.add(embed(t));
        }
        return out;
    }
}
