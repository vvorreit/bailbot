"use server";

import type { Candidature } from '@/lib/db-local';

export interface LigneComparaison {
  critere: string;
  valeurA: string;
  valeurB: string;
  meilleur: 'A' | 'B' | 'egal';
}

export interface ComparaisonData {
  lignes: LigneComparaison[];
  recommande: 'A' | 'B';
  justification: string;
}

function comparer(a: number, b: number, plusEstMieux: boolean): 'A' | 'B' | 'egal' {
  if (a === b) return 'egal';
  if (plusEstMieux) return a > b ? 'A' : 'B';
  return a < b ? 'A' : 'B';
}

export async function getComparaisonData(
  dossierA: Candidature,
  dossierB: Candidature,
  loyerCC: number
): Promise<ComparaisonData> {
  const dA = dossierA.dossier ?? {};
  const dB = dossierB.dossier ?? {};

  const scoreA = dossierA.bailScore ?? 0;
  const scoreB = dossierB.bailScore ?? 0;

  const revenusA = dA.salaireNetMensuel ?? 0;
  const revenusB = dB.salaireNetMensuel ?? 0;

  const ratioA = revenusA > 0 ? Math.round((loyerCC / revenusA) * 100 * 10) / 10 : 0;
  const ratioB = revenusB > 0 ? Math.round((loyerCC / revenusB) * 100 * 10) / 10 : 0;

  const fraudeA = dossierA.alertesFraude ?? 0;
  const fraudeB = dossierB.alertesFraude ?? 0;

  const completudeA = dossierA.completude?.pourcentage ?? 0;
  const completudeB = dossierB.completude?.pourcentage ?? 0;

  const lignes: LigneComparaison[] = [
    {
      critere: 'BailScore',
      valeurA: `${scoreA}/100`,
      valeurB: `${scoreB}/100`,
      meilleur: comparer(scoreA, scoreB, true),
    },
    {
      critere: 'Revenus nets',
      valeurA: `${revenusA.toLocaleString('fr-FR')} €`,
      valeurB: `${revenusB.toLocaleString('fr-FR')} €`,
      meilleur: comparer(revenusA, revenusB, true),
    },
    {
      critere: 'Ratio loyer/revenus',
      valeurA: `${ratioA}%`,
      valeurB: `${ratioB}%`,
      meilleur: comparer(ratioA, ratioB, false),
    },
    {
      critere: 'Eligible Visale',
      valeurA: dossierA.eligibleVisale ? 'OUI' : 'NON',
      valeurB: dossierB.eligibleVisale ? 'OUI' : 'NON',
      meilleur: dossierA.eligibleVisale === dossierB.eligibleVisale ? 'egal'
        : dossierA.eligibleVisale ? 'A' : 'B',
    },
    {
      critere: 'Score fraude',
      valeurA: `${fraudeA} alerte${fraudeA > 1 ? 's' : ''}`,
      valeurB: `${fraudeB} alerte${fraudeB > 1 ? 's' : ''}`,
      meilleur: comparer(fraudeA, fraudeB, false),
    },
    {
      critere: 'Completude dossier',
      valeurA: `${completudeA}%`,
      valeurB: `${completudeB}%`,
      meilleur: comparer(completudeA, completudeB, true),
    },
    {
      critere: 'Situation professionnelle',
      valeurA: dA.typeContrat || '—',
      valeurB: dB.typeContrat || '—',
      meilleur: 'egal',
    },
    {
      critere: 'Garant',
      valeurA: dossierA.aGarant ? 'OUI' : 'NON',
      valeurB: dossierB.aGarant ? 'OUI' : 'NON',
      meilleur: dossierA.aGarant === dossierB.aGarant ? 'egal'
        : dossierA.aGarant ? 'A' : 'B',
    },
  ];

  const pointsA = lignes.filter((l) => l.meilleur === 'A').length;
  const pointsB = lignes.filter((l) => l.meilleur === 'B').length;
  const recommande = pointsA >= pointsB ? 'A' : 'B';

  const nomA = [dA.prenom, dA.nom].filter(Boolean).join(' ') || 'Candidat A';
  const nomB = [dB.prenom, dB.nom].filter(Boolean).join(' ') || 'Candidat B';
  const gagnant = recommande === 'A' ? nomA : nomB;
  const justification = `${gagnant} obtient de meilleurs resultats sur ${Math.max(pointsA, pointsB)} criteres sur ${lignes.length}.`;

  return { lignes, recommande, justification };
}
