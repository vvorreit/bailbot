'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, RefreshCw, Loader2, AlertCircle, BarChart3 } from 'lucide-react';
import { getLoyerMarcheForBien, refreshLoyerMarche } from '@/app/actions/loyer-marche';
import type { LoyerMarcheResult } from '@/lib/dvf-api';

interface Props {
  bienId: string;
  loyerActuel: number;
  surface: number | null;
}

type Ecart = 'vert' | 'orange' | 'rouge';

function getEcart(loyerActuelM2: number, q1: number, q3: number): { ecart: Ecart; pct: number } {
  const mediane = (q1 + q3) / 2;
  const pct = mediane > 0 ? Math.round(((loyerActuelM2 - mediane) / mediane) * 100) : 0;

  if (loyerActuelM2 >= q1 && loyerActuelM2 <= q3) return { ecart: 'vert', pct };
  if (Math.abs(pct) <= 15) return { ecart: 'orange', pct };
  return { ecart: 'rouge', pct };
}

const ECART_STYLES: Record<Ecart, { bg: string; text: string; border: string; label: string }> = {
  vert: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    label: 'Dans la fourchette du marché',
  },
  orange: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    label: 'Légèrement hors fourchette',
  },
  rouge: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
    label: 'Significativement hors marché',
  },
};

