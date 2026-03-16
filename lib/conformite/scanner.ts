// ─── Scanner de conformité réglementaire ────────────────────────────────────
// Orchestre les 4 modules : clauses interdites, encadrement, DPE, mentions

import { scannerClausesInterdites } from './clauses-interdites';
import { verifierEncadrementLoyers } from './encadrement-loyers';
import { verifierDPE } from './dpe-conformite';
import { verifierMentionsObligatoires } from './mentions-obligatoires';
import type { ConformiteAlerte, ConformiteReport } from './types';

export type { ConformiteAlerte, ConformiteReport } from './types';

interface BailInput {
  id: string;
  loyerMensuel: number;
  chargesMensuelles: number;
  depotGarantie: number | null;
  dateDebut: Date;
  dateFin: Date | null;
  indiceRevision: string | null;
  statut: string;
}

interface BienInput {
  adresse: string;
  surface: number | null;
  typeBail: string;
  classeDPE?: string | null;
  dateDPE: Date | null;
  dateElectricite: Date | null;
  dateGaz: Date | null;
  datePlomb: Date | null;
  dateAmiante: Date | null;
}

/**
 * Scan complet de conformité réglementaire pour un bail + bien.
 * 100% déterministe, aucun appel API externe.
 */
export function scanConformite(
  bail: BailInput,
  bien: BienInput,
  texteBail?: string | null,
): ConformiteReport {
  const alertes: ConformiteAlerte[] = [];

  /* 1. Clauses interdites (uniquement si texte disponible) */
  if (texteBail && texteBail.trim().length > 0) {
    const clausesDetectees = scannerClausesInterdites(texteBail);
    for (const c of clausesDetectees) {
      alertes.push({
        type: "BLOQUANT",
        categorie: "CLAUSE_INTERDITE",
        description: `${c.description} — Extrait : ${c.extrait}`,
        actionRequise: "Supprimer cette clause du bail (réputée non écrite)",
        reference: c.reference,
      });
    }
  }

  /* 2. Encadrement des loyers */
  const encadrement = verifierEncadrementLoyers(
    bien.adresse,
    bien.surface,
    bail.loyerMensuel,
    bien.typeBail,
  );
  if (encadrement.encadre && encadrement.depassement != null && encadrement.depassement > 0) {
    alertes.push({
      type: "BLOQUANT",
      categorie: "ENCADREMENT",
      description: `Loyer supérieur au loyer de référence majoré (${encadrement.loyerActuelM2} €/m² vs ${encadrement.loyerRefMajore} €/m²). Dépassement : ${encadrement.depassement} €/mois`,
      actionRequise: `Réduire le loyer au maximum de ${encadrement.loyerRefMajore} €/m² (zone : ${encadrement.commune})`,
      reference: "Art. 140 Loi ELAN, Décret encadrement des loyers",
    });
  } else if (encadrement.encadre && encadrement.loyerRef == null && bien.surface == null) {
    alertes.push({
      type: "AVERTISSEMENT",
      categorie: "ENCADREMENT",
      description: `Bien situé en zone d'encadrement des loyers (${encadrement.commune}) mais surface non renseignée`,
      actionRequise: "Renseigner la surface habitable pour vérifier le respect de l'encadrement",
      reference: "Art. 140 Loi ELAN",
    });
  }

  /* 3. DPE */
  const dpe = verifierDPE(bien.classeDPE ?? null);
  alertes.push(...dpe.alertes);

  /* 4. Mentions obligatoires */
  const mentions = verifierMentionsObligatoires({
    adresse: bien.adresse,
    surface: bien.surface,
    dateDebut: bail.dateDebut,
    dateFin: bail.dateFin,
    loyerMensuel: bail.loyerMensuel,
    chargesMensuelles: bail.chargesMensuelles,
    depotGarantie: bail.depotGarantie,
    indiceRevision: bail.indiceRevision,
    typeBail: bien.typeBail,
    classeDPE: bien.classeDPE ?? null,
    dateDPE: bien.dateDPE,
    dateElectricite: bien.dateElectricite,
    dateGaz: bien.dateGaz,
    datePlomb: bien.datePlomb,
    dateAmiante: bien.dateAmiante,
  });
  alertes.push(...mentions.manquantes);

  /* 5. Score de conformité */
  const score = calculerScore(alertes);

  return {
    bailId: bail.id,
    score,
    alertes,
    dateAnalyse: new Date(),
  };
}

/**
 * Calcule un score 0–100 basé sur les alertes détectées.
 * - BLOQUANT : −15 pts
 * - AVERTISSEMENT : −5 pts
 * - INFO : −1 pt
 */
function calculerScore(alertes: ConformiteAlerte[]): number {
  let score = 100;
  for (const a of alertes) {
    switch (a.type) {
      case "BLOQUANT": score -= 15; break;
      case "AVERTISSEMENT": score -= 5; break;
      case "INFO": score -= 1; break;
    }
  }
  return Math.max(0, Math.min(100, score));
}
