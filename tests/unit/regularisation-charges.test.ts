import { describe, it, expect, vi, beforeEach } from "vitest";

// The creerRegularisation function uses session and Prisma.
// We test the calculation logic: solde = totalProvisions - chargesReelles

vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    regularisationCharges: { create: vi.fn(), findMany: vi.fn(), updateMany: vi.fn() },
  },
}));

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { creerRegularisation } from "@/app/actions/regularisation-charges";

describe("creerRegularisation — charge calculation", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      user: { email: "user@test.com" },
    });

    (prisma.user.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "user-1",
    });
  });

  it("should calculate complement when charges > provisions (tenant owes)", async () => {
    // provisions: 100€/month × 12 = 1200€, charges réelles: 1450€
    // solde = 1200 - 1450 = -250 (negative = tenant must pay 250€)
    let capturedData: any = null;
    (prisma.regularisationCharges.create as ReturnType<typeof vi.fn>).mockImplementation(
      (args: any) => {
        capturedData = args.data;
        return Promise.resolve({ id: "reg-1", ...args.data });
      }
    );

    await creerRegularisation({
      bienId: "bien-1",
      annee: 2025,
      chargesReelles: 1450,
      provisionsMensuelles: 100,
    });

    expect(capturedData.totalProvisions).toBe(1200);
    expect(capturedData.solde).toBe(-250);
    expect(capturedData.chargesReelles).toBe(1450);
    expect(capturedData.provisionsMensuelles).toBe(100);
  });

  it("should calculate refund when provisions > charges (tenant overpaid)", async () => {
    // provisions: 150€/month × 12 = 1800€, charges réelles: 1500€
    // solde = 1800 - 1500 = 300 (positive = refund 300€ to tenant)
    let capturedData: any = null;
    (prisma.regularisationCharges.create as ReturnType<typeof vi.fn>).mockImplementation(
      (args: any) => {
        capturedData = args.data;
        return Promise.resolve({ id: "reg-2", ...args.data });
      }
    );

    await creerRegularisation({
      bienId: "bien-2",
      annee: 2025,
      chargesReelles: 1500,
      provisionsMensuelles: 150,
    });

    expect(capturedData.totalProvisions).toBe(1800);
    expect(capturedData.solde).toBe(300);
    expect(capturedData.chargesReelles).toBe(1500);
  });

  it("should calculate zero solde when charges equal provisions", async () => {
    let capturedData: any = null;
    (prisma.regularisationCharges.create as ReturnType<typeof vi.fn>).mockImplementation(
      (args: any) => {
        capturedData = args.data;
        return Promise.resolve({ id: "reg-3", ...args.data });
      }
    );

    await creerRegularisation({
      bienId: "bien-3",
      annee: 2025,
      chargesReelles: 1200,
      provisionsMensuelles: 100,
    });

    expect(capturedData.totalProvisions).toBe(1200);
    expect(capturedData.solde).toBe(0);
  });

  it("should compute totalProvisions as provisionsMensuelles × 12", async () => {
    let capturedData: any = null;
    (prisma.regularisationCharges.create as ReturnType<typeof vi.fn>).mockImplementation(
      (args: any) => {
        capturedData = args.data;
        return Promise.resolve({ id: "reg-4", ...args.data });
      }
    );

    await creerRegularisation({
      bienId: "bien-4",
      annee: 2025,
      chargesReelles: 2000,
      provisionsMensuelles: 175,
    });

    expect(capturedData.totalProvisions).toBe(175 * 12);
    expect(capturedData.solde).toBe(175 * 12 - 2000);
  });

  it("should throw when not authenticated", async () => {
    (getServerSession as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    await expect(
      creerRegularisation({
        bienId: "bien-1",
        annee: 2025,
        chargesReelles: 1000,
        provisionsMensuelles: 100,
      })
    ).rejects.toThrow("Non authentifie");
  });
});
