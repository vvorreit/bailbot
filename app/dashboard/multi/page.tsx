'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus, Search, Trash2, X, AlertTriangle } from 'lucide-react';
import type { Bien, Candidature } from '@/lib/db-local';
import {
  listerBiens,
  creerBien,
  supprimerBien,
  listerCandidatures,
  mettreAJourCandidature,
  purgerAnciensDossiers,
} from '@/lib/db-local';
import KanbanCard from '@/components/KanbanCard';
import DossierModal from '@/components/DossierModal';
import AdresseSearch from '@/components/AdresseSearch';

// ─── Types ─────────────────────────────────────────────────────────────────────

type StatutColonne = Candidature['statut'];

const COLONNES: { id: StatutColonne; label: string; headerClass: string; bodyClass: string }[] = [
  { id: 'en_attente',  label: 'EN ATTENTE',  headerClass: 'bg-slate-200 text-slate-800 border-slate-300', bodyClass: 'bg-slate-100' },
  { id: 'en_analyse',  label: 'EN ANALYSE',  headerClass: 'bg-blue-100 text-blue-800 border-blue-200',   bodyClass: 'bg-blue-50' },
  { id: 'complet',     label: 'COMPLET',     headerClass: 'bg-emerald-100 text-emerald-900 border-emerald-300', bodyClass: 'bg-emerald-50' },
  { id: 'selectionne', label: 'SÉLECTIONNÉ', headerClass: 'bg-purple-100 text-purple-900 border-purple-300', bodyClass: 'bg-purple-50' },
  { id: 'refuse',      label: 'REFUSÉ',      headerClass: 'bg-red-100 text-red-900 border-red-300',      bodyClass: 'bg-red-50' },
];

// ─── Modal création bien ───────────────────────────────────────────────────────

