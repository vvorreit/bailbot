export type EcheancePret = {
  mois: number;
  date: Date;
  mensualite: number;
  capital: number;
  interets: number;
  assurance: number;
  capitalRestant: number;
  capitalRembourse: number;
};

export type TableauAmortissement = {
  echeances: EcheancePret[];
  totalInterets: number;
  totalCapital: number;
  totalAssurance: number;
  coutTotal: number;
  mensualiteHorsAssurance: number;
  mensualiteAvecAssurance: number;
  tauxEffectifGlobalPct: number;
};

export function genererTableauAmortissement(params: {
  capitalEmprunte: number;
  tauxAnnuelPct: number;
  dureeMois: number;
  dateDebut: Date;
  assuranceMensuelle?: number;
  fraisDossier?: number;
  garantie?: number;
}): TableauAmortissement {
  const {
    capitalEmprunte,
    tauxAnnuelPct,
    dureeMois,
    dateDebut,
    assuranceMensuelle = 0,
    fraisDossier = 0,
    garantie = 0,
  } = params;

  const tauxMensuel = tauxAnnuelPct / 100 / 12;

  let mensualiteHorsAssurance: number;
  if (tauxMensuel === 0) {
    mensualiteHorsAssurance = capitalEmprunte / dureeMois;
  } else {
    mensualiteHorsAssurance =
      (capitalEmprunte * tauxMensuel) /
      (1 - Math.pow(1 + tauxMensuel, -dureeMois));
  }

  mensualiteHorsAssurance = round2(mensualiteHorsAssurance);
  const mensualiteAvecAssurance = round2(mensualiteHorsAssurance + assuranceMensuelle);

  const echeances: EcheancePret[] = [];
  let capitalRestant = capitalEmprunte;
  let totalInterets = 0;
  let totalCapital = 0;
  let totalAssurance = 0;

  for (let i = 1; i <= dureeMois; i++) {
    const date = new Date(dateDebut);
    date.setMonth(date.getMonth() + (i - 1));

    const interets = round2(capitalRestant * tauxMensuel);
    let capital: number;

    if (i === dureeMois) {
      capital = round2(capitalRestant);
    } else {
      capital = round2(mensualiteHorsAssurance - interets);
    }

    const mensualiteReelle = round2(capital + interets);
    capitalRestant = round2(capitalRestant - capital);
    if (capitalRestant < 0) capitalRestant = 0;

    totalInterets += interets;
    totalCapital += capital;
    totalAssurance += assuranceMensuelle;

    echeances.push({
      mois: i,
      date,
      mensualite: round2(mensualiteReelle + assuranceMensuelle),
      capital,
      interets,
      assurance: assuranceMensuelle,
      capitalRestant,
      capitalRembourse: round2(capitalEmprunte - capitalRestant),
    });
  }

  totalInterets = round2(totalInterets);
  totalCapital = round2(totalCapital);
  totalAssurance = round2(totalAssurance);
  const coutTotal = round2(totalInterets + totalAssurance + fraisDossier + garantie);

  const tauxEffectifGlobalPct = calculerTEG(
    capitalEmprunte,
    echeances.map((e) => e.mensualite),
    fraisDossier + garantie
  );

  return {
    echeances,
    totalInterets,
    totalCapital,
    totalAssurance,
    coutTotal,
    mensualiteHorsAssurance,
    mensualiteAvecAssurance,
    tauxEffectifGlobalPct,
  };
}

function calculerTEG(
  capitalNet: number,
  mensualites: number[],
  fraisInitiaux: number
): number {
  const capitalRecu = capitalNet - fraisInitiaux;
  if (capitalRecu <= 0 || mensualites.length === 0) return 0;

  let tauxMin = 0;
  let tauxMax = 1;

  for (let iter = 0; iter < 100; iter++) {
    const tauxMid = (tauxMin + tauxMax) / 2;
    const tauxMensuel = tauxMid / 12;

    let somme = 0;
    for (let i = 0; i < mensualites.length; i++) {
      somme += mensualites[i] / Math.pow(1 + tauxMensuel, i + 1);
    }

    if (somme > capitalRecu) {
      tauxMin = tauxMid;
    } else {
      tauxMax = tauxMid;
    }
  }

  return round2(((tauxMin + tauxMax) / 2) * 100);
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
