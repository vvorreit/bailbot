import { test, expect } from "@playwright/test";

test.describe("Rappels impayes cron", () => {
  test("l'API /api/cron/rappels-impayes repond 200 avec authorization", async ({
    request,
  }) => {
    const cronSecret = process.env.CRON_SECRET || "test-secret";
    const response = await request.get("/api/cron/rappels-impayes", {
      headers: { Authorization: `Bearer ${cronSecret}` },
    });
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("success");
  });

  test("les routes protegees renvoient 401 sans session", async ({
    request,
  }) => {
    const response = await request.get("/api/bails");
    expect([401, 403]).toContain(response.status());
  });
});
