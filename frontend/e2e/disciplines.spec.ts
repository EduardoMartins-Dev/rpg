import { test, expect } from "@playwright/test";
import { login, logout, openCampaign, uniq } from "./helpers";

/**
 * Ficha com VÁRIAS disciplinas e VÁRIOS poderes por disciplina.
 * Exercita o editor novo (bloco por disciplina + lista de poderes nível/nome),
 * a persistência no sheet_data e a visualização read-only.
 */
test("ficha: múltiplas disciplinas com vários poderes", async ({ page }) => {
  const slug = uniq("v5disc");
  const systemName = `Vampiro ${slug}`;
  const campName = uniq("disc-cronica");

  // --- ADMIN: sistema + schema (atributos/perícias padrão) ---
  await login(page, "admin@test");
  await page.goto("/admin");
  await page.getByTestId("system-name").fill(systemName);
  await page.getByTestId("system-slug").fill(slug);
  await page.getByTestId("system-create").click();
  await page.getByTestId(`system-manage-${slug}`).click();
  await expect(page.getByTestId("system-detail")).toBeVisible();
  await page.getByTestId("schema-save").click();
  await expect(page.getByTestId("admin-msg")).toContainText("schema");
  await logout(page);

  // --- MESTRE: campanha + ficha (o mestre também cria/abre fichas) ---
  await login(page, "mestre@test");
  await page.locator("#camp-name").fill(campName);
  await page.getByTestId("campaign-system").selectOption({ label: systemName });
  await page.getByTestId("campaign-create").click();
  await openCampaign(page, campName);

  await page.getByTestId("cam-tab-sheets").click();
  await page.getByTestId("char-name").fill("Dorian");
  await page.getByTestId("char-create").click();
  // mestre vê lista de cards; abre pelo card
  await page.getByTestId("character-row").filter({ hasText: "Dorian" }).first().click();
  await expect(page.getByTestId("dynamic-sheet")).toBeVisible();

  // --- etapa Disciplinas ---
  await page.getByTestId("step-disciplinas").click();
  const list = page.getByTestId("disciplines-list");

  // Disciplina 1 com 2 poderes
  await page.getByRole("button", { name: "+ Disciplina" }).click();
  const d1 = page.getByTestId("discipline-row").nth(0);
  await d1.getByLabel("disciplina", { exact: true }).fill("Ofuscação");
  await d1.getByRole("button", { name: "+ Poder" }).click();
  await d1.getByRole("button", { name: "+ Poder" }).click();
  const d1powers = d1.getByTestId("power-row");
  await expect(d1powers).toHaveCount(2);
  await d1powers.nth(0).getByLabel("nível do poder", { exact: true }).selectOption("1");
  await d1powers.nth(0).getByLabel("poder", { exact: true }).fill("Manto das Sombras");
  await d1powers.nth(1).getByLabel("nível do poder", { exact: true }).selectOption("2");
  await d1powers.nth(1).getByLabel("poder", { exact: true }).fill("Presença Invisível");

  // Disciplina 2 com 3 poderes
  await page.getByRole("button", { name: "+ Disciplina" }).click();
  const d2 = page.getByTestId("discipline-row").nth(1);
  await d2.getByLabel("disciplina", { exact: true }).fill("Potência");
  for (let i = 0; i < 3; i++) await d2.getByRole("button", { name: "+ Poder" }).click();
  const d2powers = d2.getByTestId("power-row");
  await expect(d2powers).toHaveCount(3);
  await d2powers.nth(0).getByLabel("poder", { exact: true }).fill("Força Prodigiosa");
  await d2powers.nth(1).getByLabel("poder", { exact: true }).fill("Salto");
  await d2powers.nth(2).getByLabel("poder", { exact: true }).fill("Resiliência");

  await expect(page.getByTestId("discipline-row")).toHaveCount(2);
  await expect(list.getByTestId("power-row")).toHaveCount(5);

  // salva
  await page.getByTestId("sheet-save").click();
  await expect(page.getByTestId("sheet-msg")).toBeVisible();

  // recarrega a página (persistência real no sheet_data) e confere o editor
  await page.reload();
  await page.getByTestId("step-disciplinas").click();
  await expect(page.getByTestId("discipline-row")).toHaveCount(2);
  await expect(page.getByTestId("disciplines-list").getByTestId("power-row")).toHaveCount(5);
  await expect(page.getByTestId("discipline-row").nth(0).getByLabel("poder", { exact: true }).nth(1))
    .toHaveValue("Presença Invisível");

  // --- visualização read-only ---
  await page.getByTestId("mode-view").click();
  const view = page.getByTestId("sheet-view");
  await expect(view).toContainText("Ofuscação");
  await expect(view).toContainText("Manto das Sombras");
  await expect(view).toContainText("Presença Invisível");
  await expect(view).toContainText("Potência");
  await expect(view).toContainText("Força Prodigiosa");
  await expect(view).toContainText("Resiliência");
});