export default function LoyerMarcheWidget({ bienId, loyerActuel, surface }: Props) {
  const [data, setData] = useState<LoyerMarcheResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!surface || surface < 5) {
      setError('Surface non renseignée');
      setLoading(false);
      return;
    }
    getLoyerMarcheForBien(bienId)
      .then(setData)
      .catch(() => setError('Impossible de charger les données'))
      .finally(() => setLoading(false));
  }, [bienId, surface]);

  async function handleRefresh() {
    setRefreshing(true);
    setError(null);
    try {
      const result = await refreshLoyerMarche(bienId);
      setData(result);
      if (!result) setError('Pas assez de transactions à proximité');
    } catch {
      setError('Erreur lors de l\'actualisation');
    } finally {
      setRefreshing(false);
    }
  }

  /* Skeleton */
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-4 h-4 bg-slate-200 rounded animate-pulse" />
          <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="space-y-3">
          <div className="h-8 bg-slate-100 rounded-xl animate-pulse" />
          <div className="h-16 bg-slate-100 rounded-xl animate-pulse" />
          <div className="h-4 w-48 bg-slate-100 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  /* Erreur ou pas de données */
  if (error || !data) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-blue-600" />
          Loyer de marché
        </h2>
        <div className="flex items-start gap-2 text-sm text-slate-500">
          <AlertCircle className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
          <div>
            <p>{error || 'Pas assez de transactions à proximité pour estimer le loyer de marché.'}</p>
            {surface && surface >= 5 && (
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors"
              >
                {refreshing ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <RefreshCw className="w-3 h-3" />
                )}
                Réessayer
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* Données disponibles */
  const loyerActuelM2 = surface && surface > 0 ? loyerActuel / surface : 0;
  const { ecart, pct } = getEcart(loyerActuelM2, data.loyerQ1M2, data.loyerQ3M2);
  const style = ECART_STYLES[ecart];
  const loyerEstimeTotal = Math.round(data.loyerMedianM2 * (surface ?? 0));

  /* Position de la jauge (0-100) */
  const jaugeMin = data.loyerQ1M2 * 0.7;
  const jaugeMax = data.loyerQ3M2 * 1.3;
  const jaugeRange = jaugeMax - jaugeMin;
  const positionActuel = jaugeRange > 0
    ? Math.max(0, Math.min(100, ((loyerActuelM2 - jaugeMin) / jaugeRange) * 100))
    : 50;
  const positionQ1 = jaugeRange > 0
    ? ((data.loyerQ1M2 - jaugeMin) / jaugeRange) * 100
    : 30;
  const positionQ3 = jaugeRange > 0
    ? ((data.loyerQ3M2 - jaugeMin) / jaugeRange) * 100
    : 70;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-blue-600" />
          Loyer de marché
        </h2>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          title="Actualiser"
        >
          {refreshing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Badge écart */}
      <div className={`rounded-xl px-3 py-2 mb-4 ${style.bg} border ${style.border}`}>
        <div className="flex items-center gap-2">
          <TrendingUp className={`w-4 h-4 ${style.text}`} />
          <span className={`text-xs font-bold ${style.text}`}>
            {pct === 0
              ? 'Votre loyer correspond à la médiane du marché local'
              : pct > 0
                ? `Votre loyer est ${pct}% au-dessus du marché local`
                : `Votre loyer est ${Math.abs(pct)}% en-dessous du marché local`
            }
          </span>
        </div>
      </div>

      {/* Jauge visuelle */}
      <div className="mb-4">
        <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
          {/* Zone Q1-Q3 (marché) */}
          <div
            className="absolute top-0 h-full bg-emerald-200 rounded-full"
            style={{ left: `${positionQ1}%`, width: `${positionQ3 - positionQ1}%` }}
          />
          {/* Marqueur loyer actuel */}
          <div
            className={`absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-white shadow-md ${
              ecart === 'vert' ? 'bg-emerald-600' : ecart === 'orange' ? 'bg-amber-500' : 'bg-red-500'
            }`}
            style={{ left: `${positionActuel}%`, marginLeft: '-7px' }}
          />
        </div>
        <div className="flex justify-between mt-1.5 text-[10px] text-slate-400">
          <span>Q1: {data.loyerQ1M2.toFixed(1)} €/m²</span>
          <span className="font-bold text-slate-600">Médiane: {data.loyerMedianM2.toFixed(1)} €/m²</span>
          <span>Q3: {data.loyerQ3M2.toFixed(1)} €/m²</span>
        </div>
      </div>

      {/* Comparaison chiffrée */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-slate-50 rounded-xl p-3">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Votre loyer</p>
          <p className="text-sm font-black text-slate-900">{loyerActuel.toLocaleString('fr-FR')} €</p>
          <p className="text-[10px] text-slate-400">{loyerActuelM2.toFixed(1)} €/m²</p>
        </div>
        <div className="bg-blue-50 rounded-xl p-3">
          <p className="text-[10px] font-bold text-blue-400 uppercase">Estimation marché</p>
          <p className="text-sm font-black text-blue-700">{loyerEstimeTotal.toLocaleString('fr-FR')} €</p>
          <p className="text-[10px] text-blue-400">{data.loyerMedianM2.toFixed(1)} €/m²</p>
        </div>
      </div>

      {/* Métadonnées */}
      <div className="text-[10px] text-slate-400 space-y-0.5">
        <p>{data.nbTransactions} transaction{data.nbTransactions > 1 ? 's' : ''} analysée{data.nbTransactions > 1 ? 's' : ''}</p>
        <p>Source : {data.source}</p>
        <p>Prix médian vente : {data.prixMedianVenteM2.toLocaleString('fr-FR')} €/m² (rendement {(data.tauxRendement * 100).toFixed(1)}%)</p>
      </div>
    </div>
  );
}

/* ─── Indicateur compact pour la liste des biens ─────────────────────────── */

export function LoyerMarcheIndicateur({ bienId, loyerActuel, surface }: Props) {
  const [data, setData] = useState<LoyerMarcheResult | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!surface || surface < 5) {
      setLoaded(true);
      return;
    }
    getLoyerMarcheForBien(bienId)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [bienId, surface]);

  if (!loaded || !data || !surface || surface < 5) return null;

  const loyerActuelM2 = loyerActuel / surface;
  const { ecart, pct } = getEcart(loyerActuelM2, data.loyerQ1M2, data.loyerQ3M2);

  const colors: Record<Ecart, string> = {
    vert: 'text-emerald-600',
    orange: 'text-amber-600',
    rouge: 'text-red-600',
  };

  const icons: Record<Ecart, string> = {
    vert: '●',
    orange: '▲',
    rouge: '▲',
  };

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold ${colors[ecart]}`} title={`Loyer vs marché: ${pct > 0 ? '+' : ''}${pct}%`}>
      <BarChart3 className="w-3 h-3" />
      {pct > 0 ? '+' : ''}{pct}%
    </span>
  );
}
