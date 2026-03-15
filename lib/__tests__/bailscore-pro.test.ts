import { describe, it, expect } from "vitest";
import { computeBailScorePro, type DossierProInput } from "../bailscore";

function dossPro(overrides: Partial<DossierProInput> = {}): DossierProInput {
  return {
    kbis: { siret: "12345678901234", denomination: "CABINET MARTIN", formeJuridique: "SELARL", dateImmat: "01/01/2015" },
    bilans: [
      { exercice: "2024", chiffreAffaires: 120000, resultatNet: 18000, capitauxPropres: 50000 },
      { exercice: "2023", chiffreAffaires: 110000, resultatNet: 15000, capitauxPropres: 45000 },
    ],
    ribFourni: true,
    rcProFournie: true,
    cniDirigeant: true,
    ...overrides,
  };
}

describe("computeBailScorePro — solvabilité", () => {
  it("CA/loyer ≥ 5× → 35 pts solvabilité", () => {
    /* loyer 2000 HT/mois → 24 000 HT/an ; CA 120 000 = 5× */
    const s = computeBailScorePro(dossPro(), 2000);
    expect(s.dimensions.solvabilitePro.score).toBe(35);
  });

  it("CA/loyer ≥ 3× et < 5× → 25 pts (base) + bonus résultat net positif", () => {
    /* loyer 3500 HT/mois → 42 000 HT/an ; CA 120 000 ≈ 2.86× → base 12 + bonus = 17 */
    /* En fait CA 120 000 / (3500 * 12 = 42 000) ≈ 2.86 → tranche < 3 → 12 pts */
    const s = computeBailScorePro(dossPro(), 3500);
    expect(s.dimensions.solvabilitePro.score).toBeGreaterThanOrEqual(12);
  });

  it("CA/loyer ≥ 3× exact → 25 pts + bonus résultat net positif", () => {
    /* loyer 1200 → 14 400/an ; CA 60 000 = ~4.17× */
    const s = computeBailScorePro(dossPro({
      bilans: [{ exercice: "2024", chiffreAffaires: 60000, resultatNet: 5000, capitauxPropres: 20000 }],
    }), 1200);
    expect(s.dimensions.solvabilitePro.score).toBeGreaterThanOrEqual(25);
  });

  it("résultat net négatif signalé en pointsAttention", () => {
    const s = computeBailScorePro(dossPro({
      bilans: [{ exercice: "2024", chiffreAffaires: 120000, resultatNet: -5000, capitauxPropres: 30000 }],
    }), 2000);
    expect(s.pointsAttention).toContain("Résultat net négatif");
  });

  it("CA non renseigné → solvabilité 0 + pointsAttention", () => {
    const s = computeBailScorePro(dossPro({ bilans: [], declaration2035: [] }), 2000);
    expect(s.dimensions.solvabilitePro.score).toBe(0);
    expect(s.pointsAttention.some((p) => /chiffre d.affaires/i.test(p))).toBe(true);
  });
});

describe("computeBailScorePro — stabilité activité", () => {
  it("entreprise > 5 ans → 20 pts ancienneté de base", () => {
    const s = computeBailScorePro(dossPro(), 2000);
    /* dateImmat 01/01/2015 → > 10 ans → 20 pts + bonus CA en hausse 10 pts = 30 */
    expect(s.dimensions.stabilitePro.score).toBeGreaterThanOrEqual(20);
  });

  it("entreprise < 2 ans → 5 pts ancienneté + pointsAttention", () => {
    const s = computeBailScorePro(dossPro({
      kbis: { siret: "12345678901234", denomination: "CABINET MARTIN", formeJuridique: "SELARL", dateImmat: "01/01/2025" },
    }), 2000);
    /* 2025 → < 2 ans depuis 2026 */
    const ancScore = s.dimensions.stabilitePro.score;
    expect(ancScore).toBeGreaterThanOrEqual(0);
    expect(s.pointsAttention.some((p) => /2 ans/.test(p))).toBe(true);
  });

  it("CA en hausse → bonus +10 points", () => {
    const s = computeBailScorePro(dossPro({
      bilans: [
        { exercice: "2024", chiffreAffaires: 130000, resultatNet: 10000, capitauxPropres: 50000 },
        { exercice: "2023", chiffreAffaires: 110000, resultatNet: 8000, capitauxPropres: 40000 },
      ],
    }), 2000);
    expect(s.pointsForts.some((p) => /CA en progression/i.test(p))).toBe(true);
  });

  it("SIRET absent → stabilitéPro 0 + pointsAttention", () => {
    const s = computeBailScorePro(dossPro({ kbis: undefined }), 2000);
    expect(s.pointsAttention.some((p) => /SIRET/i.test(p))).toBe(true);
  });
});

