import { describe, it, expect } from "vitest";
import { calculerEligibiliteVisale, calculerAge } from "../eligibilite-visale";
import { DossierLocataire } from "../parsers";

// ─── Helper : fabrique une date de naissance à partir d'un âge ───────────────
function dobFromAge(age: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - age);
  const jj = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const aaaa = d.getFullYear();
  return `${jj}/${mm}/${aaaa}`;
}

function makeDossier(overrides: Partial<DossierLocataire> = {}): Partial<DossierLocataire> {
  return {
    nom: "DUPONT",
    prenom: "Jean",
    dateNaissance: dobFromAge(25),
    typeContrat: "CDI",
    salaireNetMensuel: 2000,
    situationFiscale: "",
    revenusN1: 24000,
    revenusN2: 0,
    ...overrides,
  };
}

// ─── calculerAge ─────────────────────────────────────────────────────────────
describe("calculerAge", () => {
  it("retourne l'âge correct", () => {
    const dob = dobFromAge(26);
    expect(calculerAge(dob)).toBe(26);
  });

  it("retourne -1 pour une date vide", () => {
    expect(calculerAge("")).toBe(-1);
  });

  it("retourne -1 pour un format invalide", () => {
    expect(calculerAge("2000-01-01")).toBe(-1);
  });
});

// ─── calculerEligibiliteVisale ────────────────────────────────────────────────
describe("calculerEligibiliteVisale", () => {
  it("jeune 25 ans, CDI, loyer 800€, revenus 2000€ → éligible", () => {
    const dossier = makeDossier({ dateNaissance: dobFromAge(25), typeContrat: "CDI", salaireNetMensuel: 2000 });
    const result = calculerEligibiliteVisale(dossier, 800);
    expect(result.eligible).toBe(true);
    expect(result.conditions.age.ok).toBe(true);
    expect(result.conditions.contrat.ok).toBe(true);
    expect(result.conditions.loyerRevenus.ok).toBe(true);
    expect(result.conditions.loyerPlafond.ok).toBe(true);
    expect(result.conditions.nonProprietaire.ok).toBe(true);
  });

  it("35 ans, CDI, loyer 800€, revenus 2000€ → éligible (salarié)", () => {
    const dossier = makeDossier({ dateNaissance: dobFromAge(35), typeContrat: "CDI", salaireNetMensuel: 2000 });
    const result = calculerEligibiliteVisale(dossier, 800);
    expect(result.eligible).toBe(true);
    expect(result.conditions.age.ok).toBe(false); // > 30 ans
    expect(result.conditions.contrat.ok).toBe(true); // CDI sauve
  });

  it("35 ans, sans emploi (contrat vide), loyer 800€ → non éligible", () => {
    const dossier = makeDossier({ dateNaissance: dobFromAge(35), typeContrat: "", salaireNetMensuel: 0 });
    const result = calculerEligibiliteVisale(dossier, 800);
    expect(result.eligible).toBe(false);
    expect(result.motifs_refus.length).toBeGreaterThan(0);
  });

  it("loyer 900€, revenus 1600€ (56%) → non éligible (ratio > 50%)", () => {
    const dossier = makeDossier({ dateNaissance: dobFromAge(25), typeContrat: "CDI", salaireNetMensuel: 1600 });
    const result = calculerEligibiliteVisale(dossier, 900);
    expect(result.eligible).toBe(false);
    expect(result.conditions.loyerRevenus.ok).toBe(false);
    expect(result.conditions.loyerRevenus.ratio).toBe(56);
  });

  it("loyer 2000€, Paris → non éligible (plafond 1800€)", () => {
    const dossier = makeDossier({ dateNaissance: dobFromAge(25), typeContrat: "CDI", salaireNetMensuel: 5000 });
    const result = calculerEligibiliteVisale(dossier, 2000, true);
    expect(result.eligible).toBe(false);
    expect(result.conditions.loyerPlafond.ok).toBe(false);
  });

  it("loyer 1700€, Paris → plafond OK (≤1800€)", () => {
    const dossier = makeDossier({ dateNaissance: dobFromAge(25), typeContrat: "CDI", salaireNetMensuel: 4000 });
    const result = calculerEligibiliteVisale(dossier, 1700, true);
    expect(result.conditions.loyerPlafond.ok).toBe(true);
  });

  it("loyer 1600€, hors Paris → non éligible plafond (>1500€)", () => {
    const dossier = makeDossier({ dateNaissance: dobFromAge(25), typeContrat: "CDI", salaireNetMensuel: 4000 });
    const result = calculerEligibiliteVisale(dossier, 1600, false);
    expect(result.conditions.loyerPlafond.ok).toBe(false);
  });

  it("contrat CDD → éligible si conditions communes OK", () => {
    const dossier = makeDossier({ dateNaissance: dobFromAge(28), typeContrat: "CDD", salaireNetMensuel: 2000 });
    const result = calculerEligibiliteVisale(dossier, 800);
    expect(result.eligible).toBe(true);
  });

  it("contrat INTERIM → éligible si conditions communes OK", () => {
    const dossier = makeDossier({ dateNaissance: dobFromAge(28), typeContrat: "INTERIM", salaireNetMensuel: 2000 });
    const result = calculerEligibiliteVisale(dossier, 800);
    expect(result.eligible).toBe(true);
  });

  it("non éligible → alternatives GarantMe, Unkle, Cautioneo", () => {
    const dossier = makeDossier({ dateNaissance: dobFromAge(35), typeContrat: "", salaireNetMensuel: 0 });
    const result = calculerEligibiliteVisale(dossier, 800);
    expect(result.alternatives).toEqual(["GarantMe", "Unkle", "Cautioneo"]);
  });

  it("éligible → alternatives vides", () => {
    const dossier = makeDossier();
    const result = calculerEligibiliteVisale(dossier, 800);
    expect(result.alternatives).toEqual([]);
  });

  it("score 100 si tout OK", () => {
    const dossier = makeDossier();
    const result = calculerEligibiliteVisale(dossier, 800);
    expect(result.score).toBe(100);
  });
});
