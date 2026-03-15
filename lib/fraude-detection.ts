// ─── BailBot — Détection de Fraude ───────────────────────────────────────────
// Analyse la cohérence d'un dossier locataire et détecte les anomalies

import { DossierLocataire } from "./parsers";

export interface AlerteFraude {
  niveau: "INFO" | "ATTENTION" | "ANOMALIE" | "CRITIQUE";
  code: string;
  message: string;
  detail: string;
  document?: string;
  sousScore?: number;
}

export interface ResultatFraude {
  alertes: AlerteFraude[];
  score_confiance: number;
  synthese: string;
  verdict: "CONFORME" | "SUSPECT" | "FRAUDE_PROBABLE" | "FRAUDE_AVEREE";
  parDocument: {
    document: string;
    score: number;
    alertes: AlerteFraude[];
  }[];
}

type DocType = "Bulletin de paie" | "Avis imposition" | "CNI" | "RIB" | "Justificatif domicile";

const DOC_POIDS: Record<DocType, number> = {
  "Bulletin de paie": 0.40,
  "Avis imposition": 0.30,
  "CNI": 0.15,
  "RIB": 0.10,
  "Justificatif domicile": 0.05,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }
  return dp[m][n];
}

function validerIBANFR(iban: string): boolean {
  const clean = iban.replace(/\s/g, "").toUpperCase();
  return /^FR\d{2}[0-9A-Z]{23}$/.test(clean);
}

function validerBIC(bic: string): boolean {
  const clean = bic.replace(/\s/g, "").toUpperCase();
  return /^[A-Z]{4}[A-Z]{2}[0-9A-Z]{2}([0-9A-Z]{3})?$/.test(clean);
}

function validerNumeroCNI(numero: string): boolean {
  const clean = numero.replace(/\s/g, "").toUpperCase();
  return /^[0-9A-Z]{12}$/.test(clean);
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split(/[\/\-\.]/);
  if (parts.length === 2) {
    const [month, year] = parts.map(Number);
    if (month && year) return new Date(year, month - 1, 1);
  } else if (parts.length === 3) {
    const [day, month, year] = parts.map(Number);
    if (day && month && year) return new Date(year, month - 1, day);
  }
  return null;
}

