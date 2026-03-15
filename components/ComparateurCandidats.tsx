'use client';

import { useState, useEffect } from 'react';
import { X, FileText, Loader2, Trophy } from 'lucide-react';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import type { Candidature } from '@/lib/db-local';
import {
  getComparaisonData,
  type ComparaisonData,
  type LigneComparaison,
} from '@/app/actions/comparer-candidats';

interface Props {
  candidatA: Candidature;
  candidatB: Candidature;
  loyerCC: number;
  onClose: () => void;
}

function couleurMeilleur(meilleur: 'A' | 'B' | 'egal', colonne: 'A' | 'B'): string {
  if (meilleur === 'egal') return 'text-slate-600 bg-slate-50';
  if (meilleur === colonne) return 'text-emerald-700 bg-emerald-50 font-bold';
  return 'text-red-600 bg-red-50';
}

function nomCandidat(c: Candidature): string {
  const d = c.dossier ?? {};
  return [d.prenom, d.nom].filter(Boolean).join(' ') || 'Sans nom';
}

export default function ComparateurCandidats({ candidatA, candidatB, loyerCC, onClose }: Props) {
  const trapRef = useFocusTrap(true);
  const [data, setData] = useState<ComparaisonData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getComparaisonData(candidatA, candidatB, loyerCC)
      .then(setData)
      .finally(() => setLoading(false));
  }, [candidatA, candidatB, loyerCC]);

  const handleExportPDF = async () => {
    if (!data) return;
    const jsPDF = (await import('jspdf')).default;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();

    doc.setFillColor(16, 185, 129);
    doc.rect(0, 0, W, 22, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('BailBot — Comparaison candidats', 14, 14);

    let y = 32;
    const nomA = nomCandidat(candidatA);
    const nomB = nomCandidat(candidatB);

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(nomA, 70, y, { align: 'center' });
    doc.text('vs', W / 2, y, { align: 'center' });
    doc.text(nomB, W - 70, y, { align: 'center' });

    y += 10;
    const cols = [14, 70, 140];

    doc.setFillColor(241, 245, 249);
    doc.rect(10, y - 4, W - 20, 7, 'F');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Critere', cols[0], y);
    doc.text(nomA, cols[1], y);
    doc.text(nomB, cols[2], y);

    y += 7;
    doc.setTextColor(30, 41, 59);

    for (const ligne of data.lignes) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(ligne.critere, cols[0], y);
      doc.setFont('helvetica', ligne.meilleur === 'A' ? 'bold' : 'normal');
      doc.text(ligne.valeurA, cols[1], y);
      doc.setFont('helvetica', ligne.meilleur === 'B' ? 'bold' : 'normal');
      doc.text(ligne.valeurB, cols[2], y);
      y += 6;
    }

    y += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    const recommande = data.recommande === 'A' ? nomA : nomB;
    doc.text(`Recommande : ${recommande}`, 14, y);
    y += 5;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(data.justification, 14, y);

    doc.save(`comparaison_${nomA.replace(/\s/g, '_')}_vs_${nomB.replace(/\s/g, '_')}.pdf`);
  };

  const nomA = nomCandidat(candidatA);
  const nomB = nomCandidat(candidatB);

  return (
    <div ref={trapRef} role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Comparaison candidats</h2>
              <p className="text-xs text-slate-500">{nomA} vs {nomB}</p>
            </div>
          </div>
          <button onClick={onClose} aria-label="Fermer" className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : data ? (
          <div className="p-6 space-y-6">
            {/* Tableau comparatif */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 text-xs font-black text-slate-500 uppercase tracking-wider">Critere</th>
                    <th className="text-center px-4 py-3 text-xs font-black text-emerald-700 uppercase tracking-wider">{nomA}</th>
                    <th className="text-center px-4 py-3 text-xs font-black text-blue-700 uppercase tracking-wider">{nomB}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.lignes.map((ligne: LigneComparaison) => (
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

            {/* Verdict */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-emerald-600" />
                <p className="text-sm font-black text-emerald-900">
                  Recommande : {data.recommande === 'A' ? nomA : nomB}
                </p>
              </div>
              <p className="text-xs text-emerald-700">{data.justification}</p>
            </div>

            {/* Export */}
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Exporter la comparaison PDF
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
