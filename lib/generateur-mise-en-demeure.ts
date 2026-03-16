// ─── BailBot — Générateur PDF Mise en Demeure & Courriers ────────────────────
// Utilise jsPDF (client-side uniquement)

import type { Paiement } from './db-local';

export async function genererMiseEnDemeurePDF(
  paiement: Paiement,
  bailleur: { nom: string; adresse: string; ville: string },
  moisImpayes: Paiement[]
): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const marginL = 25;
  const marginR = 185;
  const pageW = 210;
  let y = 30;

  const today = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  // ── En-tête ────────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(20, 20, 20);
  const title = 'MISE EN DEMEURE DE PAYER';
  const titleW = doc.getTextWidth(title);
  doc.text(title, (pageW - titleW) / 2, y);
  y += 4;
  doc.setDrawColor(200, 0, 0);
  doc.setLineWidth(0.5);
  doc.line((pageW - titleW) / 2 - 2, y, (pageW - titleW) / 2 + titleW + 2, y);
  y += 12;

  // ── Date et lieu ──────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  doc.text(`${bailleur.ville}, le ${today}`, marginR, y, { align: 'right' });
  y += 14;

  // ── Identités ─────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(20, 20, 20);
  doc.text('Bailleur :', marginL, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${bailleur.nom}`, marginL + 22, y);
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Adresse :', marginL, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${bailleur.adresse}`, marginL + 22, y);
  y += 10;

  doc.setFont('helvetica', 'bold');
  doc.text('Locataire :', marginL, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${paiement.locatairePrenom} ${paiement.locataireNom}`, marginL + 26, y);
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Bien loué :', marginL, y);
  doc.setFont('helvetica', 'normal');
  // On utilise l'adresse du bailleur comme référence du bien si pas de champ séparé
  doc.text(`${bailleur.adresse}`, marginL + 26, y);
  y += 14;

  // ── Corps du texte ────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.text('Monsieur/Madame,', marginL, y);
  y += 8;

  const montantTotal = moisImpayes.reduce((sum, p) => sum + (p.montantRecu ? p.loyerCC - p.montantRecu : p.loyerCC), 0);
  const premiereEcheance = new Date(
    Math.min(...moisImpayes.map((p) => p.dateAttendue.getTime()))
  ).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const bodyText = `Par la présente, je vous mets en demeure de me régler, dans un délai de 8 jours à compter de la réception de ce courrier, la somme de ${montantTotal.toLocaleString('fr-FR')}€ correspondant aux loyers et charges impayés depuis le ${premiereEcheance}.`;
  const lines = doc.splitTextToSize(bodyText, marginR - marginL);
  doc.text(lines, marginL, y);
  y += lines.length * 5 + 8;

  // ── Tableau des mois impayés ───────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Détail des sommes dues :', marginL, y);
  y += 6;

  // Header
  doc.setFillColor(240, 240, 240);
  doc.rect(marginL, y - 4, marginR - marginL, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Mois', marginL + 2, y);
  doc.text('Loyer attendu', marginL + 50, y);
  doc.text('Montant reçu', marginL + 95, y);
  doc.text('Solde dû', marginL + 135, y);
  y += 6;

  doc.setFont('helvetica', 'normal');
  for (const p of moisImpayes) {
    const [year, month] = p.mois.split('-');
    const moisLabel = new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleDateString('fr-FR', {
      month: 'long',
      year: 'numeric',
    });
    const recu = p.montantRecu ?? 0;
    const solde = p.loyerCC - recu;

    doc.text(moisLabel, marginL + 2, y);
    doc.text(`${p.loyerCC.toLocaleString('fr-FR')}€`, marginL + 50, y);
    doc.text(recu > 0 ? `${recu.toLocaleString('fr-FR')}€` : '-', marginL + 95, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(180, 0, 0);
    doc.text(`${solde.toLocaleString('fr-FR')}€`, marginL + 135, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(20, 20, 20);
    doc.setDrawColor(220, 220, 220);
    doc.line(marginL, y + 2, marginR, y + 2);
    y += 8;
  }

  // Total
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(20, 20, 20);
  doc.text('TOTAL DÛ :', marginL + 110, y);
  doc.setTextColor(180, 0, 0);
  doc.text(`${montantTotal.toLocaleString('fr-FR')}€`, marginL + 135, y);
  doc.setTextColor(20, 20, 20);
  y += 14;

  // ── Mention légale ────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  const legalText = `À défaut de règlement dans ce délai, je me verrai contraint(e) d'engager une procédure judiciaire d'expulsion conformément aux dispositions légales, notamment la clause résolutoire prévue à votre contrat de bail.`;
  const legalLines = doc.splitTextToSize(legalText, marginR - marginL);
  doc.text(legalLines, marginL, y);
  y += legalLines.length * 5 + 12;

  // ── Signature ─────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Fait à ${bailleur.ville}, le ${today}`, marginL, y);
  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.text(bailleur.nom, marginL, y);
  y += 16;

  // ── Mention LRAR ─────────────────────────────────────────────────────────
  doc.setFillColor(255, 248, 220);
  doc.setDrawColor(200, 160, 0);
  doc.setLineWidth(0.3);
  doc.roundedRect(marginL, y, marginR - marginL, 12, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(120, 80, 0);
  doc.text(
    '⚠  À envoyer par lettre recommandée avec accusé de réception (LRAR)',
    marginL + 4,
    y + 7.5
  );
  doc.setTextColor(20, 20, 20);
  y += 20;

  // ── Footer ────────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(160, 160, 160);
  doc.text(
    `Document généré par BailBot • ${new Date().toLocaleDateString('fr-FR')}`,
    pageW / 2,
    285,
    { align: 'center' }
  );

  return doc.output('blob');
}

// ─── Générateur courrier simple (étapes 1 & 2) ────────────────────────────────

export async function genererLettreSimplePDF(
  etape: { numero: number; nom: string },
  objet: string,
  corps: string,
  bailleur: { nom: string; ville: string }
): Promise<Blob> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const marginL = 25;
  const marginR = 185;
  let y = 30;

  const today = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  // Date + lieu
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(`${bailleur.ville}, le ${today}`, marginR, y, { align: 'right' });
  y += 14;

  // Titre étape
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(20, 20, 20);
  doc.text(`Étape ${etape.numero} — ${etape.nom}`, marginL, y);
  y += 5;
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  doc.line(marginL, y, marginR, y);
  y += 10;

  // Objet
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Objet : ', marginL, y);
  doc.setFont('helvetica', 'normal');
  const objetLines = doc.splitTextToSize(objet, marginR - marginL - 18);
  doc.text(objetLines, marginL + 18, y);
  y += objetLines.length * 5 + 10;

  // Corps
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const corpsLines = doc.splitTextToSize(corps, marginR - marginL);
  doc.text(corpsLines, marginL, y);
  y += corpsLines.length * 5 + 16;

  // Signature
  doc.setFont('helvetica', 'bold');
  doc.text(bailleur.nom, marginL, y);

  // Footer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(160, 160, 160);
  doc.text(
    `Document généré par BailBot • ${new Date().toLocaleDateString('fr-FR')}`,
    210 / 2,
    285,
    { align: 'center' }
  );

  return doc.output('blob');
}
