'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, FileText, Loader2, Trophy, AlertTriangle, Check, ArrowUpDown } from 'lucide-react';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import type { Candidature } from '@/lib/db-local';
import {
  getComparaisonData,
  type ComparaisonData,
  type LigneComparaison,
} from '@/app/actions/comparer-candidats';

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface Props {
  candidats: Candidature[];
  loyerCC: number;
  onClose: () => void;
}

/* Legacy props — compat with old 2-candidate usage */
interface LegacyProps {
  candidatA: Candidature;
  candidatB: Candidature;
  loyerCC: number;
  onClose: () => void;
}

type AllProps = Props | LegacyProps;

function isLegacy(p: AllProps): p is LegacyProps {
  return 'candidatA' in p;
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function nomCandidat(c: Candidature): string {
  const d = c.dossier ?? {};
  return [d.prenom, d.nom].filter(Boolean).join(' ') || 'Sans nom';
}

function couleurMeilleur(meilleur: 'A' | 'B' | 'egal', colonne: 'A' | 'B'): string {
  if (meilleur === 'egal') return 'text-slate-600 bg-slate-50';
  if (meilleur === colonne) return 'text-emerald-700 bg-emerald-50 font-bold';
  return 'text-red-600 bg-red-50';
}

function getRangBadge(rang: number, total: number, score: number) {
  if (rang === 1 && score > 70) return { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', badge: 'Recommande' };
  if (score < 40) return { bg: 'bg-red-50 border-red-200', text: 'text-red-700', badge: 'Attention' };
  if (rang === total && score < 50) return { bg: 'bg-red-50 border-red-200', text: 'text-red-600', badge: null };
  return { bg: 'bg-white border-slate-100', text: 'text-slate-900', badge: null };
}

/* ─── Component ──────────────────────────────────────────────────────────── */

export default function ComparateurCandidats(props: AllProps) {
  const trapRef = useFocusTrap(true);
  const candidats = isLegacy(props) ? [props.candidatA, props.candidatB] : props.candidats;
  const loyerCC = props.loyerCC;

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [compareData, setCompareData] = useState<ComparaisonData | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);

  /* Build ranked list sorted by BailScore desc */
  const classement = useMemo(() => {
    return [...candidats]
      .map((c) => {
        const d = c.dossier ?? {};
        const revenus = d.salaireNetMensuel ?? 0;
        const ratio = revenus > 0 ? Math.round((loyerCC / revenus) * 100 * 10) / 10 : 0;
        return {
          candidat: c,
          nom: nomCandidat(c),
          bailScore: c.bailScore ?? 0,
          revenus,
          ratio,
          visale: c.eligibleVisale ?? false,
          fraude: c.alertesFraude ?? 0,
          completude: c.completude?.pourcentage ?? 0,
        };
      })
      .sort((a, b) => b.bailScore - a.bailScore)
      .map((item, i) => ({ ...item, rang: i + 1 }));
  }, [candidats, loyerCC]);

  /* Toggle selection for detail comparison */
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
    setCompareData(null);
  };

  /* Load 2-candidate comparison */
  const handleCompare2 = async () => {
    if (selectedIds.length !== 2) return;
    const cA = candidats.find((c) => c.id === selectedIds[0]);
    const cB = candidats.find((c) => c.id === selectedIds[1]);
    if (!cA || !cB) return;
    setCompareLoading(true);
    try {
      const data = await getComparaisonData(cA, cB, loyerCC);
      setCompareData(data);
    } finally {
      setCompareLoading(false);
    }
  };

  /* ─── PDF export — classement complet ─── */
  const handleExportPDF = async () => {
    const jsPDF = (await import('jspdf')).default;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();

    doc.setFillColor(16, 185, 129);
    doc.rect(0, 0, W, 22, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('BailBot — Classement candidats', 14, 14);

    let y = 34;
    const cols = [14, 28, 80, 120, 148, 178, 198, 225, 250];
    const headers = ['Rang', 'Nom', 'BailScore', 'Revenus', 'Ratio', 'Visale', 'Fraude', 'Completude', 'Reco.'];

    doc.setFillColor(241, 245, 249);
    doc.rect(10, y - 4, W - 20, 7, 'F');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'bold');
    headers.forEach((h, i) => doc.text(h, cols[i], y));

    y += 8;
    doc.setTextColor(30, 41, 59);

    for (const item of classement) {
      doc.setFont('helvetica', item.rang === 1 ? 'bold' : 'normal');
      doc.setFontSize(8);
      doc.text(`#${item.rang}`, cols[0], y);
      doc.text(item.nom, cols[1], y);
      doc.text(`${item.bailScore}/100`, cols[2], y);
      doc.text(`${item.revenus.toLocaleString('fr-FR')} EUR`, cols[3], y);
      doc.text(`${item.ratio}%`, cols[4], y);
      doc.text(item.visale ? 'OUI' : 'NON', cols[5], y);
      doc.text(`${item.fraude}`, cols[6], y);
      doc.text(`${item.completude}%`, cols[7], y);
      const reco = item.rang === 1 && item.bailScore > 70 ? 'Recommande' : item.fraude > 0 || item.bailScore < 40 ? 'Attention' : '';
      doc.text(reco, cols[8], y);
      y += 6;
    }

    doc.save(`classement_candidats_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const selectedA = selectedIds[0] ? candidats.find((c) => c.id === selectedIds[0]) : null;
  const selectedB = selectedIds[1] ? candidats.find((c) => c.id === selectedIds[1]) : null;

  return (
    <div ref={trapRef} role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Classement candidats</h2>
              <p className="text-xs text-slate-500">{candidats.length} candidat{candidats.length > 1 ? 's' : ''} — tri par BailScore</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              PDF
            </button>
            <button onClick={props.onClose} aria-label="Fermer" className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Tableau classement */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="w-10 px-2 py-3"></th>
                  <th className="text-left px-3 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Rang</th>
                  <th className="text-left px-3 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Nom</th>
                  <th className="text-center px-3 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">BailScore</th>
                  <th className="text-center px-3 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Revenus</th>
                  <th className="text-center px-3 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Ratio</th>
                  <th className="text-center px-3 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Visale</th>
                  <th className="text-center px-3 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Fraude</th>
                  <th className="text-center px-3 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Completude</th>
                  <th className="text-center px-3 py-3 text-[10px] font-black text-slate-500 uppercase tracking-wider">Reco.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {classement.map((item) => {
                  const style = getRangBadge(item.rang, classement.length, item.bailScore);
                  const checked = selectedIds.includes(item.candidat.id);
                  return (
                    <tr key={item.candidat.id} className={`${style.bg} border ${checked ? 'ring-2 ring-purple-300' : ''} transition-all`}>
                      <td className="px-2 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSelect(item.candidat.id)}
                          className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                        />
                      </td>
                      <td className="px-3 py-3">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-black ${
                          item.rang === 1 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          #{item.rang}
                        </span>
                      </td>
                      <td className={`px-3 py-3 font-bold ${style.text}`}>{item.nom}</td>
                      <td className="px-3 py-3 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-black ${
                          item.bailScore >= 70 ? 'bg-emerald-100 text-emerald-700'
                          : item.bailScore >= 50 ? 'bg-amber-100 text-amber-700'
                          : 'bg-red-100 text-red-700'
                        }`}>
                          {item.bailScore}/100
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center text-slate-700">
                        {item.revenus > 0 ? `${item.revenus.toLocaleString('fr-FR')} EUR` : '—'}
                      </td>
                      <td className={`px-3 py-3 text-center font-semibold ${
                        item.ratio <= 33 ? 'text-emerald-600' : item.ratio <= 40 ? 'text-amber-600' : 'text-red-600'
                      }`}>
                        {item.ratio > 0 ? `${item.ratio}%` : '—'}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {item.visale ? (
                          <span className="text-emerald-600 font-bold text-xs">OUI</span>
                        ) : (
                          <span className="text-slate-400 text-xs">NON</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center">
                        {item.fraude > 0 ? (
                          <span className="inline-flex items-center gap-1 text-red-600 text-xs font-bold">
                            <AlertTriangle className="w-3 h-3" />
                            {item.fraude}
                          </span>
                        ) : (
                          <span className="text-emerald-600 text-xs font-semibold">0</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center text-xs font-semibold text-slate-700">{item.completude}%</td>
                      <td className="px-3 py-3 text-center">
                        {style.badge === 'Recommande' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-full">
                            <Check className="w-3 h-3" /> Recommande
                          </span>
                        )}
                        {style.badge === 'Attention' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-black rounded-full">
                            <AlertTriangle className="w-3 h-3" /> Attention
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Compare 2 button */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleCompare2}
              disabled={selectedIds.length !== 2 || compareLoading}
              className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white text-sm font-bold rounded-xl hover:bg-purple-700 disabled:opacity-40 transition-colors"
            >
              {compareLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUpDown className="w-4 h-4" />}
              Comparer ces 2
            </button>
            <span className="text-xs text-slate-400 font-medium">
              {selectedIds.length === 0 && 'Cochez 2 candidats pour comparer en detail'}
              {selectedIds.length === 1 && '1 selectionne — cochez un 2e'}
              {selectedIds.length === 2 && '2 selectionnes'}
            </span>
          </div>

          {/* Detail comparison 2 candidats */}
          {compareData && selectedA && selectedB && (
            <div className="space-y-4 border-t border-slate-200 pt-6">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-purple-600" />
                Detail : {nomCandidat(selectedA)} vs {nomCandidat(selectedB)}
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider">Critere</th>
                      <th className="text-center px-4 py-3 text-xs font-black text-emerald-700 uppercase tracking-wider">{nomCandidat(selectedA)}</th>
                      <th className="text-center px-4 py-3 text-xs font-black text-blue-700 uppercase tracking-wider">{nomCandidat(selectedB)}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {compareData.lignes.map((ligne: LigneComparaison) => (
                      <tr key={ligne.critere} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-semibold text-slate-700">{ligne.critere}</td>
                        <td className={`px-4 py-3 text-center rounded-lg ${couleurMeilleur(ligne.meilleur, 'A')}`}>
                          {ligne.valeurA}
                        </td>
                        <td className={`px-4 py-3 text-center rounded-lg ${couleurMeilleur(ligne.meilleur, 'B')}`}>
                          {ligne.valeurB}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-5 h-5 text-emerald-600" />
                  <p className="text-sm font-black text-emerald-900">
                    Recommande : {compareData.recommande === 'A' ? nomCandidat(selectedA) : nomCandidat(selectedB)}
                  </p>
                </div>
                <p className="text-xs text-emerald-700">{compareData.justification}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
