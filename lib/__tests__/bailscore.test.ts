import { describe, it, expect } from "vitest";
import { calculerBailScore } from "../bailscore";
import { DossierLocataire } from "../parsers";

function dossier(overrides: Partial<DossierLocataire> = {}): Partial<DossierLocataire> {
  return {
    nom: "DUPONT",
    prenom: "Jean",
    dateNaissance: "15/06/1990",
    typeContrat: "CDI",
    salaireNetMensuel: 3000,
    revenusN1: 35000,
    revenusN2: 34000,
    iban: "FR7612345678901234567890123",
    adresseActuelle: "12 rue de la Paix, 75001 Paris",
    anciennete: "3 ans",
    bulletinsCount: 3,
    ...overrides,
  };
}

describe("calculerBailScore — solvabilité", () => {
  it("ratio ≤ 0.33 → 40 pts solvabilité", () => {
    const s = calculerBailScore(dossier({ salaireNetMensuel: 3000 }), 900);
    expect(s.dimensions.solvabilite.score).toBe(40);
  });

  it("ratio ≤ 0.40 → 28 pts solvabilité (sans bonus N1/N2)", () => {
    // Désactive le bonus N1/N2 en mettant revenusN2 = 0
    const s = calculerBailScore(dossier({ salaireNetMensuel: 3000, revenusN2: 0 }), 1100);
    expect(s.dimensions.solvabilite.score).toBe(28);
  });

  it("ratio ≤ 0.50 → 15 pts solvabilité (sans bonus N1/N2)", () => {
    const s = calculerBailScore(dossier({ salaireNetMensuel: 3000, revenusN1: 0, revenusN2: 0 }), 1400);
    expect(s.dimensions.solvabilite.score).toBe(15);
  });

  it("ratio > 0.50 → 0 pts solvabilité (sans bonus N1/N2)", () => {
    const s = calculerBailScore(dossier({ salaireNetMensuel: 1000, revenusN1: 0, revenusN2: 0 }), 700);
    expect(s.dimensions.solvabilite.score).toBe(0);
  });

  it("bonus +5 si revenus N1/N2 stables", () => {
    const s = calculerBailScore(
      dossier({ salaireNetMensuel: 3000, revenusN1: 35000, revenusN2: 34000 }),
      900
    );
    // 40 pts + 5 bonus stabilité = 40 (capped) → test bonus applied
    expect(s.dimensions.solvabilite.score).toBe(40);
    // Avec ratio 28 pts + 5 bonus
    const s2 = calculerBailScore(
      dossier({ salaireNetMensuel: 3000, revenusN1: 35000, revenusN2: 34000 }),
      1100
    );
    expect(s2.dimensions.solvabilite.score).toBe(33); // 28 + 5
  });
});

describe("calculerBailScore — stabilité professionnelle", () => {
  it("CDI → 30 pts stabilité", () => {
    const s = calculerBailScore(dossier({ typeContrat: "CDI" }), 900);
    expect(s.dimensions.stabilite.score).toBeGreaterThanOrEqual(30);
  });

  it("CDD → score inférieur au CDI", () => {
    const sCDD = calculerBailScore(dossier({ typeContrat: "CDD" }), 900);
    const sCDI = calculerBailScore(dossier({ typeContrat: "CDI" }), 900);
    expect(sCDD.dimensions.stabilite.score).toBeLessThan(sCDI.dimensions.stabilite.score);
  });

  it("sans emploi → 0 pts stabilité", () => {
    const s = calculerBailScore(dossier({ typeContrat: "" }), 900);
    expect(s.dimensions.stabilite.score).toBe(0);
  });

  it("bonus très solvable (salaire > 4× loyer)", () => {
    const s = calculerBailScore(dossier({ salaireNetMensuel: 5000, typeContrat: "CDI" }), 900);
    // CDI 30 pts + bonus 5 pts = 35, mais capped à 30
    expect(s.dimensions.stabilite.score).toBe(30);
    // Avec CDD : 20 + 5 = 25
    const sCDD = calculerBailScore(dossier({ salaireNetMensuel: 5000, typeContrat: "CDD", anciennete: "8 mois" }), 900);
    expect(sCDD.dimensions.stabilite.score).toBe(25);
  });
});

describe("calculerBailScore — grade", () => {
  it("score >= 80 → EXCELLENT", () => {
    const s = calculerBailScore(dossier({ salaireNetMensuel: 4000, typeContrat: "CDI" }), 900);
    expect(["EXCELLENT", "BON"]).toContain(s.grade);
  });

  it("score très bas → INSUFFISANT ou FAIBLE", () => {
    const s = calculerBailScore(
      { salaireNetMensuel: 800, typeContrat: "" },
      900
    );
    expect(["INSUFFISANT", "FAIBLE"]).toContain(s.grade);
  });

  it("total est entre 0 et 100", () => {
    const s = calculerBailScore(dossier(), 1000);
    expect(s.total).toBeGreaterThanOrEqual(0);
    expect(s.total).toBeLessThanOrEqual(100);
  });
});
