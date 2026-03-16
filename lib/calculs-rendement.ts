export interface DonneesBien {
  prixAchat: number;
  valeurActuelle?: number;
  loyerMensuelHC: number;
  chargesMensuelles: number;
  taxeFonciere: number;
  chargesAnnuelles: number;
  fraisGestionPct: number;
  trancheMarginalePct: number;
  surface?: number;
  mensualiteCredit?: number;
  nbMoisLoues?: number;
}

export interface KPIsRendement {
  rendementBrut: number;
  rendementNet: number;
  rendementNetNet: number;
  cashFlowMensuel: number;
  cashFlowAnnuel: number;
  tauxOccupation: number;
  loyerM2: number | null;
  ratioChargesLoyer: number;
  plusValueLatente: number | null;
  loyerAnnuelCC: number;
  loyerAnnuelHC: number;
  chargesAnnuellesTotales: number;
}

export function calculerKPIs(d: DonneesBien): KPIsRendement {
  const loyerAnnuelHC = d.loyerMensuelHC * 12;
  const loyerAnnuelCC = (d.loyerMensuelHC + d.chargesMensuelles) * 12;
  const fraisGestion = loyerAnnuelHC * (d.fraisGestionPct / 100);
  const chargesAnnuellesTotales = d.chargesAnnuelles + d.taxeFonciere + fraisGestion;

  const rendementBrut = d.prixAchat > 0
    ? (loyerAnnuelCC / d.prixAchat) * 100
    : 0;

  const rendementNet = d.prixAchat > 0
    ? ((loyerAnnuelHC - chargesAnnuellesTotales) / d.prixAchat) * 100
    : 0;

  const revenuNetAvantImpot = loyerAnnuelHC - chargesAnnuellesTotales;
  const impot = revenuNetAvantImpot > 0
    ? revenuNetAvantImpot * (d.trancheMarginalePct / 100) + revenuNetAvantImpot * 0.172
    : 0;
  const rendementNetNet = d.prixAchat > 0
    ? ((revenuNetAvantImpot - impot) / d.prixAchat) * 100
    : 0;

  const mensualiteCredit = d.mensualiteCredit ?? 0;
  const cashFlowMensuel =
    d.loyerMensuelHC + d.chargesMensuelles
    - mensualiteCredit
    - d.chargesAnnuelles / 12
    - d.taxeFonciere / 12;

  const cashFlowAnnuel = cashFlowMensuel * 12;

  const nbMoisLoues = d.nbMoisLoues ?? 12;
  const tauxOccupation = (nbMoisLoues / 12) * 100;

  const loyerM2 = d.surface && d.surface > 0
    ? d.loyerMensuelHC / d.surface
    : null;

  const ratioChargesLoyer = loyerAnnuelHC > 0
    ? (chargesAnnuellesTotales / loyerAnnuelHC) * 100
    : 0;

  const plusValueLatente = d.valeurActuelle != null && d.prixAchat > 0
    ? d.valeurActuelle - d.prixAchat
    : null;

  return {
    rendementBrut: round2(rendementBrut),
    rendementNet: round2(rendementNet),
    rendementNetNet: round2(rendementNetNet),
    cashFlowMensuel: round2(cashFlowMensuel),
    cashFlowAnnuel: round2(cashFlowAnnuel),
    tauxOccupation: round2(tauxOccupation),
    loyerM2: loyerM2 != null ? round2(loyerM2) : null,
    ratioChargesLoyer: round2(ratioChargesLoyer),
    plusValueLatente: plusValueLatente != null ? round2(plusValueLatente) : null,
    loyerAnnuelCC: round2(loyerAnnuelCC),
    loyerAnnuelHC: round2(loyerAnnuelHC),
    chargesAnnuellesTotales: round2(chargesAnnuellesTotales),
  };
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
