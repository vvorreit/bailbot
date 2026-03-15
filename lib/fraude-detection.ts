// ─── BailBot — Détection de Fraude ───────────────────────────────────────────
// Analyse la cohérence d'un dossier locataire et détecte les anomalies

import { DossierLocataire } from "./parsers";

export interface AlerteFraude {
  niveau: "INFO" | "ATTENTION" | "ANOMALIE";
  code: string;
  message: string;
  detail: string;
}

export interface ResultatFraude {
  alertes: AlerteFraude[];
  score_confiance: number; // 0-100 (100 = dossier parfaitement cohérent)
  synthese: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Distance de Levenshtein entre deux chaînes
 */
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

/**
 * Valide un IBAN français selon la structure attendue
 * Format : FR + 2 chiffres clé + 5 chiffres banque + 5 chiffres guichet + 11 caractères compte + 2 clé RIB
 * Soit FR + 2 + 23 = 27 caractères au total (sans espaces)
 */
function validerIBANFR(iban: string): boolean {
  // Supprimer espaces et normaliser en majuscules
  const clean = iban.replace(/\s/g, "").toUpperCase();
  // Regex stricte : FR + 2 chiffres + 23 caractères alphanumériques = 27 total
  return /^FR\d{2}[0-9A-Z]{23}$/.test(clean);
}

/**
 * Parse une date bulletin (MM/AAAA ou JJ/MM/AAAA) en objet Date
 */
function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split(/[\/\-\.]/);
  if (parts.length === 2) {
    // MM/AAAA
    const [month, year] = parts.map(Number);
    if (month && year) return new Date(year, month - 1, 1);
  } else if (parts.length === 3) {
    const [day, month, year] = parts.map(Number);
    if (day && month && year) return new Date(year, month - 1, day);
  }
  return null;
}

// ─── Analyse principale ───────────────────────────────────────────────────────

export function analyserFraude(dossier: Partial<DossierLocataire>): ResultatFraude {
  const alertes: AlerteFraude[] = [];
  let penalite = 0; // Score de confiance commence à 100, on déduit

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
        message: `Forte incohérence — vérification manuelle requise`,
        detail: `Salaire annualisé : ${salaireAnnuel.toLocaleString("fr-FR")} € vs revenus fiscaux N-1 : ${revenusN1.toLocaleString("fr-FR")} € (écart : ${ecartPct}%)`,
      });
      penalite += 25;
    } else if (ecart > 0.20) {
      alertes.push({
        niveau: "ATTENTION",
        code: "SALAIRE_REVENUS_ECART",
        message: `Écart salaire/revenus fiscaux à vérifier (${ecartPct}%)`,
        detail: `Salaire annualisé : ${salaireAnnuel.toLocaleString("fr-FR")} € vs revenus fiscaux N-1 : ${revenusN1.toLocaleString("fr-FR")} €`,
      });
      penalite += 12;
    }
    // < 20% → OK, aucune alerte
  }

  // ─── 2. Validité IBAN ─────────────────────────────────────────────────────
  const iban = dossier.iban ?? "";
  if (!iban || iban.trim() === "") {
    alertes.push({
      niveau: "INFO",
      code: "IBAN_MANQUANT",
      message: "RIB non fourni",
      detail: "Aucun IBAN trouvé dans le dossier. Le RIB n'a peut-être pas été déposé.",
    });
    penalite += 5;
  } else {
    const ibanClean = iban.replace(/\s/g, "").toUpperCase();
    if (!validerIBANFR(ibanClean)) {
      alertes.push({
        niveau: "ANOMALIE",
        code: "IBAN_INVALIDE",
        message: "IBAN invalide",
        detail: `Format IBAN incorrect : "${iban}". Un IBAN français doit commencer par FR suivi de 25 caractères alphanumériques.`,
      });
      penalite += 20;
    }
  }

  // ─── 3. Cohérence nom CNI / bulletins de paie ────────────────────────────
  const nomCNI = (dossier.nom ?? "").trim().toUpperCase();
  const titulaire = (dossier.titulaireCompte ?? "").trim().toUpperCase();
  const employeur = (dossier.employeur ?? "").trim();

  // Comparaison nom CNI vs titulaire RIB (proxy bulletin si pas de champ dédié)
  if (nomCNI && titulaire) {
    // Extrait le premier mot (nom de famille)
    const nomCNIPart = nomCNI.split(/\s+/)[0];
    const nomTitulairePart = titulaire.split(/\s+/)[0];
    const dist = levenshtein(nomCNIPart, nomTitulairePart);

    if (dist >= 2 && nomCNIPart.length > 2) {
      alertes.push({
        niveau: "ATTENTION",
        code: "NOM_INCOHERENT",
        message: "Nom différent sur CNI et bulletin de paie",
        detail: `Nom CNI : "${nomCNI}" vs titulaire compte : "${titulaire}" (distance Levenshtein : ${dist})`,
      });
      penalite += 15;
    }
  }

  // ─── 4. Ancienneté documents ──────────────────────────────────────────────
  // Champ ancienneté peut contenir une date ou une durée — on cherche une date bulletin
  const anciennete = (dossier.anciennete ?? "").toLowerCase();

  // Tentative extraction date depuis ancienneté (ex: "depuis 01/2023", "11/2024", etc.)
  const dateMatch = anciennete.match(/(\d{2}[\/\-]\d{4})/);
  if (dateMatch) {
    const dateBulletin = parseDate(dateMatch[1].replace("-", "/"));
    if (dateBulletin) {
      const maintenant = new Date();
      const diffMois =
        (maintenant.getFullYear() - dateBulletin.getFullYear()) * 12 +
        (maintenant.getMonth() - dateBulletin.getMonth());

      if (diffMois > 3) {
        alertes.push({
          niveau: "INFO",
          code: "DOCUMENT_ANCIEN",
          message: `Bulletin de paie potentiellement ancien (${diffMois} mois)`,
          detail: `Date estimée du bulletin : ${dateMatch[1]}. Un bulletin de moins de 3 mois est recommandé.`,
        });
        penalite += 5;
      }
    }
  }

  // ─── 5. Cohérence type contrat / revenus ──────────────────────────────────
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
      });
      penalite += 10;
    }
  }

  // ─── Score de confiance final ─────────────────────────────────────────────
  const score_confiance = Math.max(0, Math.min(100, 100 - penalite));

  // ─── Synthèse ─────────────────────────────────────────────────────────────
  const nbAnomalies = alertes.filter((a) => a.niveau === "ANOMALIE").length;
  const nbAttentions = alertes.filter((a) => a.niveau === "ATTENTION").length;
  const nbInfos = alertes.filter((a) => a.niveau === "INFO").length;

  let synthese = "";
  if (alertes.length === 0) {
    synthese = "Dossier cohérent — aucune anomalie détectée.";
  } else if (nbAnomalies > 0) {
    synthese = `${nbAnomalies} anomalie${nbAnomalies > 1 ? "s" : ""} critique${nbAnomalies > 1 ? "s" : ""} — vérification manuelle obligatoire.`;
  } else if (nbAttentions > 0) {
    synthese = `${nbAttentions} point${nbAttentions > 1 ? "s" : ""} d'attention — vérification recommandée.`;
  } else {
    synthese = `${nbInfos} information${nbInfos > 1 ? "s" : ""} à noter — dossier globalement cohérent.`;
  }

  return {
    alertes,
    score_confiance,
    synthese,
  };
}
