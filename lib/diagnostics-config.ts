export type DiagnosticType = 'DPE' | 'ELEC' | 'GAZ' | 'PLOMB' | 'AMIANTE' | 'ERP' | 'BRUIT' | 'TERMITES' | 'SURFACE';

export const ALL_DIAGNOSTIC_TYPES: DiagnosticType[] = [
  'DPE', 'ELEC', 'GAZ', 'PLOMB', 'AMIANTE', 'ERP', 'BRUIT', 'TERMITES', 'SURFACE',
];

export const DIAGNOSTICS_CONFIG: Record<DiagnosticType, {
  nom: string;
  description: string;
  validiteAns: number | null;
  validiteMois: number | null;
  obligatoire: string;
  legalRef: string;
  conseils: string;
}> = {
  DPE: {
    nom: "Diagnostic de Performance Energetique",
    description: "Evalue la consommation energetique et l'impact climatique du logement",
    validiteAns: 10,
    validiteMois: null,
    obligatoire: "Obligatoire pour toute mise en location",
    legalRef: "Art. L.134-1 CCH",
    conseils: "Attention : les DPE realises avant le 1er juillet 2021 sont invalides depuis le 1er janvier 2023. Les logements classe G sont interdits a la location depuis janvier 2025.",
  },
  ELEC: {
    nom: "Diagnostic Electrique",
    description: "Etat de l'installation electrique interieure",
    validiteAns: 6,
    validiteMois: null,
    obligatoire: "Obligatoire si installation > 15 ans",
    legalRef: "Art. L.134-7 CCH",
    conseils: "A renouveler a chaque changement de locataire si le diagnostic date de plus de 6 ans.",
  },
  GAZ: {
    nom: "Diagnostic Gaz",
    description: "Etat de l'installation de gaz interieure",
    validiteAns: 6,
    validiteMois: null,
    obligatoire: "Obligatoire si installation > 15 ans",
    legalRef: "Art. L.134-6 CCH",
    conseils: "Inclut les appareils de production d'eau chaude individuelle au gaz.",
  },
  PLOMB: {
    nom: "Constat de Risque d'Exposition au Plomb (CREP)",
    description: "Recherche de plomb dans les peintures",
    validiteAns: null,
    validiteMois: null,
    obligatoire: "Obligatoire pour les immeubles construits avant le 1er janvier 1949",
    legalRef: "Art. L.1334-5 CSP",
    conseils: "Illimite si absence de plomb. 6 ans si presence de plomb. A refaire en cas de travaux.",
  },
  AMIANTE: {
    nom: "Etat d'Amiante",
    description: "Reperage des materiaux contenant de l'amiante",
    validiteAns: null,
    validiteMois: null,
    obligatoire: "Obligatoire pour les immeubles dont le permis de construire est anterieur au 1er juillet 1997",
    legalRef: "Art. L.1334-13 CSP",
    conseils: "Illimite si absence d'amiante. A refaire apres travaux susceptibles d'avoir modifie la situation.",
  },
  ERP: {
    nom: "Etat des Risques et Pollutions",
    description: "Risques naturels, miniers, technologiques, sismiques, radon",
    validiteAns: null,
    validiteMois: 6,
    obligatoire: "Obligatoire pour toute mise en location dans les zones concernees",
    legalRef: "Art. L.125-5 CE",
    conseils: "A renouveler tous les 6 mois. Disponible gratuitement sur georisques.gouv.fr",
  },
  BRUIT: {
    nom: "Diagnostic Bruit (Zone de Bruit)",
    description: "Information sur la situation en zone de bruit d'aerodromes",
    validiteAns: null,
    validiteMois: 6,
    obligatoire: "Obligatoire pour les biens situes dans les plans d'exposition au bruit des aerodromes",
    legalRef: "Art. L.112-11 CCH",
    conseils: "Verifier sur le site de la mairie si votre bien est en zone de bruit.",
  },
  TERMITES: {
    nom: "Etat Relatif aux Termites",
    description: "Presence ou absence de termites dans le bien",
    validiteAns: null,
    validiteMois: 6,
    obligatoire: "Obligatoire dans les zones definies par arrete prefectoral",
    legalRef: "Art. L.133-6 CCH",
    conseils: "Verifier si votre commune est en zone termites sur termites.gouv.fr",
  },
  SURFACE: {
    nom: "Surface Loi Boutin",
    description: "Mesure de la surface habitable du logement",
    validiteAns: null,
    validiteMois: null,
    obligatoire: "Obligatoire pour tout bail de location nue (loi Boutin)",
    legalRef: "Art. 78 Loi Boutin / Art. 3 Loi du 6 juillet 1989",
    conseils: "Illimite sauf si travaux modifiant la surface. Attention : surface Carrez != surface Boutin.",
  },
};

export function calculerDateExpiration(type: DiagnosticType, dateRealisation: Date): Date | null {
  const config = DIAGNOSTICS_CONFIG[type];
  if (!config.validiteAns && !config.validiteMois) return null;

  const expiration = new Date(dateRealisation);
  if (config.validiteAns) {
    expiration.setFullYear(expiration.getFullYear() + config.validiteAns);
  }
  if (config.validiteMois) {
    expiration.setMonth(expiration.getMonth() + config.validiteMois);
  }
  return expiration;
}

export function getStatutDiagnostic(diag: {
  dateExpiration: Date | null;
  nonConcerne: boolean;
  dateRealisation: Date | null;
} | null, type: DiagnosticType): 'valide' | 'expire' | 'expire-bientot' | 'illimite' | 'non-concerne' | 'manquant' {
  if (!diag || (!diag.dateRealisation && !diag.nonConcerne)) return 'manquant';
  if (diag.nonConcerne) return 'non-concerne';

  const config = DIAGNOSTICS_CONFIG[type];
  if (!config.validiteAns && !config.validiteMois) return 'illimite';
  if (!diag.dateExpiration) return 'manquant';

  const now = new Date();
  const joursRestants = Math.ceil(
    (diag.dateExpiration.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (joursRestants <= 0) return 'expire';
  if (joursRestants <= 30) return 'expire-bientot';
  return 'valide';
}

export const STATUT_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  'valide': { label: 'Valide', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  'expire': { label: 'Expire', color: 'text-red-700', bg: 'bg-red-100' },
  'expire-bientot': { label: 'Expire bientot', color: 'text-amber-700', bg: 'bg-amber-100' },
  'illimite': { label: 'Illimite', color: 'text-blue-700', bg: 'bg-blue-100' },
  'non-concerne': { label: 'Non concerne', color: 'text-slate-500', bg: 'bg-slate-100' },
  'manquant': { label: 'Manquant', color: 'text-red-700', bg: 'bg-red-50' },
};

export const STATUT_ICONS: Record<string, string> = {
  'valide': '\u2705',
  'expire': '\uD83D\uDD34',
  'expire-bientot': '\u26A0\uFE0F',
  'illimite': '\u2705',
  'non-concerne': '\u2796',
  'manquant': '\u2753',
};
