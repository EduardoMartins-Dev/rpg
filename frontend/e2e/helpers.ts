import { Page, expect } from "@playwright/test";

// Senha do seed dev (DevSeeder / prompt §8).
export const PASSWORD = "Sup3rSenha!";

export function uniq(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e4)}`;
}

export async function login(page: Page, email: string, password: string = PASSWORD) {
  await page.goto("/login");
  await page.getByTestId("login-email").fill(email);
  await page.getByTestId("login-password").fill(password);
  await page.getByTestId("login-submit").click();
  await expect(page.getByTestId("campaigns-page")).toBeVisible();
}

export async function logout(page: Page) {
  await page.getByTestId("logout").click();
  await expect(page.getByTestId("nav-login")).toBeVisible();
}

/** Abre uma campanha pelo card que contém o nome dado (o card inteiro é um link). */
export async function openCampaign(page: Page, name: string) {
  const row = page.getByTestId("campaign-row").filter({ hasText: name });
  await row.first().click();
  await expect(page.getByTestId("campaign-detail")).toBeVisible();
}
