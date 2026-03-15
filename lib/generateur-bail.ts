// ─── BailBot — Générateur de bail (ALUR + Professionnel) ─────────────────────
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

// ─── Types Bail Pro ───────────────────────────────────────────────────────────

export type IndiceProRevision = 'ILC' | 'ILAT' | 'ICC' | 'LIBRE';

export interface DonneesBailPro {
  /* Bailleur */
  nomBailleur: string;
  adresseBailleur: string;

  /* Locataire professionnel */
  nomLocataire: string;         // Dénomination sociale ou nom
  prenomLocataire?: string;
  siret: string;
  formeJuridique: string;
  adresseLocataire: string;     // Siège social

  /* Bien */
  adresseBien: string;
  surface: number;
  destinationProfessionnelle: string; // "cabinet médical", "bureau d'avocat", etc.

  /* Conditions financières */
  loyerHT: number;
  chargesHT: number;
  tvaApplicable: boolean;       // option TVA 20%
  depotGarantie: number;        // montant libre

  /* Durée */
  dateDebut: string;            // JJ/MM/AAAA
  dureeAns: number;             // min 6
  preavisLocataireMois: number; // 6 par défaut

  /* Révision */
  indiceRevision: IndiceProRevision;

  /* Options */
  clausesSpeciales?: string;
  villeSignature: string;
  dateSignature: string;        // JJ/MM/AAAA
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

// ─── Générateur bail professionnel ────────────────────────────────────────────

export function genererBailProPDF(donnees: DonneesBailPro): Blob {
  const doc = new jsPDF({ format: 'a4', unit: 'mm' });

  const pageW = 210;
  const pageH = 297;
  const marginL = 20;
  const marginR = 20;
  const contentW = pageW - marginL - marginR;
  let y = 20;

  const tvaRate = 0.20;
  const loyerTTC = donnees.tvaApplicable ? donnees.loyerHT * (1 + tvaRate) : donnees.loyerHT;
  const chargesTTC = donnees.tvaApplicable ? donnees.chargesHT * (1 + tvaRate) : donnees.chargesHT;
  const totalMensuelHT = donnees.loyerHT + donnees.chargesHT;
  const totalMensuelTTC = loyerTTC + chargesTTC;

  /* Date de fin : dateDebut + dureeAns années */
  const calcDateFinPro = (): string => {
    const parts = donnees.dateDebut.split('/');
    if (parts.length !== 3) return '';
    const [j, m, a] = parts.map(Number);
    const fin = new Date(a + donnees.dureeAns, m - 1, j - 1);
    return `${String(fin.getDate()).padStart(2, '0')}/${String(fin.getMonth() + 1).padStart(2, '0')}/${fin.getFullYear()}`;
  };
  const dateFin = calcDateFinPro();

  const indiceLabel: Record<IndiceProRevision, string> = {
    ILC: 'ILC — Indice des Loyers Commerciaux (INSEE)',
    ILAT: 'ILAT — Indice des Loyers des Activités Tertiaires (INSEE)',
    ICC: 'ICC — Indice du Coût de la Construction (INSEE)',
    LIBRE: 'Indexation libre (clause contractuelle)',
  };

  /* ─── Helpers de rendu ── */
  const checkPage = (needed = 20) => {
    if (y + needed > pageH - 25) {
      addFooterPro();
      doc.addPage();
      y = 20;
      addHeaderPro(false);
    }
  };

  const addFooterPro = () => {
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'italic');
    doc.text('Généré par BailBot — Document non juridiquement opposable sans signature manuscrite des parties', pageW / 2, pageH - 10, { align: 'center' });
    doc.text(`Page ${doc.getCurrentPageInfo().pageNumber}`, pageW - marginR, pageH - 10, { align: 'right' });
    doc.setTextColor(0, 0, 0);
  };

  const addHeaderPro = (withTitle: boolean) => {
    /* Logo BailBot indigo pour les baux pro */
    doc.setFillColor(79, 70, 229); /* indigo-600 */
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
    doc.text('Bail Professionnel', marginL + 13, y + 8);
    doc.setTextColor(0, 0, 0);

    if (withTitle) {
      y += 15;
      doc.setFillColor(79, 70, 229);
      doc.rect(marginL, y, contentW, 14, 'F');
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text('CONTRAT DE LOCATION PROFESSIONNELLE', pageW / 2, y + 6, { align: 'center' });
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Art. L145-40-2 C.com. — Loi du 6 juillet 1989 modifiée — Décret n°53-960', pageW / 2, y + 11, { align: 'center' });
      doc.setTextColor(0, 0, 0);
      y += 20;
    } else {
      y += 12;
    }
  };

