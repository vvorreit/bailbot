import jsPDF from 'jspdf';

export interface DonneesQuittance {
  // Bailleur
  nomBailleur: string;
  adresseBailleur: string;

  // Locataire
  nomLocataire: string;
  prenomLocataire: string;
  adresseBien: string;

  // Loyer
  loyerHC: number;
  charges: number;
  mois: string; // "mars 2026"
  dateReglement: string; // "10 mars 2026"
  modePaiement: string; // "virement bancaire"

  // Période
  periodeDebut: string; // "1er mars 2026"
  periodeFin: string;   // "31 mars 2026"
}

export function genererQuittancePDF(donnees: DonneesQuittance): Blob {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const total = donnees.loyerHC + donnees.charges;

  // Extraire la ville depuis l'adresse bailleur (dernier mot/segment)
  const partiesAdresse = donnees.adresseBailleur.split(',');
  const ville = partiesAdresse[partiesAdresse.length - 1]?.trim() || 'Paris';

  // Date de génération
  const maintenant = new Date();
  const dateGeneration = maintenant.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const marginLeft = 20;
  const marginRight = 20;
  const pageWidth = 210;
  const contentWidth = pageWidth - marginLeft - marginRight;
  let y = 25;

  // ─── En-tête ──────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('QUITTANCE DE LOYER', pageWidth / 2, y, { align: 'center' });
  y += 8;

  doc.setFontSize(12);
  doc.text(`Mois de ${donnees.mois}`, pageWidth / 2, y, { align: 'center' });
  y += 10;

  // Ligne séparatrice
  doc.setDrawColor(200, 200, 200);
  doc.line(marginLeft, y, pageWidth - marginRight, y);
  y += 8;

  // ─── Corps ────────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);

  const ligneDeclaration =
    `Je soussigné(e), ${donnees.nomBailleur}, propriétaire du logement désigné ci-dessous,\n` +
    `déclare avoir reçu de ${donnees.prenomLocataire} ${donnees.nomLocataire}, locataire du dit logement,\n` +
    `la somme de ${total.toLocaleString('fr-FR')} € (loyer + charges) au titre du loyer\n` +
    `du ${donnees.periodeDebut} au ${donnees.periodeFin}.`;

  const lignesDeclaration = doc.splitTextToSize(ligneDeclaration, contentWidth);
  doc.text(lignesDeclaration, marginLeft, y);
  y += lignesDeclaration.length * 6 + 6;

  // Logement
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('LOGEMENT :', marginLeft, y);
  doc.setFont('helvetica', 'normal');
  doc.text(donnees.adresseBien, marginLeft + 28, y);
  y += 10;

  // Détail
  doc.setFont('helvetica', 'bold');
  doc.text('DÉTAIL DU RÈGLEMENT :', marginLeft, y);
  y += 7;

  doc.setFont('helvetica', 'normal');
  doc.text(`- Loyer hors charges : ${donnees.loyerHC.toLocaleString('fr-FR')} €`, marginLeft + 4, y);
  y += 6;
  doc.text(`- Provisions sur charges : ${donnees.charges.toLocaleString('fr-FR')} €`, marginLeft + 4, y);
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text(`- TOTAL : ${total.toLocaleString('fr-FR')} €`, marginLeft + 4, y);
  y += 10;

  doc.setFont('helvetica', 'normal');
  doc.text(
    `Règlement reçu le ${donnees.dateReglement} par ${donnees.modePaiement}.`,
    marginLeft,
    y
  );
  y += 12;

  // Fait à / signature
  doc.text(`Fait à ${ville}, le ${dateGeneration}`, marginLeft, y);
  y += 10;

  doc.text('Signature du bailleur :', marginLeft, y);
  y += 8;
  doc.text('_______________________', marginLeft, y);
  y += 7;
  doc.setFont('helvetica', 'bold');
  doc.text(donnees.nomBailleur, marginLeft, y);
  y += 12;

  // Ligne séparatrice bas
  doc.setDrawColor(200, 200, 200);
  doc.line(marginLeft, y, pageWidth - marginRight, y);
  y += 8;

  // Mentions légales
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);

  const mentions =
    "Cette quittance annule tous les reçus qui auraient pu être établis précédemment\n" +
    "pour la période considérée. Elle ne vaut pas décharge des sommes qui resteraient dues.\n" +
    "Généré par BailBot";

  const lignesMentions = doc.splitTextToSize(mentions, contentWidth);
  doc.text(lignesMentions, marginLeft, y);

  return doc.output('blob');
}
