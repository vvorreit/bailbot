// ─── BailBot — Utilitaires export CSV / Excel ────────────────────────────────

export function generateCSV(rows: Record<string, unknown>[], headers: string[]): string {
  const csvLines = [
    headers.join(';'),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = String(row[h] ?? '');
          if (val.includes(';') || val.includes('"') || val.includes('\n')) {
            return `"${val.replace(/"/g, '""')}"`;
          }
          return val;
        })
        .join(';')
    ),
  ];
  return '\uFEFF' + csvLines.join('\n');
}

export async function generateExcel(
  rows: Record<string, unknown>[],
  headers: string[],
  sheetName = 'Export'
): Promise<Blob> {
  const XLSX = await import('xlsx');

  const data = rows.map((row) => {
    const obj: Record<string, unknown> = {};
    for (const h of headers) {
      obj[h] = row[h] ?? '';
    }
    return obj;
  });

  const ws = XLSX.utils.json_to_sheet(data, { header: headers });
  ws['!cols'] = headers.map((h) => ({ wch: Math.max(h.length + 2, 15) }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}
