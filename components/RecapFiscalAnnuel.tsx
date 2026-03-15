'use client';

import { useState } from 'react';
import { Edit2, Check, X, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react';
import {
  type RecapFiscal,
  type RecapBien,
  type ConfigFiscalBien,
  type RegimeFiscal,
  REGIME_LABELS,
  estRegimeMicro,
} from '@/lib/recapitulatif-fiscal';

function euros(n: number) {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' €';
}

function CellEdit({
  label,
  value,
  onSave,
}: {
  label: string;
  value: number;
  onSave: (v: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  const handleSave = () => {
    const parsed = parseFloat(draft.replace(',', '.'));
    if (!isNaN(parsed) && parsed >= 0) onSave(parsed);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          type="number"
          min="0"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false); }}
          className="w-24 border border-emerald-400 rounded-lg px-2 py-1 text-xs focus:outline-none text-right"
          autoFocus
        />
        <button onClick={handleSave} className="p-1 text-emerald-600 hover:text-emerald-800">
          <Check className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => setEditing(false)} className="p-1 text-slate-400 hover:text-slate-600">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => { setDraft(String(value)); setEditing(true); }}
      className="flex items-center gap-1 text-slate-700 hover:text-emerald-700 group"
      title={`Modifier ${label}`}
    >
      <span>{euros(value)}</span>
      <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
    </button>
  );
}

function RegimeSelect({
  value,
  onChange,
}: {
  value: RegimeFiscal;
  onChange: (r: RegimeFiscal) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as RegimeFiscal)}
      className="text-xs bg-transparent border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:border-emerald-400 text-slate-600 font-semibold"
    >
      {(Object.keys(REGIME_LABELS) as RegimeFiscal[]).map((r) => (
        <option key={r} value={r}>
          {REGIME_LABELS[r]}
        </option>
      ))}
    </select>
  );
}

