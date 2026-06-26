import { test, expect } from "@playwright/test";
import { login, logout, uniq } from "./helpers";

test("registro → login → logout (UI auth ponta a ponta)", async ({ page }) => {
  const email = `${uniq("user")}@test.local`;

  // registro cria conta e já autentica → cai em /campaigns
  await page.goto("/register");
  await page.getByTestId("register-name").fill("Novato");
  await page.getByTestId("register-email").fill(email);
  await page.getByTestId("register-password").fill("Sup3rSenha!");
  await page.getByTestId("register-submit").click();

  await expect(page.getByTestId("campaigns-page")).toBeVisible();
  await expect(page.getByTestId("nav-user")).toHaveText("Novato");

  await logout(page);

  // login com a mesma conta
  await login(page, email);
  await expect(page.getByTestId("nav-user")).toHaveText("Novato");
});

test("usuário comum não vê o link de Admin", async ({ page }) => {
  await login(page, "player1@test");
  await expect(page.getByTestId("nav-admin")).toHaveCount(0);
});
