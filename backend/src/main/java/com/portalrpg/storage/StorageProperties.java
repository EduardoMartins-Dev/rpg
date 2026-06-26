package com.portalrpg.storage;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Config do armazenamento de objetos (Supabase Storage). Livros ficam num bucket
 * PRIVADO; o upload do navegador usa signed URL gerada pelo backend (service key),
 * então o arquivo não passa pela Vercel nem pelo Render. Vazio = storage desabilitado.
 */
@ConfigurationProperties(prefix = "app.storage")
public class StorageProperties {

    /** none | supabase */
    private String provider = "none";
    /** ex.: https://<ref>.supabase.co */
    private String supabaseUrl = "";
    /** service_role key (secret — só no backend) */
    private String serviceKey = "";
    /** bucket privado dos livros */
    private String bucket = "rag-books";

    public boolean enabled() {
        return "supabase".equalsIgnoreCase(provider)
                && !supabaseUrl.isBlank() && !serviceKey.isBlank();
    }

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }
    public String getSupabaseUrl() { return supabaseUrl; }
    public void setSupabaseUrl(String supabaseUrl) { this.supabaseUrl = stripTrailingSlash(supabaseUrl); }
    public String getServiceKey() { return serviceKey; }
    public void setServiceKey(String serviceKey) { this.serviceKey = serviceKey; }
    public String getBucket() { return bucket; }
    public void setBucket(String bucket) { this.bucket = bucket; }

    private static String stripTrailingSlash(String s) {
        if (s == null) return "";
        return s.endsWith("/") ? s.substring(0, s.length() - 1) : s;
    }
}
