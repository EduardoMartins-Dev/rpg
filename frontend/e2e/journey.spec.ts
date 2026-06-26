import { test, expect } from "@playwright/test";
import { login, logout, openCampaign, uniq } from "./helpers";

const CORPUS = [
  "Vitalidade. A Vitalidade de um vampiro e igual ao seu Vigor mais 3.",
  "Forca de Vontade. A Forca de Vontade e igual a Autocontrole mais Determinacao.",
].join("\n\n");

/**
 * Jornada completa ponta a ponta exercitando todos os fluxos do §7:
 * admin (sistema + sheet-schema + upload/indexação) → mestre (campanha + convite) →
 * player (join + ficha dinâmica do schema + derivados do servidor + clã) →
 * IA escopada → e o mestre enxergando a ficha do player (AUTHZ-01 pela UI).
 */
test("jornada: admin → sistema → campanha → ficha dinâmica → IA", async ({ page }) => {
  const slug = uniq("v5");
  const systemName = `Vampiro ${slug}`;
  const campName = uniq("cronica");

  // --- ADMIN: cria sistema, define schema, sobe corpus (indexa) ---
  await login(page, "admin@test");
  await page.goto("/admin");
  await page.getByTestId("system-name").fill(systemName);
  await page.getByTestId("system-slug").fill(slug);
  await page.getByTestId("system-create").click();

  await page.getByTestId(`system-manage-${slug}`).click();
  await expect(page.getByTestId("system-detail")).toBeVisible();
  await page.getByTestId("schema-save").click();
  await expect(page.getByTestId("admin-msg")).toContainText("schema");

  await page.getByTestId("doc-file").setInputFiles({
    name: "v5.txt", mimeType: "text/plain", buffer: Buffer.from(CORPUS),
  });
  await page.getByTestId("doc-upload").click();
  await expect(page.getByTestId("doc-status").first()).toHaveText("INDEXED");
  await logout(page);

  // --- MESTRE: cria campanha nesse sistema e pega o convite ---
  await login(page, "mestre@test");
  await page.getByTestId("campaign-name").fill(campName);
  await page.getByTestId("campaign-system").selectOption({ label: systemName });
  await page.getByTestId("campaign-create").click();
  await openCampaign(page, campName);
  await expect(page.getByTestId("my-role")).toHaveText("MASTER");
  const invite = (await page.getByTestId("invite-code").innerText()).trim();
  expect(invite.length).toBeGreaterThan(0);
  await logout(page);

  // --- PLAYER1: entra por convite, cria ficha e preenche via schema dinâmico ---
  await login(page, "player1@test");
  await page.getByTestId("join-code").fill(invite);
  await page.getByTestId("join-submit").click();
  await openCampaign(page, campName);
  await expect(page.getByTestId("my-role")).toHaveText("PLAYER");

  await page.getByTestId("char-name").fill("Lucian");
  await page.getByTestId("char-create").click();
  await page.getByTestId("character-row").filter({ hasText: "Lucian" })
    .getByRole("link", { name: "Abrir ficha" }).click();

  // form renderizado a partir do sheet-schema (atributos vindos do schema)
  await expect(page.getByTestId("dynamic-sheet")).toBeVisible();
  await page.getByTestId("attr-vigor").fill("3");
  await page.getByTestId("attr-autocontrole").fill("3");
  await page.getByTestId("attr-determinacao").fill("2");
  await page.getByTestId("sheet-clan").fill("BRUJAH");
  await page.getByTestId("sheet-save").click();

  // derivados calculados no servidor + clã auto-populado
  await expect(page.getByTestId("derived-vitality")).toHaveText("6");
  await expect(page.getByTestId("derived-willpower")).toHaveText("5");
  await expect(page.getByTestId("clan-disciplines")).toContainText("Celeridade");

  // --- IA escopada ao sistema da campanha ---
  await page.getByText("← Campanha").click();
  await expect(page.getByTestId("campaign-detail")).toBeVisible();
  await page.getByTestId("ai-question").fill("Qual a formula da Vitalidade?");
  await page.getByTestId("ai-ask").click();
  await expect(page.getByTestId("ai-answer")).toContainText("Vigor");
  await logout(page);

  // --- MESTRE enxerga a ficha do player (AUTHZ-01 pela UI) ---
  await login(page, "mestre@test");
  await openCampaign(page, campName);
  await expect(page.getByTestId("character-list")).toContainText("Lucian");
});
