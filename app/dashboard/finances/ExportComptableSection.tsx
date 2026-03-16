'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react';
import { exportFEC, exportCSV } from '@/app/actions/export-comptable';

const currentYear = new Date().getFullYear();
const YEARS = [currentYear, currentYear - 1, currentYear - 2];

function downloadFile(content: string, filename: string, mimeType: string) {
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExportComptableSection() {
  const [annee, setAnnee] = useState(currentYear);
  const [loadingFEC, setLoadingFEC] = useState(false);
  const [loadingCSV, setLoadingCSV] = useState(false);
  const [error, setError] = useState('');

  const handleFEC = async () => {
    setError('');
    setLoadingFEC(true);
    try {
      const content = await exportFEC(annee);
      downloadFile(content, `BailBot_FEC_${annee}.txt`, 'text/plain');
    } catch (e: any) {
      setError(e.message || 'Erreur lors de l\'export FEC');
    } finally {
      setLoadingFEC(false);
    }
  };

  const handleCSV = async () => {
    setError('');
    setLoadingCSV(true);
    try {
      const content = await exportCSV(annee);
      downloadFile(content, `BailBot_Export_${annee}.csv`, 'text/csv');
    } catch (e: any) {
      setError(e.message || 'Erreur lors de l\'export CSV');
    } finally {
      setLoadingCSV(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center">
          <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-base font-black text-slate-900">Export comptable</h3>
          <p className="text-xs text-slate-500">Format FEC conforme art. L47 A LPF — Compatible expert-comptable, Pennylane, QuickBooks</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-500 mb-1">Année</label>
          <select
            value={annee}
            onChange={(e) => setAnnee(Number(e.target.value))}
            className="border border-slate-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2 mt-auto">
          <button
            onClick={handleFEC}
            disabled={loadingFEC}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
          >
            {loadingFEC ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Télécharger FEC
          </button>
          <button
            onClick={handleCSV}
            disabled={loadingCSV}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-colors disabled:opacity-50"
          >
            {loadingCSV ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Télécharger CSV
          </button>
        </div>
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-600 font-medium">{error}</p>
      )}
    </div>
  );
}
