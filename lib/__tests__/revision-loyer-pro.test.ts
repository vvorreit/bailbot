import { describe, it, expect } from "vitest";
import {
  calculerRevisionLoyerPro,
  ILC_DATA,
  ILAT_DATA,
  type IndiceRevisionPro,
} from "../revision-loyer";

/* Date de signature fictive avec 1 an d'écart garanti dans les données */
const DATE_SIGN = "01/01/2023";
const DATE_REV = "01/01/2024";

describe("calculerRevisionLoyerPro — ILC", () => {
  it("calcule correctement le nouveau loyer HT avec ILC", () => {
    const r = calculerRevisionLoyerPro(1000, "ILC", DATE_SIGN, DATE_REV);
    const t1 = "2024-T1";
    const t0 = "2023-T1";
    const expected = Math.ceil((1000 * (ILC_DATA[t1] / ILC_DATA[t0])) * 100) / 100;
    expect(r.nouveauLoyerHT).toBe(expected);
  });

  it("variation est positive quand l'indice monte", () => {
    const r = calculerRevisionLoyerPro(1000, "ILC", DATE_SIGN, DATE_REV);
    expect(r.variation).toBeGreaterThan(0);
  });

  it("retourne les bons trimestres de référence", () => {
    const r = calculerRevisionLoyerPro(1000, "ILC", DATE_SIGN, DATE_REV);
    expect(r.trimestreNouveau).toBe("2024-T1");
    expect(r.trimestreReference).toBe("2023-T1");
  });

  it("sans TVA → nouveauLoyerTTC absent", () => {
    const r = calculerRevisionLoyerPro(1000, "ILC", DATE_SIGN, DATE_REV, false);
    expect(r.tvaApplicable).toBe(false);
    expect(r.nouveauLoyerTTC).toBeUndefined();
  });

  it("avec TVA → nouveauLoyerTTC = nouveauLoyerHT × 1.20", () => {
    const r = calculerRevisionLoyerPro(1000, "ILC", DATE_SIGN, DATE_REV, true);
    expect(r.tvaApplicable).toBe(true);
    expect(r.nouveauLoyerTTC).toBeDefined();
    const expected = Math.ceil(r.nouveauLoyerHT * 1.20 * 100) / 100;
    expect(r.nouveauLoyerTTC).toBe(expected);
  });
});

describe("calculerRevisionLoyerPro — ILAT", () => {
  it("calcule correctement le nouveau loyer HT avec ILAT", () => {
    const r = calculerRevisionLoyerPro(1500, "ILAT", DATE_SIGN, DATE_REV);
    const t1 = "2024-T1";
    const t0 = "2023-T1";
    const expected = Math.ceil((1500 * (ILAT_DATA[t1] / ILAT_DATA[t0])) * 100) / 100;
    expect(r.nouveauLoyerHT).toBe(expected);
  });

  it("augmentationHT = nouveauLoyerHT - loyerHT", () => {
    const loyer = 2000;
    const r = calculerRevisionLoyerPro(loyer, "ILAT", DATE_SIGN, DATE_REV);
    const expected = Math.round((r.nouveauLoyerHT - loyer) * 100) / 100;
    expect(r.augmentationHT).toBe(expected);
  });

  it("variation = (augmentation / loyer) × 100", () => {
    const loyer = 1200;
    const r = calculerRevisionLoyerPro(loyer, "ILAT", DATE_SIGN, DATE_REV);
    const variationExpected = Math.round(((r.nouveauLoyerHT - loyer) / loyer) * 10000) / 100;
    expect(r.variation).toBe(variationExpected);
  });

  it("dateApplication est au format JJ/MM/AAAA", () => {
    const r = calculerRevisionLoyerPro(1000, "ILAT", DATE_SIGN, DATE_REV);
    expect(r.dateApplication).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });
});

describe("calculerRevisionLoyerPro — erreurs attendues", () => {
  it("LIBRE → throw", () => {
    expect(() => calculerRevisionLoyerPro(1000, "LIBRE" as IndiceRevisionPro, DATE_SIGN, DATE_REV)).toThrow();
  });

  it("ICC → throw", () => {
    expect(() => calculerRevisionLoyerPro(1000, "ICC" as IndiceRevisionPro, DATE_SIGN, DATE_REV)).toThrow();
  });
});

describe("calculerRevisionLoyerPro — ILC vs ILAT différence", () => {
  it("ILC et ILAT donnent des résultats légèrement différents", () => {
    const r1 = calculerRevisionLoyerPro(1000, "ILC", DATE_SIGN, DATE_REV);
    const r2 = calculerRevisionLoyerPro(1000, "ILAT", DATE_SIGN, DATE_REV);
    /* Les deux indices évoluent différemment — résultats distincts */
    expect(r1.indiceNouveau).not.toBe(r2.indiceNouveau);
  });

  it("arrondi au centime supérieur (ceil)", () => {
    /* Vérifie que le résultat est bien arrondi au centime superieur */
    const r = calculerRevisionLoyerPro(1000, "ILC", DATE_SIGN, DATE_REV);
    const precise = 1000 * (r.indiceNouveau / r.indiceReference);
    const ceilCentime = Math.ceil(precise * 100) / 100;
    expect(r.nouveauLoyerHT).toBe(ceilCentime);
  });
});
