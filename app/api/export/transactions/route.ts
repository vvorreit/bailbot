import { NextRequest, NextResponse } from 'next/server';
import { generateCSV } from '@/lib/export-csv';

export async function POST(req: NextRequest) {
  try {
    const { rows, format, year } = await req.json();

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'Aucune transaction' }, { status: 400 });
    }

    const headers = [
      'Date', 'Bien', 'Adresse', 'Locataire', 'Type', 'Montant', 'Statut', 'Reference quittance',
    ];
    const filename = `transactions_${year || 'export'}`;

    if (format === 'xlsx') {
      const { generateExcel } = await import('@/lib/export-csv');
      const blob = await generateExcel(rows, headers, 'Transactions');
      const buffer = await blob.arrayBuffer();

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
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
