'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Plus,
  Loader2,
  Copy,
  Check,
  Link2,
  Power,
  PowerOff,
  Trash2,
  MessageSquare,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Send,
  X,
} from 'lucide-react';

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface Demande {
  id: string;
  espaceId: string;
  type: 'DOCUMENT' | 'TRAVAUX' | 'QUESTION' | 'CONGE';
  message: string;
  statut: 'NOUVEAU' | 'EN_COURS' | 'RESOLU';
  reponse: string | null;
  createdAt: string;
}

interface BailInfo {
  id: string;
  locataireNom: string;
  locataireEmail: string;
  bienId: string;
  loyerMensuel: number;
  statut: string;
}

interface Espace {
  id: string;
  userId: string;
  bailId: string;
  token: string;
  actif: boolean;
  expiresAt: string;
  createdAt: string;
  demandes: Demande[];
  bail: BailInfo | null;
}

interface BailOption {
  id: string;
  locataireNom: string;
  bienId: string;
}

/* ─── Constantes ─────────────────────────────────────────────────────────── */

const TYPE_LABELS: Record<string, string> = {
  DOCUMENT: 'Document',
  TRAVAUX: 'Travaux',
  QUESTION: 'Question',
  CONGE: 'Congé',
};

const TYPE_COLORS: Record<string, string> = {
  DOCUMENT: 'bg-blue-100 text-blue-700',
  TRAVAUX: 'bg-amber-100 text-amber-700',
  QUESTION: 'bg-slate-100 text-slate-600',
  CONGE: 'bg-red-100 text-red-700',
};

