import { describe, it, expect } from "vitest";
import { bailSchema } from "@/lib/schemas/bailSchema";
import { dossierIdentiteSchema, dossierSchema } from "@/lib/schemas/dossierSchema";
import { paiementSchema } from "@/lib/schemas/paiementSchema";
import { locataireSchema } from "@/lib/schemas/locataireSchema";

describe("bailSchema", () => {
  const validBail = {
    locataireNom: "Dupont",
    locatairePrenom: "Jean",
    locataireEmail: "jean@test.fr",
    bienAdresse: "10 rue de Paris",
    loyerHC: 800,
    charges: 50,
    dateDebut: "2025-01-01",
    duree: 36,
    typeBail: "habitation_vide" as const,
  };

  it("validates a correct bail", () => {
    const result = bailSchema.safeParse(validBail);
    expect(result.success).toBe(true);
  });

  it("rejects missing locataireNom", () => {
    const result = bailSchema.safeParse({ ...validBail, locataireNom: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing bienAdresse", () => {
    const result = bailSchema.safeParse({ ...validBail, bienAdresse: "" });
    expect(result.success).toBe(false);
  });

  it("rejects negative loyer", () => {
    const result = bailSchema.safeParse({ ...validBail, loyerHC: -100 });
    expect(result.success).toBe(false);
  });

  it("coerces string numbers", () => {
    const result = bailSchema.safeParse({ ...validBail, loyerHC: "800", charges: "50", duree: "36" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.loyerHC).toBe(800);
      expect(result.data.charges).toBe(50);
      expect(result.data.duree).toBe(36);
    }
  });

  it("accepts empty email", () => {
    const result = bailSchema.safeParse({ ...validBail, locataireEmail: "" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = bailSchema.safeParse({ ...validBail, locataireEmail: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("defaults typeBail to habitation_vide", () => {
    const { typeBail, ...rest } = validBail;
    const result = bailSchema.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.typeBail).toBe("habitation_vide");
  });

  it("defaults jourPaiement to 5", () => {
    const result = bailSchema.safeParse(validBail);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.jourPaiement).toBe(5);
  });
});

describe("dossierIdentiteSchema", () => {
  it("validates correct identity", () => {
    const result = dossierIdentiteSchema.safeParse({ nom: "Dupont", prenom: "Marie" });
    expect(result.success).toBe(true);
  });

  it("rejects empty nom", () => {
    const result = dossierIdentiteSchema.safeParse({ nom: "", prenom: "Marie" });
    expect(result.success).toBe(false);
  });
});

describe("dossierSchema", () => {
  it("validates full dossier", () => {
    const result = dossierSchema.safeParse({
      identite: { nom: "Test", prenom: "User" },
      emploi: { employeur: "Corp" },
      fiscal: { revenusN1: 30000 },
      banque: { titulaire: "Test User" },
    });
    expect(result.success).toBe(true);
  });

  it("validates dossier with garant", () => {
    const result = dossierSchema.safeParse({
      identite: { nom: "Test", prenom: "User" },
      emploi: {},
      fiscal: {},
      banque: {},
      garant: { nom: "Garant", prenom: "Parent" },
    });
    expect(result.success).toBe(true);
  });
});

describe("paiementSchema", () => {
  const validPaiement = {
    bienAdresse: "10 rue de Paris",
    mois: "2025-01",
    locataireNom: "Dupont",
    montant: 850,
    statut: "paye" as const,
  };

  it("validates correct paiement", () => {
    const result = paiementSchema.safeParse(validPaiement);
    expect(result.success).toBe(true);
  });

  it("rejects missing bienAdresse", () => {
    const result = paiementSchema.safeParse({ ...validPaiement, bienAdresse: "" });
    expect(result.success).toBe(false);
  });

  it("rejects negative montant", () => {
    const result = paiementSchema.safeParse({ ...validPaiement, montant: -10 });
    expect(result.success).toBe(false);
  });
});

describe("locataireSchema", () => {
  it("validates correct locataire", () => {
    const result = locataireSchema.safeParse({
      nom: "Dupont",
      prenom: "Jean",
      email: "jean@test.fr",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = locataireSchema.safeParse({
      nom: "Dupont",
      prenom: "Jean",
      email: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing required fields", () => {
    const result = locataireSchema.safeParse({ nom: "", prenom: "", email: "" });
    expect(result.success).toBe(false);
  });
});
