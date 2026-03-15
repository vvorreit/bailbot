// ─── BailBot — Récapitulatif fiscal annuel ────────────────────────────────────

import type { Bien, Paiement } from './db-local';

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
  revenuNet: number; /* après abattement ou après déduction réelle */
}

export interface RecapFiscal {
  annee: number;
  biens: RecapBien[];
  totalEncaisses: number;
  totalAttendus: number;
  totalManquants: number;
  totalCharges: number;
  totalNet: number;
}

/* ─── Abattements ─────────────────────────────────────────────────────────── */

export function appliquerAbattementMicroFoncier(revenus: number): number {
  return Math.round(revenus * 0.70 * 100) / 100; /* 30% abattement → 70% imposable */
}

export function appliquerAbattementMicroBic(revenus: number): number {
  return Math.round(revenus * 0.50 * 100) / 100; /* 50% abattement → 50% imposable */
}

function revenuNetSelon(encaisses: number, charges: number, regime: RegimeFiscal): number {
  switch (regime) {
    case 'MICRO_FONCIER':
      return appliquerAbattementMicroFoncier(encaisses);
    case 'MICRO_BIC':
      return appliquerAbattementMicroBic(encaisses);
    case 'REEL':
    case 'BIC_REEL':
    case 'LMNP':
      return Math.max(0, encaisses - charges);
    default:
      return encaisses;
  }
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

    const revenuNet = revenuNetSelon(loyersEncaisses, config.chargesAnnuelles, config.regime);

    return {
      bien,
      config,
      loyersEncaisses,
      loyersAttendus,
      loyersManquants,
      chargesDeductibles: config.chargesAnnuelles,
      revenuNet,
    };
  });

  return {
    annee,
    biens: biensList,
    totalEncaisses: biensList.reduce((s, b) => s + b.loyersEncaisses, 0),
    totalAttendus: biensList.reduce((s, b) => s + b.loyersAttendus, 0),
    totalManquants: biensList.reduce((s, b) => s + b.loyersManquants, 0),
    totalCharges: biensList.reduce((s, b) => s + b.chargesDeductibles, 0),
    totalNet: biensList.reduce((s, b) => s + b.revenuNet, 0),
  };
}

/* ─── Export CSV ──────────────────────────────────────────────────────────── */

export function genererCSV(recap: RecapFiscal): string {
  const lignes: string[] = [
    'Bien;Loyers bruts encaissés;Loyers attendus;Loyers manquants;Charges déductibles;Revenu net;Régime fiscal',
    ...recap.biens.map((b) =>
      [
        `"${b.bien.adresse}"`,
        b.loyersEncaisses.toFixed(2),
        b.loyersAttendus.toFixed(2),
        b.loyersManquants.toFixed(2),
        b.chargesDeductibles.toFixed(2),
        b.revenuNet.toFixed(2),
        REGIME_LABELS[b.config.regime],
      ].join(';')
    ),
    '',
    `"TOTAL";${recap.totalEncaisses.toFixed(2)};${recap.totalAttendus.toFixed(2)};${recap.totalManquants.toFixed(2)};${recap.totalCharges.toFixed(2)};${recap.totalNet.toFixed(2)};`,
  ];
  return lignes.join('\n');
}
