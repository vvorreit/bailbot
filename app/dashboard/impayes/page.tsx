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
import GererBiensModal from '@/components/GererBiensModal';
import { FeatureGate } from '@/components/FeatureGate';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plus,
  Filter,
  ChevronDown,
  LayoutGrid,
  List,
  Settings,
  Home,
} from 'lucide-react';

const BAILLEUR_KEY = 'bailbot_bailleur_profil';

interface BailleurProfil {
  nom: string;
  ville: string;
  iban: string;
}

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

function genererMoisTableau(n = 6): string[] {
  const result: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return result;
}

function statutPriorite(s: Paiement['statut']): number {
  const map: Record<string, number> = { paye: 0, attendu: 1, partiel: 2, retard: 3, impaye: 4 };
  return map[s] ?? 0;
}

// ─── Tableau mensuel par bien ─────────────────────────────────────────────────

function TableauMensuel({
  biens,
  allPaiements,
  moisCols,
  onActionPaiement,
}: {
  biens: Bien[];
  allPaiements: Paiement[];
  moisCols: string[];
  onActionPaiement: (p: Paiement) => void;
}) {
  // Construit map bienId → mois → Paiement (statut le pire si plusieurs)
  const map = new Map<string, Map<string, Paiement>>();
  for (const p of allPaiements) {
    if (!map.has(p.bienId)) map.set(p.bienId, new Map());
    const existing = map.get(p.bienId)!.get(p.mois);
    if (!existing || statutPriorite(p.statut) > statutPriorite(existing.statut)) {
      map.get(p.bienId)!.set(p.mois, p);
    }
  }

  if (biens.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
        <Home className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-400 font-semibold">Aucun bien enregistré</p>
        <p className="text-xs text-slate-400 mt-1">Ajoutez vos biens pour voir le tableau mensuel</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="text-left px-5 py-3 text-xs font-black text-slate-500 uppercase tracking-wider min-w-[180px]">
                Bien
              </th>
              {moisCols.map((m) => (
                <th
                  key={m}
                  className="px-3 py-3 text-center text-xs font-bold text-slate-500 capitalize min-w-[90px]"
                >
                  {new Date(parseInt(m.split('-')[0]), parseInt(m.split('-')[1]) - 1, 1).toLocaleDateString(
                    'fr-FR',
                    { month: 'short', year: '2-digit' }
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {biens.map((bien) => (
              <tr key={bien.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-5 py-3">
                  <p className="text-sm font-bold text-slate-800 max-w-[180px] truncate" title={bien.adresse}>
                    {bien.adresse}
                  </p>
                  <p className="text-xs text-slate-400">
                    {(bien.loyer + bien.charges).toLocaleString('fr-FR')}€/mois
                  </p>
                </td>
                {moisCols.map((m) => {
                  const p = map.get(bien.id)?.get(m);
                  return (
                    <td key={m} className="px-3 py-3 text-center">
                      {p ? (
                        <button
                          onClick={() => onActionPaiement(p)}
                          title={`${p.locatairePrenom} ${p.locataireNom} — ${p.statut}`}
                          className={`w-10 h-10 rounded-xl mx-auto flex items-center justify-center text-xl transition-all hover:scale-110 active:scale-95 ${
                            p.statut === 'paye'
                              ? 'bg-emerald-50 hover:bg-emerald-100'
                              : p.statut === 'retard'
                              ? 'bg-amber-50 hover:bg-amber-100'
                              : p.statut === 'impaye'
                              ? 'bg-red-50 hover:bg-red-100'
                              : p.statut === 'partiel'
                              ? 'bg-orange-50 hover:bg-orange-100'
                              : 'bg-slate-50 hover:bg-slate-100'
                          }`}
                        >
                          {p.statut === 'paye' && '✅'}
                          {p.statut === 'retard' && '⚠️'}
                          {p.statut === 'impaye' && '🔴'}
                          {p.statut === 'partiel' && '🟠'}
                          {p.statut === 'attendu' && '⏳'}
                        </button>
                      ) : (
                        <div className="w-10 h-10 rounded-xl mx-auto flex items-center justify-center text-slate-200 text-sm">
                          —
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Légende */}
      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-4 text-xs text-slate-500">
        <span>✅ Payé</span>
        <span>⏳ Attendu</span>
        <span>⚠️ Retard</span>
        <span>🔴 Impayé</span>
        <span>🟠 Partiel</span>
        <span className="text-slate-300">— Aucune entrée</span>
      </div>
    </div>
  );
}

// ─── Modal profil bailleur ────────────────────────────────────────────────────

function BailleurProfilModal({
  profil,
  onChange,
  onClose,
}: {
  profil: BailleurProfil;
  onChange: (p: BailleurProfil) => void;
  onClose: () => void;
}) {
  const [local, setLocal] = useState({ ...profil });

  const handleSave = () => {
    localStorage.setItem(BAILLEUR_KEY, JSON.stringify(local));
    onChange(local);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <h2 className="text-lg font-black text-slate-900 mb-1">⚙️ Profil bailleur</h2>
        <p className="text-xs text-slate-400 mb-5">
          Utilisé dans les courriers, relances et PDFs. Stocké uniquement dans votre navigateur.
        </p>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Votre nom complet *</label>
            <input
              type="text"
              value={local.nom}
              onChange={(e) => setLocal((p) => ({ ...p, nom: e.target.value }))}
              placeholder="Jean Dupont"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Ville *</label>
            <input
              type="text"
              value={local.ville}
              onChange={(e) => setLocal((p) => ({ ...p, ville: e.target.value }))}
              placeholder="Paris"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">IBAN (optionnel)</label>
            <input
              type="text"
              value={local.iban}
              onChange={(e) => setLocal((p) => ({ ...p, iban: e.target.value }))}
              placeholder="FR76 xxxx xxxx xxxx xxxx xxxx xxx"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
            <p className="text-[10px] text-slate-400 mt-1">Affiché dans les rappels de loyer (étape 1)</p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={!local.nom.trim()}
            className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl text-sm hover:bg-emerald-700 transition-colors disabled:opacity-40"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

function StatutBadge({ statut, joursRetard }: { statut: Paiement['statut']; joursRetard?: number }) {
  if (statut === 'paye')
    return (
      <span className="text-emerald-600 font-semibold text-xs flex items-center gap-1">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Payé
      </span>
    );
  if (statut === 'retard')
    return (
      <span className="text-amber-600 font-bold text-xs flex items-center gap-1">
        <AlertTriangle className="w-3.5 h-3.5" />
        J+{joursRetard} RETARD
      </span>
    );
  if (statut === 'impaye')
    return (
      <span className="text-red-600 font-bold text-xs flex items-center gap-1">
        <XCircle className="w-3.5 h-3.5" />
        J+{joursRetard} IMPAYÉ
      </span>
    );
  if (statut === 'partiel')
    return <span className="text-orange-500 font-bold text-xs">Partiel</span>;
  return <span className="text-slate-400 text-xs">Attendu</span>;
}

export default function ImpayesPage() {
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [allPaiements, setAllPaiements] = useState<Paiement[]>([]);
  const [biens, setBiens] = useState<Record<string, Bien>>({});
  const [moisSelectionne, setMoisSelectionne] = useState(getMoisCourant());
  const [bienFiltre, setBienFiltre] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [vue, setVue] = useState<'liste' | 'tableau'>('liste');

  const [showEnregistrer, setShowEnregistrer] = useState(false);
  const [relanceTarget, setRelanceTarget] = useState<Paiement | null>(null);
  const [histoTarget, setHistoTarget] = useState<Paiement | null>(null);
  const [showGererBiens, setShowGererBiens] = useState(false);
  const [showBailleurModal, setShowBailleurModal] = useState(false);

  const [bailleurProfil, setBailleurProfil] = useState<BailleurProfil>({
    nom: '',
    ville: 'Paris',
    iban: '',
  });

  const optionsMois = genererOptionsMois(12);
  const moisTableau = genererMoisTableau(6);

  // Charger profil bailleur depuis localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(BAILLEUR_KEY);
      if (stored) setBailleurProfil(JSON.parse(stored));
    } catch {
      // ignore
    }
  }, []);

  const recharger = useCallback(async () => {
    setLoading(true);
    try {
      await mettreAJourStatutsRetard();
      const [allBiens, filteredPais, allPais] = await Promise.all([
        listerBiens(),
        listerPaiements(bienFiltre || undefined, moisSelectionne),
        listerPaiements(), // tous, pour le tableau et le calcul des mois impayés
      ]);
      const biensMap: Record<string, Bien> = {};
      allBiens.forEach((b) => (biensMap[b.id] = b));
      setBiens(biensMap);
      setPaiements(filteredPais);
      setAllPaiements(allPais);
    } finally {
      setLoading(false);
    }
  }, [bienFiltre, moisSelectionne]);

  useEffect(() => {
    recharger();
  }, [recharger]);

  // Stats sur le mois sélectionné (vue liste)
  const nbPayes = paiements.filter((p) => p.statut === 'paye').length;
  const nbRetard = paiements.filter((p) => p.statut === 'retard').length;
  const nbImpayes = paiements.filter((p) => p.statut === 'impaye').length;
  const totalAttendu = paiements.reduce((s, p) => s + p.loyerCC, 0);
  const totalRecu = paiements
    .filter((p) => p.statut === 'paye')
    .reduce((s, p) => s + (p.montantRecu ?? p.loyerCC), 0);
  const totalManquant = totalAttendu - totalRecu;

  // Stats globales (toutes périodes)
  const nbImpayesTotal = allPaiements.filter(
    (p) => p.statut === 'impaye' || p.statut === 'retard'
  ).length;

  // Récupère tous les mois impayés pour un locataire/bien donné
  const getMoisImpayesPour = (p: Paiement) =>
    allPaiements.filter(
      (pm) =>
        pm.bienId === p.bienId &&
        pm.locataireNom === p.locataireNom &&
        (pm.statut === 'impaye' || pm.statut === 'retard' || pm.statut === 'partiel')
    );

  const handleMiseEnDemeure = async (p: Paiement) => {
    const { genererMiseEnDemeurePDF } = await import('@/lib/generateur-mise-en-demeure');
    const bienConcerne = biens[p.bienId];
    const moisList = getMoisImpayesPour(p);

    const blob = await genererMiseEnDemeurePDF(
      p,
      {
        nom: bailleurProfil.nom || 'Le Bailleur',
        adresse: bienConcerne?.adresse ?? p.bienId,
        ville: bailleurProfil.ville || 'Paris',
      },
      moisList.length > 0 ? moisList : [p]
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

  // Clic sur cellule du tableau
  const handleTableauCellClick = (p: Paiement) => {
    const isActionable = p.statut === 'retard' || p.statut === 'impaye' || p.statut === 'attendu' || p.statut === 'partiel';
    if (isActionable) {
      setRelanceTarget(p);
    } else if (p.relances.length > 0) {
      setHistoTarget(p);
    }
  };

  const biensList = Object.values(biens);

  return (
    <FeatureGate feature="DASHBOARD_IMPAYES" fallback={<div className="max-w-2xl mx-auto px-4 py-16"><UpgradePrompt feature="DASHBOARD_IMPAYES" /></div>}>
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Bannière si profil bailleur non configuré */}
      {!bailleurProfil.nom && (
        <div className="mb-4 flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <p className="text-sm text-amber-800 font-medium">
            ⚠️ Configurez votre profil bailleur pour personnaliser les courriers et PDFs générés
          </p>
          <button
            onClick={() => setShowBailleurModal(true)}
            className="ml-4 text-xs font-bold text-amber-700 underline shrink-0"
          >
            Configurer →
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-black text-slate-900">
          💸 Suivi des loyers
          {nbImpayesTotal > 0 && (
            <span className="ml-3 text-base bg-red-500 text-white rounded-full px-2.5 py-0.5 leading-tight">
              {nbImpayesTotal}
            </span>
          )}
        </h1>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Toggle vue */}
          <div className="flex items-center bg-slate-100 rounded-xl p-1">
            <button
              onClick={() => setVue('liste')}
              title="Vue liste"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                vue === 'liste' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Liste
            </button>
            <button
              onClick={() => setVue('tableau')}
              title="Tableau mensuel par bien"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                vue === 'tableau' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Tableau
            </button>
          </div>

          {/* Gérer les biens */}
          <button
            onClick={() => setShowGererBiens(true)}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-50 transition-colors"
          >
            <Home className="w-4 h-4" />
            Biens ({biensList.length})
          </button>

          {/* Profil bailleur */}
          <button
            onClick={() => setShowBailleurModal(true)}
            title="Profil bailleur"
            className={`flex items-center gap-2 px-3 py-2 border font-bold rounded-xl text-sm transition-colors ${
              bailleurProfil.nom
                ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                : 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100'
            }`}
          >
            <Settings className="w-4 h-4" />
            {bailleurProfil.nom || 'Profil bailleur'}
          </button>

          {/* Enregistrer paiement */}
          <button
            onClick={() => setShowEnregistrer(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Enregistrer
          </button>
        </div>
      </div>

      {/* ── VUE TABLEAU ────────────────────────────────────────────────────────── */}
      {vue === 'tableau' && (
        <>
          <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-2xl p-5 mb-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              📊 Tableau mensuel — 6 derniers mois
            </p>
            <p className="text-xs text-slate-400">
              Cliquez sur une cellule pour enregistrer un paiement ou envoyer une relance.
            </p>
          </div>
          {loading ? (
            <div className="text-center text-slate-400 py-12">Chargement…</div>
          ) : (
            <TableauMensuel
              biens={biensList}
              allPaiements={allPaiements}
              moisCols={moisTableau}
              onActionPaiement={handleTableauCellClick}
            />
          )}
        </>
      )}

      {/* ── VUE LISTE ──────────────────────────────────────────────────────────── */}
      {vue === 'liste' && (
        <>
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
                {biensList.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.adresse}
                  </option>
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
                  <option key={m} value={m}>
                    {formatMoisLabel(m)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Stats */}
          <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-2xl p-5 mb-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              📊 Tableau de bord — {formatMoisLabel(moisSelectionne)}
            </p>
            <div className="flex flex-wrap gap-4 mb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span className="font-bold text-slate-800">
                  {nbPayes} payé{nbPayes > 1 ? 's' : ''}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <span className="font-bold text-slate-800">{nbRetard} en retard</span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                <span className="font-bold text-slate-800">
                  {nbImpayes} impayé{nbImpayes > 1 ? 's' : ''}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="text-slate-500">
                💰 Total attendu :{' '}
                <strong className="text-slate-800">{totalAttendu.toLocaleString('fr-FR')}€</strong>
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500">
                Reçu :{' '}
                <strong className="text-emerald-700">{totalRecu.toLocaleString('fr-FR')}€</strong>
              </span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500">
                Manquant :{' '}
                <strong className="text-red-600">{totalManquant.toLocaleString('fr-FR')}€</strong>
              </span>
            </div>
          </div>

          {/* Liste */}
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
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                  {formatMoisLabel(moisSelectionne)}
                </span>
              </div>
              <div className="divide-y divide-slate-50">
                {paiements.map((p) => {
                  const bien = biens[p.bienId];
                  const joursRetard = calculerJoursRetard(p);
                  const prochainEtape = getProchainEtape(p);
                  const isActionable = p.statut === 'retard' || p.statut === 'impaye';

                  return (
                    <div
                      key={p.id}
                      className={`px-5 py-4 flex flex-wrap items-center gap-3 hover:bg-slate-50/50 transition-colors ${
                        isActionable ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      {/* Statut icône */}
                      <div className="w-6 flex-shrink-0">
                        {p.statut === 'paye' && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                        {p.statut === 'retard' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
                        {p.statut === 'impaye' && <XCircle className="w-5 h-5 text-red-500" />}
                        {(p.statut === 'attendu' || p.statut === 'partiel') && (
                          <div className="w-4 h-4 rounded-full border-2 border-slate-300" />
                        )}
                      </div>

                      {/* Adresse bien */}
                      <div className="flex-1 min-w-[140px]">
                        <p className="text-sm font-bold text-slate-800">{bien?.adresse ?? p.bienId}</p>
                      </div>

                      {/* Locataire */}
                      <div className="w-36 hidden sm:block">
                        <p className="text-sm text-slate-600">
                          {p.locatairePrenom} {p.locataireNom}
                        </p>
                      </div>

                      {/* Loyer */}
                      <div className="w-20 text-right">
                        <p className="text-sm font-bold text-slate-800">
                          {p.loyerCC.toLocaleString('fr-FR')}€
                        </p>
                      </div>

                      {/* Statut + étape */}
                      <div className="w-36 text-right">
                        <StatutBadge statut={p.statut} joursRetard={joursRetard} />
                        {prochainEtape && (
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Étape {prochainEtape.numero} due (J+{prochainEtape.declenchementJours})
                          </p>
                        )}
                        {p.statut === 'paye' && p.dateReelle && (
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Payé le{' '}
                            {new Date(p.dateReelle).toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                            })}
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
                            title={`${prochainEtape.nom} — ${prochainEtape.action}`}
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
                            title="Ouvrir le gestionnaire de relances"
                            className="px-2.5 py-1.5 text-xs font-bold bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                          >
                            📋
                          </button>
                        )}
                        {p.relances.length > 0 && (
                          <button
                            onClick={() => setHistoTarget(p)}
                            title="Historique des relances"
                            className="px-2.5 py-1.5 text-xs font-bold bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition-colors"
                          >
                            {p.relances.length}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── MODALS ─────────────────────────────────────────────────────────────── */}

      {showEnregistrer && (
        <EnregistrerPaiementModal
          biens={biensList}
          moisDefaut={moisSelectionne}
          onClose={() => setShowEnregistrer(false)}
          onSaved={() => {
            setShowEnregistrer(false);
            recharger();
          }}
        />
      )}

      {relanceTarget && (
        <RelanceModal
          paiement={relanceTarget}
          bien={biens[relanceTarget.bienId]}
          bailleur={bailleurProfil}
          moisImpayes={getMoisImpayesPour(relanceTarget)}
          onClose={() => setRelanceTarget(null)}
          onSaved={() => {
            setRelanceTarget(null);
            recharger();
          }}
        />
      )}

      {histoTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-black text-slate-900 mb-4">
              📋 Historique des relances
            </h2>
            <p className="text-sm text-slate-600 mb-4">
              {histoTarget.locatairePrenom} {histoTarget.locataireNom} — {formatMoisLabel(histoTarget.mois)}
            </p>
            <div className="space-y-2">
              {histoTarget.relances.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-xl text-sm"
                >
                  <div>
                    <span className="font-bold text-slate-800">Étape {r.etape}</span>
                    <span className="text-slate-400 ml-2">via {r.methode}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-500">
                      {new Date(r.envoyeeAt).toLocaleDateString('fr-FR')}
                    </p>
                    <span
                      className={`text-xs font-bold ${
                        r.statut === 'confirmee' ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                    >
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

      {showGererBiens && (
        <GererBiensModal
          onClose={() => setShowGererBiens(false)}
          onChanged={() => recharger()}
        />
      )}

      {showBailleurModal && (
        <BailleurProfilModal
          profil={bailleurProfil}
          onChange={setBailleurProfil}
          onClose={() => setShowBailleurModal(false)}
        />
      )}
    </div>
    </FeatureGate>
  );
}
