import { describe, it, expect } from "vitest";

describe("useFocusTrap", () => {
  it("module exports correctly", async () => {
    const mod = await import("@/hooks/useFocusTrap");
    expect(mod.useFocusTrap).toBeDefined();
    expect(typeof mod.useFocusTrap).toBe("function");
  });
});
