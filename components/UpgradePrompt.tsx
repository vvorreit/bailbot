'use client'

import { Lock } from 'lucide-react'
import type { Feature } from '@/lib/features'
import { FEATURES } from '@/lib/features'

const METIER_FR: Record<string, string> = {
  PROPRIETAIRE: 'Propriétaires',
  AGENCE: 'Agences',
  GESTIONNAIRE: 'Gestionnaires professionnels',
}

interface Props {
  feature: Feature
  className?: string
}

export function UpgradePrompt({ feature, className = '' }: Props) {
  const metiers = FEATURES[feature] as readonly string[]
  const labels = metiers.map((m) => METIER_FR[m]).filter(Boolean)
  const metierList = labels.length > 1
    ? labels.slice(0, -1).join(', ') + ' et ' + labels[labels.length - 1]
    : labels[0] ?? ''

  return (
    <div className={`flex flex-col items-center justify-center gap-3 p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center ${className}`}>
      <div className="w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center">
        <Lock className="w-5 h-5 text-slate-500" />
      </div>
      <div>
        <p className="text-sm font-bold text-slate-800">Fonctionnalité non disponible</p>
        <p className="text-xs text-slate-500 mt-1">
          Cette fonctionnalité est disponible pour les{' '}
          <span className="font-semibold text-slate-700">{metierList}</span>.
        </p>
      </div>
      <a
        href="/pricing"
        className="text-xs font-bold text-emerald-600 hover:text-emerald-700 underline underline-offset-2 transition-colors"
      >
        En savoir plus →
      </a>
    </div>
  )
}
