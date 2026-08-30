/**
 * Extrai a mensagem de erro que o provedor de IA devolveu no corpo da resposta.
 *
 * Sem isto o usuário via só "groq returned 404" e não dava para saber a causa — 404 da
 * Groq é quase sempre modelo inexistente ou sem acesso na chave usada, e a resposta diz
 * exatamente qual. São mensagens operacionais de configuração (nome de modelo, cota),
 * não segredo: a chave nunca volta no corpo.
 */
export async function providerErrorDetail(res: Response, provider: string): Promise<string> {
  let detail = "";
  try {
    const text = (await res.text()).trim();
    if (text) {
      try {
        // Formato OpenAI/Groq: { error: { message, code } }. Gemini: { error: { message } }.
        const json = JSON.parse(text) as { error?: { message?: string } | string };
        const msg = typeof json.error === "string" ? json.error : json.error?.message;
        detail = msg ?? text;
      } catch {
        detail = text; // corpo não-JSON (HTML de gateway, por exemplo)
      }
    }
  } catch {
    /* corpo ilegível: fica só o status */
  }
  const curto = detail.replace(/\s+/g, " ").slice(0, 300);
  return curto
    ? `${provider} respondeu ${res.status}: ${curto}`
    : `${provider} respondeu ${res.status}`;
}
