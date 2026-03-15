'use client';

import { useState } from 'react';
import { CheckCircle2, Circle, AlertCircle, Download, Info } from 'lucide-react';

interface Annexe {
  id: string;
  label: string;
  obligatoire: boolean;
  condition?: string;
}

const ANNEXES_OBLIGATOIRES: Annexe[] = [
  { id: 'notice', label: 'Notice d\'information (arr. 29/05/2015)', obligatoire: true },
  { id: 'ddt', label: 'Diagnostic de performance énergétique (DPE)', obligatoire: true },
  { id: 'ernmt', label: 'État des risques naturels et miniers (ERNMT/ERP)', obligatoire: true },
  { id: 'constat_plomb', label: 'Constat de risque d\'exposition au plomb (CREP)', obligatoire: false, condition: 'avant 1949' },
  { id: 'amiante', label: 'Dossier amiante parties privatives', obligatoire: false, condition: 'avant 1997' },
  { id: 'etat_lieux', label: 'État des lieux d\'entrée', obligatoire: true },
  { id: 'reglement_copro', label: 'Règlement de copropriété (si applicable)', obligatoire: false, condition: 'copropriété' },
  { id: 'diagnostic_elec', label: 'Diagnostic électricité (+ 15 ans)', obligatoire: false, condition: 'avant 2009' },
  { id: 'diagnostic_gaz', label: 'Diagnostic gaz (+ 15 ans)', obligatoire: false, condition: 'avant 2009' },
  { id: 'surface_loi_carrez', label: 'Surface Loi Carrez (copropriété)', obligatoire: false },
];

interface Props {
  onClose?: () => void;
}

