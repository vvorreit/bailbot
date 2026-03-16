// ─── BailBot — Générateur PDF État des Lieux (loi ALUR) ──────────────────────
// 100% client-side, zéro appel API externe

import jsPDF from 'jspdf';

/* ─── Types ───────────────────────────────────────────────────────────────── */

export interface ElementPiece {
  nom: string;
  etat: EtatElement;
  commentaire: string;
  photos: string[]; // base64 data URLs
}

export type EtatElement = 'Très bon' | 'Bon' | 'Usure normale' | 'Mauvais état' | 'À remplacer';

export interface Piece {
  nom: string;
  elements: ElementPiece[];
}

export interface Compteurs {
  eau: string;
  gaz: string;
  electricite: string;
}

export interface Cles {
  nombre: number;
  type: string;
}

export interface DonneesEDL {
  type: 'ENTREE' | 'SORTIE';
  date: string; // ISO ou JJ/MM/AAAA
  adresseBien: string;
  nomBailleur: string;
  nomLocataire: string;
  pieces: Piece[];
  compteurs: Compteurs;
  cles: Cles;
  signatureLocataire?: string; // base64 data URL
  signatureBailleur?: string;
}

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

const ETAT_COLORS: Record<EtatElement, [number, number, number]> = {
  'Très bon': [16, 185, 129],
  'Bon': [34, 197, 94],
  'Usure normale': [245, 158, 11],
  'Mauvais état': [239, 68, 68],
  'À remplacer': [185, 28, 28],
};

function formatDate(d: string): string {
  if (d.includes('/')) return d;
  const dt = new Date(d);
  return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
}

/* ─── Générateur principal ────────────────────────────────────────────────── */

export function genererEdlPDF(donnees: DonneesEDL): Blob {
  const doc = new jsPDF({ format: 'a4', unit: 'mm' });

  const pageW = 210;
  const pageH = 297;
  const marginL = 20;
  const marginR = 20;
  const contentW = pageW - marginL - marginR;
  let y = 20;

  const typeLabel = donnees.type === 'ENTREE' ? "ÉTAT DES LIEUX D'ENTRÉE" : 'ÉTAT DES LIEUX DE SORTIE';
  const dateFormatted = formatDate(donnees.date);

  /* ─── Helpers de rendu ─── */

  const checkPage = (needed: number = 20) => {
    if (y + needed > pageH - 25) {
      doc.addPage();
      y = 20;
      addHeaderSmall();
    }
  };

  const addHeaderSmall = () => {
    doc.setFillColor(16, 185, 129);
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
    doc.text('État des lieux', marginL + 13, y + 8);
    doc.setTextColor(0, 0, 0);
    y += 14;
  };

  const drawSeparator = () => {
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    doc.line(marginL, y, pageW - marginR, y);
    y += 4;
  };

  const addSectionTitle = (title: string) => {
    checkPage(15);
    doc.setFillColor(240, 253, 244);
    doc.rect(marginL, y, contentW, 8, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(5, 120, 85);
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

  /* ─── Rendu ─── */

  /* Header principal */
  addHeaderSmall();
  y += 2;

  /* Titre */
  doc.setFillColor(16, 185, 129);
  doc.rect(marginL, y, contentW, 14, 'F');
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(typeLabel, pageW / 2, y + 6, { align: 'center' });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Conforme loi ALUR du 24 mars 2014 — Décret n°2016-382 du 30 mars 2016', pageW / 2, y + 11, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  y += 20;

  /* Infos générales */
  addSectionTitle('INFORMATIONS GÉNÉRALES');
  addKV('Date :', dateFormatted);
  addKV('Adresse du bien :', donnees.adresseBien);
  addKV('Bailleur :', donnees.nomBailleur);
  addKV('Locataire :', donnees.nomLocataire);
  drawSeparator();

  /* Pièces */
  for (const piece of donnees.pieces) {
    addSectionTitle(`PIÈCE — ${piece.nom.toUpperCase()}`);

    for (const el of piece.elements) {
      checkPage(20);

      /* Nom + état */
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'bold');
      doc.text(el.nom, marginL + 3, y);

      /* Badge état */
      const etatColor = ETAT_COLORS[el.etat] || [100, 100, 100];
      const etatText = el.etat;
      const etatW = doc.getTextWidth(etatText) + 6;
      const etatX = pageW - marginR - etatW;
      doc.setFillColor(etatColor[0], etatColor[1], etatColor[2]);
      doc.roundedRect(etatX, y - 3.5, etatW, 5, 1.5, 1.5, 'F');
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      doc.text(etatText, etatX + 3, y);
      doc.setTextColor(0, 0, 0);
      y += 5;

      /* Commentaire */
      if (el.commentaire) {
        doc.setFontSize(7.5);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 100, 100);
        const cLines = doc.splitTextToSize(el.commentaire, contentW - 10);
        doc.text(cLines, marginL + 6, y);
        y += cLines.length * 3.5 + 1;
        doc.setTextColor(0, 0, 0);
      }

      /* Photos — max 800px dans le PDF (images déjà compressées côté client) */
      if (el.photos.length > 0) {
        checkPage(35);
        const photoSize = 22;
        const gap = 3;
        let px = marginL + 6;
        for (const photo of el.photos.slice(0, 5)) {
          try {
            doc.addImage(photo, 'JPEG', px, y, photoSize, photoSize);
          } catch {
            doc.setDrawColor(200, 200, 200);
            doc.rect(px, y, photoSize, photoSize);
            doc.setFontSize(6);
            doc.text('Photo', px + 5, y + 11);
          }
          px += photoSize + gap;
        }
        y += photoSize + 3;
      }

      y += 2;
    }

    drawSeparator();
  }

  /* Compteurs */
  addSectionTitle('RELEVÉ DES COMPTEURS');
  addKV('Eau :', donnees.compteurs.eau || '—');
  addKV('Gaz :', donnees.compteurs.gaz || '—');
  addKV('Électricité :', donnees.compteurs.electricite || '—');
  drawSeparator();

  /* Clés */
  addSectionTitle('REMISE DES CLÉS');
  addKV('Nombre :', String(donnees.cles.nombre));
  addKV('Type :', donnees.cles.type);
  drawSeparator();

  /* Signatures */
  checkPage(50);
  y += 5;
  addText('Les parties reconnaissent avoir effectué contradictoirement le présent état des lieux.', 0, false, 8);
  addText(`Fait le ${dateFormatted}`, 0, false, 9);
  y += 8;

  const sigW = (contentW - 10) / 2;
  const sigX1 = marginL;
  const sigX2 = marginL + sigW + 10;

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text('Signature Bailleur :', sigX1, y);
  doc.text('Signature Locataire :', sigX2, y);
  y += 5;

  /* Signatures images si disponibles */
  if (donnees.signatureBailleur) {
    try {
      doc.addImage(donnees.signatureBailleur, 'PNG', sigX1, y, sigW, 20);
    } catch { /* fallback ligne */ }
  }
  if (donnees.signatureLocataire) {
    try {
      doc.addImage(donnees.signatureLocataire, 'PNG', sigX2, y, sigW, 20);
    } catch { /* fallback ligne */ }
  }
  y += 22;

  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.5);
  doc.line(sigX1, y, sigX1 + sigW, y);
  doc.line(sigX2, y, sigX2 + sigW, y);
  y += 4;

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text(donnees.nomBailleur, sigX1, y);
  doc.text(donnees.nomLocataire, sigX2, y);
  doc.setTextColor(0, 0, 0);

  /* Footers sur toutes les pages */
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'italic');
    doc.text(
      'Généré par BailBot — Conforme loi ALUR — Décret n°2016-382',
      pageW / 2,
      pageH - 10,
      { align: 'center' }
    );
    doc.text(`Page ${i} / ${totalPages}`, pageW - marginR, pageH - 10, { align: 'right' });
  }
  doc.setTextColor(0, 0, 0);

  return doc.output('blob');
}

