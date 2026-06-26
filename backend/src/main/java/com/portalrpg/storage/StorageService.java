package com.portalrpg.storage;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import com.fasterxml.jackson.databind.JsonNode;
import com.portalrpg.common.ApiException;

/**
 * Cliente do Supabase Storage (REST) via service key. Gera signed upload URL
 * (navegador faz PUT direto no Supabase) e baixa o objeto pro pipeline de RAG.
 */
@Service
public class StorageService {

    public record SignedUpload(String uploadUrl, String path, String bucket) {
    }

    private final StorageProperties props;
    private final RestClient http;

    public StorageService(StorageProperties props) {
        this.props = props;
        this.http = RestClient.builder().build();
    }

    public boolean enabled() {
        return props.enabled();
    }

    public String bucket() {
        return props.getBucket();
    }

    private void requireEnabled() {
        if (!props.enabled()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE,
                    "object storage not configured (set app.storage.* / SUPABASE_* envs)");
        }
    }

    private String base() {
        return props.getSupabaseUrl() + "/storage/v1";
    }

    /** Cria uma signed upload URL pra um objeto no bucket privado. */
    public SignedUpload createSignedUpload(String path) {
        requireEnabled();
        try {
            JsonNode body = http.post()
                    .uri(base() + "/object/upload/sign/{bucket}/{path}", props.getBucket(), path)
                    .header("apikey", props.getServiceKey())
                    .header("Authorization", "Bearer " + props.getServiceKey())
                    .retrieve()
                    .body(JsonNode.class);
            String rel = body != null && body.hasNonNull("url") ? body.get("url").asText() : null;
            if (rel == null) {
                throw new ApiException(HttpStatus.BAD_GATEWAY, "storage did not return an upload url");
            }
            // a url vem relativa (/object/upload/sign/...?token=...); o navegador faz PUT aqui:
            return new SignedUpload(base() + rel, path, props.getBucket());
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "failed to create signed upload url: " + e.getMessage());
        }
    }

    /** Baixa os bytes do objeto (service key) pra extração/indexação. */
    public byte[] download(String path) {
        requireEnabled();
        try {
            byte[] bytes = http.get()
                    .uri(base() + "/object/{bucket}/{path}", props.getBucket(), path)
                    .header("apikey", props.getServiceKey())
                    .header("Authorization", "Bearer " + props.getServiceKey())
                    .retrieve()
                    .body(byte[].class);
            if (bytes == null || bytes.length == 0) {
                throw new ApiException(HttpStatus.BAD_GATEWAY, "storage returned empty object: " + path);
            }
            return bytes;
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "failed to download object: " + e.getMessage());
        }
    }
}
