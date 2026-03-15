// ─── BailBot — Générateur de bail conforme loi ALUR ──────────────────────────
// 100% client-side, zéro appel API externe

import jsPDF from 'jspdf';

export interface DonneesBail {
  // Bailleur
  nomBailleur: string;
  adresseBailleur: string;

  // Locataire
  nomLocataire: string;
  prenomLocataire: string;
  dateNaissanceLocataire: string;
  adresseActuelle: string;

  // Garant (optionnel)
  garant?: {
    nom: string;
    prenom: string;
    adresse: string;
  };

  // Bien
  adresseBien: string;
  typeBien: 'appartement' | 'maison';
  surface: number;

  // Conditions financières
  loyerHC: number;
  charges: number;
  depot: number;

  // Durée
  dateEffet: string; // format JJ/MM/AAAA
  duree: number; // en mois
  jourPaiement: number;

  // Options
  zoneTendue: boolean;
  clauseResolutoire: boolean;
  villeSignature: string;
  dateSignature: string;

  // IBAN bailleur (optionnel)
  ibanBailleur?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function calculerDateFin(dateEffet: string, duree: number): string {
  // dateEffet format: JJ/MM/AAAA
  const parts = dateEffet.split('/');
  if (parts.length !== 3) return '';
  const [jour, mois, annee] = parts.map(Number);
  const d = new Date(annee, mois - 1, jour);
  d.setMonth(d.getMonth() + duree);
  d.setDate(d.getDate() - 1); // veille du jour d'entrée N mois après
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

export function getPreavisLocataire(zoneTendue: boolean): string {
  return zoneTendue ? '1 mois (zone tendue)' : '3 mois';
}

// ─── Générateur principal ─────────────────────────────────────────────────────

export function genererBailPDF(donnees: DonneesBail): Blob {
  const doc = new jsPDF({ format: 'a4', unit: 'mm' });

  const pageW = 210;
  const pageH = 297;
  const marginL = 20;
  const marginR = 20;
  const contentW = pageW - marginL - marginR;
  let y = 20;

  const dateFin = calculerDateFin(donnees.dateEffet, donnees.duree);
  const loyerCC = donnees.loyerHC + donnees.charges;
  const nomCompletLocataire = `${donnees.prenomLocataire} ${donnees.nomLocataire}`.trim();
  const nomCompletBailleur = donnees.nomBailleur;
  const typeBienLabel = donnees.typeBien === 'appartement' ? 'Appartement' : 'Maison';
  const preavis = getPreavisLocataire(donnees.zoneTendue);

  // ─── Helpers de rendu ──────────────────────────────────────────────────────

  const checkPage = (needed: number = 20) => {
    if (y + needed > pageH - 25) {
      addFooter();
      doc.addPage();
      y = 20;
      addHeader(false);
    }
  };

  const addFooter = () => {
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'italic');
    const footer = 'Généré par BailBot — Document non juridiquement opposable sans signature manuscrite des parties';
    doc.text(footer, pageW / 2, pageH - 10, { align: 'center' });
    // Numéro de page
    doc.text(`Page ${doc.getCurrentPageInfo().pageNumber}`, pageW - marginR, pageH - 10, { align: 'right' });
    doc.setTextColor(0, 0, 0);
  };

  const addHeader = (withTitle: boolean) => {
    // Logo BailBot
    doc.setFillColor(16, 185, 129); // emerald-500
    doc.roundedRect(marginL, y, 10, 10, 2, 2, 'F');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('BB', marginL + 5, y + 6.5, { align: 'center' });
    doc.setTextColor(0, 0, 0);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('BailBot', marginL + 13, y + 4);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Gestion locative intelligente', marginL + 13, y + 8);
    doc.setTextColor(0, 0, 0);

    if (withTitle) {
      y += 15;
      // Titre principal
      doc.setFillColor(16, 185, 129);
      doc.rect(marginL, y, contentW, 14, 'F');
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('CONTRAT DE LOCATION', pageW / 2, y + 6, { align: 'center' });
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Loi n°89-462 du 6 juillet 1989 — Loi ALUR du 24 mars 2014', pageW / 2, y + 11, { align: 'center' });
      doc.setTextColor(0, 0, 0);
      y += 20;
    } else {
      y += 12;
    }
  };

  const drawSeparator = () => {
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(marginL, y, pageW - marginR, y);
    y += 4;
  };

  const addArticleTitle = (title: string) => {
    checkPage(15);
    doc.setFillColor(240, 253, 244); // emerald-50
    doc.rect(marginL, y, contentW, 8, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(5, 120, 85);
    doc.text(title, marginL + 3, y + 5.5);
    doc.setTextColor(0, 0, 0);
    y += 12;
  };

  const addText = (text: string, indent: number = 0, bold: boolean = false, fontSize: number = 8.5) => {
    checkPage(10);
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    const lines = doc.splitTextToSize(text, contentW - indent);
    doc.text(lines, marginL + indent, y);
    y += lines.length * (fontSize * 0.4) + 2;
  };

  const addKeyValue = (label: string, value: string, indent: number = 3) => {
    checkPage(8);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    const labelW = doc.getTextWidth(label + ' ');
    doc.text(label, marginL + indent, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value || '—', marginL + indent + labelW, y);
    y += 5.5;
  };

  // ─── Rendu ─────────────────────────────────────────────────────────────────

  addHeader(true);

  // ─── Article 1 — Parties ──────────────────────────────────────────────────
  addArticleTitle('ARTICLE 1 — DÉSIGNATION DES PARTIES');
  addKeyValue('Bailleur :', `${nomCompletBailleur}, demeurant ${donnees.adresseBailleur}`);
  addKeyValue('Locataire(s) :', `${nomCompletLocataire}, né(e) le ${donnees.dateNaissanceLocataire}, demeurant actuellement ${donnees.adresseActuelle}`);
  if (donnees.garant) {
    const nomGarant = `${donnees.garant.prenom} ${donnees.garant.nom}`.trim();
    addKeyValue('Garant :', `${nomGarant}, demeurant ${donnees.garant.adresse}`);
  }
  drawSeparator();

  // ─── Article 2 — Locaux ───────────────────────────────────────────────────
  addArticleTitle('ARTICLE 2 — DÉSIGNATION DES LOCAUX');
  addKeyValue('Adresse :', donnees.adresseBien);
  addKeyValue('Type :', typeBienLabel);
  addKeyValue('Surface habitable :', `${donnees.surface} m²`);
  drawSeparator();

  // ─── Article 3 — Destination ──────────────────────────────────────────────
  addArticleTitle('ARTICLE 3 — DESTINATION DES LIEUX');
  addText('Le logement est loué à usage de résidence principale exclusive du locataire.');
  drawSeparator();

  // ─── Article 4 — Durée ────────────────────────────────────────────────────
  addArticleTitle('ARTICLE 4 — DURÉE DE LA LOCATION');
  addKeyValue('Durée :', `${donnees.duree} mois`);
  addKeyValue("Date d'entrée dans les lieux :", donnees.dateEffet);
  addKeyValue('Date de fin :', dateFin);
  addText(`Le contrat est renouvelé tacitement par périodes de ${donnees.duree} mois.`);
  drawSeparator();

  // ─── Article 5 — Conditions financières ──────────────────────────────────
  addArticleTitle('ARTICLE 5 — CONDITIONS FINANCIÈRES');
  addKeyValue('5.1 Loyer mensuel (hors charges) :', `${donnees.loyerHC.toLocaleString('fr-FR')} €`);
  addKeyValue('5.2 Provisions sur charges :', `${donnees.charges.toLocaleString('fr-FR')} € par mois`);
  addKeyValue('5.3 Loyer total charges comprises :', `${loyerCC.toLocaleString('fr-FR')} €`);
  addText("5.4 Révision : Le loyer est révisé chaque année à la date anniversaire selon l'Indice de Référence des Loyers (IRL).");
  drawSeparator();

  // ─── Article 6 — Dépôt de garantie ───────────────────────────────────────
  addArticleTitle('ARTICLE 6 — DÉPÔT DE GARANTIE');
  addKeyValue('Montant :', `${donnees.depot.toLocaleString('fr-FR')} €`);
  addText('Versé à la signature du présent contrat.');
  addText('Restitution dans un délai maximum de 2 mois après remise des clés.');
  drawSeparator();

  // ─── Article 7 — Modalités de paiement ───────────────────────────────────
  addArticleTitle('ARTICLE 7 — MODALITÉS DE PAIEMENT');
  addKeyValue('Échéance :', `Le ${donnees.jourPaiement} de chaque mois`);
  if (donnees.ibanBailleur) {
    addKeyValue('IBAN bailleur :', donnees.ibanBailleur);
  }
  drawSeparator();

  // ─── Article 8 — Charges récupérables ────────────────────────────────────
  addArticleTitle('ARTICLE 8 — CHARGES RÉCUPÉRABLES');
  addText("Les provisions sur charges couvrent : eau froide, eau chaude, chauffage collectif, ascenseur, entretien des parties communes, ordures ménagères.");
  drawSeparator();

  // ─── Article 9 — Travaux ──────────────────────────────────────────────────
  addArticleTitle('ARTICLE 9 — TRAVAUX');
  addText("Le locataire ne peut effectuer aucune transformation sans accord écrit du bailleur.");
  drawSeparator();

  // ─── Article 10 — Assurance ───────────────────────────────────────────────
  addArticleTitle('ARTICLE 10 — ASSURANCE');
  addText("Le locataire est tenu de s'assurer contre les risques locatifs (incendie, dégâts des eaux, responsabilité civile). Une attestation d'assurance devra être fournie au bailleur à la remise des clés, puis chaque année.");
  drawSeparator();

  // ─── Article 11 — Résiliation ─────────────────────────────────────────────
  addArticleTitle('ARTICLE 11 — RÉSILIATION');
  addKeyValue('Préavis locataire :', preavis);
  addKeyValue('Préavis bailleur :', '6 mois minimum avant la date d\'échéance');
  addText("La résiliation se fait par lettre recommandée avec accusé de réception ou par acte d'huissier.");
  drawSeparator();

  // ─── Article 12 — Clause résolutoire ─────────────────────────────────────
  addArticleTitle('ARTICLE 12 — CLAUSE RÉSOLUTOIRE');
  if (donnees.clauseResolutoire) {
    addText("Le présent contrat contient une clause résolutoire. En cas de non-paiement du loyer ou des charges aux termes convenus, de non-versement du dépôt de garantie, de non-souscription d'une assurance locative ou d'absence de délivrance d'attestation d'assurance, le contrat sera résilié de plein droit après commandement demeuré infructueux pendant un délai de deux mois, en application de l'article 24 de la loi du 6 juillet 1989.");
  } else {
    addText("Le présent contrat ne comporte pas de clause résolutoire automatique.");
  }
  drawSeparator();

  // ─── Signatures ───────────────────────────────────────────────────────────
  checkPage(60);
  y += 5;
  addText(`Fait à ${donnees.villeSignature}, le ${donnees.dateSignature}`, 0, false, 9);
  addText('En autant d\'exemplaires originaux que de parties.', 0, false, 8);
  y += 10;

  // Zone signatures
  const sigW = (contentW - 10) / 2;
  const sigX1 = marginL;
  const sigX2 = marginL + sigW + 10;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Signature Bailleur :', sigX1, y);
  doc.text('Signature Locataire :', sigX2, y);
  y += 15;

  // Lignes de signature
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.5);
  doc.line(sigX1, y, sigX1 + sigW, y);
  doc.line(sigX2, y, sigX2 + sigW, y);
  y += 4;

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text(nomCompletBailleur, sigX1, y);
  doc.text(nomCompletLocataire, sigX2, y);
  doc.setTextColor(0, 0, 0);

  // Signature garant si présent
  if (donnees.garant) {
    checkPage(35);
    y += 15;
    const nomGarant = `${donnees.garant.prenom} ${donnees.garant.nom}`.trim();
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.text('Signature Garant :', sigX1, y);
    y += 15;
    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(0.5);
    doc.line(sigX1, y, sigX1 + sigW, y);
    y += 4;
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.text(nomGarant, sigX1, y);
    doc.setTextColor(0, 0, 0);
  }

  // Footers sur toutes les pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'italic');
    const footer = 'Généré par BailBot — Document non juridiquement opposable sans signature manuscrite des parties';
    doc.text(footer, pageW / 2, pageH - 10, { align: 'center' });
    doc.text(`Page ${i} / ${totalPages}`, pageW - marginR, pageH - 10, { align: 'right' });
  }
  doc.setTextColor(0, 0, 0);

  return doc.output('blob');
}
