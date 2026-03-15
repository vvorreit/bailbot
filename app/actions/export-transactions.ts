"use server";

import type { Bien, Paiement } from '@/lib/db-local';

export interface TransactionRow {
  Date: string;
  Bien: string;
  Adresse: string;
  Locataire: string;
  Type: string;
  Montant: string;
  Statut: string;
  'Reference quittance': string;
}

const STATUT_LABELS: Record<string, string> = {
  paye: 'Payé',
  attendu: 'Attendu',
  retard: 'En retard',
  impaye: 'Impayé',
  partiel: 'Partiel',
};

export async function getTransactionsAnnuelles(
  biens: Bien[],
  paiements: Paiement[],
  year: number
): Promise<TransactionRow[]> {
  const prefixe = `${year}-`;
  const biensMap = Object.fromEntries(biens.map((b) => [b.id, b]));

  return paiements
    .filter((p) => p.mois.startsWith(prefixe))
    .sort((a, b) => a.mois.localeCompare(b.mois))
    .map((p) => {
      const bien = biensMap[p.bienId];
      const dateReelle = p.dateReelle
        ? new Date(p.dateReelle).toLocaleDateString('fr-FR')
        : '';
      const locataire = [p.locatairePrenom, p.locataireNom].filter(Boolean).join(' ') || '—';

      return {
        Date: dateReelle || p.mois,
        Bien: bien?.adresse?.split(',')[0] || '—',
        Adresse: bien?.adresse || '—',
        Locataire: locataire,
        Type: 'Loyer + charges',
        Montant: (p.montantRecu ?? p.loyerCC).toFixed(2),
        Statut: STATUT_LABELS[p.statut] || p.statut,
        'Reference quittance': `Q-${p.mois}-${p.bienId.slice(0, 6)}`,
      };
    });
}
