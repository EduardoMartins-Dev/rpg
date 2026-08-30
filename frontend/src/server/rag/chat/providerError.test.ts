import { describe, expect, it } from "vitest";
import { providerErrorDetail } from "./providerError";

const resp = (status: number, body: string, type = "application/json") =>
  new Response(body, { status, headers: { "Content-Type": type } });

describe("providerErrorDetail", () => {
  it("extrai a mensagem do formato OpenAI/Groq", async () => {
    const body = JSON.stringify({
      error: {
        message: "The model `llama-3.3-70b-versatile` does not exist or you do not have access to it.",
        type: "invalid_request_error",
        code: "model_not_found",
      },
    });
    const out = await providerErrorDetail(resp(404, body), "groq");
    expect(out).toContain("groq respondeu 404");
    expect(out).toContain("does not exist or you do not have access");
  });

  it("extrai a mensagem do formato Gemini", async () => {
    const body = JSON.stringify({
      error: { code: 429, message: "Quota exceeded for quota metric 'Generate requests'.", status: "RESOURCE_EXHAUSTED" },
    });
    const out = await providerErrorDetail(resp(429, body), "gemini");
    expect(out).toContain("gemini respondeu 429");
    expect(out).toContain("Quota exceeded");
  });

  it("aceita corpo não-JSON (página de gateway)", async () => {
    const out = await providerErrorDetail(resp(502, "<html><body>Bad Gateway</body></html>", "text/html"), "groq");
    expect(out).toContain("groq respondeu 502");
    expect(out).toContain("Bad Gateway");
  });

  it("cai para só o status quando o corpo é vazio", async () => {
    expect(await providerErrorDetail(resp(500, ""), "groq")).toBe("groq respondeu 500");
  });

  it("trunca corpo gigante para não inundar a tela", async () => {
    const out = await providerErrorDetail(resp(400, JSON.stringify({ error: { message: "x".repeat(2000) } })), "groq");
    expect(out.length).toBeLessThan(340);
  });

  it("colapsa quebras de linha numa mensagem de uma linha", async () => {
    const out = await providerErrorDetail(resp(400, "erro\n  com\n\nquebras"), "groq");
    expect(out).toBe("groq respondeu 400: erro com quebras");
  });
});
