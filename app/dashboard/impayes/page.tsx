'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  listerPaiements,
  listerBiens,
  mettreAJourStatutsRetard,
  listerImpayes,
  type Paiement,
  type Bien,
} from '@/lib/db-local';
import { calculerEtapesDues, getProchainEtape, calculerJoursRetard } from '@/lib/relances-impaye';
import EnregistrerPaiementModal from '@/components/EnregistrerPaiementModal';
import RelanceModal from '@/components/RelanceModal';
import { CheckCircle2, AlertTriangle, XCircle, Plus, Filter, ChevronDown } from 'lucide-react';

function formatMoisLabel(mois: string): string {
  const [year, month] = mois.split('-');
  return new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });
}

function getMoisCourant(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function genererOptionsMois(n = 12): string[] {
  const result: string[] = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return result;
}

export default function ImpayesPage() {
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [biens, setBiens] = useState<Record<string, Bien>>({});
  const [moisSelectionne, setMoisSelectionne] = useState(getMoisCourant());
  const [bienFiltre, setBienFiltre] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const [showEnregistrer, setShowEnregistrer] = useState(false);
  const [relanceTarget, setRelanceTarget] = useState<Paiement | null>(null);
  const [histoTarget, setHistoTarget] = useState<Paiement | null>(null);

  const optionsMois = genererOptionsMois(12);

  const recharger = useCallback(async () => {
    setLoading(true);
    try {
      await mettreAJourStatutsRetard();
      const [allBiens, allPaiements] = await Promise.all([
        listerBiens(),
        listerPaiements(bienFiltre || undefined, moisSelectionne),
      ]);
      const biensMap: Record<string, Bien> = {};
      allBiens.forEach((b) => (biensMap[b.id] = b));
      setBiens(biensMap);
      setPaiements(allPaiements);
    } finally {
      setLoading(false);
    }
  }, [bienFiltre, moisSelectionne]);

  useEffect(() => {
    recharger();
  }, [recharger]);

  // Stats
  const nbPayes = paiements.filter((p) => p.statut === 'paye').length;
  const nbRetard = paiements.filter((p) => p.statut === 'retard').length;
  const nbImpayes = paiements.filter((p) => p.statut === 'impaye').length;
  const totalAttendu = paiements.reduce((s, p) => s + p.loyerCC, 0);
  const totalRecu = paiements
    .filter((p) => p.statut === 'paye')
    .reduce((s, p) => s + (p.montantRecu ?? p.loyerCC), 0);
  const totalManquant = totalAttendu - totalRecu;

  const handleMiseEnDemeure = async (p: Paiement) => {
    const { genererMiseEnDemeurePDF } = await import('@/lib/generateur-mise-en-demeure');
    const bienConcerne = biens[p.bienId];
    const blob = await genererMiseEnDemeurePDF(
      p,
      {
        nom: 'Le Bailleur',
        adresse: bienConcerne?.adresse ?? p.bienId,
        ville: 'Paris',
      },
      [p]
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mise-en-demeure-${p.locataireNom}-${p.mois}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleMarquerPaye = async (p: Paiement) => {
    const { mettreAJourPaiement } = await import('@/lib/db-local');
    await mettreAJourPaiement(p.id, {
      statut: 'paye',
      dateReelle: Date.now(),
    });
    recharger();
  };

  function StatutBadge({ statut, joursRetard }: { statut: Paiement['statut']; joursRetard?: number }) {
    if (statut === 'paye') return <span className="text-emerald-600 font-semibold text-xs flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />Payé</span>;
    if (statut === 'retard') return <span className="text-amber-600 font-bold text-xs flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" />J+{joursRetard} RETARD</span>;
    if (statut === 'impaye') return <span className="text-red-600 font-bold text-xs flex items-center gap-1"><XCircle className="w-3.5 h-3.5" />J+{joursRetard} IMPAYÉ</span>;
    if (statut === 'partiel') return <span className="text-orange-500 font-bold text-xs">Partiel</span>;
    return <span className="text-slate-400 text-xs">Attendu</span>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h1 className="text-2xl font-black text-slate-900">💸 Suivi des loyers</h1>
        <button
          onClick={() => setShowEnregistrer(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors text-sm"
        >
          <Plus className="w-4 h-4" />
          Enregistrer un paiement
        </button>
      </div>

      {/* Filtres */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={bienFiltre}
            onChange={(e) => setBienFiltre(e.target.value)}
            className="bg-transparent text-slate-700 font-semibold focus:outline-none"
          >
            <option value="">Tous les biens</option>
            {Object.values(biens).map((b) => (
              <option key={b.id} value={b.id}>{b.adresse}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm">
          <ChevronDown className="w-4 h-4 text-slate-400" />
          <select
            value={moisSelectionne}
            onChange={(e) => setMoisSelectionne(e.target.value)}
            className="bg-transparent text-slate-700 font-semibold focus:outline-none capitalize"
          >
            {optionsMois.map((m) => (
              <option key={m} value={m}>{formatMoisLabel(m)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-2xl p-5 mb-6">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">📊 Tableau de bord — {formatMoisLabel(moisSelectionne)}</p>
        <div className="flex flex-wrap gap-4 mb-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <span className="font-bold text-slate-800">{nbPayes} payé{nbPayes > 1 ? 's' : ''}</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span className="font-bold text-slate-800">{nbRetard} en retard</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-500" />
            <span className="font-bold text-slate-800">{nbImpayes} impayé{nbImpayes > 1 ? 's' : ''}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <span className="text-slate-500">💰 Total attendu : <strong className="text-slate-800">{totalAttendu.toLocaleString('fr-FR')}€</strong></span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-500">Reçu : <strong className="text-emerald-700">{totalRecu.toLocaleString('fr-FR')}€</strong></span>
          <span className="text-slate-400">•</span>
          <span className="text-slate-500">Manquant : <strong className="text-red-600">{totalManquant.toLocaleString('fr-FR')}€</strong></span>
        </div>
      </div>

      {/* Liste des paiements */}
      {loading ? (
        <div className="text-center text-slate-400 py-12">Chargement…</div>
      ) : paiements.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
          <p className="text-slate-400 font-semibold mb-2">Aucun paiement pour ce mois</p>
          <button
            onClick={() => setShowEnregistrer(true)}
            className="mt-2 px-4 py-2 bg-emerald-50 text-emerald-700 font-bold rounded-xl text-sm hover:bg-emerald-100 transition-colors"
          >
            + Enregistrer les paiements du mois
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400">{formatMoisLabel(moisSelectionne)}</span>
          </div>
          <div className="divide-y divide-slate-50">
            {paiements.map((p) => {
              const bien = biens[p.bienId];
              const joursRetard = calculerJoursRetard(p);
              const prochainEtape = getProchainEtape(p);
              const isActionable = p.statut === 'retard' || p.statut === 'impaye';

              return (
                <div key={p.id} className={`px-5 py-4 flex flex-wrap items-center gap-3 hover:bg-slate-50/50 transition-colors ${isActionable ? 'bg-amber-50/30' : ''}`}>
                  {/* Statut icône */}
                  <div className="w-6 flex-shrink-0">
                    {p.statut === 'paye' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                    {p.statut === 'retard' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
                    {p.statut === 'impaye' && <XCircle className="w-5 h-5 text-red-500" />}
                    {(p.statut === 'attendu' || p.statut === 'partiel') && <div className="w-4 h-4 rounded-full border-2 border-slate-300" />}
                  </div>

                  {/* Adresse bien */}
                  <div className="flex-1 min-w-[140px]">
                    <p className="text-sm font-bold text-slate-800">{bien?.adresse ?? p.bienId}</p>
                  </div>

                  {/* Locataire */}
                  <div className="w-36 hidden sm:block">
                    <p className="text-sm text-slate-600">{p.locatairePrenom} {p.locataireNom}</p>
                  </div>

                  {/* Loyer */}
                  <div className="w-20 text-right">
                    <p className="text-sm font-bold text-slate-800">{p.loyerCC.toLocaleString('fr-FR')}€</p>
                  </div>

                  {/* Statut + étape */}
                  <div className="w-36 text-right">
                    <StatutBadge statut={p.statut} joursRetard={joursRetard} />
                    {prochainEtape && (
                      <p className="text-[10px] text-slate-400 mt-0.5">Étape {prochainEtape.numero} due</p>
                    )}
                    {p.statut === 'paye' && p.dateReelle && (
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Payé {new Date(p.dateReelle).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 ml-auto">
                    {p.statut !== 'paye' && (
                      <button
                        onClick={() => handleMarquerPaye(p)}
                        title="Marquer comme payé"
                        className="px-2.5 py-1.5 text-xs font-bold bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors"
                      >
                        ✅ Payé
                      </button>
                    )}
                    {isActionable && prochainEtape && prochainEtape.numero < 3 && (
                      <button
                        onClick={() => setRelanceTarget(p)}
                        title="Envoyer une relance"
                        className="px-2.5 py-1.5 text-xs font-bold bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors"
                      >
                        📧 Relancer
                      </button>
                    )}
                    {isActionable && prochainEtape && prochainEtape.numero >= 3 && (
                      <button
                        onClick={() => handleMiseEnDemeure(p)}
                        title="Générer mise en demeure PDF"
                        className="px-2.5 py-1.5 text-xs font-bold bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        📄 Mise en dem.
                      </button>
                    )}
                    {isActionable && (
                      <button
                        onClick={() => setRelanceTarget(p)}
                        title="Envoyer relance (toutes étapes)"
                        className="px-2.5 py-1.5 text-xs font-bold bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                      >
                        📧
                      </button>
                    )}
                    {p.relances.length > 0 && (
                      <button
                        onClick={() => setHistoTarget(p)}
                        title="Historique relances"
                        className="px-2.5 py-1.5 text-xs font-bold bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition-colors"
                      >
                        📋 {p.relances.length}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modals */}
      {showEnregistrer && (
        <EnregistrerPaiementModal
          biens={Object.values(biens)}
          moisDefaut={moisSelectionne}
          onClose={() => setShowEnregistrer(false)}
          onSaved={() => { setShowEnregistrer(false); recharger(); }}
        />
      )}

      {relanceTarget && (
        <RelanceModal
          paiement={relanceTarget}
          bien={biens[relanceTarget.bienId]}
          onClose={() => setRelanceTarget(null)}
          onSaved={() => { setRelanceTarget(null); recharger(); }}
        />
      )}

      {histoTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-black text-slate-900 mb-4">📋 Historique des relances</h2>
            <div className="space-y-2">
              {histoTarget.relances.map((r) => (
                <div key={r.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-sm">
                  <div>
                    <span className="font-bold text-slate-800">Étape {r.etape}</span>
                    <span className="text-slate-400 ml-2">via {r.methode}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-500">{new Date(r.envoyeeAt).toLocaleDateString('fr-FR')}</p>
                    <span className={`text-xs font-bold ${r.statut === 'confirmee' ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {r.statut === 'confirmee' ? '✅ Confirmée' : '📤 Envoyée'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setHistoTarget(null)}
              className="mt-4 w-full py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
