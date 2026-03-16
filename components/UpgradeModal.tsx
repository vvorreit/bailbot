'use client'

import { useState } from 'react'
import { X, CheckCircle, Lock } from 'lucide-react'
import { createCheckoutSession } from '@/app/dashboard/actions'

interface Props {
  feature: string
  onClose: () => void
}

const GRATUIT_FEATURES = [
  '1 bien',
  'Analyse OCR + BailScore',
  'Calcul rendement',
  '1 quittance (1er mois)',
]

const ESSENTIEL_FEATURES = [
  '3 biens max',
  'Bail ALUR complet',
  'Quittances automatiques',
  'Portail locataire',
  'IRL automatique',
  'Diagnostics + alertes',
]

export default function UpgradeModal({ feature, onClose }: Props) {
  const [loading, setLoading] = useState(false)

  const handleCheckout = async () => {
    setLoading(true)
    try {
      const { url } = await createCheckoutSession('ESSENTIEL')
      if (url) window.location.href = url
    } catch (err: any) {
      alert(err?.message || 'Erreur lors du paiement.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center">
              <Lock className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="text-base font-black text-slate-900">
              Fonctionnalité Essentiel
            </h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5">
          <p className="text-sm text-slate-600 font-medium">
            <span className="font-black text-slate-900">{feature}</span> est disponible avec le plan Essentiel.
          </p>

          {/* Comparison */}
          <div className="grid grid-cols-2 gap-3">
            {/* Gratuit */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Gratuit</p>
              <ul className="space-y-2">
                {GRATUIT_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-slate-500 font-medium">
                    <CheckCircle className="w-3.5 h-3.5 text-slate-300 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>

            {/* Essentiel */}
            <div className="bg-emerald-50 rounded-xl p-4 border-2 border-emerald-200">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-3">Essentiel</p>
              <ul className="space-y-2">
                {ESSENTIEL_FEATURES.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-emerald-700 font-bold">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl text-sm uppercase tracking-widest hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-lg shadow-emerald-200"
          >
            {loading ? 'Chargement...' : 'Passer \u00e0 Essentiel \u2014 9,90\u20ac/mois'}
          </button>

          <a
            href="#tarifs"
            onClick={onClose}
            className="block text-center text-xs font-bold text-emerald-600 hover:text-emerald-700 underline underline-offset-2"
          >
            En savoir plus sur nos offres
          </a>
        </div>
      </div>
    </div>
  )
}
