// ─── Types conformité réglementaire ─────────────────────────────────────────

export type NiveauAlerte = 'BLOQUANT' | 'AVERTISSEMENT' | 'INFO';
export type CategorieAlerte = 'CLAUSE_INTERDITE' | 'ENCADREMENT' | 'DPE' | 'MENTION_MANQUANTE';

export interface ConformiteAlerte {
  type: NiveauAlerte;
  categorie: CategorieAlerte;
  description: string;
  actionRequise: string;
  reference: string;
}

export interface ConformiteReport {
  bailId: string;
  score: number; // 0-100
  alertes: ConformiteAlerte[];
  dateAnalyse: Date;
}

export interface ResultatEncadrement {
  encadre: boolean;
  commune: string | null;
  loyerRef: number | null;
  loyerRefMajore: number | null;
  depassement: number | null;
}

export interface ResultatDPE {
  classe: string | null;
  interditLocation: boolean;
  dateEcheance: string | null;
  alertes: ConformiteAlerte[];
}
