import { describe, it, expect } from "vitest";
import { analyserFraude } from "../fraude-detection";
import { DossierLocataire } from "../parsers";

function dossier(overrides: Partial<DossierLocataire> = {}): Partial<DossierLocataire> {
  return {
    nom: "DUPONT",
    prenom: "Jean",
    salaireNetMensuel: 2916,  // ~35000/12
    revenusN1: 35000,
    revenusN2: 34000,
    typeContrat: "CDI",
    iban: "FR7612345678901234567890123",
    titulaireCompte: "DUPONT Jean",
    anciennete: "depuis 01/2024",
    ...overrides,
  };
}

describe("analyserFraude — IBAN", () => {
  it("IBAN valide → pas d'alerte IBAN", () => {
    const r = analyserFraude(dossier({ iban: "FR7612345678901234567890123" }));
    const ibanAlertes = r.alertes.filter(a => a.code === "IBAN_INVALIDE");
    expect(ibanAlertes).toHaveLength(0);
  });

  it("IBAN invalide → ANOMALIE IBAN_INVALIDE", () => {
    const r = analyserFraude(dossier({ iban: "FR761234" }));
    const a = r.alertes.find(a => a.code === "IBAN_INVALIDE");
    expect(a).toBeDefined();
    expect(a!.niveau).toBe("ANOMALIE");
  });

  it("IBAN manquant → INFO IBAN_MANQUANT", () => {
    const r = analyserFraude(dossier({ iban: "" }));
    const a = r.alertes.find(a => a.code === "IBAN_MANQUANT");
    expect(a).toBeDefined();
    expect(a!.niveau).toBe("INFO");
  });
});

describe("analyserFraude — cohérence salaire/revenus", () => {
  it("écart < 20% → aucune alerte salaire", () => {
    const r = analyserFraude(dossier({ salaireNetMensuel: 2916, revenusN1: 35000 }));
    const alertesSalaire = r.alertes.filter(a =>
      a.code === "SALAIRE_REVENUS_INCOHERENT" || a.code === "SALAIRE_REVENUS_ECART"
    );
    expect(alertesSalaire).toHaveLength(0);
  });

  it("écart 20-35% → ATTENTION", () => {
    // Salaire annuel = 2000 * 12 = 24000 ; revenus N1 = 32000 → écart = 25%
    const r = analyserFraude(dossier({ salaireNetMensuel: 2000, revenusN1: 32000 }));
    const a = r.alertes.find(a => a.code === "SALAIRE_REVENUS_ECART");
    expect(a).toBeDefined();
    expect(a!.niveau).toBe("ATTENTION");
  });

  it("écart > 35% → ANOMALIE", () => {
    // Salaire annuel = 1000 * 12 = 12000 ; revenus N1 = 25000 → écart > 50%
    const r = analyserFraude(dossier({ salaireNetMensuel: 1000, revenusN1: 25000 }));
    const a = r.alertes.find(a => a.code === "SALAIRE_REVENUS_INCOHERENT");
    expect(a).toBeDefined();
    expect(a!.niveau).toBe("ANOMALIE");
  });
});

describe("analyserFraude — score de confiance", () => {
  it("dossier cohérent → score_confiance élevé (>= 80)", () => {
    const r = analyserFraude(dossier());
    expect(r.score_confiance).toBeGreaterThanOrEqual(80);
  });

  it("dossier avec anomalie IBAN → score réduit", () => {
    const r = analyserFraude(dossier({ iban: "INVALIDE" }));
    expect(r.score_confiance).toBeLessThan(90);
  });

  it("score est entre 0 et 100", () => {
    const r = analyserFraude(dossier({ iban: "", salaireNetMensuel: 500, revenusN1: 30000 }));
    expect(r.score_confiance).toBeGreaterThanOrEqual(0);
    expect(r.score_confiance).toBeLessThanOrEqual(100);
  });
});