export default function RecapFiscalAnnuel({
  recap,
  onConfigChange,
}: {
  recap: RecapFiscal;
  onConfigChange: (bienId: string, config: ConfigFiscalBien) => void;
}) {
  if (recap.biens.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
        <TrendingUp className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-400 font-semibold">Aucun bien enregistré</p>
        <p className="text-xs text-slate-400 mt-1">
          Ajoutez vos biens dans le suivi des loyers pour générer le récapitulatif fiscal.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="text-left px-5 py-3 text-xs font-black text-slate-500 uppercase tracking-wider min-w-[200px]">
                Bien
              </th>
              <th className="px-4 py-3 text-right text-xs font-black text-slate-500 uppercase tracking-wider min-w-[120px]">
                Loyers attendus
              </th>
              <th className="px-4 py-3 text-right text-xs font-black text-emerald-600 uppercase tracking-wider min-w-[120px]">
                Encaissés
              </th>
              <th className="px-4 py-3 text-right text-xs font-black text-red-500 uppercase tracking-wider min-w-[110px]">
                Manquants
              </th>
              <th className="px-4 py-3 text-right text-xs font-black text-slate-500 uppercase tracking-wider min-w-[130px]">
                Charges <span className="normal-case font-normal">(cliquer pour éditer)</span>
              </th>
              <th className="px-4 py-3 text-right text-xs font-black text-slate-500 uppercase tracking-wider min-w-[100px]">
                Abattement
              </th>
              <th className="px-4 py-3 text-center text-xs font-black text-slate-500 uppercase tracking-wider min-w-[160px]">
                Régime fiscal
              </th>
              <th className="px-4 py-3 text-right text-xs font-black text-slate-700 uppercase tracking-wider min-w-[130px]">
                Base imposable
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {recap.biens.map((b: RecapBien) => (
              <tr key={b.bien.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-5 py-3.5">
                  <p className="font-bold text-slate-800 max-w-[200px] truncate" title={b.bien.adresse}>
                    {b.bien.adresse}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {b.bien.typeBail === 'HABITATION_MEUBLE' ? 'Meublé' :
                      b.bien.typeBail === 'PROFESSIONNEL' ? 'Professionnel' : 'Vide'}
                    {' · '}
                    {(b.bien.loyer + b.bien.charges).toLocaleString('fr-FR')} €/mois
                  </p>
                </td>
                <td className="px-4 py-3.5 text-right font-mono text-slate-600">
                  {euros(b.loyersAttendus)}
                </td>
                <td className="px-4 py-3.5 text-right font-mono font-bold text-emerald-700">
                  {euros(b.loyersEncaisses)}
                </td>
                <td className="px-4 py-3.5 text-right">
                  {b.loyersManquants > 0 ? (
                    <span className="flex items-center justify-end gap-1 text-red-600 font-bold font-mono">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {euros(b.loyersManquants)}
                    </span>
                  ) : (
                    <span className="text-slate-300 font-mono">—</span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-right">
                  {estRegimeMicro(b.config.regime) ? (
                    <span className="text-slate-300 font-mono text-xs" title="Non utilisé en régime micro (abattement forfaitaire)">
                      {b.chargesDeductibles > 0 ? euros(b.chargesDeductibles) : '—'}
                    </span>
                  ) : (
                    <CellEdit
                      label="charges annuelles"
                      value={b.chargesDeductibles}
                      onSave={(v) =>
                        onConfigChange(b.bien.id, { ...b.config, chargesAnnuelles: v })
                      }
                    />
                  )}
                </td>
                <td className="px-4 py-3.5 text-right font-mono text-slate-500">
                  {b.abattementMontant > 0 ? (
                    <span title={`Abattement forfaitaire ${b.config.regime === 'MICRO_FONCIER' ? '30%' : '50%'}`}>
                      −{euros(b.abattementMontant)}
                    </span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-center">
                  <RegimeSelect
                    value={b.config.regime}
                    onChange={(r) => onConfigChange(b.bien.id, { ...b.config, regime: r })}
                  />
                  <span className="block text-[10px] text-slate-400 mt-0.5">
                    {b.formulaire}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-right">
                  <span
                    className={`font-bold font-mono ${
                      b.baseImposable < 0
                        ? 'text-red-600'
                        : b.baseImposable === 0
                        ? 'text-slate-400'
                        : 'text-slate-900'
                    }`}
                  >
                    {euros(b.baseImposable)}
                  </span>
                  {b.baseImposable < 0 && (
                    <span className="block text-[10px] text-red-500">déficit foncier</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-900 text-white">
              <td className="px-5 py-3 font-black text-sm">TOTAL {recap.annee}</td>
              <td className="px-4 py-3 text-right font-mono font-bold text-slate-300">
                {euros(recap.totalAttendus)}
              </td>
              <td className="px-4 py-3 text-right font-mono font-bold text-emerald-400">
                {euros(recap.totalEncaisses)}
              </td>
              <td className="px-4 py-3 text-right font-mono font-bold text-red-400">
                {recap.totalManquants > 0 ? euros(recap.totalManquants) : '—'}
              </td>
              <td className="px-4 py-3 text-right font-mono font-bold text-slate-300">
                {euros(recap.totalCharges)}
              </td>
              <td className="px-4 py-3 text-right font-mono font-bold text-slate-300">
                {recap.totalAbattement > 0 ? euros(recap.totalAbattement) : '—'}
              </td>
              <td className="px-4 py-3" />
              <td className="px-4 py-3 text-right font-mono font-black text-white text-base">
                {euros(recap.totalBaseImposable)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Note régimes */}
      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100">
        <p className="text-[11px] text-slate-400">
          <strong>Micro-foncier</strong> : 30% d'abattement forfaitaire — revenus &lt; 15 000 €/an.
          {' '}
          <strong>Réel foncier</strong> : déduction des charges réelles saisies.
          {' '}
          <strong>Micro-BIC</strong> : 50% d'abattement (meublé).
          {' '}
          <strong>LMNP</strong> : déduction des charges + amortissement (à compléter avec votre comptable).
          {' '}
          Les charges déductibles sont saisies manuellement et sauvegardées localement.
        </p>
      </div>
    </div>
  );
}
