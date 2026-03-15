// ─── BailBot — Générateur PDF déclaration 2044 ──────────────────────────────

import jsPDF from 'jspdf';
import type { RecapFiscalComplet } from '@/app/actions/recap-fiscal';

const fmt = (n: number) =>
  n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

export function genererPDFFiscal2044(
  data: RecapFiscalComplet,
  nomProprietaire: string,
  year: number
): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  /* ─── Header ──────────────────────────────────────────────────────────── */
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 0, W, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('BailBot — Récapitulatif fiscal', 14, 14);
  doc.setFontSize(11);
  doc.text(`Déclaration ${year} — Formulaire 2044`, 14, 22);
  doc.setFontSize(9);
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, W - 14, 14, { align: 'right' });

  /* ─── Infos propriétaire ──────────────────────────────────────────────── */
  let y = 38;
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Propriétaire :', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text(nomProprietaire || '—', 50, y);
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Année fiscale :', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.text(String(year), 50, y);

  /* ─── Synthèse globale ────────────────────────────────────────────────── */
  y += 12;
  doc.setFillColor(241, 245, 249);
  doc.rect(10, y - 5, W - 20, 32, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Synthèse globale', 14, y + 2);

  y += 8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const synthLines = [
    ['Revenus bruts fonciers', fmt(data.revenusBrutsFonciers)],
    ['Charges déductibles totales', fmt(data.chargesDeductiblesTotales)],
    ['Résultat net foncier', fmt(data.resultatNetFoncier)],
    ['Acompte PAS estimé (30,1%)', fmt(data.acomptePrelSrc)],
  ];
  for (const [label, val] of synthLines) {
    doc.text(label, 18, y);
    doc.setFont('helvetica', 'bold');
    doc.text(val, W - 18, y, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    y += 5.5;
  }

  /* ─── Tableau par bien ────────────────────────────────────────────────── */
  y += 8;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Détail par bien', 14, y);
  y += 6;

  const cols = [14, 75, 105, 135, 160, 195];
  const colHeaders = ['Adresse', 'Type', 'Loyer brut', 'Charges', 'Net foncier', 'Formulaire'];

  doc.setFillColor(15, 23, 42);
  doc.rect(10, y - 4, W - 20, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  colHeaders.forEach((h, i) => doc.text(h, cols[i], y));

  y += 6;
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'normal');

  for (const bien of data.bienDetails) {
    if (y > H - 30) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(8);
    const addr = bien.adresse.length > 30 ? bien.adresse.slice(0, 28) + '…' : bien.adresse;
    doc.text(addr, cols[0], y);
    doc.text(bien.typeBail, cols[1], y);
    doc.text(fmt(bien.loyerAnnuelBrut), cols[2], y);
    doc.text(fmt(bien.chargesDeductibles), cols[3], y);
    doc.setFont('helvetica', 'bold');
    doc.text(fmt(bien.netFoncier), cols[4], y);
    doc.setFont('helvetica', 'normal');
    doc.text(bien.formulaire, cols[5], y);
    y += 6;

    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(`Régime : ${bien.regime}`, cols[0] + 2, y);
    doc.setTextColor(30, 41, 59);
    y += 6;
  }

  /* ─── Totaux ──────────────────────────────────────────────────────────── */
  y += 4;
  doc.setFillColor(15, 23, 42);
  doc.rect(10, y - 4, W - 20, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL', cols[0], y);
  doc.text(fmt(data.revenusBrutsFonciers), cols[2], y);
  doc.text(fmt(data.chargesDeductiblesTotales), cols[3], y);
  doc.text(fmt(data.resultatNetFoncier), cols[4], y);

  /* ─── Note de bas de page ─────────────────────────────────────────────── */
  y += 16;
  if (y > H - 25) {
    doc.addPage();
    y = 20;
  }
  doc.setTextColor(148, 163, 184);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.text(
    'Ce document est informatif et ne constitue pas un avis fiscal. Vérifiez les montants avec votre comptable avant déclaration.',
    14,
    y
  );
  y += 4;
  doc.text(
    'Les charges déductibles comprennent : taxe foncière, assurance PNO, frais de gestion, travaux (si régime réel). Amortissements LMNP à compléter.',
    14,
    y
  );
  y += 4;
  doc.text(
    `Document généré par BailBot le ${new Date().toLocaleDateString('fr-FR')} — contact@optibot.fr`,
    14,
    y
  );

  return doc;
}
