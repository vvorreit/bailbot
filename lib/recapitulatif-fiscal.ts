// ─── BailBot — Récapitulatif fiscal annuel ────────────────────────────────────

import type { Bien, Paiement } from './db-local';
import jsPDF from 'jspdf';

export type RegimeFiscal = 'MICRO_FONCIER' | 'REEL' | 'MICRO_BIC' | 'BIC_REEL' | 'LMNP';

export const REGIME_LABELS: Record<RegimeFiscal, string> = {
  MICRO_FONCIER: 'Micro-foncier (−30%)',
  REEL: 'Réel foncier',
  MICRO_BIC: 'Micro-BIC (−50%)',
  BIC_REEL: 'BIC réel',
  LMNP: 'LMNP',
};

export const REGIMES_MEUBLE: RegimeFiscal[] = ['MICRO_BIC', 'BIC_REEL', 'LMNP'];

export interface ConfigFiscalBien {
  regime: RegimeFiscal;
  chargesAnnuelles: number; /* travaux + assurance PNO + frais gestion, etc. */
}

export interface RecapBien {
  bien: Bien;
  config: ConfigFiscalBien;
  loyersEncaisses: number;
  loyersAttendus: number;
  loyersManquants: number;
  chargesDeductibles: number;
  abattementMontant: number; /* montant déduit par abattement forfaitaire (micro) */
  baseImposable: number; /* après abattement ou après déduction réelle */
  formulaire: string; /* 2044 ou 2042-C-PRO */
}

export interface RecapFiscal {
  annee: number;
  biens: RecapBien[];
  totalEncaisses: number;
  totalAttendus: number;
  totalManquants: number;
  totalCharges: number;
  totalAbattement: number;
  totalBaseImposable: number;
}

/* ─── Abattements ─────────────────────────────────────────────────────────── */

export function appliquerAbattementMicroFoncier(revenus: number): number {
  return Math.round(revenus * 0.70 * 100) / 100; /* 30% abattement → 70% imposable */
}

export function appliquerAbattementMicroBic(revenus: number): number {
  return Math.round(revenus * 0.50 * 100) / 100; /* 50% abattement → 50% imposable */
}

export function abattementMontantSelon(encaisses: number, regime: RegimeFiscal): number {
  switch (regime) {
    case 'MICRO_FONCIER':
      return Math.round(encaisses * 0.30 * 100) / 100;
    case 'MICRO_BIC':
      return Math.round(encaisses * 0.50 * 100) / 100;
    default:
      return 0;
  }
}

function baseImposableSelon(encaisses: number, charges: number, regime: RegimeFiscal): number {
  switch (regime) {
    case 'MICRO_FONCIER':
      return appliquerAbattementMicroFoncier(encaisses);
    case 'MICRO_BIC':
      return appliquerAbattementMicroBic(encaisses);
    case 'REEL':
    case 'BIC_REEL':
    case 'LMNP':
      return encaisses - charges; /* peut être négatif (déficit foncier) */
    default:
      return encaisses;
  }
}

export function formulairePourRegime(regime: RegimeFiscal): string {
  switch (regime) {
    case 'MICRO_FONCIER':
    case 'REEL':
      return '2044';
    case 'MICRO_BIC':
    case 'BIC_REEL':
    case 'LMNP':
      return '2042-C-PRO';
  }
}

export function estRegimeMicro(regime: RegimeFiscal): boolean {
  return regime === 'MICRO_FONCIER' || regime === 'MICRO_BIC';
}

/* ─── Calcul principal ────────────────────────────────────────────────────── */

export function calculerRecapFiscal(
  biens: Bien[],
  paiements: Paiement[],
  configs: Record<string, ConfigFiscalBien>,
  annee: number
): RecapFiscal {
  const prefixe = `${annee}-`;

  const biensList: RecapBien[] = biens.map((bien) => {
    const paiementsBien = paiements.filter(
      (p) => p.bienId === bien.id && p.mois.startsWith(prefixe)
    );

    const loyersAttendus = paiementsBien.reduce((s, p) => s + p.loyerCC, 0);
    const loyersEncaisses = paiementsBien
      .filter((p) => p.statut === 'paye')
      .reduce((s, p) => s + (p.montantRecu ?? p.loyerCC), 0);
    const loyersManquants = Math.max(0, loyersAttendus - loyersEncaisses);

    const config: ConfigFiscalBien = configs[bien.id] ?? {
      regime: 'MICRO_FONCIER',
      chargesAnnuelles: 0,
    };

    const abattement = abattementMontantSelon(loyersEncaisses, config.regime);
    const baseImposable = baseImposableSelon(loyersEncaisses, config.chargesAnnuelles, config.regime);

    return {
      bien,
      config,
      loyersEncaisses,
      loyersAttendus,
      loyersManquants,
      chargesDeductibles: config.chargesAnnuelles,
      abattementMontant: abattement,
      baseImposable,
      formulaire: formulairePourRegime(config.regime),
    };
  });

  return {
    annee,
    biens: biensList,
    totalEncaisses: biensList.reduce((s, b) => s + b.loyersEncaisses, 0),
    totalAttendus: biensList.reduce((s, b) => s + b.loyersAttendus, 0),
    totalManquants: biensList.reduce((s, b) => s + b.loyersManquants, 0),
    totalCharges: biensList.reduce((s, b) => s + b.chargesDeductibles, 0),
    totalAbattement: biensList.reduce((s, b) => s + b.abattementMontant, 0),
    totalBaseImposable: biensList.reduce((s, b) => s + b.baseImposable, 0),
  };
}

