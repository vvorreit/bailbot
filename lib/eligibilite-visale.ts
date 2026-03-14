// ─── BailBot — Module Éligibilité Visale ──────────────────────────────────────
// Calcul local (RGPD-safe, zéro appel API externe)
// Règles officielles Visale 2025 — Action Logement

import { DossierLocataire } from "./parsers";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface EligibiliteVisale {
  eligible: boolean;
  score: number; // 0–100
  conditions: {
    age: { ok: boolean; valeur: number; detail: string };
    contrat: { ok: boolean; valeur: string; detail: string };
    loyerRevenus: { ok: boolean; ratio: number; detail: string };
    loyerPlafond: { ok: boolean; valeur: number; detail: string };
    nonProprietaire: { ok: boolean; detail: string };
  };
  motifs_refus: string[];
  alternatives: string[];
  message: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Calcule l'âge en années entières depuis une date de naissance JJ/MM/AAAA.
 * Retourne -1 si la date est invalide.
 */
export function calculerAge(dateNaissance: string): number {
  if (!dateNaissance) return -1;
  const parts = dateNaissance.split("/");
  if (parts.length !== 3) return -1;
  const [jour, mois, annee] = parts.map(Number);
  if (!jour || !mois || !annee) return -1;

  const today = new Date();
  const dob = new Date(annee, mois - 1, jour);
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

const CONTRATS_ELIGIBLES = ["CDI", "CDD", "INTERIM", "INTÉRIM", "APPRENTISSAGE", "CONTRAT PRO", "PROFESSIONNALISATION", "CIP"];

function isContratEligible(typeContrat: string): boolean {
  if (!typeContrat) return false;
  const upper = typeContrat.toUpperCase().trim();
  return CONTRATS_ELIGIBLES.some((c) => upper.includes(c));
}

// ─── Fonction principale ──────────────────────────────────────────────────────

export function calculerEligibiliteVisale(
  dossier: Partial<DossierLocataire>,
  loyerMensuelCC: number,
  villeEstParis: boolean = false
): EligibiliteVisale {
  const plafondLoyer = villeEstParis ? 1800 : 1500;

  // ── Condition A : Jeune (18–30 ans) ──────────────────────────────────────
  const age = calculerAge(dossier.dateNaissance ?? "");
  const conditionAge = age >= 18 && age <= 30;

  // ── Condition B : Salarié ─────────────────────────────────────────────────
  const contratVal = dossier.typeContrat ?? "";
  const conditionContrat = isContratEligible(contratVal);

  // ── Condition commune — ratio loyer/revenus (≤ 50%) ──────────────────────
  const revenusMensuels = dossier.salaireNetMensuel ?? 0;
  const ratio = revenusMensuels > 0 ? loyerMensuelCC / revenusMensuels : Infinity;
  const conditionRatio = revenusMensuels > 0 && ratio <= 0.5;

  // ── Condition commune — plafond loyer ─────────────────────────────────────
  const conditionPlafond = loyerMensuelCC <= plafondLoyer;

  // ── Condition commune — non propriétaire ─────────────────────────────────
  // On considère non-propriétaire par défaut (pas de champ revenus fonciers dans DossierLocataire).
  // Si situationFiscale mentionne "foncier" ou "propriétaire", on refuse.
  const situationFiscale = (dossier.situationFiscale ?? "").toLowerCase();
  const conditionNonProprio =
    !situationFiscale.includes("foncier") && !situationFiscale.includes("propriétaire");

  // ── Condition principale (A ou B) ─────────────────────────────────────────
  const conditionPrincipale = conditionAge || (conditionContrat && revenusMensuels > 0);

  // ── Éligibilité finale ────────────────────────────────────────────────────
  const eligible =
    conditionPrincipale &&
    conditionRatio &&
    conditionPlafond &&
    conditionNonProprio;

  // ── Score (nb conditions communes + principale sur 5) ────────────────────
  const points = [
    conditionAge || conditionContrat,
    conditionRatio,
    conditionPlafond,
    conditionNonProprio,
    conditionPrincipale,
  ].filter(Boolean).length;
  const score = Math.round((points / 5) * 100);

  // ── Motifs de refus ───────────────────────────────────────────────────────
  const motifs_refus: string[] = [];
  if (!conditionPrincipale) {
    if (age < 18) motifs_refus.push("Âge inférieur à 18 ans");
    else if (age > 30 && !conditionContrat) {
      motifs_refus.push(
        contratVal
          ? `Type de contrat non éligible (${contratVal})`
          : "Type de contrat non reconnu ou absent"
      );
    }
    if (revenusMensuels === 0) motifs_refus.push("Revenus non renseignés");
  }
  if (!conditionRatio) {
    motifs_refus.push(
      `Loyer trop élevé par rapport aux revenus (${Math.round(ratio * 100)}% — limite 50%)`
    );
  }
  if (!conditionPlafond) {
    motifs_refus.push(
      `Loyer dépasse le plafond de ${plafondLoyer.toLocaleString("fr-FR")} €/mois`
    );
  }
  if (!conditionNonProprio) {
    motifs_refus.push("Revenus fonciers détectés — locataire potentiellement propriétaire");
  }

  // ── Alternatives si non éligible ─────────────────────────────────────────
  const alternatives = eligible ? [] : ["GarantMe", "Unkle", "Cautioneo"];

  // ── Message résumé ────────────────────────────────────────────────────────
  const message = eligible
    ? `✅ ${dossier.prenom ? dossier.prenom + " est éligible" : "Éligible"} à Visale — la demande peut être lancée sur visale.fr`
    : `❌ Non éligible à Visale${motifs_refus.length ? " : " + motifs_refus[0] : ""}. Alternatives : ${alternatives.join(", ")}.`;

  return {
    eligible,
    score,
    conditions: {
      age: {
        ok: conditionAge,
        valeur: age,
        detail:
          age === -1
            ? "Date de naissance non renseignée"
            : age >= 18 && age <= 30
            ? `${age} ans — éligible (18–30 ans)`
            : `${age} ans — hors tranche jeune (18–30 ans)`,
      },
      contrat: {
        ok: conditionContrat,
        valeur: contratVal || "Non renseigné",
        detail: conditionContrat
          ? `${contratVal} — contrat éligible`
          : contratVal
          ? `${contratVal} — contrat non éligible Visale`
          : "Type de contrat non renseigné",
      },
      loyerRevenus: {
        ok: conditionRatio,
        ratio: revenusMensuels > 0 ? Math.round(ratio * 100) : 0,
        detail:
          revenusMensuels === 0
            ? "Revenus non renseignés"
            : `${Math.round(ratio * 100)}% des revenus (limite 50%)`,
      },
      loyerPlafond: {
        ok: conditionPlafond,
        valeur: loyerMensuelCC,
        detail: `${loyerMensuelCC.toLocaleString("fr-FR")} €/mois — plafond ${plafondLoyer.toLocaleString("fr-FR")} €`,
      },
      nonProprietaire: {
        ok: conditionNonProprio,
        detail: conditionNonProprio
          ? "Aucun revenu foncier détecté"
          : "Revenus fonciers détectés dans le dossier fiscal",
      },
    },
    motifs_refus,
    alternatives,
    message,
  };
}
