import { describe, it, expect } from "vitest";
import { parseKbis, parseBilan, parse2035 } from "../parsers";

/* ─── parseKbis ──────────────────────────────────────────────────────────────── */

describe("parseKbis", () => {
  it("extrait le SIRET sur 14 chiffres bruts", () => {
    const text = "SIRET : 12345678901234 — CABINET DUPONT";
    const r = parseKbis(text);
    expect(r.siret).toBe("12345678901234");
  });

  it("extrait le SIRET avec espaces de séparation", () => {
    const text = "SIRET 123 456 789 01234";
    const r = parseKbis(text);
    expect(r.siret).toBe("12345678901234");
  });

  it("extrait la dénomination sociale", () => {
    const text = "Dénomination sociale : MARTIN & ASSOCIÉS SELARL\nSIRET: 98765432101234";
    const r = parseKbis(text);
    expect(r.denomination).toMatch(/MARTIN/i);
  });

  it("extrait la forme juridique SARL", () => {
    const text = "Forme : SARL\nSIRET 11122233344456";
    const r = parseKbis(text);
    expect(r.formeJuridique).toBe("SARL");
  });

  it("extrait la forme juridique SELARL", () => {
    const text = "Structure : SELARL\nDénomination : CABINET LEGRAND\nSIRET 11122233344456";
    const r = parseKbis(text);
    expect(r.formeJuridique).toBe("SELARL");
  });

  it("extrait SAS correctement", () => {
    const text = "SAS MY COMPANY — SIRET 10101010101015";
    const r = parseKbis(text);
    expect(r.formeJuridique).toBe("SAS");
  });

  it("extrait la date d'immatriculation format JJ/MM/AAAA", () => {
    const text = "Immatriculée le 15/03/2018\nSIRET 12345678901234";
    const r = parseKbis(text);
    expect(r.dateImmat).toBe("15/03/2018");
  });

  it("retourne des chaînes vides si aucune info trouvée", () => {
    const r = parseKbis("Texte quelconque sans données professionnelles");
    expect(r.siret).toBe("");
    expect(r.formeJuridique).toBe("");
  });

  it("détecte micro-entreprise", () => {
    const text = "micro-entreprise — SIRET 55566677788899";
    const r = parseKbis(text);
    expect(r.formeJuridique.toLowerCase()).toContain("micro");
  });
});

/* ─── parseBilan ─────────────────────────────────────────────────────────────── */

describe("parseBilan", () => {
  it("extrait l'exercice sur 4 chiffres", () => {
    const text = "Bilan exercice 2024\nChiffre d'affaires net : 250 000,00 €";
    const r = parseBilan(text);
    expect(r.exercice).toBe("2024");
  });

  it("extrait l'exercice via date 31/12/AAAA", () => {
    const text = "Bilan au 31/12/2023\nProduits d'exploitation : 85 000,00";
    const r = parseBilan(text);
    expect(r.exercice).toBe("2023");
  });

  it("extrait le chiffre d'affaires", () => {
    const text = "exercice 2024\nChiffre d'affaires 180 000,00 €\nRésultat net 22 000,00 €";
    const r = parseBilan(text);
    expect(r.chiffreAffaires).toBe(180000);
  });

  it("extrait le résultat net positif", () => {
    const text = "exercice 2024\nCA : 100 000\nRésultat net : 15 000,00 €";
    const r = parseBilan(text);
    expect(r.resultatNet).toBe(15000);
  });

  it("extrait les capitaux propres", () => {
    const text = "exercice 2024\nCapitaux propres : 45 000,00 €";
    const r = parseBilan(text);
    expect(r.capitauxPropres).toBe(45000);
  });

  it("retourne 0 pour les montants si rien trouvé", () => {
    const r = parseBilan("Bilan vide sans données chiffrées");
    expect(r.chiffreAffaires).toBe(0);
    expect(r.resultatNet).toBe(0);
    expect(r.capitauxPropres).toBe(0);
  });
});

/* ─── parse2035 ──────────────────────────────────────────────────────────────── */

describe("parse2035", () => {
  it("extrait l'année depuis en-tête 2035 (capte l'année fiscale)", () => {
    /* Le parser cherche un 4-chiffres après le mot-clé "2035" ou "déclaration".
       Le texte "Déclaration 2035 — recettes…" → extrait "2035" comme année (attendu). */
    const text = "Déclaration 2035\nRecettes totales : 95 000,00 €";
    const r = parse2035(text);
    expect(r.annee).toBe("2035");
  });

  it("extrait les recettes totales", () => {
    const text = "2035 année 2023\nRecettes totales : 78 500,00 €\nBénéfice imposable : 12 300,00 €";
    const r = parse2035(text);
    expect(r.recettes).toBe(78500);
  });

  it("extrait le bénéfice imposable", () => {
    const text = "2035 année 2024\nRecettes : 90 000,00\nBénéfice imposable : 14 200,00 €";
    const r = parse2035(text);
    expect(r.benefice).toBe(14200);
  });

  it("extrait le résultat net (variante libellé)", () => {
    const text = "Déclaration 2035\nannée 2024\nRecettes professionnelles : 65 000,00 €\nRésultat : 9 800,00 €";
    const r = parse2035(text);
    expect(r.recettes).toBe(65000);
  });

  it("retourne 0 si aucune donnée numérique", () => {
    const r = parse2035("Formulaire 2035 vide");
    expect(r.recettes).toBe(0);
    expect(r.benefice).toBe(0);
  });

  it("gère les montants sans centimes", () => {
    const text = "2035 — 2024\nRecettes 120000\nBénéfice net 20000";
    const r = parse2035(text);
    expect(r.recettes).toBeGreaterThan(0);
  });
});
