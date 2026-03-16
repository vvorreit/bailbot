import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  prisma: {
    espaceLocataire: { findUnique: vi.fn() },
    bailActif: { findFirst: vi.fn() },
    quittanceAuto: { findMany: vi.fn() },
    demandeLocataire: { create: vi.fn() },
    user: { findUnique: vi.fn() },
    auditLog: { create: vi.fn() },
  },
}));

vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ authOptions: {} }));

vi.mock("@/lib/mailer", () => ({
  sendMail: vi.fn().mockResolvedValue(undefined),
}));

import { prisma } from "@/lib/db";
import { getPortailLocataireData, soumettreDemandeLocataire } from "@/app/actions/portail-locataire";

describe("portail locataire security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return null for invalid token (no info leak)", async () => {
    (prisma.espaceLocataire.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const result = await getPortailLocataireData("invalid-token-abc123");
    expect(result).toBeNull();
  });

  it("should return null for expired token", async () => {
    (prisma.espaceLocataire.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "espace-1",
      bailId: "bail-1",
      token: "expired-token",
      actif: true,
      expiresAt: new Date(Date.now() - 86400000), // expired yesterday
      demandes: [],
    });

    const result = await getPortailLocataireData("expired-token");
    expect(result).toBeNull();
  });

  it("should return null for deactivated space", async () => {
    (prisma.espaceLocataire.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "espace-1",
      bailId: "bail-1",
      token: "deactivated-token",
      actif: false,
      expiresAt: new Date(Date.now() + 86400000),
      demandes: [],
    });

    const result = await getPortailLocataireData("deactivated-token");
    expect(result).toBeNull();
  });

  it("should return only the tenant's data with valid token", async () => {
    const bailId = "bail-tenant-a";

    (prisma.espaceLocataire.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "espace-1",
      bailId,
      token: "valid-token",
      actif: true,
      expiresAt: new Date(Date.now() + 30 * 86400000),
      demandes: [{ id: "d1", type: "QUESTION", message: "test", statut: "NOUVEAU" }],
    });

    (prisma.bailActif.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: bailId,
      locataireNom: "Dupont",
      locataireEmail: "dupont@test.com",
      bienId: "bien-1",
      loyerMensuel: 800,
      chargesMensuelles: 50,
      dateDebut: new Date(2024, 0, 1),
      dateFin: null,
      statut: "ACTIF",
    });

    (prisma.quittanceAuto.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: "q1", mois: "2025-03", bailId },
    ]);

    const result = await getPortailLocataireData("valid-token");

    expect(result).not.toBeNull();
    expect(result!.bail!.locataireNom).toBe("Dupont");
    expect(result!.quittances).toHaveLength(1);

    // Verify Prisma was called with the correct bailId (scoped to this tenant)
    expect(prisma.bailActif.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: bailId },
      })
    );
    expect(prisma.quittanceAuto.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { bailId },
      })
    );
  });

  it("should scope data to the token's bail only (cannot access other tenants)", async () => {
    // Token is for bail-A, but we verify only bail-A data is queried
    const tokenBailId = "bail-A";

    (prisma.espaceLocataire.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "espace-a",
      bailId: tokenBailId,
      token: "token-a",
      actif: true,
      expiresAt: new Date(Date.now() + 86400000),
      demandes: [],
    });

    (prisma.bailActif.findFirst as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: tokenBailId,
      locataireNom: "Tenant A",
      locataireEmail: "a@test.com",
      bienId: "bien-1",
      loyerMensuel: 700,
      chargesMensuelles: 30,
      dateDebut: new Date(2024, 0, 1),
      dateFin: null,
      statut: "ACTIF",
    });

    (prisma.quittanceAuto.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    await getPortailLocataireData("token-a");

    // The function should only query bail-A, never bail-B
    const bailCalls = (prisma.bailActif.findFirst as ReturnType<typeof vi.fn>).mock.calls;
    expect(bailCalls).toHaveLength(1);
    expect(bailCalls[0][0].where.id).toBe(tokenBailId);
  });

  it("soumettreDemandeLocataire should throw for invalid token", async () => {
    (prisma.espaceLocataire.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    await expect(
      soumettreDemandeLocataire("bad-token", "QUESTION", "Hello")
    ).rejects.toThrow("Espace invalide");
  });

  it("soumettreDemandeLocataire should throw for deactivated space", async () => {
    (prisma.espaceLocataire.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "espace-1",
      actif: false,
    });

    await expect(
      soumettreDemandeLocataire("inactive-token", "DOCUMENT", "Need docs")
    ).rejects.toThrow("Espace invalide");
  });
});
