"use server";

import type { Bien, Paiement } from '@/lib/db-local';
import {
  calculerRecapFiscal,
  type ConfigFiscalBien,
  type RecapFiscal,
  type RecapBien,
  REGIME_LABELS,
  estRegimeMicro,
} from '@/lib/recapitulatif-fiscal';

export interface RecapFiscalComplet {
  recap: RecapFiscal;
  revenusBrutsFonciers: number;
  chargesDeductiblesTotales: number;
  resultatNetFoncier: number;
  acomptePrelSrc: number;
  bienDetails: {
    adresse: string;
    typeBail: string;
    loyerAnnuelBrut: number;
    chargesDeductibles: number;
    netFoncier: number;
    regime: string;
    formulaire: string;
  }[];
}

export async function getRecapFiscal(
  biens: Bien[],
  paiements: Paiement[],
  configs: Record<string, ConfigFiscalBien>,
  year: number
): Promise<RecapFiscalComplet> {
  const recap = calculerRecapFiscal(biens, paiements, configs, year);

  const revenusBrutsFonciers = recap.totalEncaisses;
  const chargesDeductiblesTotales = recap.biens.reduce((s, b) => {
    return s + (estRegimeMicro(b.config.regime) ? b.abattementMontant : b.chargesDeductibles);
  }, 0);
  const resultatNetFoncier = revenusBrutsFonciers - chargesDeductiblesTotales;
  const acomptePrelSrc = Math.max(0, Math.round(resultatNetFoncier * 0.301 * 100) / 100);

  const bienDetails = recap.biens.map((b: RecapBien) => ({
    adresse: b.bien.adresse,
    typeBail: b.bien.typeBail === 'HABITATION_MEUBLE' ? 'Meuble' :
      b.bien.typeBail === 'PROFESSIONNEL' ? 'Professionnel' : 'Vide',
    loyerAnnuelBrut: b.loyersEncaisses,
    chargesDeductibles: estRegimeMicro(b.config.regime) ? b.abattementMontant : b.chargesDeductibles,
    netFoncier: b.baseImposable,
    regime: REGIME_LABELS[b.config.regime],
    formulaire: b.formulaire,
  }));

  return {
    recap,
    revenusBrutsFonciers,
    chargesDeductiblesTotales,
    resultatNetFoncier,
    acomptePrelSrc,
    bienDetails,
  };
}
