import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    bien: { findFirst: vi.fn() },
    paiementBien: { findMany: vi.fn() },
    diagnosticBien: { findMany: vi.fn() },
    bailActif: { findMany: vi.fn() },
    etatDesLieux: { findFirst: vi.fn() },
    quittanceAuto: { findFirst: vi.fn() },
  },
}));

import { prisma } from "@/lib/db";
import { calculerSante } from "@/lib/sante-locative";

const now = new Date();
const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000);
const daysFromNow = (n: number) => new Date(now.getTime() + n * 24 * 60 * 60 * 1000);

describe("calculerSante", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    (prisma.bien.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "bien-1",
      adresse: "10 rue de Paris",
      statut: "loue",
    });

    // Default: no issues
    (prisma.paiementBien.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (prisma.diagnosticBien.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (prisma.bailActif.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);
    (prisma.quittanceAuto.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "q1" });
  });

  it("should return VERT when everything is up to date", async () => {
    const result = await calculerSante("bien-1", "user-1");

    expect(result.score).toBe("VERT");
    expect(result.details).toHaveLength(0);
    expect(result.adresse).toBe("10 rue de Paris");
  });

  it("should return ROUGE when rent is overdue > 30 days", async () => {
    (prisma.paiementBien.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        mois: "2025-01",
        dateAttendue: daysAgo(45), // 45 days overdue
        statut: "impaye",
        locataireNom: "Dupont",
      },
    ]);

    const result = await calculerSante("bien-1", "user-1");

    expect(result.score).toBe("ROUGE");
    expect(result.details.some((d: string) => d.includes("impayé depuis"))).toBe(true);
  });

  it("should return ORANGE when rent is overdue < 30 days", async () => {
    (prisma.paiementBien.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        mois: "2025-03",
        dateAttendue: daysAgo(15), // 15 days overdue
        statut: "retard",
        locataireNom: "Martin",
      },
    ]);

    const result = await calculerSante("bien-1", "user-1");

    expect(result.score).toBe("ORANGE");
    expect(result.details.some((d: string) => d.includes("en retard de"))).toBe(true);
  });

  it("should return ROUGE when diagnostic expired > 30 days", async () => {
    (prisma.diagnosticBien.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        type: "DPE",
        dateExpiration: daysAgo(60),
        nonConcerne: false,
      },
    ]);

    const result = await calculerSante("bien-1", "user-1");

    expect(result.score).toBe("ROUGE");
    expect(result.details.some((d: string) => d.includes("DPE") && d.includes("expiré"))).toBe(true);
  });

  it("should return ORANGE when diagnostic expiring within 30 days", async () => {
    (prisma.diagnosticBien.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        type: "ELECTRICITE",
        dateExpiration: daysFromNow(15),
        nonConcerne: false,
      },
    ]);

    const result = await calculerSante("bien-1", "user-1");

    expect(result.score).toBe("ORANGE");
    expect(result.details.some((d: string) => d.includes("ELECTRICITE") && d.includes("expire dans"))).toBe(true);
  });

  it("should return ROUGE when bail terminated without EDL de sortie", async () => {
    (prisma.bailActif.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: "bail-1",
        statut: "TERMINE",
        dateSortie: daysAgo(10),
        dateDebut: daysAgo(365),
        locataireNom: "Lefevre",
      },
    ]);
    (prisma.etatDesLieux.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const result = await calculerSante("bien-1", "user-1");

    expect(result.score).toBe("ROUGE");
    expect(result.details.some((d: string) => d.includes("EDL de sortie") && d.includes("Lefevre"))).toBe(true);
  });

  it("should return ORANGE when active bail > 30 days without EDL d'entree", async () => {
    (prisma.bailActif.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: "bail-2",
        statut: "ACTIF",
        dateSortie: null,
        dateDebut: daysAgo(60),
        locataireNom: "Bernard",
      },
    ]);
    (prisma.etatDesLieux.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (prisma.quittanceAuto.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "q1" });

    const result = await calculerSante("bien-1", "user-1");

    expect(result.score).toBe("ORANGE");
    expect(result.details.some((d: string) => d.includes("EDL d'entrée manquant"))).toBe(true);
  });

  it("should return ORANGE when current month quittance is missing", async () => {
    (prisma.bailActif.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: "bail-3",
        statut: "ACTIF",
        dateSortie: null,
        dateDebut: daysAgo(10),
        locataireNom: "Petit",
      },
    ]);
    (prisma.quittanceAuto.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const result = await calculerSante("bien-1", "user-1");

    expect(result.score).toBe("ORANGE");
    expect(result.details.some((d: string) => d.includes("Quittance") && d.includes("non envoyée"))).toBe(true);
  });

  it("should return VERT for unknown bienId", async () => {
    (prisma.bien.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const result = await calculerSante("unknown", "user-1");

    expect(result.score).toBe("VERT");
    expect(result.adresse).toBe("Inconnu");
  });

  it("should prioritize ROUGE over ORANGE (multiple issues)", async () => {
    // One ORANGE issue (retard < 30 days) + one ROUGE issue (impaye > 30 days)
    (prisma.paiementBien.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        mois: "2025-01",
        dateAttendue: daysAgo(10),
        statut: "retard",
        locataireNom: "A",
      },
      {
        mois: "2024-12",
        dateAttendue: daysAgo(60),
        statut: "impaye",
        locataireNom: "A",
      },
    ]);

    const result = await calculerSante("bien-1", "user-1");

    expect(result.score).toBe("ROUGE");
    expect(result.details.length).toBeGreaterThanOrEqual(2);
  });
});