/* ─── Pièces par défaut (template ALUR) ──────────────────────────────────── */

const ELEMENTS_PAR_DEFAUT = ['Murs', 'Sol', 'Plafond', 'Fenêtres', 'Volets / stores', 'Prises électriques', 'Interrupteurs', 'Éclairage'];

export const PIECES_PAR_DEFAUT: Piece[] = [
  { nom: 'Entrée', elements: ELEMENTS_PAR_DEFAUT.map(nom => ({ nom, etat: 'Bon', commentaire: '', photos: [] })) },
  { nom: 'Salon / Séjour', elements: [...ELEMENTS_PAR_DEFAUT, 'Radiateur / chauffage'].map(nom => ({ nom, etat: 'Bon', commentaire: '', photos: [] })) },
  { nom: 'Cuisine', elements: [...ELEMENTS_PAR_DEFAUT, 'Évier', 'Robinetterie', 'Plaques de cuisson', 'Hotte', 'Placards'].map(nom => ({ nom, etat: 'Bon', commentaire: '', photos: [] })) },
  { nom: 'Chambre 1', elements: [...ELEMENTS_PAR_DEFAUT, 'Placard / rangement'].map(nom => ({ nom, etat: 'Bon', commentaire: '', photos: [] })) },
  { nom: 'Salle de bain', elements: ['Murs', 'Sol', 'Plafond', 'Baignoire / douche', 'Lavabo', 'Robinetterie', 'WC', 'Miroir', 'VMC'].map(nom => ({ nom, etat: 'Bon', commentaire: '', photos: [] })) },
  { nom: 'WC', elements: ['Murs', 'Sol', 'Cuvette', 'Chasse d\'eau', 'Lave-mains'].map(nom => ({ nom, etat: 'Bon', commentaire: '', photos: [] })) },
];
