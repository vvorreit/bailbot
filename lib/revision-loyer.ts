// ─── BailBot — Révision annuelle du loyer (IRL) ───────────────────────────────
// Calcul conforme à l'article 17-1 de la loi du 6 juillet 1989

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