function ModalCreerBien({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [adresse, setAdresse] = useState('');
  const [loyer, setLoyer] = useState('');
  const [charges, setCharges] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adresse || !loyer) return;
    setLoading(true);
    try {
      await creerBien({ adresse, loyer: parseFloat(loyer), charges: parseFloat(charges || '0') });
      onCreated();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black text-slate-900">📍 Nouveau bien</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Adresse *</label>
            <AdresseSearch
              value={adresse}
              onChange={setAdresse}
              placeholder="12 rue de la Paix, Paris 75002"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Loyer HC *</label>
              <input
                type="number"
                value={loyer}
                onChange={(e) => setLoyer(e.target.value)}
                placeholder="1000"
                min="0"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Charges</label>
              <input
                type="number"
                value={charges}
                onChange={(e) => setCharges(e.target.value)}
                placeholder="200"
                min="0"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || !adresse || !loyer}
            className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Création...' : 'Créer le bien'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Modal purge RGPD ─────────────────────────────────────────────────────────

function ModalPurge({ onClose, onPurged }: { onClose: () => void; onPurged: (n: number) => void }) {
  const [loading, setLoading] = useState(false);

  const handlePurge = async () => {
    setLoading(true);
    try {
      const n = await purgerAnciensDossiers(90);
      onPurged(n);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-center">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-lg font-black text-slate-900 mb-2">Purge RGPD</h2>
        <p className="text-sm text-slate-500 mb-6">
          Supprimer tous les dossiers de plus de <strong>90 jours</strong> ?
          Cette action est irréversible.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50">
            Annuler
          </button>
          <button
            onClick={handlePurge}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Purge...' : 'Purger'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Kanban colonne ────────────────────────────────────────────────────────────

function KanbanColonne({
  colonne,
  candidatures,
  onOuvrir,
  onChangerStatut,
}: {
  colonne: (typeof COLONNES)[0];
  candidatures: Candidature[];
  onOuvrir: (id: string) => void;
  onChangerStatut: (id: string, statut: StatutColonne) => void;
}) {
  return (
    <div className="flex-1 min-w-[220px] max-w-[280px]">
      {/* Colonne header */}
      <div className={`rounded-xl border px-3 py-2 mb-3 flex items-center justify-between ${colonne.headerClass}`}>
        <span className="text-[11px] font-black tracking-wider">{colonne.label}</span>
        <span className="text-[11px] font-black bg-white/60 text-slate-700 px-1.5 py-0.5 rounded-full">{candidatures.length}</span>
      </div>
      {/* Cards */}
      <SortableContext items={candidatures.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <div className={`space-y-2 min-h-[120px] p-2 rounded-xl ${colonne.bodyClass}`}>
          {candidatures.map((c) => (
            <KanbanCard
              key={c.id}
              candidature={c}
              onOuvrir={onOuvrir}
              onChangerStatut={onChangerStatut}
            />
          ))}
          {candidatures.length === 0 && (
            <div className="border-2 border-dashed border-slate-300 rounded-xl h-20 flex items-center justify-center">
              <span className="text-xs text-slate-500 font-medium">Vide</span>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function MultiDossierPage() {
  const [biens, setBiens] = useState<Bien[]>([]);
  const [candidatures, setCandidatures] = useState<Record<string, Candidature[]>>({});
  const [selectedBienId, setSelectedBienId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showCreerBien, setShowCreerBien] = useState(false);
  const [showPurge, setShowPurge] = useState(false);
  const [dossierOuvert, setDossierOuvert] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const loadBiens = useCallback(async () => {
    try {
      const list = await listerBiens();
      setBiens(list);
      if (list.length > 0 && !selectedBienId) {
        setSelectedBienId(list[0].id);
      }
    } catch {
      // SSR ou IndexedDB pas encore dispo
    }
    setReady(true);
  }, [selectedBienId]);

  const loadCandidatures = useCallback(async (bienId: string) => {
    try {
      const list = await listerCandidatures(bienId);
      setCandidatures((prev) => ({ ...prev, [bienId]: list }));
    } catch {}
  }, []);

  useEffect(() => {
    loadBiens();
  }, []);

  useEffect(() => {
    if (selectedBienId) {
      loadCandidatures(selectedBienId);
    }
  }, [selectedBienId]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || !selectedBienId) return;

    // Détecter la colonne cible (over peut être un card ou une colonne)
    const targetStatut = COLONNES.find((c) => c.id === over.id)?.id;
    if (!targetStatut) return;

    const candidatureId = active.id as string;
    const current = candidatures[selectedBienId]?.find((c) => c.id === candidatureId);
    if (!current || current.statut === targetStatut) return;

    // Optimistic update
    setCandidatures((prev) => ({
      ...prev,
      [selectedBienId]: prev[selectedBienId].map((c) =>
        c.id === candidatureId ? { ...c, statut: targetStatut } : c
      ),
    }));

    try {
      await mettreAJourCandidature(candidatureId, { statut: targetStatut });
    } catch {
      loadCandidatures(selectedBienId);
    }
  };

  const handleChangerStatut = async (id: string, statut: StatutColonne) => {
    if (!selectedBienId) return;
    setCandidatures((prev) => ({
      ...prev,
      [selectedBienId]: prev[selectedBienId].map((c) =>
        c.id === id ? { ...c, statut } : c
      ),
    }));
    await mettreAJourCandidature(id, { statut });
  };

  const handleSupprimerBien = async (id: string) => {
    if (!confirm('Supprimer ce bien et toutes ses candidatures ?')) return;
    await supprimerBien(id);
    setBiens((prev) => prev.filter((b) => b.id !== id));
    if (selectedBienId === id) setSelectedBienId(null);
    showToast('Bien supprimé');
  };

  const biensFiltres = biens.filter((b) =>
    b.adresse.toLowerCase().includes(search.toLowerCase())
  );

  const selectedBien = biens.find((b) => b.id === selectedBienId);
  const candidaturesDuBien = selectedBienId ? (candidatures[selectedBienId] ?? []) : [];

  const candidatureOuverte = dossierOuvert
    ? candidaturesDuBien.find((c) => c.id === dossierOuvert)
    : null;

  const activeCandidature = activeId
    ? candidaturesDuBien.find((c) => c.id === activeId)
    : null;

  if (!ready) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-slate-400 text-sm font-medium">Chargement du dashboard...</p>
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto px-4 py-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl text-sm font-semibold shadow-lg">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <h1 className="text-2xl font-black text-slate-900">🏘 Multi-dossiers</h1>
        <div className="flex-1" />
        <button
          onClick={() => setShowPurge(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 transition-colors"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Purge RGPD
        </button>
        <button
          onClick={() => setShowCreerBien(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouveau bien
        </button>
      </div>

      {/* Sélection de bien */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un bien..."
            className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-64"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {biensFiltres.map((bien) => (
            <div key={bien.id} className="flex items-center gap-1">
              <button
                onClick={() => setSelectedBienId(bien.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                  selectedBienId === bien.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-emerald-400'
                }`}
              >
                📍 {bien.adresse} — {(bien.loyer + bien.charges).toLocaleString('fr-FR')}€ CC
              </button>
              <button
                onClick={() => handleSupprimerBien(bien.id)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Supprimer ce bien"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {biensFiltres.length === 0 && (
            <p className="text-sm text-slate-400">Aucun bien trouvé. Créez votre premier bien.</p>
          )}
        </div>
      </div>

      {/* Kanban */}
      {selectedBien ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-black text-slate-600 uppercase tracking-wider">
              📍 {selectedBien.adresse} — {selectedBien.loyer}€ + {selectedBien.charges}€ charges
            </h2>
            <span className="text-xs text-slate-400">{candidaturesDuBien.length} candidature{candidaturesDuBien.length > 1 ? 's' : ''}</span>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 overflow-x-auto pb-4">
              {COLONNES.map((colonne) => (
                <KanbanColonne
                  key={colonne.id}
                  colonne={colonne}
                  candidatures={candidaturesDuBien.filter((c) => c.statut === colonne.id)}
                  onOuvrir={(id) => setDossierOuvert(id)}
                  onChangerStatut={handleChangerStatut}
                />
              ))}
            </div>

            <DragOverlay>
              {activeCandidature ? (
                <div className="opacity-80 rotate-2 shadow-2xl">
                  <KanbanCard
                    candidature={activeCandidature}
                    onOuvrir={() => {}}
                    onChangerStatut={() => {}}
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>

          {/* Mention RGPD */}
          <p className="mt-6 text-xs text-slate-300 text-center">
            🔒 Toutes les données restent dans votre navigateur (IndexedDB). Aucune donnée locataire n'est transmise au serveur.
          </p>
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-4xl mb-4">🏘</p>
          <p className="text-slate-500 font-semibold">Créez votre premier bien pour commencer</p>
          <button
            onClick={() => setShowCreerBien(true)}
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nouveau bien
          </button>
        </div>
      )}

      {/* Modals */}
      {showCreerBien && (
        <ModalCreerBien
          onClose={() => setShowCreerBien(false)}
          onCreated={() => { loadBiens(); showToast('Bien créé ✅'); }}
        />
      )}

      {showPurge && (
        <ModalPurge
          onClose={() => setShowPurge(false)}
          onPurged={(n) => {
            if (selectedBienId) loadCandidatures(selectedBienId);
            showToast(`${n} dossier${n > 1 ? 's' : ''} purgé${n > 1 ? 's' : ''} ✅`);
          }}
        />
      )}

      {dossierOuvert && candidatureOuverte && (
        <DossierModal
          candidature={candidatureOuverte}
          bien={selectedBien}
          onClose={() => setDossierOuvert(null)}
          onUpdated={() => { if (selectedBienId) loadCandidatures(selectedBienId); }}
          onDeleted={() => {
            setDossierOuvert(null);
            if (selectedBienId) loadCandidatures(selectedBienId);
            showToast('Candidature supprimée');
          }}
        />
      )}
    </div>
  );
}
