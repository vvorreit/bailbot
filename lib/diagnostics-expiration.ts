// lib/diagnostics-expiration.ts
// Calcul des dates d'expiration des diagnostics immobiliers

export type TypeDiagnostic = 'DPE' | 'electricite' | 'gaz' | 'plomb' | 'amiante';

export interface DiagnosticExpiration {
  type: TypeDiagnostic;
  label: string;
  dateRealisation: Date;
  dateExpiration: Date;
  joursRestants: number;
  criticite: 'urgent' | 'attention' | 'valide' | 'expire';
}

/** Durée de validité légale par type de diagnostic (en années) */
const DUREE_VALIDITE: Record<TypeDiagnostic, number | null> = {
  DPE: 10,
  electricite: 6,
  gaz: 6,
  plomb: null,       /* illimité si conforme, 6 ans si présence plomb */
  amiante: null,     /* illimité si négatif, 3 ans si positif avant travaux */
};

const LABELS: Record<TypeDiagnostic, string> = {
  DPE: 'Diagnostic de performance énergétique (DPE)',
  electricite: 'Diagnostic électricité',
  gaz: 'Diagnostic gaz',
  plomb: 'Constat de risque d\'exposition au plomb (CREP)',
  amiante: 'Diagnostic amiante',
};

/**
 * Calcule la date d'expiration d'un diagnostic à partir de sa date de réalisation.
 * Retourne null si le diagnostic a une validité illimitée.
 */
export function calculerDateExpiration(
  type: TypeDiagnostic,
  dateRealisation: Date,
): Date | null {
  const duree = DUREE_VALIDITE[type];
  if (duree === null) return null;

  const expiration = new Date(dateRealisation);
  expiration.setFullYear(expiration.getFullYear() + duree);
  return expiration;
}

/**
 * Calcule la criticité d'un diagnostic selon les jours restants.
 */
export function calculerCriticite(joursRestants: number): DiagnosticExpiration['criticite'] {
  if (joursRestants <= 0) return 'expire';
  if (joursRestants <= 30) return 'urgent';
  if (joursRestants <= 90) return 'attention';
  return 'valide';
}

/**
 * Génère les infos d'expiration pour un type de diagnostic donné.
 */
export function analyserDiagnostic(
  type: TypeDiagnostic,
  dateRealisation: Date | null | undefined,
): DiagnosticExpiration | null {
  if (!dateRealisation) return null;

  const dateExpiration = calculerDateExpiration(type, dateRealisation);
  if (!dateExpiration) return null;

  const now = new Date();
  const joursRestants = Math.ceil(
    (dateExpiration.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    type,
    label: LABELS[type],
    dateRealisation,
    dateExpiration,
    joursRestants,
    criticite: calculerCriticite(joursRestants),
  };
}

/**
 * Analyse tous les diagnostics d'un bien et retourne ceux qui nécessitent attention.
 */
export function analyserTousDiagnostics(dates: {
  dateDPE?: Date | null;
  dateElectricite?: Date | null;
  dateGaz?: Date | null;
  datePlomb?: Date | null;
  dateAmiante?: Date | null;
}): DiagnosticExpiration[] {
  const types: { type: TypeDiagnostic; date: Date | null | undefined }[] = [
    { type: 'DPE', date: dates.dateDPE },
    { type: 'electricite', date: dates.dateElectricite },
    { type: 'gaz', date: dates.dateGaz },
    { type: 'plomb', date: dates.datePlomb },
    { type: 'amiante', date: dates.dateAmiante },
  ];

  return types
    .map(({ type, date }) => analyserDiagnostic(type, date))
    .filter((d): d is DiagnosticExpiration => d !== null);
}

/**
 * Retourne les diagnostics à renouveler dans les N prochains jours.
 */
export function diagnosticsARenouveler(
  diagnostics: DiagnosticExpiration[],
  joursMax: number = 90,
): DiagnosticExpiration[] {
  return diagnostics
    .filter((d) => d.joursRestants <= joursMax)
    .sort((a, b) => a.joursRestants - b.joursRestants);
}

export const DIAGNOSTIC_LABELS = LABELS;
export const DIAGNOSTIC_DUREES = DUREE_VALIDITE;
