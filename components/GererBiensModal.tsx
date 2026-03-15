'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { listerBiens, creerBien, supprimerBien, type Bien, type TypeBail } from '@/lib/db-local';

interface Props {
  onClose: () => void;
  onChanged: () => void;
}

export default function GererBiensModal({ onClose, onChanged }: Props) {
  const [biens, setBiens] = useState<Bien[]>([]);
  const [adresse, setAdresse] = useState('');
  const [loyer, setLoyer] = useState('');
  const [charges, setCharges] = useState('');
  const [typeBail, setTypeBail] = useState<TypeBail>('HABITATION_VIDE');
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const charger = async () => setBiens(await listerBiens());

  useEffect(() => { charger(); }, []);

  const handleAjouter = async () => {
    if (!adresse.trim() || !loyer) return;
    setLoading(true);
    try {
      await creerBien({
        adresse: adresse.trim(),
        loyer: parseFloat(loyer),
        charges: parseFloat(charges) || 0,
        typeBail,
      });
      setAdresse('');
      setLoyer('');
      setCharges('');
      setTypeBail('HABITATION_VIDE');
      await charger();
      onChanged();
    } finally {
      setLoading(false);
    }
  };

  const handleSupprimer = async (id: string) => {
    setLoading(true);
    try {
      await supprimerBien(id);
      setConfirmDelete(null);
      await charger();
      onChanged();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-900">🏠 Gérer les biens</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {biens.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">Aucun bien enregistré</p>
          ) : (
            <div className="space-y-2">
              {biens.map((b) => (
                <div key={b.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-800">{b.adresse}</p>
                      {b.typeBail === 'PROFESSIONNEL' && (
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-indigo-600 text-white">PRO</span>
                      )}
                      {b.typeBail === 'HABITATION_MEUBLE' && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">Meublé</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {b.loyer.toLocaleString('fr-FR')}€ HC + {b.charges.toLocaleString('fr-FR')}€ charges ={' '}
                      <strong>{(b.loyer + b.charges).toLocaleString('fr-FR')}€ CC</strong>
                    </p>
                  </div>
                  {confirmDelete === b.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-600 font-semibold">Confirmer ?</span>
                      <button
                        onClick={() => handleSupprimer(b.id)}
                        disabled={loading}
                        className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded-lg"
                      >
                        Oui
                      </button>
                      <button
                        onClick={() => setConfirmDelete(null)}
                        className="px-2 py-1 bg-slate-200 text-slate-700 text-xs font-bold rounded-lg"
                      >
                        Non
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(b.id)}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Supprimer ce bien"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-slate-100 pt-4">
            <p className="text-xs font-bold text-slate-500 mb-3">Ajouter un bien</p>
            <div className="space-y-3">
              <input
                type="text"
                value={adresse}
                onChange={(e) => setAdresse(e.target.value)}
                placeholder="Adresse complète du bien *"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
              <div>
                <label className="block text-xs text-slate-500 mb-1">Type de bail</label>
                <select
                  value={typeBail}
                  onChange={(e) => setTypeBail(e.target.value as TypeBail)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
                >
                  <option value="HABITATION_VIDE">🏠 Habitation vide</option>
                  <option value="HABITATION_MEUBLE">🛋️ Habitation meublée</option>
                  <option value="PROFESSIONNEL">💼 Professionnel</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">
                    {typeBail === 'PROFESSIONNEL' ? 'Loyer HT (€) *' : 'Loyer HC (€) *'}
                  </label>
                  <input
                    type="number"
                    value={loyer}
                    onChange={(e) => setLoyer(e.target.value)}
                    placeholder="1000"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Charges (€)</label>
                  <input
                    type="number"
                    value={charges}
                    onChange={(e) => setCharges(e.target.value)}
                    placeholder="200"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
              </div>
              <button
                onClick={handleAjouter}
                disabled={loading || !adresse.trim() || !loyer}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-sm hover:bg-emerald-700 transition-colors disabled:opacity-40"
              >
                <Plus className="w-4 h-4" />
                {loading ? 'Enregistrement…' : 'Ajouter le bien'}
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