/* ─── Export CSV ──────────────────────────────────────────────────────────── */

export function genererCSV(recap: RecapFiscal): string {
  const lignes: string[] = [
    'Bien;Régime fiscal;Loyers encaissés;Loyers attendus;Loyers manquants;Charges déductibles;Abattement;Base imposable;Formulaire',
    ...recap.biens.map((b) =>
      [
        `"${b.bien.adresse}"`,
        REGIME_LABELS[b.config.regime],
        b.loyersEncaisses.toFixed(2),
        b.loyersAttendus.toFixed(2),
        b.loyersManquants.toFixed(2),
        b.chargesDeductibles.toFixed(2),
        b.abattementMontant.toFixed(2),
        b.baseImposable.toFixed(2),
        b.formulaire,
      ].join(';')
    ),
    '',
    `"TOTAL";;${recap.totalEncaisses.toFixed(2)};${recap.totalAttendus.toFixed(2)};${recap.totalManquants.toFixed(2)};${recap.totalCharges.toFixed(2)};${recap.totalAbattement.toFixed(2)};${recap.totalBaseImposable.toFixed(2)};`,
  ];
  return lignes.join('\n');
}

/* ─── Export PDF ─────────────────────────────────────────────────────────── */

export function genererPDF(recap: RecapFiscal): jsPDF {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();

  /* Header */
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 0, W, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`BailBot — Récapitulatif fiscal ${recap.annee}`, 14, 14);
  doc.setFontSize(9);
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, W - 14, 14, { align: 'right' });

  /* Table header */
  const startY = 30;
  const cols = [14, 72, 102, 132, 158, 188, 218, 255];
  const headers = ['Bien', 'Attendus', 'Encaissés', 'Manquants', 'Charges', 'Abattement', 'Régime', 'Base imposable'];

  doc.setFillColor(241, 245, 249);
  doc.rect(10, startY - 5, W - 20, 8, 'F');
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  headers.forEach((h, i) => doc.text(h, cols[i], startY));

  /* Rows */
  let y = startY + 8;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  const fmt = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' €';

  for (const b of recap.biens) {
    if (y > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(8);
    const addr = b.bien.adresse.length > 26 ? b.bien.adresse.slice(0, 24) + '…' : b.bien.adresse;
    doc.text(addr, cols[0], y);
    doc.text(fmt(b.loyersAttendus), cols[1], y);
    doc.text(fmt(b.loyersEncaisses), cols[2], y);
    doc.text(b.loyersManquants > 0 ? fmt(b.loyersManquants) : '—', cols[3], y);
    doc.text(fmt(b.chargesDeductibles), cols[4], y);
    doc.text(b.abattementMontant > 0 ? fmt(b.abattementMontant) : '—', cols[5], y);
    doc.setFontSize(7);
    doc.text(REGIME_LABELS[b.config.regime], cols[6], y);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(fmt(b.baseImposable), cols[7], y);
    doc.setFont('helvetica', 'normal');
    y += 7;
  }

  /* Total row */
  y += 3;
  doc.setFillColor(15, 23, 42);
  doc.rect(10, y - 5, W - 20, 9, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL', cols[0], y);
  doc.text(fmt(recap.totalAttendus), cols[1], y);
  doc.text(fmt(recap.totalEncaisses), cols[2], y);
  doc.text(recap.totalManquants > 0 ? fmt(recap.totalManquants) : '—', cols[3], y);
  doc.text(fmt(recap.totalCharges), cols[4], y);
  doc.text(recap.totalAbattement > 0 ? fmt(recap.totalAbattement) : '—', cols[5], y);
  doc.text('', cols[6], y);
  doc.text(fmt(recap.totalBaseImposable), cols[7], y);

  /* Footer note */
  y += 14;
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(
    'Micro-foncier : abattement 30% (formulaire 2044) · Réel foncier : charges réelles (formulaire 2044) · Micro-BIC : abattement 50% (formulaire 2042-C-PRO) · BIC réel / LMNP : charges réelles (formulaire 2042-C-PRO).',
    14,
    y
  );
  y += 5;
  doc.text(
    'Ce document est indicatif et ne constitue pas un avis fiscal. Consultez votre comptable pour valider les montants avant déclaration.',
    14,
    y
  );

  return doc;
}
