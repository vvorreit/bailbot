import { describe, it, expect } from "vitest";
import { analyserFraude } from "../fraude-detection";
import { DossierLocataire } from "../parsers";

function dossier(overrides: Partial<DossierLocataire> = {}): Partial<DossierLocataire> {
  return {
    nom: "DUPONT",
    prenom: "Jean",
    dateNaissance: "15/03/1990",
    numeroCNI: "ABC123456789",
    salaireNetMensuel: 2916,
    revenusN1: 35000,
    revenusN2: 34000,
    nombreParts: 1,
    typeContrat: "CDI",
    iban: "FR7612345678901234567890123",
    bic: "BNPAFRPP",
    titulaireCompte: "DUPONT Jean",
    anciennete: "depuis 01/2025",
    adresseActuelle: "12 rue de la Paix 75002 Paris",
    adresseDomicile: "12 rue de la Paix 75002 Paris",
    ...overrides,
  };
}

describe("analyserFraude — structure résultat", () => {
  it("retourne verdict + parDocument", () => {
    const r = analyserFraude(dossier());
    expect(r.verdict).toBeDefined();
    expect(["CONFORME", "SUSPECT", "FRAUDE_PROBABLE", "FRAUDE_AVEREE"]).toContain(r.verdict);
    expect(r.parDocument).toHaveLength(5);
    expect(r.parDocument.map((d) => d.document)).toEqual([
      "Bulletin de paie",
      "Avis imposition",
      "CNI",
      "RIB",
      "Justificatif domicile",
    ]);
  });

  it("chaque alerte a un document et sousScore", () => {
    const r = analyserFraude(dossier({ iban: "INVALIDE" }));
    const alerteIban = r.alertes.find((a) => a.code === "IBAN_INVALIDE");
    expect(alerteIban).toBeDefined();
    expect(alerteIban!.document).toBe("RIB");
    expect(alerteIban!.sousScore).toBeGreaterThan(0);
  });
});

describe("analyserFraude — IBAN", () => {
  it("IBAN valide → pas d'alerte IBAN", () => {
    const r = analyserFraude(dossier({ iban: "FR7612345678901234567890123" }));
    const ibanAlertes = r.alertes.filter((a) => a.code === "IBAN_INVALIDE");
    expect(ibanAlertes).toHaveLength(0);
  });

  it("IBAN invalide → ANOMALIE IBAN_INVALIDE", () => {
    const r = analyserFraude(dossier({ iban: "FR761234" }));
    const a = r.alertes.find((a) => a.code === "IBAN_INVALIDE");
    expect(a).toBeDefined();
    expect(a!.niveau).toBe("ANOMALIE");
  });

  it("IBAN manquant → INFO IBAN_MANQUANT", () => {
    const r = analyserFraude(dossier({ iban: "" }));
    const a = r.alertes.find((a) => a.code === "IBAN_MANQUANT");
    expect(a).toBeDefined();
    expect(a!.niveau).toBe("INFO");
  });
});

describe("analyserFraude — BIC", () => {
  it("BIC valide → pas d'alerte", () => {
    const r = analyserFraude(dossier({ bic: "BNPAFRPP" }));
    expect(r.alertes.find((a) => a.code === "BIC_INVALIDE")).toBeUndefined();
  });

  it("BIC 11 caractères valide → pas d'alerte", () => {
    const r = analyserFraude(dossier({ bic: "BNPAFRPPXXX" }));
    expect(r.alertes.find((a) => a.code === "BIC_INVALIDE")).toBeUndefined();
  });

  it("BIC invalide → ATTENTION", () => {
    const r = analyserFraude(dossier({ bic: "INVALID" }));
    const a = r.alertes.find((a) => a.code === "BIC_INVALIDE");
    expect(a).toBeDefined();
    expect(a!.niveau).toBe("ATTENTION");
    expect(a!.document).toBe("RIB");
  });
});

describe("analyserFraude — cohérence salaire/revenus", () => {
  it("écart < 20% → aucune alerte salaire", () => {
    const r = analyserFraude(dossier({ salaireNetMensuel: 2916, revenusN1: 35000 }));
    const alertesSalaire = r.alertes.filter(
      (a) => a.code === "SALAIRE_REVENUS_INCOHERENT" || a.code === "SALAIRE_REVENUS_ECART"
    );
    expect(alertesSalaire).toHaveLength(0);
  });

  it("écart 20-35% → ATTENTION", () => {
    const r = analyserFraude(dossier({ salaireNetMensuel: 2000, revenusN1: 32000 }));
    const a = r.alertes.find((a) => a.code === "SALAIRE_REVENUS_ECART");
    expect(a).toBeDefined();
    expect(a!.niveau).toBe("ATTENTION");
  });

  it("écart > 35% → ANOMALIE", () => {
    const r = analyserFraude(dossier({ salaireNetMensuel: 1000, revenusN1: 25000 }));
    const a = r.alertes.find((a) => a.code === "SALAIRE_REVENUS_INCOHERENT");
    expect(a).toBeDefined();
    expect(a!.niveau).toBe("ANOMALIE");
  });
});

