'use client';

import { useState } from 'react';
import { X, FileSignature, Loader2 } from 'lucide-react';
import type { Bien } from '@/lib/db-local';

interface Props {
  biens: Bien[];
  onClose: () => void;
  onCreated: () => void;
}

export default function CreerBailActifModal({ biens, onClose, onCreated }: Props) {
  const [form, setForm] = useState({
    bienId: biens[0]?.id || '',
    locataireNom: '',
    locataireEmail: '',
    dateSignature: new Date().toISOString().split('T')[0],
    dateDebut: new Date().toISOString().split('T')[0],
    dateFin: '',
    dureePreavisMois: '3',
    loyerMensuel: '',
    chargesMensuelles: '0',
    indiceRevision: 'IRL',
    dateProchRevision: '',
    dateFinDiagnostics: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === 'dateDebut' && !form.dateProchRevision) {
      const d = new Date(value);
      d.setFullYear(d.getFullYear() + 1);
      setForm((prev) => ({ ...prev, [field]: value, dateProchRevision: d.toISOString().split('T')[0] }));
    }
  };

  const handleSave = async () => {
    if (!form.bienId || !form.locataireNom || !form.locataireEmail || !form.loyerMensuel || !form.dateProchRevision) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/bails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de la création');
      }
      onCreated();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <FileSignature className="w-5 h-5 text-emerald-600" />
            Enregistrer un bail
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Bien *</label>
            <select
              value={form.bienId}
              onChange={(e) => handleChange('bienId', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              {biens.map((b) => (
                <option key={b.id} value={b.id}>{b.adresse}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Nom locataire *</label>
              <input
                type="text"
                value={form.locataireNom}
                onChange={(e) => handleChange('locataireNom', e.target.value)}
                placeholder="Jean Dupont"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Email locataire *</label>
              <input
                type="email"
                value={form.locataireEmail}
                onChange={(e) => handleChange('locataireEmail', e.target.value)}
                placeholder="locataire@email.fr"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Date de signature</label>
              <input
                type="date"
                value={form.dateSignature}
                onChange={(e) => handleChange('dateSignature', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Date de début *</label>
              <input
                type="date"
                value={form.dateDebut}
                onChange={(e) => handleChange('dateDebut', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Date de fin</label>
              <input
                type="date"
                value={form.dateFin}
                onChange={(e) => handleChange('dateFin', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">Vide = bail sans terme fixe</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Préavis (mois)</label>
              <input
                type="number"
                value={form.dureePreavisMois}
                onChange={(e) => handleChange('dureePreavisMois', e.target.value)}
                min="1"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Loyer mensuel (€) *</label>
              <input
                type="number"
                value={form.loyerMensuel}
                onChange={(e) => handleChange('loyerMensuel', e.target.value)}
                placeholder="800"
                step="0.01"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Charges (€)</label>
              <input
                type="number"
                value={form.chargesMensuelles}
                onChange={(e) => handleChange('chargesMensuelles', e.target.value)}
                placeholder="50"
                step="0.01"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Indice de révision</label>
              <select
                value={form.indiceRevision}
                onChange={(e) => handleChange('indiceRevision', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                <option value="IRL">IRL</option>
                <option value="ILC">ILC</option>
                <option value="ILAT">ILAT</option>
                <option value="ICC">ICC</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1">Prochaine révision *</label>
              <input
                type="date"
                value={form.dateProchRevision}
                onChange={(e) => handleChange('dateProchRevision', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Fin diagnostics (DPE, etc.)</label>
            <input
              type="date"
              value={form.dateFinDiagnostics}
              onChange={(e) => handleChange('dateFinDiagnostics', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
        </div>

        {error && (
          <div className="mt-3 bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg font-medium">{error}</div>
        )}

        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl text-sm hover:bg-emerald-700 disabled:opacity-40"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Créer le bail
          </button>
        </div>
      </div>
    </div>
  );
}
