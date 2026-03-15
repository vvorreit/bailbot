import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("analytics", () => {
  const mockLocalStorage: Record<string, string> = {};

  beforeEach(() => {
    vi.stubGlobal("window", {});
    vi.stubGlobal("localStorage", {
      getItem: vi.fn((key: string) => mockLocalStorage[key] ?? null),
      setItem: vi.fn((key: string, value: string) => { mockLocalStorage[key] = value; }),
      removeItem: vi.fn((key: string) => { delete mockLocalStorage[key]; }),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
    Object.keys(mockLocalStorage).forEach((k) => delete mockLocalStorage[k]);
  });

  it("hasAnalyticsConsent returns false when no consent", async () => {
    const { hasAnalyticsConsent } = await import("@/lib/analytics");
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it("hasAnalyticsConsent returns true when granted", async () => {
    mockLocalStorage["bailbot_analytics_consent"] = "granted";
    const { hasAnalyticsConsent } = await import("@/lib/analytics");
    expect(hasAnalyticsConsent()).toBe(true);
  });

  it("grantAnalyticsConsent sets localStorage", async () => {
    const { grantAnalyticsConsent } = await import("@/lib/analytics");
    grantAnalyticsConsent();
    expect(localStorage.setItem).toHaveBeenCalledWith("bailbot_analytics_consent", "granted");
  });

  it("revokeAnalyticsConsent sets localStorage to denied", async () => {
    const { revokeAnalyticsConsent } = await import("@/lib/analytics");
    revokeAnalyticsConsent();
    expect(localStorage.setItem).toHaveBeenCalledWith("bailbot_analytics_consent", "denied");
  });

  it("trackEvent does nothing without consent", async () => {
    const { trackEvent } = await import("@/lib/analytics");
    await expect(trackEvent("page_view", { url: "/test" })).resolves.toBeUndefined();
  });
});