function normaliserNom(nom: string): string {
  return nom.trim().toUpperCase().replace(/[-']/g, " ").replace(/\s+/g, " ");
}

// ─── Analyse principale ───────────────────────────────────────────────────────

export function analyserFraude(dossier: Partial<DossierLocataire>): ResultatFraude {
  const alertes: AlerteFraude[] = [];
  const maintenant = new Date();
  const anneeActuelle = maintenant.getFullYear();

  // ─── 1. Cohérence salaire / revenus fiscaux ───────────────────────────────
  const salaire = dossier.salaireNetMensuel ?? 0;
  const revenusN1 = dossier.revenusN1 ?? 0;

  if (salaire > 0 && revenusN1 > 0) {
    const salaireAnnuel = salaire * 12;
    const ecart = Math.abs(salaireAnnuel - revenusN1) / revenusN1;
    const ecartPct = Math.round(ecart * 100);

    if (ecart > 0.35) {
      alertes.push({
        niveau: "ANOMALIE",
        code: "SALAIRE_REVENUS_INCOHERENT",
        message: "Forte incohérence — vérification manuelle requise",
        detail: `Salaire annualisé : ${salaireAnnuel.toLocaleString("fr-FR")} € vs revenus fiscaux N-1 : ${revenusN1.toLocaleString("fr-FR")} € (écart : ${ecartPct}%)`,
        document: "Bulletin de paie",
        sousScore: 25,
      });
    } else if (ecart > 0.20) {
      alertes.push({
        niveau: "ATTENTION",
        code: "SALAIRE_REVENUS_ECART",
        message: `Écart salaire/revenus fiscaux à vérifier (${ecartPct}%)`,
        detail: `Salaire annualisé : ${salaireAnnuel.toLocaleString("fr-FR")} € vs revenus fiscaux N-1 : ${revenusN1.toLocaleString("fr-FR")} €`,
        document: "Bulletin de paie",
        sousScore: 12,
      });
    }
  }

  // ─── 2. Cohérence mathématique bulletins de paie ─────────────────────────
  if (salaire > 0) {
    /* Ratio net/brut attendu entre 0.70 et 0.85 en France */
    /* Pas de champ brut dans le dossier, on vérifie via cumul annuel si disponible */
  }

  // ─── 3. Cohérence temporelle bulletins ───────────────────────────────────
  const anciennete = (dossier.anciennete ?? "").toLowerCase();
  const dateMatch = anciennete.match(/(\d{2}[\/\-]\d{4})/);
  if (dateMatch) {
    const dateBulletin = parseDate(dateMatch[1].replace("-", "/"));
    if (dateBulletin) {
      const diffMois =
        (maintenant.getFullYear() - dateBulletin.getFullYear()) * 12 +
        (maintenant.getMonth() - dateBulletin.getMonth());

      if (diffMois > 24) {
        alertes.push({
          niveau: "ANOMALIE",
          code: "BULLETIN_TRES_ANCIEN",
          message: `Bulletin de paie très ancien (${diffMois} mois)`,
          detail: `Date estimée : ${dateMatch[1]}. Les bulletins doivent dater de moins de 3 mois.`,
          document: "Bulletin de paie",
          sousScore: 20,
        });
      } else if (diffMois > 3) {
        alertes.push({
          niveau: "INFO",
          code: "DOCUMENT_ANCIEN",
          message: `Bulletin de paie potentiellement ancien (${diffMois} mois)`,
          detail: `Date estimée du bulletin : ${dateMatch[1]}. Un bulletin de moins de 3 mois est recommandé.`,
          document: "Bulletin de paie",
          sousScore: 5,
        });
      }

      /* Vérifier que l'année est N ou N-1 */
      const anneeBulletin = dateBulletin.getFullYear();
      if (anneeBulletin < anneeActuelle - 1) {
        alertes.push({
          niveau: "ANOMALIE",
          code: "BULLETIN_ANNEE_ANCIENNE",
          message: `Bulletin daté de ${anneeBulletin} — trop ancien`,
          detail: `L'année du bulletin (${anneeBulletin}) est antérieure à N-1 (${anneeActuelle - 1}). Bulletins acceptés : ${anneeActuelle} ou ${anneeActuelle - 1}.`,
          document: "Bulletin de paie",
          sousScore: 15,
        });
      }
    }
  }

  // ─── 4. Cohérence type contrat / revenus ────────────────────────────────
  const typeContrat = (dossier.typeContrat ?? "").toUpperCase();
  const revenusN2 = dossier.revenusN2 ?? 0;

  if (typeContrat.includes("CDI") && revenusN1 > 0 && revenusN2 > 0) {
    const variationRev = Math.abs(revenusN1 - revenusN2) / revenusN2;
    if (variationRev > 0.30) {
      alertes.push({
        niveau: "ATTENTION",
        code: "CDI_REVENUS_VARIABLES",
        message: "Revenus très variables malgré un CDI déclaré",
        detail: `Revenus N-1 : ${revenusN1.toLocaleString("fr-FR")} € vs N-2 : ${revenusN2.toLocaleString("fr-FR")} € (variation ${Math.round(variationRev * 100)}%). Peut indiquer un changement d'emploi ou une erreur de saisie.`,
        document: "Bulletin de paie",
        sousScore: 10,
      });
    }
  }

  // ─── 5. Validité IBAN ──────────────────────────────────────────────────
  const iban = dossier.iban ?? "";
  if (!iban || iban.trim() === "") {
    alertes.push({
      niveau: "INFO",
      code: "IBAN_MANQUANT",
      message: "RIB non fourni",
      detail: "Aucun IBAN trouvé dans le dossier. Le RIB n'a peut-être pas été déposé.",
      document: "RIB",
      sousScore: 5,
    });
  } else {
    const ibanClean = iban.replace(/\s/g, "").toUpperCase();
    if (!validerIBANFR(ibanClean)) {
      alertes.push({
        niveau: "ANOMALIE",
        code: "IBAN_INVALIDE",
        message: "IBAN invalide",
        detail: `Format IBAN incorrect : "${iban}". Un IBAN français doit commencer par FR suivi de 25 caractères alphanumériques.`,
        document: "RIB",
        sousScore: 20,
      });
    }
  }

  // ─── 6. Validité BIC ───────────────────────────────────────────────────
  const bic = (dossier.bic ?? "").trim();
  if (bic && !validerBIC(bic)) {
    alertes.push({
      niveau: "ATTENTION",
      code: "BIC_INVALIDE",
      message: "BIC invalide",
      detail: `Format BIC incorrect : "${bic}". Un BIC valide contient 8 ou 11 caractères alphanumériques (ex: BNPAFRPP).`,
      document: "RIB",
      sousScore: 10,
    });
  }

  // ─── 7. Cohérence nom CNI / titulaire RIB ──────────────────────────────
  const nomCNI = normaliserNom(dossier.nom ?? "");
  const prenomCNI = normaliserNom(dossier.prenom ?? "");
  const titulaire = normaliserNom(dossier.titulaireCompte ?? "");

  if (nomCNI && titulaire) {
    const nomCNIPart = nomCNI.split(/\s+/)[0];
    const titulaireParts = titulaire.split(/\s+/);
    const bestDist = Math.min(
      ...titulaireParts.map((p) => levenshtein(nomCNIPart, p))
    );

    if (bestDist >= 5 && nomCNIPart.length > 2) {
      alertes.push({
        niveau: "ANOMALIE",
        code: "NOM_RIB_CNI_INCOHERENT",
        message: "Nom très différent sur CNI et RIB",
        detail: `Nom CNI : "${nomCNI}" vs titulaire RIB : "${titulaire}" (distance Levenshtein : ${bestDist})`,
        document: "RIB",
        sousScore: 20,
      });
    } else if (bestDist >= 2 && nomCNIPart.length > 2) {
      alertes.push({
        niveau: "ATTENTION",
        code: "NOM_INCOHERENT",
        message: "Nom différent sur CNI et RIB",
        detail: `Nom CNI : "${nomCNI}" vs titulaire RIB : "${titulaire}" (distance Levenshtein : ${bestDist})`,
        document: "RIB",
        sousScore: 15,
      });
    }
  }

  // ─── 8. Validité CNI ──────────────────────────────────────────────────
  const numeroCNI = (dossier.numeroCNI ?? "").trim();
  if (numeroCNI && !validerNumeroCNI(numeroCNI)) {
    alertes.push({
      niveau: "ATTENTION",
      code: "CNI_FORMAT_INVALIDE",
      message: "Numéro CNI au format invalide",
      detail: `Numéro fourni : "${numeroCNI}". Un numéro CNI valide contient 12 caractères alphanumériques.`,
      document: "CNI",
      sousScore: 10,
    });
  }

  // ─── 9. Cohérence âge CNI ─────────────────────────────────────────────
  const dateNaissance = dossier.dateNaissance ?? "";
  if (dateNaissance) {
    const dob = parseDate(dateNaissance);
    if (dob) {
      const age = (maintenant.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      if (age < 18) {
        alertes.push({
          niveau: "CRITIQUE",
          code: "CNI_MINEUR",
          message: "Le candidat est mineur",
          detail: `Date de naissance : ${dateNaissance} — âge calculé : ${Math.floor(age)} ans. Un locataire doit être majeur.`,
          document: "CNI",
          sousScore: 30,
        });
      } else if (age > 80) {
        alertes.push({
          niveau: "INFO",
          code: "CNI_AGE_ELEVE",
          message: `Âge élevé (${Math.floor(age)} ans)`,
          detail: `Date de naissance : ${dateNaissance}. Vérifier que la date est correcte.`,
          document: "CNI",
          sousScore: 5,
        });
      }
    }
  }

  // ─── 10. Cohérence avis imposition ────────────────────────────────────
  const nombreParts = dossier.nombreParts ?? 0;
  if (revenusN1 > 0 && nombreParts > 0) {
    const rfrParPart = revenusN1 / nombreParts;
    if (rfrParPart < 8000) {
      alertes.push({
        niveau: "INFO",
        code: "IMPO_RFR_FAIBLE",
        message: `RFR/part très faible (${Math.round(rfrParPart).toLocaleString("fr-FR")} €)`,
        detail: `Revenu fiscal de référence : ${revenusN1.toLocaleString("fr-FR")} € / ${nombreParts} part(s) = ${Math.round(rfrParPart).toLocaleString("fr-FR")} €/part. Seuil bas attendu : 8 000 €/part.`,
        document: "Avis imposition",
        sousScore: 5,
      });
    } else if (rfrParPart > 80000) {
      alertes.push({
        niveau: "ATTENTION",
        code: "IMPO_RFR_ELEVE",
        message: `RFR/part inhabituellement élevé (${Math.round(rfrParPart).toLocaleString("fr-FR")} €)`,
        detail: `Revenu fiscal de référence : ${revenusN1.toLocaleString("fr-FR")} € / ${nombreParts} part(s) = ${Math.round(rfrParPart).toLocaleString("fr-FR")} €/part. Seuil haut : 80 000 €/part. Vérifier cohérence.`,
        document: "Avis imposition",
        sousScore: 10,
      });
    }
  }

  // ─── 11. Cohérence inter-documents : nom sur tous les documents ───────
  const nomsAVerifier: { nom: string; source: string }[] = [];
  if (nomCNI) nomsAVerifier.push({ nom: nomCNI, source: "CNI" });
  if (titulaire) nomsAVerifier.push({ nom: titulaire, source: "RIB" });

  /* Vérification croisée nom CNI / employeur */
  const employeur = (dossier.employeur ?? "").trim();
  /* L'employeur n'est pas le nom du candidat — on ne compare pas ici */

  // ─── 12. Cohérence adresse domicile ───────────────────────────────────
  const adresseActuelle = normaliserNom(dossier.adresseActuelle ?? "");
  const adresseDomicile = normaliserNom(dossier.adresseDomicile ?? "");

  if (adresseActuelle && adresseDomicile && adresseActuelle.length > 5 && adresseDomicile.length > 5) {
    const dist = levenshtein(adresseActuelle, adresseDomicile);
    const maxLen = Math.max(adresseActuelle.length, adresseDomicile.length);
    const ratio = dist / maxLen;

    if (ratio > 0.5) {
      alertes.push({
        niveau: "ATTENTION",
        code: "ADRESSE_INCOHERENTE",
        message: "Adresse déclarée différente du justificatif",
        detail: `Adresse déclarée : "${dossier.adresseActuelle}" vs justificatif : "${dossier.adresseDomicile}".`,
        document: "Justificatif domicile",
        sousScore: 10,
      });
    }
  }

  // ─── Score par document ─────────────────────────────────────────────────
  const docTypes: DocType[] = [
    "Bulletin de paie",
    "Avis imposition",
    "CNI",
    "RIB",
    "Justificatif domicile",
  ];

  const parDocument = docTypes.map((doc) => {
    const docAlertes = alertes.filter((a) => a.document === doc);
    const totalPenalite = docAlertes.reduce((s, a) => s + (a.sousScore ?? 0), 0);
    const score = Math.max(0, Math.min(100, 100 - totalPenalite));
    return { document: doc, score, alertes: docAlertes };
  });

  // ─── Score global = moyenne pondérée ────────────────────────────────────
  const score_confiance = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        parDocument.reduce(
          (sum, pd) => sum + pd.score * DOC_POIDS[pd.document as DocType],
          0
        )
      )
    )
  );

  // ─── Verdict ────────────────────────────────────────────────────────────
  let verdict: ResultatFraude["verdict"];
  if (score_confiance >= 90) verdict = "CONFORME";
  else if (score_confiance >= 70) verdict = "SUSPECT";
  else if (score_confiance >= 40) verdict = "FRAUDE_PROBABLE";
  else verdict = "FRAUDE_AVEREE";

  // ─── Synthèse ───────────────────────────────────────────────────────────
  const nbCritiques = alertes.filter((a) => a.niveau === "CRITIQUE").length;
  const nbAnomalies = alertes.filter((a) => a.niveau === "ANOMALIE").length;
  const nbAttentions = alertes.filter((a) => a.niveau === "ATTENTION").length;
  const nbPoints = nbCritiques + nbAnomalies + nbAttentions;

  let synthese: string;
  switch (verdict) {
    case "CONFORME":
      synthese = "✅ Dossier conforme — aucune anomalie significative";
      break;
    case "SUSPECT":
      synthese = `⚠️ Dossier à vérifier — ${nbPoints} point${nbPoints > 1 ? "s" : ""} d'attention`;
      break;
    case "FRAUDE_PROBABLE":
      synthese = `🔶 Fraude probable — ${nbPoints} anomalie${nbPoints > 1 ? "s" : ""} détectée${nbPoints > 1 ? "s" : ""}, vérification obligatoire`;
      break;
    case "FRAUDE_AVEREE":
      synthese = `🔴 Fraude avérée — cohérence documentaire effondrée`;
      break;
  }

  return {
    alertes,
    score_confiance,
    synthese,
    verdict,
    parDocument,
  };
}
