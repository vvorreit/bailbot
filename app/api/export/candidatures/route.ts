import { NextRequest, NextResponse } from 'next/server';
import { generateCSV } from '@/lib/export-csv';

export async function POST(req: NextRequest) {
  try {
    const { rows, format, bienAdresse } = await req.json();

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'Aucune candidature' }, { status: 400 });
    }

    const headers = [
      'Rang', 'Nom', 'Prenom', 'Revenus nets', 'Loyer demande',
      'Ratio loyer/revenus', 'BailScore', 'Visale', 'Statut', 'Date depot',
    ];
    const slug = (bienAdresse || 'bien')
      .toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 30);
    const filename = `candidatures_${slug}_${new Date().toISOString().slice(0, 10)}`;

    if (format === 'pdf') {
      const jsPDF = (await import('jspdf')).default;
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const W = doc.internal.pageSize.getWidth();

      doc.setFillColor(16, 185, 129);
      doc.rect(0, 0, W, 22, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`BailBot — Candidatures`, 14, 10);
      doc.setFontSize(10);
      doc.text(bienAdresse || '', 14, 17);
      doc.setFontSize(8);
      doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, W - 14, 10, { align: 'right' });

      let y = 30;
      const cols = [14, 28, 65, 100, 125, 150, 180, 205, 230, 255];

      doc.setFillColor(241, 245, 249);
      doc.rect(10, y - 4, W - 20, 7, 'F');
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      headers.forEach((h, i) => doc.text(h, cols[i], y));

      y += 7;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59);

      for (const row of rows) {
        if (y > doc.internal.pageSize.getHeight() - 15) {
          doc.addPage();
          y = 20;
        }
        doc.setFontSize(7);
        headers.forEach((h, i) => {
          doc.text(String(row[h] ?? ''), cols[i], y);
        });
        y += 5.5;
      }

      const buffer = doc.output('arraybuffer');
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}.pdf"`,
        },
      });
    }

    const csv = generateCSV(rows, headers);
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}.csv"`,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Erreur export' }, { status: 500 });
  }
}
