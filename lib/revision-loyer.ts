// ─── BailBot — Révision annuelle du loyer (IRL + ILC/ILAT Pro) ────────────────
// Calcul conforme à l'article 17-1 de la loi du 6 juillet 1989 (IRL)
// et aux indices ILC / ILAT pour les baux professionnels (art. L145-40-2 C.com.)

// Dernières valeurs IRL publiées par l'INSEE
// Source : https://www.insee.fr/fr/statistiques/serie/001515333
// À mettre à jour chaque trimestre
export const IRL_DATA: Record<string, number> = {
  '2022-T1': 133.93,
  '2022-T2': 135.84,
  '2022-T3': 136.27,
  '2022-T4': 136.47,
  '2023-T1': 136.69,
  '2023-T2': 138.25,
  '2023-T3': 139.26,
  '2023-T4': 140.44,
  '2024-T1': 141.41,
  '2024-T2': 142.06,
  '2024-T3': 143.07,
  '2024-T4': 143.48,
  '2025-T1': 144.12, // estimé — actualiser
};

export const IRL_DERNIERE_MAJ = '2025-T1';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Convertit une date JJ/MM/AAAA en objet Date
 */
function parseDate(dateStr: string): Date {
  const parts = dateStr.split('/');
  if (parts.length !== 3) throw new Error(`Date invalide: ${dateStr}`);
  const [day, month, year] = parts.map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Retourne le trimestre correspondant à une date (format "AAAA-TX")
 * Le trimestre de référence est celui publié 1 an avant la date de révision
 */
function getTrimestre(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 1-12
  let trimestre: number;
  if (month <= 3) trimestre = 1;
  else if (month <= 6) trimestre = 2;
  else if (month <= 9) trimestre = 3;
  else trimestre = 4;
  return `${year}-T${trimestre}`;
}

/**
 * Retourne les trimestres disponibles dans l'ordre décroissant
 */
export function getIRLTrimestres(): string[] {
  return Object.keys(IRL_DATA).sort((a, b) => b.localeCompare(a));
}

/**
 * Retourne le dernier trimestre disponible
 */
export function getDernierTrimestre(): string {
  const trimestres = getIRLTrimestres();
  return trimestres[0];
}

/**
 * Retourne le trimestre N-4 (1 an avant)
 */
function getTrimestreNMoinsUn(trimestre: string): string {
  const [yearStr, tStr] = trimestre.split('-T');
  const year = parseInt(yearStr);
  const t = parseInt(tStr);
  return `${year - 1}-T${t}`;
}

// ─── Calcul principal ─────────────────────────────────────────────────────────

export interface ResultatRevisionLoyer {
  nouveauLoyer: number;
  variation: number; // en %
  irlReference: number;
  irlNouveau: number;
  trimestreReference: string;
  trimestreNouveau: string;
  augmentation: number; // en €
  dateApplication: string; // JJ/MM/AAAA
}

/**
 * Calcule la révision annuelle du loyer selon l'IRL
 * 
 * @param loyerActuel - Loyer hors charges actuel en €
 * @param dateSignature - Date de signature du bail (JJ/MM/AAAA)
 * @param dateRevision - Date de révision (défaut = anniversaire du bail)
 */
export function calculerRevisionLoyer(
  loyerActuel: number,
  dateSignature: string,
  dateRevision?: string
): ResultatRevisionLoyer {
  // Date de révision = anniversaire du bail (ou date fournie)
  let dateRev: Date;
  if (dateRevision) {
    dateRev = parseDate(dateRevision);
  } else {
    const signDate = parseDate(dateSignature);
    const today = new Date();
    dateRev = new Date(today.getFullYear(), signDate.getMonth(), signDate.getDate());
    // Si l'anniversaire est déjà passé cette année, prendre l'année prochaine ? Non, on prend la plus récente.
    if (dateRev > today) {
      dateRev = new Date(today.getFullYear() - 1, signDate.getMonth(), signDate.getDate());
    }
  }

  // Trimestre nouveau = trimestre de la date de révision (dernier publié)
  const trimestreNouveau = getTrimestre(dateRev);
  // Trimestre référence = N-4 (1 an avant)
  const trimestreReference = getTrimestreNMoinsUn(trimestreNouveau);

  // Cherche les IRL — fallback vers le plus proche disponible
  const irlNouveau = IRL_DATA[trimestreNouveau] ?? IRL_DATA[getDernierTrimestre()];
  const irlReference = IRL_DATA[trimestreReference] ?? IRL_DATA[getIRLTrimestres()[getIRLTrimestres().length - 1]];

  if (!irlNouveau || !irlReference) {
    throw new Error(`IRL non disponible pour les trimestres ${trimestreNouveau} / ${trimestreReference}`);
  }

  // Calcul : nouveau loyer = loyer actuel × (IRL nouveau / IRL référence)
  const nouveauLoyerBrut = loyerActuel * (irlNouveau / irlReference);
  // Arrondi au centime supérieur
  const nouveauLoyer = Math.ceil(nouveauLoyerBrut * 100) / 100;

  const augmentation = Math.round((nouveauLoyer - loyerActuel) * 100) / 100;
  const variation = Math.round(((nouveauLoyer - loyerActuel) / loyerActuel) * 10000) / 100;

  // Date d'application = date de révision
  const dateApplication = `${String(dateRev.getDate()).padStart(2, '0')}/${String(dateRev.getMonth() + 1).padStart(2, '0')}/${dateRev.getFullYear()}`;

  return {
    nouveauLoyer,
    variation,
    irlReference,
    irlNouveau,
    trimestreReference,
    trimestreNouveau,
    augmentation,
    dateApplication,
  };
}

// ─── Génération du courrier PDF ───────────────────────────────────────────────

export interface InfosCourrierRevision {
  nomBailleur: string;
  nomLocataire: string;
  villeSignature: string;
  dateSignature: string; // JJ/MM/AAAA
  loyerActuel: number;
  charges: number;
  resultat: ResultatRevisionLoyer;
}

/**
 * Génère le texte du courrier de révision de loyer
 */
export function genererTexteCourrierRevision(infos: InfosCourrierRevision): string {
  const { nomBailleur, nomLocataire, villeSignature, dateSignature, loyerActuel, charges, resultat } = infos;
  const today = new Date();
  const dateAujourdhui = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

  return `${villeSignature}, le ${dateAujourdhui}

${nomBailleur}
à
${nomLocataire}

Objet : Révision annuelle du loyer

Madame, Monsieur,

Conformément aux dispositions de votre bail du ${dateSignature} et à l'article 17-1 de la loi du 6 juillet 1989, nous vous informons de la révision de votre loyer.

Loyer actuel (hors charges) : ${loyerActuel.toFixed(2)} €
Indice de référence (base) : IRL ${resultat.trimestreReference} = ${resultat.irlReference}
Indice de référence (nouveau) : IRL ${resultat.trimestreNouveau} = ${resultat.irlNouveau}

Calcul : ${loyerActuel.toFixed(2)} × (${resultat.irlNouveau} / ${resultat.irlReference}) = ${resultat.nouveauLoyer.toFixed(2)} €

Nouveau loyer (hors charges) : ${resultat.nouveauLoyer.toFixed(2)} € (arrondi au centime supérieur)
Applicable à compter du : ${resultat.dateApplication}

Charges : ${charges.toFixed(2)} € (inchangées)
Nouveau loyer charges comprises : ${(resultat.nouveauLoyer + charges).toFixed(2)} €

Veuillez agréer, Madame, Monsieur, l'expression de mes salutations distinguées.

${nomBailleur}`;
}

/**
 * Génère le PDF du courrier de révision de loyer
 */
export function genererPDFCourrierRevision(infos: InfosCourrierRevision): Blob {
  const { jsPDF } = require('jspdf') as { jsPDF: typeof import('jspdf').default };
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const texte = genererTexteCourrierRevision(infos);
  const lignes = texte.split('\n');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);

  let y = 20;
  const marginLeft = 20;
  const pageWidth = 210;
  const maxWidth = pageWidth - marginLeft * 2;

  for (const ligne of lignes) {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    if (ligne === '') {
      y += 5;
      continue;
    }

    // Ligne "Objet :" en gras
    if (ligne.startsWith('Objet :')) {
      doc.setFont('helvetica', 'bold');
    } else if (ligne.startsWith('Calcul :') || ligne.startsWith('Nouveau loyer') || ligne.startsWith('Loyer actuel')) {
      doc.setFont('helvetica', 'normal');
    } else {
      doc.setFont('helvetica', 'normal');
    }

    const wrapped = doc.splitTextToSize(ligne, maxWidth);
    doc.text(wrapped, marginLeft, y);
    y += wrapped.length * 6;
  }

  return doc.output('blob');
}