describe("analyserFraude — CNI", () => {
  it("numéro CNI valide → pas d'alerte format", () => {
    const r = analyserFraude(dossier({ numeroCNI: "ABC123456789" }));
    expect(r.alertes.find((a) => a.code === "CNI_FORMAT_INVALIDE")).toBeUndefined();
  });

  it("numéro CNI invalide → ATTENTION", () => {
    const r = analyserFraude(dossier({ numeroCNI: "123" }));
    const a = r.alertes.find((a) => a.code === "CNI_FORMAT_INVALIDE");
    expect(a).toBeDefined();
    expect(a!.niveau).toBe("ATTENTION");
    expect(a!.document).toBe("CNI");
  });

  it("mineur → CRITIQUE", () => {
    const r = analyserFraude(dossier({ dateNaissance: "15/03/2015" }));
    const a = r.alertes.find((a) => a.code === "CNI_MINEUR");
    expect(a).toBeDefined();
    expect(a!.niveau).toBe("CRITIQUE");
  });

  it("âge > 80 → INFO", () => {
    const r = analyserFraude(dossier({ dateNaissance: "15/03/1930" }));
    const a = r.alertes.find((a) => a.code === "CNI_AGE_ELEVE");
    expect(a).toBeDefined();
    expect(a!.niveau).toBe("INFO");
  });
});

describe("analyserFraude — avis imposition", () => {
  it("RFR/part normal → pas d'alerte", () => {
    const r = analyserFraude(dossier({ revenusN1: 35000, nombreParts: 1 }));
    const impoAlertes = r.alertes.filter(
      (a) => a.code === "IMPO_RFR_FAIBLE" || a.code === "IMPO_RFR_ELEVE"
    );
    expect(impoAlertes).toHaveLength(0);
  });

  it("RFR/part < 8000 → INFO", () => {
    const r = analyserFraude(dossier({ revenusN1: 5000, nombreParts: 1, salaireNetMensuel: 400 }));
    const a = r.alertes.find((a) => a.code === "IMPO_RFR_FAIBLE");
    expect(a).toBeDefined();
    expect(a!.document).toBe("Avis imposition");
  });

  it("RFR/part > 80000 → ATTENTION", () => {
    const r = analyserFraude(dossier({ revenusN1: 100000, nombreParts: 1, salaireNetMensuel: 8333 }));
    const a = r.alertes.find((a) => a.code === "IMPO_RFR_ELEVE");
    expect(a).toBeDefined();
    expect(a!.document).toBe("Avis imposition");
  });
});

describe("analyserFraude — cohérence adresse", () => {
  it("adresses identiques → pas d'alerte", () => {
    const r = analyserFraude(
      dossier({
        adresseActuelle: "12 rue de la Paix 75002 Paris",
        adresseDomicile: "12 rue de la Paix 75002 Paris",
      })
    );
    expect(r.alertes.find((a) => a.code === "ADRESSE_INCOHERENTE")).toBeUndefined();
  });

  it("adresses très différentes → ATTENTION", () => {
    const r = analyserFraude(
      dossier({
        adresseActuelle: "12 rue de la Paix 75002 Paris",
        adresseDomicile: "88 boulevard Haussmann 69001 Lyon",
      })
    );
    const a = r.alertes.find((a) => a.code === "ADRESSE_INCOHERENTE");
    expect(a).toBeDefined();
    expect(a!.document).toBe("Justificatif domicile");
  });
});

describe("analyserFraude — nom CNI vs RIB", () => {
  it("noms identiques → pas d'alerte", () => {
    const r = analyserFraude(dossier({ nom: "DUPONT", titulaireCompte: "DUPONT Jean" }));
    const nomAlertes = r.alertes.filter(
      (a) => a.code === "NOM_INCOHERENT" || a.code === "NOM_RIB_CNI_INCOHERENT"
    );
    expect(nomAlertes).toHaveLength(0);
  });

  it("noms très différents → ANOMALIE", () => {
    const r = analyserFraude(dossier({ nom: "DUPONT", titulaireCompte: "MARTINEZ Carlos" }));
    const a = r.alertes.find((a) => a.code === "NOM_RIB_CNI_INCOHERENT");
    expect(a).toBeDefined();
    expect(a!.niveau).toBe("ANOMALIE");
  });
});

describe("analyserFraude — score et verdict", () => {
  it("dossier cohérent → CONFORME (>= 90)", () => {
    const r = analyserFraude(dossier());
    expect(r.score_confiance).toBeGreaterThanOrEqual(90);
    expect(r.verdict).toBe("CONFORME");
  });

  it("dossier avec anomalie IBAN → score réduit", () => {
    const r = analyserFraude(dossier({ iban: "INVALIDE" }));
    expect(r.score_confiance).toBeLessThan(100);
  });

  it("score est entre 0 et 100", () => {
    const r = analyserFraude(dossier({ iban: "", salaireNetMensuel: 500, revenusN1: 30000 }));
    expect(r.score_confiance).toBeGreaterThanOrEqual(0);
    expect(r.score_confiance).toBeLessThanOrEqual(100);
  });

  it("score par document est entre 0 et 100", () => {
    const r = analyserFraude(dossier({ iban: "INVALIDE", bic: "BAD" }));
    for (const pd of r.parDocument) {
      expect(pd.score).toBeGreaterThanOrEqual(0);
      expect(pd.score).toBeLessThanOrEqual(100);
    }
  });
});
