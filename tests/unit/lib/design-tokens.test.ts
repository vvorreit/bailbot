import { describe, it, expect } from "vitest";
import { colors, spacing, typography, radii, shadows } from "@/lib/design-tokens";

describe("design-tokens", () => {
  it("exports colors with primary palette", () => {
    expect(colors.primary).toBeDefined();
    expect(colors.primary[600]).toBe("#059669");
  });

  it("exports danger colors", () => {
    expect(colors.danger).toBeDefined();
    expect(colors.danger[500]).toBe("#ef4444");
  });

  it("exports spacing tokens", () => {
    expect(spacing.xs).toBe("0.25rem");
    expect(spacing.md).toBe("1rem");
    expect(spacing.xl).toBe("2rem");
  });

  it("exports typography tokens", () => {
    expect(typography.fontSize.base).toBe("1rem");
    expect(typography.fontWeight.bold).toBe("700");
  });

  it("exports radii tokens", () => {
    expect(radii.full).toBe("9999px");
    expect(radii.xl).toBe("1rem");
  });

  it("exports shadow tokens", () => {
    expect(shadows.sm).toBeDefined();
    expect(shadows.xl).toBeDefined();
  });
});