// ─── ILC / ILAT — Indices baux professionnels ─────────────────────────────────
// Sources INSEE :
//   ILC  : série 001615526
//   ILAT : série 001617112
// Valeurs publiées trimestriellement — à actualiser chaque trimestre

export const ILC_DATA: Record<string, number> = {
  '2022-T1': 116.53,
  '2022-T2': 118.24,
  '2022-T3': 119.81,
  '2022-T4': 121.05,
  '2023-T1': 122.14,
  '2023-T2': 123.41,
  '2023-T3': 124.18,
  '2023-T4': 125.02,
  '2024-T1': 125.88,
  '2024-T2': 126.71,
  '2024-T3': 127.44,
  '2024-T4': 128.12,
  '2025-T1': 128.95, /* estimé — actualiser */
};

export const ILAT_DATA: Record<string, number> = {
  '2022-T1': 115.72,
  '2022-T2': 117.18,
  '2022-T3': 118.63,
  '2022-T4': 119.94,
  '2023-T1': 121.08,
  '2023-T2': 122.35,
  '2023-T3': 123.22,
  '2023-T4': 124.15,
  '2024-T1': 124.98,
  '2024-T2': 125.77,
  '2024-T3': 126.48,
  '2024-T4': 127.19,
  '2025-T1': 127.96, /* estimé — actualiser */
};

