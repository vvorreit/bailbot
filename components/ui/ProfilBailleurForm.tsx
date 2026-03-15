'use client';

import { useState, useEffect } from 'react';
import { Save, Loader2, CheckCircle2 } from 'lucide-react';
import {
  getProfilBailleur,
  saveProfilBailleur,
  type ProfilBailleur,
} from '@/app/actions/profil-bailleur';

const EMPTY: ProfilBailleur = {
  nom: '',
  prenom: '',
  adresse: '',
  codePostal: '',
  ville: '',
  telephone: '',
  email: '',
  siret: '',
  iban: '',
};

export default function ProfilBailleurForm() {
  const [form, setForm] = useState<ProfilBailleur>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getProfilBailleur()
      .then((data) => {
        if (data) setForm(data);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    const result = await saveProfilBailleur(form);
    setSaving(false);
    if (result.ok) {
      setSaved(true);
      // Sync to localStorage for immediate pre-fill in modals
      try {
        const existing = JSON.parse(localStorage.getItem('bailbot_infos_bailleur') || '{}');
        localStorage.setItem('bailbot_infos_bailleur', JSON.stringify({
          ...existing,
          nomBailleur: [form.prenom, form.nom].filter(Boolean).join(' '),
          adresseBailleur: [form.adresse, form.codePostal, form.ville].filter(Boolean).join(', '),
          ibanBailleur: form.iban || existing.ibanBailleur || '',
          villeSignature: form.ville || existing.villeSignature || '',
        }));
      } catch {}
      setTimeout(() => setSaved(false), 3000);
    } else {
      setError(result.error || 'Erreur lors de la sauvegarde');
    }
  };

  const update = (field: keyof ProfilBailleur, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const inputClass = 'w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Prénom</label>
          <input type="text" value={form.prenom} onChange={(e) => update('prenom', e.target.value)} className={inputClass} placeholder="Jean" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Nom</label>
          <input type="text" value={form.nom} onChange={(e) => update('nom', e.target.value)} className={inputClass} placeholder="Dupont" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-600 mb-1">Adresse</label>
        <input type="text" value={form.adresse} onChange={(e) => update('adresse', e.target.value)} className={inputClass} placeholder="12 rue de la Paix" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Code postal</label>
          <input type="text" value={form.codePostal} onChange={(e) => update('codePostal', e.target.value)} className={inputClass} placeholder="75001" maxLength={5} />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Ville</label>
          <input type="text" value={form.ville} onChange={(e) => update('ville', e.target.value)} className={inputClass} placeholder="Paris" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Téléphone</label>
          <input type="tel" value={form.telephone} onChange={(e) => update('telephone', e.target.value)} className={inputClass} placeholder="06 12 34 56 78" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-600 mb-1">Email</label>
          <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} className={inputClass} placeholder="contact@exemple.fr" />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-600 mb-1">IBAN (pour virement)</label>
        <input type="text" value={form.iban || ''} onChange={(e) => update('iban', e.target.value)} className={inputClass} placeholder="FR76 3000 6000 0112 3456 7890 189" />
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-600 mb-1">SIRET (optionnel)</label>
        <input type="text" value={form.siret || ''} onChange={(e) => update('siret', e.target.value)} className={inputClass} placeholder="123 456 789 00012" />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600 font-semibold">
          {error}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-colors ${
          saved
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-emerald-600 text-white hover:bg-emerald-700'
        } disabled:opacity-60`}
      >
        {saving ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : saved ? (
          <CheckCircle2 className="w-4 h-4" />
        ) : (
          <Save className="w-4 h-4" />
        )}
        {saving ? 'Sauvegarde...' : saved ? 'Profil sauvegardé' : 'Sauvegarder le profil bailleur'}
      </button>

      <p className="text-xs text-slate-400">
        Ces informations seront utilisées pour pré-remplir automatiquement vos baux, quittances et courriers de révision.
      </p>
    </div>
  );
}
