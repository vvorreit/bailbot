"use server";

import type { Bien, Candidature } from '@/lib/db-local';

export interface CandidatureRow {
  Rang: number;
  Nom: string;
  Prenom: string;
  'Revenus nets': string;
  'Loyer demande': string;
  'Ratio loyer/revenus': string;
  BailScore: number;
  Visale: string;
  Statut: string;
  'Date depot': string;
}

export async function getCandidaturesParBien(
  bien: Bien,
  candidatures: Candidature[]
): Promise<CandidatureRow[]> {
  const loyer = bien.loyer + bien.charges;

  return candidatures
    .sort((a, b) => (b.bailScore ?? 0) - (a.bailScore ?? 0))
    .map((c, i) => {
      const d = c.dossier ?? {};
      const salaire = d.salaireNetMensuel ?? 0;
      const revenusN1 = d.revenusN1 ?? 0;
      const revenusMensuels = revenusN1 > 0 ? revenusN1 / 12 : salaire;
      const ratio = revenusMensuels > 0
        ? Math.round((loyer / revenusMensuels) * 100 * 10) / 10
        : 0;

      return {
        Rang: i + 1,
        Nom: d.nom || '—',
        Prenom: d.prenom || '—',
        'Revenus nets': revenusMensuels.toFixed(2),
        'Loyer demande': loyer.toFixed(2),
        'Ratio loyer/revenus': `${ratio}%`,
        BailScore: c.bailScore ?? 0,
        Visale: c.eligibleVisale ? 'OUI' : 'NON',
        Statut: c.statut,
        'Date depot': new Date(c.createdAt).toLocaleDateString('fr-FR'),
      };
    });
}