export type IndiceRevisionPro = 'ILC' | 'ILAT' | 'ICC' | 'LIBRE';

export interface ResultatRevisionLoyerPro {
  nouveauLoyerHT: number;
  variation: number;
  indiceReference: number;
  indiceNouveau: number;
  trimestreReference: string;
  trimestreNouveau: string;
  augmentationHT: number;
  dateApplication: string;
  tvaApplicable: boolean;
  nouveauLoyerTTC?: number;
}

/**
 * Calcule la révision annuelle du loyer pour un bail professionnel (ILC ou ILAT)
 */
export function calculerRevisionLoyerPro(
  loyerHT: number,
  indice: IndiceRevisionPro,
  dateSignature: string,
  dateRevision?: string,
  tvaApplicable = false
): ResultatRevisionLoyerPro {
  if (indice === 'LIBRE') {
    throw new Error('Indexation LIBRE — appliquer la clause contractuelle spécifique');
  }
  if (indice === 'ICC') {
    throw new Error('ICC — indice non géré directement, utiliser ILC ou ILAT');
  }

  const data = indice === 'ILC' ? ILC_DATA : ILAT_DATA;
  const trimestresSorted = Object.keys(data).sort((a, b) => b.localeCompare(a));
  const dernierTrimestre = trimestresSorted[0];

  let dateRev: Date;
  if (dateRevision) {
    const p = dateRevision.split('/');
    dateRev = new Date(parseInt(p[2]), parseInt(p[1]) - 1, parseInt(p[0]));
  } else {
    const sp = dateSignature.split('/');
    const signDate = new Date(parseInt(sp[2]), parseInt(sp[1]) - 1, parseInt(sp[0]));
    const today = new Date();
    dateRev = new Date(today.getFullYear(), signDate.getMonth(), signDate.getDate());
    if (dateRev > today) {
      dateRev = new Date(today.getFullYear() - 1, signDate.getMonth(), signDate.getDate());
    }
  }

  const month = dateRev.getMonth() + 1;
  let t: number;
  if (month <= 3) t = 1;
  else if (month <= 6) t = 2;
  else if (month <= 9) t = 3;
  else t = 4;
  const trimestreNouveau = `${dateRev.getFullYear()}-T${t}`;
  const trimestreReference = `${dateRev.getFullYear() - 1}-T${t}`;

  const indiceNouveau = data[trimestreNouveau] ?? data[dernierTrimestre];
  const derniersKeys = Object.keys(data).sort();
  const indiceReference = data[trimestreReference] ?? data[derniersKeys[0]];

  if (!indiceNouveau || !indiceReference) {
    throw new Error(`Indice ${indice} non disponible pour ${trimestreNouveau} / ${trimestreReference}`);
  }

  const nouveauLoyerBrut = loyerHT * (indiceNouveau / indiceReference);
  const nouveauLoyerHT = Math.ceil(nouveauLoyerBrut * 100) / 100;
  const augmentationHT = Math.round((nouveauLoyerHT - loyerHT) * 100) / 100;
  const variation = Math.round(((nouveauLoyerHT - loyerHT) / loyerHT) * 10000) / 100;

  const d = dateRev;
  const dateApplication = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;

  const result: ResultatRevisionLoyerPro = {
    nouveauLoyerHT,
    variation,
    indiceReference,
    indiceNouveau,
    trimestreReference,
    trimestreNouveau,
    augmentationHT,
    dateApplication,
    tvaApplicable,
  };

  if (tvaApplicable) {
    result.nouveauLoyerTTC = Math.ceil(nouveauLoyerHT * 1.20 * 100) / 100;
  }

  return result;
}