  const drawSep = () => {
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(marginL, y, pageW - marginR, y);
    y += 4;
  };

  const addTitle = (title: string) => {
    checkPage(15);
    doc.setFillColor(238, 242, 255); /* indigo-50 */
    doc.rect(marginL, y, contentW, 8, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(67, 56, 202); /* indigo-700 */
    doc.text(title, marginL + 3, y + 5.5);
    doc.setTextColor(0, 0, 0);
    y += 12;
  };

  const addKV = (label: string, value: string, indent = 3) => {
    checkPage(8);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    const lw = doc.getTextWidth(label + ' ');
    doc.text(label, marginL + indent, y);
    doc.setFont('helvetica', 'normal');
    doc.text(value || '—', marginL + indent + lw, y);
    y += 5.5;
  };

  const addText = (text: string, indent = 0, bold = false, fs = 8.5) => {
    checkPage(10);
    doc.setFontSize(fs);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    const lines = doc.splitTextToSize(text, contentW - indent);
    doc.text(lines, marginL + indent, y);
    y += lines.length * (fs * 0.4) + 2;
  };

  /* ─── Rendu ── */
  addHeaderPro(true);

  /* Art 1 — Parties */
  addTitle('ARTICLE 1 — DÉSIGNATION DES PARTIES');
  addKV('Bailleur :', `${donnees.nomBailleur}, demeurant ${donnees.adresseBailleur}`);
  const nomLocFull = donnees.prenomLocataire
    ? `${donnees.prenomLocataire} ${donnees.nomLocataire}`.trim()
    : donnees.nomLocataire;
  addKV('Locataire :', `${nomLocFull}`);
  if (donnees.siret) addKV('SIRET :', donnees.siret);
  if (donnees.formeJuridique) addKV('Forme juridique :', donnees.formeJuridique);
  if (donnees.adresseLocataire) addKV('Siège social :', donnees.adresseLocataire);
  drawSep();

  /* Art 2 — Locaux */
  addTitle('ARTICLE 2 — DÉSIGNATION DES LOCAUX');
  addKV('Adresse :', donnees.adresseBien);
  addKV('Surface :', `${donnees.surface} m²`);
  addKV('Destination :', donnees.destinationProfessionnelle || 'Usage professionnel exclusif');
  drawSep();

  /* Art 3 — Destination */
  addTitle('ARTICLE 3 — DESTINATION DES LIEUX');
  addText(`Les locaux sont loués exclusivement pour l'exercice d'une activité professionnelle : ${donnees.destinationProfessionnelle}. Toute autre utilisation est interdite sans accord écrit préalable du bailleur.`);
  drawSep();

  /* Art 4 — Durée */
  addTitle('ARTICLE 4 — DURÉE DU BAIL');
  addKV('Durée :', `${donnees.dureeAns} ans (durée minimale légale : 6 ans)`);
  addKV('Date de prise d\'effet :', donnees.dateDebut);
  addKV('Date d\'échéance :', dateFin);
  addText('Le bail se renouvelle par tacite reconduction à son échéance pour une durée identique, sauf congé donné par l\'une des parties dans les conditions légales.');
  drawSep();

  /* Art 5 — Conditions financières */
  addTitle('ARTICLE 5 — CONDITIONS FINANCIÈRES');
  addKV('5.1 Loyer mensuel HT :', `${donnees.loyerHT.toLocaleString('fr-FR')} €`);
  addKV('5.2 Charges HT :', `${donnees.chargesHT.toLocaleString('fr-FR')} €`);
  addKV('5.3 Total mensuel HT :', `${totalMensuelHT.toLocaleString('fr-FR')} €`);
  if (donnees.tvaApplicable) {
    addKV('5.4 Option TVA :', 'Oui — TVA 20% applicable');
    addKV('Loyer mensuel TTC :', `${loyerTTC.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`);
    addKV('Total mensuel TTC :', `${totalMensuelTTC.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`);
  } else {
    addKV('5.4 Option TVA :', 'Non applicable');
  }
  drawSep();

  /* Art 6 — Révision */
  addTitle('ARTICLE 6 — RÉVISION DU LOYER');
  addKV('Indice de référence :', indiceLabel[donnees.indiceRevision]);
  addText('Le loyer est révisé annuellement à la date anniversaire du bail selon la variation de l\'indice choisi. Formule : Nouveau loyer = Loyer actuel × (Indice nouveau / Indice de référence). En cas d\'indexation libre, les modalités sont définies à l\'article 9 (Clauses spéciales).');
  drawSep();

  /* Art 7 — Dépôt de garantie */
  addTitle('ARTICLE 7 — DÉPÔT DE GARANTIE');
  addKV('Montant :', `${donnees.depotGarantie.toLocaleString('fr-FR')} € (montant libre — art. L145-40-2 C.com.)`);
  addText('Versé à la signature. Restitué dans les conditions légales à l\'expiration du bail, déduction faite des sommes dues.');
  drawSep();

  /* Art 8 — Préavis et résiliation */
  addTitle('ARTICLE 8 — PRÉAVIS ET RÉSILIATION');
  addKV('Préavis locataire :', `${donnees.preavisLocataireMois} mois (signification par LRAR ou acte d'huissier)`);
  addKV('Préavis bailleur :', '6 mois minimum avant date d\'échéance (pour refus de renouvellement)');
  addText('La résiliation anticipée par le locataire n\'est possible qu\'à chaque période triennale, avec préavis de 6 mois. Le bailleur ne peut donner congé qu\'à l\'échéance du bail.');
  drawSep();

  /* Art 9 — Cession / sous-location */
  addTitle('ARTICLE 9 — CESSION ET SOUS-LOCATION');
  addText('La cession du bail est autorisée à l\'acquéreur du fonds de commerce ou de la clientèle. La sous-location totale ou partielle est interdite sauf accord écrit du bailleur. En cas de cession, le cédant reste garant solidaire du cessionnaire pendant 3 ans.');
  drawSep();

  /* Art 10 — Travaux */
  addTitle('ARTICLE 10 — TRAVAUX ET AMÉNAGEMENTS');
  addText('Le locataire ne peut effectuer aucuns travaux de transformation sans accord écrit préalable du bailleur. Les aménagements légers (mobilier, décoration) sont libres. Les travaux autorisés deviennent la propriété du bailleur sauf accord contraire.');
  drawSep();

  /* Art 11 — Assurance */
  addTitle('ARTICLE 11 — ASSURANCE');
  addText('Le locataire est tenu de souscrire une assurance Responsabilité Civile Professionnelle (RC Pro) et une assurance multirisques professionnelle couvrant les locaux loués. Les attestations devront être remises au bailleur à la signature et renouvelées chaque année.');
  drawSep();

  /* Art 12 — Clauses spéciales */
  if (donnees.clausesSpeciales) {
    addTitle('ARTICLE 12 — CLAUSES SPÉCIALES');
    addText(donnees.clausesSpeciales);
    drawSep();
  }

  /* Art 13 — Signatures électroniques (placeholder) */
  addTitle('ARTICLE 13 — SIGNATURES');
  addText('Le présent bail est établi en autant d\'exemplaires originaux que de parties. Il sera signé manuellement ou via une solution de signature électronique qualifiée conforme au règlement eIDAS.');

  /* Zone signatures */
  checkPage(60);
  y += 5;
  addText(`Fait à ${donnees.villeSignature}, le ${donnees.dateSignature}`, 0, false, 9);
  y += 8;

  const sigW = (contentW - 10) / 2;
  const sigX1 = marginL;
  const sigX2 = marginL + sigW + 10;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Signature Bailleur :', sigX1, y);
  doc.text('Signature Locataire :', sigX2, y);
  y += 15;
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.5);
  doc.line(sigX1, y, sigX1 + sigW, y);
  doc.line(sigX2, y, sigX2 + sigW, y);
  y += 4;
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text(donnees.nomBailleur, sigX1, y);
  doc.text(nomLocFull, sigX2, y);
  doc.setTextColor(0, 0, 0);

  /* Footers */
  const totalPagesPro = doc.getNumberOfPages();
  for (let i = 1; i <= totalPagesPro; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'italic');
    doc.text('Généré par BailBot — Document non juridiquement opposable sans signature manuscrite des parties', pageW / 2, pageH - 10, { align: 'center' });
    doc.text(`Page ${i} / ${totalPagesPro}`, pageW - marginR, pageH - 10, { align: 'right' });
  }
  doc.setTextColor(0, 0, 0);

  return doc.output('blob');
}