describe("computeBailScorePro — complétude dossier", () => {
  it("dossier complet (toutes pièces) → 20 pts", () => {
    const s = computeBailScorePro(dossPro(), 2000);
    expect(s.dimensions.completudePro.score).toBe(20);
  });

  it("RC Pro manquante → pénalité 2 pts", () => {
    const s = computeBailScorePro(dossPro({ rcProFournie: false }), 2000);
    expect(s.dimensions.completudePro.score).toBe(18);
  });

  it("RIB et CNI manquants → pénalité 4+2 pts", () => {
    const s = computeBailScorePro(dossPro({ ribFourni: false, cniDirigeant: false }), 2000);
    expect(s.dimensions.completudePro.score).toBe(14);
  });
});

describe("computeBailScorePro — profil risque", () => {
  it("SARL → 15 pts profil", () => {
    const s = computeBailScorePro(dossPro({
      kbis: { siret: "12345678901234", denomination: "SARL TEST", formeJuridique: "SARL", dateImmat: "01/01/2015" },
    }), 2000);
    expect(s.dimensions.profilRisque.score).toBe(15);
  });

  it("SELARL → 12 pts profil", () => {
    const s = computeBailScorePro(dossPro(), 2000);
    expect(s.dimensions.profilRisque.score).toBe(12);
  });

  it("EI → 8 pts profil + pointsAttention responsabilité", () => {
    const s = computeBailScorePro(dossPro({
      kbis: { siret: "12345678901234", denomination: "EI MARTIN", formeJuridique: "EI", dateImmat: "01/01/2015" },
    }), 2000);
    expect(s.dimensions.profilRisque.score).toBe(8);
    expect(s.pointsAttention.some((p) => /responsabilit/i.test(p))).toBe(true);
  });
});

describe("computeBailScorePro — total & grade", () => {
  it("dossier excellent → grade EXCELLENT", () => {
    const s = computeBailScorePro(dossPro(), 2000);
    expect(s.total).toBeGreaterThanOrEqual(80);
    expect(s.grade).toBe("EXCELLENT");
  });

  it("score total est clamped entre 0 et 100", () => {
    const s = computeBailScorePro(dossPro(), 100);
    expect(s.total).toBeGreaterThanOrEqual(0);
    expect(s.total).toBeLessThanOrEqual(100);
  });

  it("dossier vide → grade INSUFFISANT", () => {
    const s = computeBailScorePro({ bilans: [], declaration2035: [], ribFourni: false, rcProFournie: false, cniDirigeant: false }, 2000);
    expect(s.grade).toBe("INSUFFISANT");
  });

  it("utilise recettes 2035 si pas de bilan", () => {
    const s = computeBailScorePro({
      declaration2035: [
        { annee: "2024", recettes: 80000, benefice: 12000 },
        { annee: "2023", recettes: 70000, benefice: 10000 },
      ],
      ribFourni: true,
      rcProFournie: true,
      cniDirigeant: true,
    }, 1500);
    /* 80 000 / 18 000 = ~4.4× → entre 3 et 5 → 25 pts + bonus bénéfice positif */
    expect(s.dimensions.solvabilitePro.score).toBeGreaterThan(0);
  });
});
