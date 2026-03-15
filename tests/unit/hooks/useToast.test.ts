import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { addToast, dismissToast } from "@/hooks/useToast";

describe("toast functions", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("addToast returns an id", () => {
    const id = addToast("success", "Test message");
    expect(id).toBeTruthy();
    expect(typeof id).toBe("string");
    expect(id).toMatch(/^toast-/);
  });

  it("addToast generates unique ids", () => {
    const id1 = addToast("success", "Message 1");
    const id2 = addToast("error", "Message 2");
    expect(id1).not.toBe(id2);
  });

  it("dismissToast does not throw when no setter registered", () => {
    expect(() => dismissToast("nonexistent")).not.toThrow();
  });
});
