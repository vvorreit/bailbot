import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { loadAutoSave, clearAutoSave } from "@/hooks/useAutoSave";

describe("loadAutoSave", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns null when no saved data", () => {
    (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(null);
    expect(loadAutoSave("test-key")).toBeNull();
  });

  it("returns parsed data when saved data exists", () => {
    const data = { name: "test", value: 42 };
    (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue(JSON.stringify(data));
    expect(loadAutoSave("test-key")).toEqual(data);
    expect(localStorage.getItem).toHaveBeenCalledWith("autosave:test-key");
  });

  it("returns null when JSON is invalid", () => {
    (localStorage.getItem as ReturnType<typeof vi.fn>).mockReturnValue("invalid-json{");
    expect(loadAutoSave("test-key")).toBeNull();
  });
});

describe("clearAutoSave", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("removes both data and timestamp keys", () => {
    clearAutoSave("test-key");
    expect(localStorage.removeItem).toHaveBeenCalledWith("autosave:test-key");
    expect(localStorage.removeItem).toHaveBeenCalledWith("autosave:test-key:ts");
  });
});
