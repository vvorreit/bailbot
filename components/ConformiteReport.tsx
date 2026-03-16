'use client';

import { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  AlertTriangle,
  AlertCircle,
  Info,
  Loader2,
  RefreshCw,
  Download,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { lancerScanConformite } from '@/app/actions/conformite';
import type { ConformiteReport as Report, ConformiteAlerte } from '@/lib/conformite/types';

interface Props {
  bailId: string;
  initialReport?: Report | null;
}

const CATEGORIE_LABELS: Record<string, string> = {
  CLAUSE_INTERDITE: 'Clause interdite',
  ENCADREMENT: 'Encadrement des loyers',
  DPE: 'Performance énergétique',
  MENTION_MANQUANTE: 'Mention manquante',
};

function scoreColor(score: number): { bg: string; text: string; ring: string; label: string } {
  if (score >= 80) return { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'stroke-emerald-500', label: 'Conforme' };
  if (score >= 50) return { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'stroke-amber-500', label: 'À corriger' };
  return { bg: 'bg-red-50', text: 'text-red-700', ring: 'stroke-red-500', label: 'Non conforme' };
}

function alerteIcon(type: ConformiteAlerte['type']) {
  switch (type) {
    case 'BLOQUANT': return <ShieldX className="w-4 h-4 text-red-500 shrink-0" />;
    case 'AVERTISSEMENT': return <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />;
    case 'INFO': return <Info className="w-4 h-4 text-blue-500 shrink-0" />;
  }
}

function alerteBg(type: ConformiteAlerte['type']) {
  switch (type) {
    case 'BLOQUANT': return 'bg-red-50 border-red-100';
    case 'AVERTISSEMENT': return 'bg-amber-50 border-amber-100';
    case 'INFO': return 'bg-blue-50 border-blue-100';
  }
}

export default function ConformiteReportWidget({ bailId, initialReport }: Props) {
  const [report, setReport] = useState<Report | null>(initialReport ?? null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);

  async function runScan() {
    setLoading(true);
    try {
      const result = await lancerScanConformite(bailId);
      setReport(result);
    } catch {
      /* silently fail — user sees no report */
    } finally {
      setLoading(false);
    }
  }

  async function exportPDF() {
    if (!report) return;
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const margin = 20;
    let y = margin;

    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Rapport de conformité réglementaire', margin, y);
    y += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date d'analyse : ${new Date(report.dateAnalyse).toLocaleDateString('fr-FR')}`, margin, y);
    y += 6;
    doc.text(`Score : ${report.score}/100`, margin, y);
    y += 10;

    const bloquants = report.alertes.filter(a => a.type === 'BLOQUANT');
    const avertissements = report.alertes.filter(a => a.type === 'AVERTISSEMENT');
    const infos = report.alertes.filter(a => a.type === 'INFO');

    const sections = [
      { title: 'Alertes bloquantes', items: bloquants },
      { title: 'Avertissements', items: avertissements },
      { title: 'Informations', items: infos },
    ];

    for (const section of sections) {
      if (section.items.length === 0) continue;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(section.title, margin, y);
      y += 7;

      for (const alerte of section.items) {
        if (y > 270) { doc.addPage(); y = margin; }
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        const descLines = doc.splitTextToSize(alerte.description, 170);
        doc.text(descLines, margin, y);
        y += descLines.length * 4;

        doc.setFont('helvetica', 'normal');
        const actionLines = doc.splitTextToSize(`Action : ${alerte.actionRequise}`, 170);
        doc.text(actionLines, margin, y);
        y += actionLines.length * 4;

        doc.setFont('helvetica', 'italic');
        doc.text(`Réf. : ${alerte.reference}`, margin, y);
        y += 6;
      }
      y += 4;
    }

    doc.save(`conformite-${bailId.slice(0, 8)}.pdf`);
  }

  /* Skeleton */
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-6 animate-pulse">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 bg-slate-200 rounded" />
          <div className="h-4 w-48 bg-slate-200 rounded" />
        </div>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-slate-100 rounded-full" />
          <div className="space-y-2 flex-1">
            <div className="h-3 w-32 bg-slate-100 rounded" />
            <div className="h-3 w-48 bg-slate-100 rounded" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-10 bg-slate-50 rounded-lg" />
          <div className="h-10 bg-slate-50 rounded-lg" />
          <div className="h-10 bg-slate-50 rounded-lg" />
        </div>
      </div>
    );
  }

  /* Pas encore de rapport */
  if (!report) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Conformité réglementaire
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          Analysez ce bail pour vérifier sa conformité avec la loi ALUR, l&apos;encadrement des loyers et les obligations DPE.
        </p>
        <button
          onClick={runScan}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-sm hover:bg-emerald-700 transition-colors w-full justify-center"
        >
          <ShieldCheck className="w-4 h-4" />
          Analyser la conformité
        </button>
      </div>
    );
  }

  /* Rapport disponible */
  const colors = scoreColor(report.score);
  const bloquants = report.alertes.filter(a => a.type === 'BLOQUANT');
  const avertissements = report.alertes.filter(a => a.type === 'AVERTISSEMENT');
  const infos = report.alertes.filter(a => a.type === 'INFO');

  /* SVG circular gauge */
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (report.score / 100) * circumference;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-sm font-black text-slate-900 uppercase tracking-wider"
        >
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Conformité réglementaire
          {expanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
        </button>
        <div className="flex items-center gap-1.5">
          <button onClick={runScan} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors" title="Relancer l'analyse">
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
          </button>
          <button onClick={exportPDF} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors" title="Exporter PDF">
            <Download className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Score gauge */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative w-16 h-16 shrink-0">
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="5" />
            <circle
              cx="32" cy="32" r={radius} fill="none"
              className={colors.ring}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-sm font-black ${colors.text}`}>{report.score}</span>
          </div>
        </div>
        <div>
          <p className={`text-sm font-black ${colors.text}`}>{colors.label}</p>
          <p className="text-xs text-slate-400">
            {report.alertes.length === 0
              ? 'Aucune alerte détectée'
              : `${bloquants.length} bloquant${bloquants.length > 1 ? 's' : ''}, ${avertissements.length} avertissement${avertissements.length > 1 ? 's' : ''}`
            }
          </p>
          <p className="text-[10px] text-slate-300 mt-0.5">
            Analysé le {new Date(report.dateAnalyse).toLocaleDateString('fr-FR')}
          </p>
        </div>
      </div>

      {!expanded && report.alertes.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {bloquants.length > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
              {bloquants.length} bloquant{bloquants.length > 1 ? 's' : ''}
            </span>
          )}
          {avertissements.length > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
              {avertissements.length} avertissement{avertissements.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}

      {/* Alertes list */}
      {expanded && report.alertes.length > 0 && (
        <div className="space-y-2">
          {/* Bloquants first, then avertissements, then infos */}
          {[...bloquants, ...avertissements, ...infos].map((alerte, i) => (
            <div key={i} className={`rounded-lg border px-3 py-2.5 ${alerteBg(alerte.type)}`}>
              <div className="flex items-start gap-2">
                {alerteIcon(alerte.type)}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-bold uppercase text-slate-400">
                      {CATEGORIE_LABELS[alerte.categorie] || alerte.categorie}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-700 leading-relaxed">{alerte.description}</p>
                  <p className="text-[10px] text-slate-500 mt-1">{alerte.actionRequise}</p>
                  <p className="text-[10px] text-slate-400 italic mt-0.5">{alerte.reference}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {expanded && report.alertes.length === 0 && (
        <div className="text-center py-4">
          <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-emerald-700">Bail conforme</p>
          <p className="text-xs text-slate-400">Aucune non-conformité détectée</p>
        </div>
      )}
    </div>
  );
}

/**
 * Badge compact pour affichage dans une liste de baux.
 */
export function ConformiteBadge({ report }: { report: Report | null }) {
  if (!report) {
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-400">
        Non analysé
      </span>
    );
  }

  const bloquants = report.alertes.filter(a => a.type === 'BLOQUANT').length;
  const colors = scoreColor(report.score);

  if (bloquants > 0) {
    return (
      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 flex items-center gap-1">
        <AlertCircle className="w-3 h-3" />
        {report.score}/100
      </span>
    );
  }

  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} flex items-center gap-1`}>
      <ShieldCheck className="w-3 h-3" />
      {report.score}/100
    </span>
  );
}