const STATUT_CONFIG: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  NOUVEAU: { label: 'Nouveau', bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  EN_COURS: { label: 'En cours', bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
  RESOLU: { label: 'Résolu', bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
};

/* ─── Composant Principal ────────────────────────────────────────────────── */

export default function EspacesLocatairesClient() {
  const [espaces, setEspaces] = useState<Espace[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  async function loadEspaces() {
    try {
      const res = await fetch('/api/espaces-locataires');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setEspaces(data.espaces || []);
    } catch {
      setEspaces([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadEspaces(); }, []);

  const stats = useMemo(() => {
    const total = espaces.length;
    const actifs = espaces.filter((e) => e.actif).length;
    const expires = espaces.filter((e) => new Date(e.expiresAt) < new Date()).length;
    const demandesNouvelles = espaces.reduce(
      (sum, e) => sum + e.demandes.filter((d) => d.statut === 'NOUVEAU').length,
      0
    );
    return { total, actifs, expires, demandesNouvelles };
  }, [espaces]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <Users className="w-7 h-7 text-emerald-600" />
            Espaces locataires
          </h1>
          <p className="text-slate-500 mt-1">Gérez les espaces de communication avec vos locataires</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          Créer un espace
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total" value={stats.total} icon={<Users className="w-5 h-5" />} color="slate" />
        <StatCard label="Actifs" value={stats.actifs} icon={<Power className="w-5 h-5" />} color="emerald" />
        <StatCard
          label="Demandes en attente"
          value={stats.demandesNouvelles}
          icon={<MessageSquare className="w-5 h-5" />}
          color={stats.demandesNouvelles > 0 ? 'red' : 'blue'}
        />
        <StatCard
          label="Expirés"
          value={stats.expires}
          icon={<Clock className="w-5 h-5" />}
          color={stats.expires > 0 ? 'red' : 'slate'}
        />
      </div>

      {/* Liste */}
      {espaces.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500 font-semibold">Aucun espace locataire</p>
          <p className="text-sm text-slate-400 mt-1">
            Créez un espace pour permettre à vos locataires de vous contacter.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {espaces.map((espace) => (
            <EspaceCard key={espace.id} espace={espace} onUpdate={loadEspaces} />
          ))}
        </div>
      )}

      {/* Modal création */}
      {showCreateModal && (
        <CreerEspaceModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            loadEspaces();
          }}
          existingBailIds={espaces.map((e) => e.bailId)}
        />
      )}
    </div>
  );
}

/* ─── Stat Card ──────────────────────────────────────────────────────────── */

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) {
  const colors: Record<string, string> = {
    slate: 'bg-slate-50 text-slate-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    red: 'bg-red-50 text-red-600',
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${colors[color] || colors.slate}`}>
          {icon}
        </div>
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-black text-slate-900">{value}</p>
    </div>
  );
}

/* ─── Espace Card ────────────────────────────────────────────────────────── */

function EspaceCard({ espace, onUpdate }: { espace: Espace; onUpdate: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isExpired = new Date(espace.expiresAt) < new Date();
  const demandesNouvelles = espace.demandes.filter((d) => d.statut === 'NOUVEAU').length;
  const lien = `${window.location.origin}/locataire/${espace.token}`;

  async function handleCopy() {
    await navigator.clipboard.writeText(lien);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleToggle() {
    setToggling(true);
    try {
      await fetch('/api/espaces-locataires', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ espaceId: espace.id, actif: !espace.actif }),
      });
      onUpdate();
    } finally {
      setToggling(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await fetch(`/api/espaces-locataires?id=${espace.id}`, { method: 'DELETE' });
      onUpdate();
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-black text-slate-900 truncate">
                {espace.bail?.locataireNom || 'Locataire inconnu'}
              </h3>
              {demandesNouvelles > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
                  <AlertCircle className="w-3 h-3" />
                  {demandesNouvelles}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              {espace.bail?.locataireEmail || '—'}
              {espace.bail?.bienId && <span className="ml-2">· Bien {espace.bail.bienId.slice(0, 8)}</span>}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Badge statut */}
            {isExpired ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-600">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                Expiré
              </span>
            ) : espace.actif ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Actif
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                Désactivé
              </span>
            )}
          </div>
        </div>

        {/* Info row */}
        <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
          <span>
            Créé le {new Date(espace.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
          <span>
            Expire le {new Date(espace.expiresAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
          <span>{espace.demandes.length} demande{espace.demandes.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Lien partageable */}
        <div className="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 mb-3">
          <Link2 className="w-4 h-4 text-slate-400 shrink-0" />
          <span className="text-xs text-slate-500 truncate flex-1 font-mono">{lien}</span>
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors shrink-0"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copié' : 'Copier'}
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded(!expanded)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-600 transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Demandes ({espace.demandes.length})
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={handleToggle}
            disabled={toggling}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 rounded-lg text-xs font-bold text-slate-600 transition-colors disabled:opacity-50"
          >
            {toggling ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : espace.actif ? (
              <PowerOff className="w-3.5 h-3.5" />
            ) : (
              <Power className="w-3.5 h-3.5" />
            )}
            {espace.actif ? 'Désactiver' : 'Réactiver'}
          </button>

          {confirmDelete ? (
            <div className="inline-flex items-center gap-1.5">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirmer'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-2 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700"
              >
                Annuler
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-red-50 rounded-lg text-xs font-bold text-slate-600 hover:text-red-600 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Supprimer
            </button>
          )}
        </div>
      </div>

      {/* Demandes expanded */}
      {expanded && (
        <div className="border-t border-slate-100 p-5">
          {espace.demandes.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">Aucune demande pour cet espace</p>
          ) : (
            <div className="space-y-3">
              {espace.demandes.map((demande) => (
                <DemandeRow key={demande.id} demande={demande} onUpdate={onUpdate} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── Demande Row ────────────────────────────────────────────────────────── */

function DemandeRow({ demande, onUpdate }: { demande: Demande; onUpdate: () => void }) {
  const [showRepondre, setShowRepondre] = useState(false);
  const [reponse, setReponse] = useState(demande.reponse || '');
  const [statut, setStatut] = useState(demande.statut);
  const [saving, setSaving] = useState(false);

  const cfg = STATUT_CONFIG[demande.statut];

  async function handleChangeStatut(newStatut: string) {
    setSaving(true);
    try {
      await fetch('/api/espaces-locataires', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          demandeId: demande.id,
          reponse: demande.reponse || '',
          statut: newStatut,
        }),
      });
      setStatut(newStatut as Demande['statut']);
      onUpdate();
    } finally {
      setSaving(false);
    }
  }

  async function handleRepondre() {
    if (!reponse.trim()) return;
    setSaving(true);
    try {
      await fetch('/api/espaces-locataires', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          demandeId: demande.id,
          reponse: reponse.trim(),
          statut: 'RESOLU',
        }),
      });
      setShowRepondre(false);
      onUpdate();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-slate-50 rounded-xl p-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${TYPE_COLORS[demande.type]}`}>
            {TYPE_LABELS[demande.type]}
          </span>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${cfg.bg} ${cfg.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>
          <span className="text-xs text-slate-400">
            {new Date(demande.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
        </div>

        {/* Statut actions */}
        {demande.statut !== 'RESOLU' && (
          <div className="flex items-center gap-1 shrink-0">
            {demande.statut === 'NOUVEAU' && (
              <button
                onClick={() => handleChangeStatut('EN_COURS')}
                disabled={saving}
                className="px-2 py-1 text-xs font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors disabled:opacity-50"
              >
                En cours
              </button>
            )}
            <button
              onClick={() => handleChangeStatut('RESOLU')}
              disabled={saving}
              className="px-2 py-1 text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors disabled:opacity-50"
            >
              Résolu
            </button>
          </div>
        )}
      </div>

      <p className="text-sm text-slate-700 mb-2">{demande.message}</p>

      {/* Réponse existante */}
      {demande.reponse && (
        <div className="bg-white rounded-lg p-3 border border-slate-100 mb-2">
          <p className="text-xs font-bold text-emerald-600 mb-1">Votre réponse :</p>
          <p className="text-sm text-slate-600">{demande.reponse}</p>
        </div>
      )}

      {/* Bouton répondre */}
      {!showRepondre && demande.statut !== 'RESOLU' && (
        <button
          onClick={() => setShowRepondre(true)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
          Répondre
        </button>
      )}

      {/* Formulaire réponse */}
      {showRepondre && (
        <div className="mt-2 space-y-2">
          <textarea
            value={reponse}
            onChange={(e) => setReponse(e.target.value)}
            placeholder="Votre réponse au locataire..."
            rows={3}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleRepondre}
              disabled={saving || !reponse.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Envoyer
            </button>
            <button
              onClick={() => setShowRepondre(false)}
              className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Modal Créer Espace ─────────────────────────────────────────────────── */

function CreerEspaceModal({
  onClose,
  onCreated,
  existingBailIds,
}: {
  onClose: () => void;
  onCreated: () => void;
  existingBailIds: string[];
}) {
  const [bails, setBails] = useState<BailOption[]>([]);
  const [loadingBails, setLoadingBails] = useState(true);
  const [selectedBailId, setSelectedBailId] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadBails() {
      try {
        const res = await fetch('/api/bails');
        if (!res.ok) throw new Error();
        const data = await res.json();
        const available = (data.bails || [])
          .filter((b: any) => b.statut === 'ACTIF' && !existingBailIds.includes(b.id))
          .map((b: any) => ({ id: b.id, locataireNom: b.locataireNom, bienId: b.bienId }));
        setBails(available);
      } catch {
        setBails([]);
      } finally {
        setLoadingBails(false);
      }
    }
    loadBails();
  }, [existingBailIds]);

  async function handleCreate() {
    if (!selectedBailId) return;
    setCreating(true);
    setError('');
    try {
      const res = await fetch('/api/espaces-locataires', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bailId: selectedBailId }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erreur lors de la création');
      }
      onCreated();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="font-bold text-slate-900 text-lg">Créer un espace locataire</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-500">
            Sélectionnez un bail actif pour créer un espace locataire. Un lien unique sera généré
            pour permettre au locataire de vous contacter.
          </p>

          {loadingBails ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            </div>
          ) : bails.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500 font-semibold">Aucun bail disponible</p>
              <p className="text-xs text-slate-400 mt-1">
                Tous vos bails actifs ont déjà un espace locataire, ou vous n&apos;avez pas encore de bail.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {bails.map((bail) => (
                  <label
                    key={bail.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      selectedBailId === bail.id
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="bail"
                      value={bail.id}
                      checked={selectedBailId === bail.id}
                      onChange={(e) => setSelectedBailId(e.target.value)}
                      className="accent-emerald-600"
                    />
                    <div>
                      <p className="text-sm font-bold text-slate-900">{bail.locataireNom}</p>
                      <p className="text-xs text-slate-400">Bien {bail.bienId.slice(0, 8)}</p>
                    </div>
                  </label>
                ))}
              </div>

              {error && (
                <p className="text-sm text-red-600 font-semibold">{error}</p>
              )}

              <button
                onClick={handleCreate}
                disabled={!selectedBailId || creating}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Créer l&apos;espace
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
