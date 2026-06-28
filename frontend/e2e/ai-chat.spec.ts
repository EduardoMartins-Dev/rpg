import { test, expect } from "@playwright/test";
import { login, logout, openCampaign, uniq } from "./helpers";

const CORPUS = [
  "Vitalidade. A Vitalidade de um vampiro e igual ao seu Vigor mais 3.",
  "Forca de Vontade. A Forca de Vontade e igual a Autocontrole mais Determinacao.",
].join("\n\n");

/**
 * Chat IA estilo ChatGPT: conversas (contextos) com histórico persistido.
 * Valida criar conversa via 1ª pergunta, follow-up no mesmo contexto, persistência
 * após reload, e troca/criação de nova conversa.
 */
test("IA: chat com histórico em conversas", async ({ page }) => {
  const slug = uniq("v5ai");
  const systemName = `Vampiro ${slug}`;
  const campName = uniq("ai-cronica");

  // admin: sistema + schema + corpus indexado
  await login(page, "admin@test");
  await page.goto("/admin");
  await page.getByTestId("system-name").fill(systemName);
  await page.getByTestId("system-slug").fill(slug);
  await page.getByTestId("system-create").click();
  await page.getByTestId(`system-manage-${slug}`).click();
  await expect(page.getByTestId("system-detail")).toBeVisible();
  await page.getByTestId("schema-save").click();
  await page.getByTestId("doc-file").setInputFiles({
    name: "v5.txt", mimeType: "text/plain", buffer: Buffer.from(CORPUS),
  });
  await page.getByTestId("doc-upload").click();
  await expect(page.getByTestId("doc-status").first()).toHaveText("INDEXED");
  await logout(page);

  // mestre: campanha nesse sistema
  await login(page, "mestre@test");
  await page.locator("#camp-name").fill(campName);
  await page.getByTestId("campaign-system").selectOption({ label: systemName });
  await page.getByTestId("campaign-create").click();
  await openCampaign(page, campName);

  // aba Chat (IA)
  await page.getByTestId("cam-tab-ai").click();
  await expect(page.getByTestId("ai-chat")).toBeVisible();
  await expect(page.getByTestId("ai-conversations")).toContainText("Sem conversas ainda");

  // 1ª pergunta cria a conversa e responde ancorado
  await page.getByTestId("ai-question").fill("Qual a formula da Vitalidade?");
  await page.getByTestId("ai-ask").click();
  await expect(page.getByTestId("ai-answer")).toContainText("Vigor");
  // a conversa aparece na lista lateral, titulada pela 1ª pergunta
  await expect(page.getByTestId("ai-conversations")).toContainText("Vitalidade");

  // follow-up no mesmo contexto
  await page.getByTestId("ai-question").fill("E a Forca de Vontade?");
  await page.getByTestId("ai-ask").click();
  await expect(page.getByTestId("ai-answer")).toContainText("Autocontrole");

  // histórico: 2 perguntas + 2 respostas = 4 bolhas
  await expect(page.locator(".ai-row")).toHaveCount(4);

  // persiste após reload
  await page.reload();
  await page.getByTestId("cam-tab-ai").click();
  await expect(page.locator(".ai-row")).toHaveCount(4);
  await expect(page.locator(".ai-msgs")).toContainText("Vitalidade");

  // nova conversa: zera o painel, mantém a anterior na lista
  await page.getByTestId("ai-new-conversation").click();
  await expect(page.locator(".ai-row")).toHaveCount(0);
  await expect(page.getByTestId("ai-conversations")).toContainText("Vitalidade");
});
