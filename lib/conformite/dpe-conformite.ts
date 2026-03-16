// ─── Conformité DPE — Loi Climat et Résilience (2021) ──────────────────────
// Calendrier d'interdiction de mise en location selon la classe DPE

import type { ConformiteAlerte } from './types';

interface SeuilDPE {
  classe: string;
  interditDepuis: Date | null;
  interditLe: Date;
  label: string;
}

const CALENDRIER_DPE: SeuilDPE[] = [
  {
    classe: "G",
    interditDepuis: new Date("2025-01-01"),
    interditLe: new Date("2025-01-01"),
    label: "Depuis le 1er janvier 2025, les logements classés G ne peuvent plus être mis en location",
  },
  {
    classe: "F",
    interditDepuis: null,
    interditLe: new Date("2028-01-01"),
    label: "À compter du 1er janvier 2028, les logements classés F ne pourront plus être mis en location",
  },
  {
    classe: "E",
    interditDepuis: null,
    interditLe: new Date("2034-01-01"),
    label: "À compter du 1er janvier 2034, les logements classés E ne pourront plus être mis en location",
  },
];

const CLASSES_VALIDES = ["A", "B", "C", "D", "E", "F", "G"];

export interface ResultatDPE {
  classe: string | null;
  interditLocation: boolean;
  dateEcheance: string | null;
  alertes: ConformiteAlerte[];
}

/**
 * Vérifie la conformité DPE d'un bien.
 * @param classeDPE - Classe énergétique (A à G) ou null si non renseignée
 * @param dateAnalyse - Date de référence pour le calcul (par défaut : maintenant)
 */
export function verifierDPE(classeDPE: string | null, dateAnalyse?: Date): ResultatDPE {
  const now = dateAnalyse ?? new Date();
  const alertes: ConformiteAlerte[] = [];

  if (!classeDPE) {
    alertes.push({
      type: "AVERTISSEMENT",
      categorie: "DPE",
      description: "Classe DPE non renseignée pour ce bien",
      actionRequise: "Renseigner la classe DPE du diagnostic de performance énergétique",
      reference: "Art. 3-3 Loi n°89-462, Décret 2006-1147",
    });
    return { classe: null, interditLocation: false, dateEcheance: null, alertes };
  }

  const classeNorm = classeDPE.toUpperCase().trim();
  if (!CLASSES_VALIDES.includes(classeNorm)) {
    return { classe: classeNorm, interditLocation: false, dateEcheance: null, alertes };
  }

  let interditLocation = false;
  let dateEcheance: string | null = null;

  for (const seuil of CALENDRIER_DPE) {
    if (seuil.classe !== classeNorm) continue;

    if (seuil.interditDepuis && now >= seuil.interditDepuis) {
      interditLocation = true;
      alertes.push({
        type: "BLOQUANT",
        categorie: "DPE",
        description: seuil.label,
        actionRequise: "Réaliser des travaux de rénovation énergétique pour améliorer la classe DPE avant de relouer",
        reference: "Art. 160 Loi Climat et Résilience n°2021-1104",
      });
    } else {
      dateEcheance = seuil.interditLe.toISOString().slice(0, 10);
      alertes.push({
        type: "AVERTISSEMENT",
        categorie: "DPE",
        description: seuil.label,
        actionRequise: `Planifier des travaux de rénovation énergétique avant le ${seuil.interditLe.toLocaleDateString('fr-FR')}`,
        reference: "Art. 160 Loi Climat et Résilience n°2021-1104",
      });
    }
  }

  /* Alerte DPE expiré (> 10 ans) — vérification non bloquante */

  return { classe: classeNorm, interditLocation, dateEcheance, alertes };
}