export default function ChecklistAlur({ onClose }: Props) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [avant1949, setAvant1949] = useState(false);
  const [avant1997, setAvant1997] = useState(false);
  const [avant2009, setAvant2009] = useState(false);
  const [copropriete, setCopropriete] = useState(false);

  // Filtrer les annexes à afficher selon les toggles
  const annexesFiltrees = ANNEXES_OBLIGATOIRES.filter((a) => {
    if (!a.condition) return true;
    if (a.condition === 'avant 1949') return avant1949;
    if (a.condition === 'avant 1997') return avant1997;
    if (a.condition === 'avant 2009') return avant2009;
    if (a.condition === 'copropriété') return copropriete;
    return true;
  });

  const obligatoiresFiltrees = annexesFiltrees.filter((a) => a.obligatoire);
  const obligatoiresManquantes = obligatoiresFiltrees.filter((a) => !checked[a.id]);
  const totalChecked = annexesFiltrees.filter((a) => checked[a.id]).length;
  const total = annexesFiltrees.length;
  const progression = total > 0 ? Math.round((totalChecked / total) * 100) : 0;

  const toggleCheck = (id: string) => {
    setChecked((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleTelechargerPDF = () => {
    const { jsPDF } = require('jspdf') as { jsPDF: typeof import('jspdf').default };
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const today = new Date();
    const dateStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Checklist de conformité ALUR', 20, 25);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Générée le ${dateStr}`, 20, 33);
    doc.text(`Progression : ${totalChecked}/${total} annexes (${progression}%)`, 20, 40);

    if (obligatoiresManquantes.length > 0) {
      doc.setTextColor(220, 38, 38);
      doc.text(`⚠ ${obligatoiresManquantes.length} annexe(s) obligatoire(s) manquante(s)`, 20, 47);
      doc.setTextColor(0, 0, 0);
    }

    let y = 58;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Annexes', 20, y);
    y += 8;

    for (const annexe of annexesFiltrees) {
      if (y > 270) { doc.addPage(); y = 20; }
      const isChecked = !!checked[annexe.id];
      const symbol = isChecked ? '☑' : '☐';
      const status = isChecked ? ' ✓' : (annexe.obligatoire ? ' ← OBLIGATOIRE' : '');
      doc.setFont('helvetica', annexe.obligatoire ? 'bold' : 'normal');
      doc.setFontSize(10);
      if (!isChecked && annexe.obligatoire) {
        doc.setTextColor(220, 38, 38);
      } else if (isChecked) {
        doc.setTextColor(16, 185, 129);
      } else {
        doc.setTextColor(100, 100, 100);
      }
      const ligne = `${symbol} ${annexe.label}${status}`;
      const wrapped = doc.splitTextToSize(ligne, 170);
      doc.text(wrapped, 20, y);
      y += wrapped.length * 6 + 2;
      doc.setTextColor(0, 0, 0);
    }

    doc.save(`checklist_alur_${dateStr.replace(/\//g, '-')}.pdf`);
  };

  return (
    <div className="space-y-5">
      {/* Toggles contexte */}
      <div className="p-4 bg-slate-50 rounded-2xl space-y-3">
        <p className="text-xs font-black text-slate-700 mb-2">🏠 Caractéristiques du bien</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Avant 1949', value: avant1949, setter: setAvant1949 },
            { label: 'Avant 1997', value: avant1997, setter: setAvant1997 },
            { label: 'Avant 2009', value: avant2009, setter: setAvant2009 },
            { label: 'Copropriété', value: copropriete, setter: setCopropriete },
          ].map(({ label, value, setter }) => (
            <label key={label} className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => setter((v) => !v)}
                className={`w-9 h-5 rounded-full transition-colors flex items-center ${value ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform mx-0.5 ${value ? 'translate-x-4' : ''}`} />
              </div>
              <span className="text-xs font-semibold text-slate-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Progression */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black text-slate-700">Progression</span>
          <span className="text-xs font-bold text-slate-500">{totalChecked}/{total} annexes</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${progression === 100 ? 'bg-emerald-500' : 'bg-emerald-400'}`}
            style={{ width: `${progression}%` }}
          />
        </div>
        {obligatoiresManquantes.length > 0 && (
          <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span className="text-xs font-bold text-red-600">
              {obligatoiresManquantes.length} annexe{obligatoiresManquantes.length > 1 ? 's' : ''} obligatoire{obligatoiresManquantes.length > 1 ? 's' : ''} manquante{obligatoiresManquantes.length > 1 ? 's' : ''}
            </span>
          </div>
        )}
        {progression === 100 && (
          <div className="flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="text-xs font-bold text-emerald-600">Toutes les annexes sont complètes !</span>
          </div>
        )}
      </div>

      {/* Checklist */}
      <div className="space-y-2">
        {annexesFiltrees.map((annexe) => {
          const isChecked = !!checked[annexe.id];
          return (
            <label
              key={annexe.id}
              className={`flex items-start gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                isChecked
                  ? 'bg-emerald-50 border border-emerald-200'
                  : annexe.obligatoire
                  ? 'bg-white border border-slate-200 hover:border-slate-300'
                  : 'bg-slate-50 border border-transparent hover:border-slate-200'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggleCheck(annexe.id)}
                  className="sr-only"
                />
                {isChecked ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : (
                  <Circle className={`w-5 h-5 ${annexe.obligatoire ? 'text-slate-400' : 'text-slate-300'}`} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${isChecked ? 'text-emerald-800 line-through' : 'text-slate-800'}`}>
                  {annexe.label}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  {annexe.obligatoire && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-red-100 text-red-600 rounded-full">obligatoire</span>
                  )}
                  {annexe.condition && (
                    <span className="text-[10px] text-slate-400 font-medium">{annexe.condition}</span>
                  )}
                </div>
              </div>
            </label>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={handleTelechargerPDF}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold transition-colors"
        >
          <Download className="w-4 h-4" />
          Télécharger la liste (PDF)
        </button>
      </div>

      <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
        <Info className="w-4 h-4 mt-0.5 shrink-0" />
        <span>Conforme à la loi ALUR (2014) et à la loi du 6 juillet 1989. Liste non exhaustive selon les spécificités du bien.</span>
      </div>
    </div>
  );
}
