'use client';

import { useEffect } from 'react';
import type { DossierLocataire } from '@/lib/parsers';
import type { BailScore } from '@/lib/bailscore';
import type { EligibiliteVisale } from '@/lib/eligibilite-visale';
import type { CompletudeDossier } from '@/lib/completude-dossier';

interface Props {
  dossier: Partial<DossierLocataire>;
  bailScore?: BailScore | null;
  visaleResult?: EligibiliteVisale | null;
  completude?: CompletudeDossier | null;
  loyerMensuel?: string;
  /** Si true, affiche un bouton compact (pour DossierModal) */
  compact?: boolean;
}

function getBailScoreLabel(score: number): string {
  if (score >= 80) return 'EXCELLENT';
  if (score >= 65) return 'BON';
  if (score >= 50) return 'MOYEN';
  if (score >= 35) return 'FAIBLE';
  return 'INSUFFISANT';
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    const [y, m, d] = dateStr.split('T')[0].split('-');
    return `${d}/${m}/${y}`;
  }
  return dateStr;
}

function buildPrintHTML(
  dossier: Partial<DossierLocataire>,
  bailScore?: BailScore | null,
  visaleResult?: EligibiliteVisale | null,
  completude?: CompletudeDossier | null,
  loyerMensuel?: string
): string {
  const now = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const nomComplet = [dossier.prenom, dossier.nom].filter(Boolean).join(' ') || '—';
  const ratio = loyerMensuel && dossier.salaireNetMensuel && Number(dossier.salaireNetMensuel) > 0
    ? `${Math.round((parseFloat(loyerMensuel) / Number(dossier.salaireNetMensuel)) * 100)}%`
    : '—';

  // Documents présents
  const docs = {
    cni: Boolean(dossier.nom && dossier.dateNaissance),
    bulletins: Boolean(dossier.salaireNetMensuel),
    avisImpo: Boolean(dossier.revenuFiscal),
    rib: Boolean(dossier.iban),
  };

  // Alertes
  const alertes: string[] = [];
  if (completude) {
    const manquants = Object.entries(completude.champs || {})
      .filter(([, v]) => !v)
      .map(([k]) => k);
    if (manquants.length > 0) {
      alertes.push(`Champs manquants : ${manquants.join(', ')}`);
    }
  }

  const scoreLabel = bailScore ? getBailScoreLabel(bailScore.total) : null;
  const visaleOk = visaleResult?.eligible;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Dossier BailBot — ${nomComplet}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 12pt;
      color: #000;
      background: #fff;
      padding: 20mm;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #000;
      padding-bottom: 12px;
      margin-bottom: 20px;
    }
    .header-left h1 {
      font-size: 20pt;
      font-weight: 900;
      color: #059669;
    }
    .header-left p {
      font-size: 10pt;
      color: #555;
      margin-top: 2px;
    }
    .header-right {
      text-align: right;
      font-size: 10pt;
      color: #555;
    }
    .section {
      border: 1px solid #ddd;
      border-radius: 4px;
      margin-bottom: 14px;
      overflow: hidden;
      page-break-inside: avoid;
    }
    .section-title {
      background: #f3f4f6;
      padding: 8px 14px;
      font-size: 10pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid #ddd;
    }
    .section-body {
      padding: 12px 14px;
    }
    .row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      border-bottom: 1px solid #f3f4f6;
      font-size: 11pt;
    }
    .row:last-child { border-bottom: none; }
    .row .label { color: #555; font-weight: 500; }
    .row .value { font-weight: 700; text-align: right; }
    .score-big {
      text-align: center;
      padding: 8px 0 4px;
    }
    .score-big .number {
      font-size: 28pt;
      font-weight: 900;
      color: #059669;
    }
    .score-big .label {
      font-size: 11pt;
      font-weight: 700;
      color: #059669;
      margin-top: 2px;
    }
    .score-details {
      margin-top: 10px;
    }
    .badge {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 10pt;
      font-weight: 700;
    }
    .badge-green { background: #dcfce7; color: #166534; }
    .badge-red { background: #fee2e2; color: #991b1b; }
    .badge-amber { background: #fef3c7; color: #92400e; }
    .docs-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
    }
    .doc-item {
      font-size: 11pt;
      padding: 4px 0;
    }
    .ok { color: #059669; }
    .ko { color: #dc2626; }
    .alertes-list { list-style: none; }
    .alertes-list li { padding: 3px 0; font-size: 11pt; }
    .footer {
      margin-top: 20px;
      padding-top: 10px;
      border-top: 1px solid #ddd;
      text-align: center;
      font-size: 9pt;
      color: #888;
    }
    @media print {
      body { padding: 15mm; }
      @page { margin: 10mm; size: A4; }
    }
  </style>
</head>
<body>

  <!-- En-tête -->
  <div class="header">
    <div class="header-left">
      <h1>🏠 BailBot</h1>
      <p>Dossier de candidature locataire</p>
    </div>
    <div class="header-right">
      <div>Généré le ${now}</div>
      <div style="margin-top:4px;font-size:9pt;color:#999">Confidentiel</div>
    </div>
  </div>

  <!-- Locataire -->
  <div class="section">
    <div class="section-title">👤 Locataire</div>
    <div class="section-body">
      <div class="row">
        <span class="label">Nom complet</span>
        <span class="value">${nomComplet}</span>
      </div>
      <div class="row">
        <span class="label">Date de naissance</span>
        <span class="value">${formatDate(dossier.dateNaissance)}</span>
      </div>
      ${dossier.adresse ? `
      <div class="row">
        <span class="label">Adresse actuelle</span>
        <span class="value">${dossier.adresse}</span>
      </div>` : ''}
      ${dossier.employeur ? `
      <div class="row">
        <span class="label">Employeur</span>
        <span class="value">${dossier.employeur}${dossier.typeContrat ? ` (${dossier.typeContrat})` : ''}</span>
      </div>` : ''}
      ${dossier.salaireNetMensuel ? `
      <div class="row">
        <span class="label">Salaire net mensuel</span>
        <span class="value">${Number(dossier.salaireNetMensuel).toLocaleString('fr-FR')} €/mois</span>
      </div>` : ''}
      ${loyerMensuel ? `
      <div class="row">
        <span class="label">Loyer demandé</span>
        <span class="value">${parseFloat(loyerMensuel).toLocaleString('fr-FR')} €/mois</span>
      </div>` : ''}
    </div>
  </div>

  <!-- BailScore -->
  ${bailScore ? `
  <div class="section">
    <div class="section-title">📊 BailScore</div>
    <div class="section-body">
      <div class="score-big">
        <div class="number">${bailScore.total}<span style="font-size:14pt;color:#555">/100</span></div>
        <div class="label">${scoreLabel}</div>
      </div>
      <div class="score-details">
        ${bailScore.dimensions?.solvabilite ? `
        <div class="row">
          <span class="label">Solvabilité</span>
          <span class="value">${bailScore.dimensions.solvabilite.score}/${bailScore.dimensions.solvabilite.max}</span>
        </div>` : ''}
        ${bailScore.dimensions?.stabilite ? `
        <div class="row">
          <span class="label">Stabilité</span>
          <span class="value">${bailScore.dimensions.stabilite.score}/${bailScore.dimensions.stabilite.max}</span>
        </div>` : ''}
        ${bailScore.dimensions?.completude ? `
        <div class="row">
          <span class="label">Complétude</span>
          <span class="value">${bailScore.dimensions.completude.score}/${bailScore.dimensions.completude.max}</span>
        </div>` : ''}
      </div>
    </div>
  </div>` : ''}

  <!-- Éligibilité Visale -->
  <div class="section">
    <div class="section-title">🛡️ Éligibilité Visale</div>
    <div class="section-body">
      <div class="row">
        <span class="label">Statut</span>
        <span class="value">
          ${visaleResult
            ? `<span class="badge ${visaleOk ? 'badge-green' : 'badge-red'}">${visaleOk ? '✅ ÉLIGIBLE' : '❌ NON ÉLIGIBLE'}</span>`
            : '<span class="badge badge-amber">⚠️ Non calculé</span>'
          }
        </span>
      </div>
      ${ratio !== '—' ? `
      <div class="row">
        <span class="label">Ratio loyer / revenus</span>
        <span class="value">${ratio}</span>
      </div>` : ''}
      ${visaleResult?.motifs_refus?.length ? `
      <div class="row">
        <span class="label">Motif</span>
        <span class="value" style="font-size:10pt;color:#555">${visaleResult.motifs_refus[0]}</span>
      </div>` : ''}
    </div>
  </div>

  <!-- Documents -->
  <div class="section">
    <div class="section-title">📄 Documents</div>
    <div class="section-body">
      <div class="docs-grid">
        <div class="doc-item ${docs.cni ? 'ok' : 'ko'}">${docs.cni ? '✅' : '❌'} Pièce d'identité</div>
        <div class="doc-item ${docs.bulletins ? 'ok' : 'ko'}">${docs.bulletins ? '✅' : '❌'} Bulletins de paie</div>
        <div class="doc-item ${docs.avisImpo ? 'ok' : 'ko'}">${docs.avisImpo ? '✅' : '❌'} Avis d'imposition</div>
        <div class="doc-item ${docs.rib ? 'ok' : 'ko'}">${docs.rib ? '✅' : '❌'} RIB</div>
      </div>
    </div>
  </div>

  <!-- Alertes -->
  <div class="section">
    <div class="section-title">⚠️ Alertes</div>
    <div class="section-body">
      ${alertes.length === 0
        ? '<div class="doc-item ok">✅ Aucune anomalie détectée</div>'
        : `<ul class="alertes-list">${alertes.map((a) => `<li class="ko">⚠️ ${a}</li>`).join('')}</ul>`
      }
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    Généré par BailBot — Document confidentiel — Ne pas diffuser sans autorisation
  </div>

  <script>
    window.onload = function() { window.print(); };
  </script>
</body>
</html>`;
}

export default function ImprimerDossier({
  dossier,
  bailScore,
  visaleResult,
  completude,
  loyerMensuel,
  compact = false,
}: Props) {
  // Override Ctrl+P pour utiliser la version BailBot
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        handlePrint();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  function handlePrint() {
    const html = buildPrintHTML(dossier, bailScore, visaleResult, completude, loyerMensuel);
    const win = window.open('', '_blank', 'width=900,height=700');
    if (!win) {
      alert('Popup bloqué. Autorisez les popups pour ce site.');
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
  }

  if (compact) {
    return (
      <button
        onClick={handlePrint}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-bold hover:bg-slate-200 transition-colors"
        title="Imprimer le dossier (Ctrl+P)"
      >
        🖨️ <span>Imprimer</span>
      </button>
    );
  }

  return (
    <button
      onClick={handlePrint}
      className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl border-2 border-white/20 bg-white/10 text-white hover:bg-white/20 transition-all"
      title="Imprimer le dossier (Ctrl+P)"
    >
      <span className="text-lg">🖨️</span>
      <span className="font-bold text-sm">Imprimer le dossier</span>
    </button>
  );
}
