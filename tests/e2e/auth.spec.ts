import { test, expect } from "@playwright/test";

test.describe("Auth flows", () => {
  test("la page /auth/signin charge sans erreur", async ({ page }) => {
    const response = await page.goto("/auth/signin");
    expect(response?.status()).toBeLessThan(500);
    await expect(page).not.toHaveTitle(/error/i);
  });

  test("redirection vers /auth/signin si pas de session", async ({ page }) => {
    const response = await page.goto("/dashboard");
    const url = page.url();
    expect(url).toContain("/auth/signin");
  });

  test("la page /onboarding redirige sans session", async ({ page }) => {
    await page.goto("/onboarding");
    const url = page.url();
    expect(url).toContain("/auth/signin");
  });
});
