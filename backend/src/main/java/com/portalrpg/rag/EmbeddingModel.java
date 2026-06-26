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
}
