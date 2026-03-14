import { describe, it, expect } from "vitest";
import { parseCNI, parseBulletinPaie, parseAvisImposition, parseRIB, parseJustificatifDomicile, detectDocumentType } from "../parsers";

describe("parseCNI", () => {
  it("extrait le numéro CNI (12 chiffres)", () => {
    const text = "REPUBLIQUE FRANCAISE\nDUPONT JEAN\n01/01/1990\n123456789012";
    const result = parseCNI(text);
    expect(result.numeroCNI).toBe("123456789012");
  });

  it("extrait la date de naissance", () => {
    const text = "né le 15/03/1985\nDURAND MARIE";
    const result = parseCNI(text);
    expect(result.dateNaissance).toContain("15");
  });
});

describe("parseBulletinPaie", () => {
  it("extrait le salaire net", () => {
    const text = "ACME SAS\nNET À PAYER : 2 850,00 €\nCDI";
    const result = parseBulletinPaie(text);
    expect(result.salaireNetMensuel).toBeGreaterThan(0);
  });

  it("détecte le type de contrat CDI", () => {
    const text = "Contrat : CDI\nNET À PAYER : 2 000,00 €";
    const result = parseBulletinPaie(text);
    expect(result.typeContrat).toBe("CDI");
  });
});

describe("parseAvisImposition", () => {
  it("extrait le revenu fiscal de référence", () => {
    const text = "DIRECTION GÉNÉRALE DES FINANCES PUBLIQUES\nREVENU FISCAL DE RÉFÉRENCE : 35 000";
    const result = parseAvisImposition(text);
    expect(result.revenusN1).toBe(35000);
  });
});

describe("parseRIB", () => {
  it("extrait un IBAN français", () => {
    const text = "IBAN : FR76 1234 5678 9012 3456 7890 123\nBIC : BNPAFRPPXXX";
    const result = parseRIB(text);
    expect(result.iban).toMatch(/^FR/);
    expect(result.bic).toBe("BNPAFRPPXXX");
  });
});

describe("detectDocumentType", () => {
  it("détecte un bulletin de paie", () => {
    const text = "Bulletin de salaire\nNET À PAYER 2000";
    expect(detectDocumentType(text)).toBe("bulletin_paie");
  });

  it("détecte un RIB", () => {
    const text = "Relevé d'identité bancaire\nIBAN FR76";
    expect(detectDocumentType(text)).toBe("rib");
  });

  it("détecte un avis d'imposition", () => {
    const text = "Direction générale des finances\nREVENU FISCAL DE RÉFÉRENCE";
    expect(detectDocumentType(text)).toBe("avis_imposition");
  });
});
