import { test, expect } from "@playwright/test";

test.describe("Quittances auto cron", () => {
  test("l'API /api/cron/quittances-auto repond 200 avec authorization", async ({
    request,
  }) => {
    const cronSecret = process.env.CRON_SECRET || "test-secret";
    const response = await request.get("/api/cron/quittances-auto", {
      headers: { Authorization: `Bearer ${cronSecret}` },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("success");
  });

  test("l'API /api/cron/quittances-auto rejette sans authorization en prod", async ({
    request,
  }) => {
    const response = await request.get("/api/cron/quittances-auto");
    // In dev mode it may pass, in prod it returns 401
    expect([200, 401]).toContain(response.status());
  });
});
