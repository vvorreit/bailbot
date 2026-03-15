// lib/echeances-bail.ts
// Calcul des échéances et alertes pour la vie du bail

import type { BailActif, TypeAlerte } from '@prisma/client';

export interface AlerteAGenerer {
  bailId: string;
  type: TypeAlerte;
  dateEcheance: Date;
}

/**
 * Calcule la prochaine date de révision IRL (anniversaire du bail)
 */
export function prochaineRevisionIRL(dateDebut: Date): Date {
  const now = new Date();
  const revision = new Date(dateDebut);
  revision.setFullYear(now.getFullYear());
  if (revision <= now) {
    revision.setFullYear(now.getFullYear() + 1);
  }
  return revision;
}

/**
 * Calcule la date de congé pour renouvellement
 * Le congé doit être donné X mois avant la fin du bail
 */
export function dateCongeRenouvellement(dateFin: Date, dureePreavisMois: number): Date {
  const conge = new Date(dateFin);
  conge.setMonth(conge.getMonth() - dureePreavisMois);
  return conge;
}

/**
 * Génère toutes les alertes pour un bail à sa création
 */
export function genererAlertes(bail: Pick<BailActif, 'id' | 'dateDebut' | 'dateFin' | 'dureePreavisMois' | 'dateProchRevision' | 'dateFinDiagnostics'>): AlerteAGenerer[] {
  const alertes: AlerteAGenerer[] = [];

  /* Révision IRL */
  alertes.push({
    bailId: bail.id,
    type: 'REVISION_LOYER',
    dateEcheance: new Date(bail.dateProchRevision),
  });

  /* Renouvellement — 6 mois avant la fin */
  if (bail.dateFin) {
    const dateFin = new Date(bail.dateFin);
    const sixMoisAvant = new Date(dateFin);
    sixMoisAvant.setMonth(sixMoisAvant.getMonth() - 6);
    alertes.push({
      bailId: bail.id,
      type: 'RENOUVELLEMENT',
      dateEcheance: sixMoisAvant,
    });

    /* Congé bailleur */
    const conge = dateCongeRenouvellement(dateFin, bail.dureePreavisMois);
    alertes.push({
      bailId: bail.id,
      type: 'CONGE_BAILLEUR',
      dateEcheance: conge,
    });
  }

  /* Diagnostics */
  if (bail.dateFinDiagnostics) {
    const diagDate = new Date(bail.dateFinDiagnostics);
    const unMoisAvant = new Date(diagDate);
    unMoisAvant.setMonth(unMoisAvant.getMonth() - 1);
    alertes.push({
      bailId: bail.id,
      type: 'DIAGNOSTIC_DPE',
      dateEcheance: unMoisAvant,
    });
  }

  return alertes;
}

/**
 * Retourne les alertes non traitées dans les N prochains jours
 */
export function alertesDansJours(dateEcheance: Date, jours: number): boolean {
  const now = new Date();
  const limite = new Date(now);
  limite.setDate(limite.getDate() + jours);
  return dateEcheance >= now && dateEcheance <= limite;
}

export const TYPE_ALERTE_LABELS: Record<TypeAlerte, string> = {
  REVISION_LOYER: 'Révision de loyer',
  RENOUVELLEMENT: 'Renouvellement du bail',
  CONGE_BAILLEUR: 'Congé bailleur',
  DIAGNOSTIC_DPE: 'DPE expiré',
  DIAGNOSTIC_ELEC: 'Diagnostic électrique',
  ASSURANCE_PNO: 'Assurance PNO',
};

export const TYPE_ALERTE_COLORS: Record<TypeAlerte, string> = {
  REVISION_LOYER: 'bg-blue-100 text-blue-700',
  RENOUVELLEMENT: 'bg-amber-100 text-amber-700',
  CONGE_BAILLEUR: 'bg-red-100 text-red-700',
  DIAGNOSTIC_DPE: 'bg-orange-100 text-orange-700',
  DIAGNOSTIC_ELEC: 'bg-orange-100 text-orange-700',
  ASSURANCE_PNO: 'bg-purple-100 text-purple-700',
};
