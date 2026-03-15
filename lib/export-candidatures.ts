import type { Bien, Candidature } from './db-local';

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('fr-FR');
}

function slugAdresse(adresse: string): string {
  return adresse
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 40);
}

function buildRows(bien: Bien, candidatures: Candidature[]) {
  const loyer = bien.loyer + bien.charges;

  return candidatures.map((c) => {
    const d = c.dossier ?? {};
    const nomComplet = [d.prenom, d.nom].filter(Boolean).join(' ') || '—';
    const salaire = d.salaireNetMensuel ?? 0;
    const revenusN1 = d.revenusN1 ?? 0;
    const revenusMensuels = revenusN1 > 0 ? revenusN1 / 12 : salaire;
    const ratio =
      revenusMensuels > 0
        ? Math.round((loyer / revenusMensuels) * 100 * 10) / 10
        : 0;

    return {
      'Nom complet': nomComplet,
      'Date de naissance': d.dateNaissance ?? '—',
      'Type contrat': d.typeContrat ?? '—',
      Employeur: d.employeur ?? '—',
      'Salaire net mensuel (€)': salaire,
      'Revenus N-1 (€)': revenusN1,
      'Ratio loyer/revenus (%)': ratio,
      'BailScore (/100)': c.bailScore ?? 0,
      Grade: c.scoreGrade ?? '—',
      'Éligible Visale': c.eligibleVisale ? 'OUI' : 'NON',
      'Alertes fraude': c.alertesFraude ?? 0,
      'Complétude dossier (%)': c.completude?.pourcentage ?? 0,
      'Statut candidature': c.statut,
      'Date de dépôt': formatDate(c.createdAt),
      Garant: c.aGarant ? 'OUI' : 'NON',
      Notes: '',
    };
  });
}

export function exporterCandidaturesCSV(bien: Bien, candidatures: Candidature[]): Blob {
  const rows = buildRows(bien, candidatures);
  if (rows.length === 0) {
    return new Blob(['Aucune candidature'], { type: 'text/csv;charset=utf-8;' });
  }

  const headers = Object.keys(rows[0]);
  const csvLines = [
    headers.join(';'),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = String((row as Record<string, unknown>)[h] ?? '');
          // Échapper les guillemets et entourer si nécessaire
          if (val.includes(';') || val.includes('"') || val.includes('\n')) {
            return `"${val.replace(/"/g, '""')}"`;
          }
          return val;
        })
        .join(';')
    ),
  ];

  return new Blob(['\uFEFF' + csvLines.join('\n')], {
    type: 'text/csv;charset=utf-8;',
  });
}

export async function exporterCandidaturesXLSX(
  bien: Bien,
  candidatures: Candidature[]
): Promise<Blob> {
  const XLSX = await import('xlsx');
  const rows = buildRows(bien, candidatures);

  const ws = XLSX.utils.json_to_sheet(rows);

  // Largeurs de colonnes
  ws['!cols'] = [
    { wch: 25 }, // Nom complet
    { wch: 15 }, // Date naissance
    { wch: 12 }, // Type contrat
    { wch: 20 }, // Employeur
    { wch: 20 }, // Salaire
    { wch: 15 }, // Revenus N-1
    { wch: 18 }, // Ratio
    { wch: 14 }, // BailScore
    { wch: 14 }, // Grade
    { wch: 16 }, // Visale
    { wch: 14 }, // Alertes
    { wch: 18 }, // Complétude
    { wch: 20 }, // Statut
    { wch: 14 }, // Date dépôt
    { wch: 10 }, // Garant
    { wch: 30 }, // Notes
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Candidatures');

  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

export function nomFichierExport(bien: Bien, ext: 'csv' | 'xlsx'): string {
  const dateStr = new Date().toISOString().slice(0, 10);
  return `candidatures_${slugAdresse(bien.adresse)}_${dateStr}.${ext}`;
}
