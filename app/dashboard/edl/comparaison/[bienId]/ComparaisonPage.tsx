'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { compareEDL, getEdlPairForBien, type ResultatComparaison } from '@/app/actions/comparaison-edl';
import { getDonneesLettreRetenue } from '@/app/actions/lettre-retenue';
import ComparaisonEDL from '@/components/ComparaisonEDL';

interface Props {
  bienId: string;
}

export default function ComparaisonPage({ bienId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resultat, setResultat] = useState<ResultatComparaison | null>(null);
  const [bailleurNom, setBailleurNom] = useState('');
  const [bailleurAdresse, setBailleurAdresse] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const pair = await getEdlPairForBien(bienId);

        if (!pair.entree || !pair.sortie) {
          setError(
            !pair.entree && !pair.sortie
              ? "Aucun état des lieux trouvé pour ce bien."
              : !pair.entree
              ? "Aucun EDL d'entrée trouvé. Créez d'abord un EDL d'entrée."
              : "Aucun EDL de sortie trouvé. Créez d'abord un EDL de sortie."
          );
          return;
        }

        const [result, lettreData] = await Promise.all([
          compareEDL(pair.entree.id, pair.sortie.id),
          getDonneesLettreRetenue(bienId),
        ]);

        if ('error' in result) {
          setError(result.error);
          return;
        }

        setResultat(result);

        if (!('error' in lettreData)) {
          setBailleurNom(lettreData.bailleurNom);
          setBailleurAdresse(lettreData.bailleurAdresse);
        }
      } catch {
        setError("Erreur lors du chargement de la comparaison.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [bienId]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
          <p className="text-sm font-bold text-amber-700">{error}</p>
          <button
            onClick={() => router.push(`/dashboard/edl/nouveau?bienId=${bienId}`)}
            className="mt-4 px-4 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-colors"
          >
            Créer un EDL
          </button>
        </div>
      </div>
    );
  }

  if (!resultat) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour
      </button>

      <h1 className="text-2xl font-black text-slate-900 mb-6">
        Comparaison EDL
      </h1>

      <ComparaisonEDL
        resultat={resultat}
        bailleurNom={bailleurNom}
        bailleurAdresse={bailleurAdresse}
      />
    </div>
  );
}
