'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  FileSignature,
  Plus,
  Loader2,
  Calendar,
  Euro,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Users,
} from 'lucide-react';
import { listerBiens, type Bien } from '@/lib/db-local';
import CreerBailActifModal from '@/components/CreerBailActifModal';
import TimelineBail from '@/components/TimelineBail';
import AlertesEcheances from '@/components/AlertesEcheances';
import type { TypeAlerte, StatutBail } from '@prisma/client';

/* ─── Types API ──────────────────────────────────────────────────────────── */

interface Alerte {
  id: string;
  bailId: string;
  type: TypeAlerte;
  dateEcheance: string;
  traitee: boolean;
}

interface BailAPI {
  id: string;
  bienId: string;
  locataireNom: string;
  locataireEmail: string;
  dateSignature: string;
  dateDebut: string;
  dateFin: string | null;
  dureePreavisMois: number;
  loyerMensuel: number;
  chargesMensuelles: number;
  indiceRevision: string;
  dateProchRevision: string;
  dateFinDiagnostics: string | null;
  statut: StatutBail;
  createdAt: string;
  alertes: Alerte[];
}

/* ─── Statut badges ──────────────────────────────────────────────────────── */

const STATUT_CONFIG: Record<StatutBail, { label: string; bg: string; text: string }> = {
  ACTIF: { label: 'Actif', bg: 'bg-emerald-100', text: 'text-emerald-700' },
  PREAVIS: { label: 'Préavis', bg: 'bg-amber-100', text: 'text-amber-700' },
  TERMINE: { label: 'Terminé', bg: 'bg-slate-100', text: 'text-slate-500' },
  RENOUVELE: { label: 'Renouvelé', bg: 'bg-blue-100', text: 'text-blue-700' },
};

/* ─── Composant Principal ────────────────────────────────────────────────── */

export default function BailsClient() {
  const [bails, setBails] = useState<BailAPI[]>([]);
  const [biens, setBiens] = useState<Bien[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [expandedBail, setExpandedBail] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [res, localBiens] = await Promise.all([
        fetch('/api/bails'),
        listerBiens(),
      ]);
      if (res.ok) {
        const data = await res.json();
        setBails(data.bails || []);
      }
      setBiens(localBiens);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const bienLabels = useMemo(() => {
    const map: Record<string, string> = {};
    biens.forEach((b) => { map[b.id] = b.adresse; });
    return map;
  }, [biens]);

  const toutesAlertes = useMemo(
    () => bails.flatMap((b) => b.alertes),
    [bails]
  );

  const bailsMinimal = useMemo(
    () => bails.map((b) => ({ id: b.id, locataireNom: b.locataireNom, bienId: b.bienId })),
    [bails]
  );

  const stats = useMemo(() => {
    const actifs = bails.filter((b) => b.statut === 'ACTIF' || b.statut === 'PREAVIS');
    const revenuMensuel = actifs.reduce((s, b) => s + b.loyerMensuel + b.chargesMensuelles, 0);
    const alertesActives = toutesAlertes.filter((a) => !a.traitee).length;
    return { total: bails.length, actifs: actifs.length, revenuMensuel, alertesActives };
  }, [bails, toutesAlertes]);

  const handleTraiter = async (alerteId: string) => {
    const res = await fetch('/api/bails/alertes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alerteId }),
    });
    if (res.ok) {
      setBails((prev) =>
        prev.map((b) => ({
          ...b,
          alertes: b.alertes.map((a) =>
            a.id === alerteId ? { ...a, traitee: true } : a
          ),
        }))
      );
    }
  };

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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <FileSignature className="w-7 h-7 text-emerald-600" />
            Mes baux
          </h1>
          <p className="text-slate-500 mt-1">Suivi de vos baux actifs et alertes d&apos;échéances</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-sm hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nouveau bail
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Baux total" value={stats.total} icon={<FileSignature className="w-5 h-5" />} color="slate" />
        <StatCard label="Actifs" value={stats.actifs} icon={<Users className="w-5 h-5" />} color="emerald" />
        <StatCard
          label="Revenus mensuels"
          value={`${stats.revenuMensuel.toLocaleString('fr-FR')} €`}
          icon={<Euro className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          label="Alertes actives"
          value={stats.alertesActives}
          icon={<AlertTriangle className="w-5 h-5" />}
          color={stats.alertesActives > 0 ? 'red' : 'slate'}
        />
      </div>

      {/* Layout : alertes + liste */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne alertes */}
        <div className="lg:col-span-1 order-2 lg:order-1">
          <AlertesEcheances
            alertes={toutesAlertes}
            bails={bailsMinimal}
            bienLabels={bienLabels}
            onTraiter={handleTraiter}
          />
        </div>

        {/* Colonne baux */}
        <div className="lg:col-span-2 order-1 lg:order-2 space-y-4">
          {bails.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
              <FileSignature className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-semibold">Aucun bail enregistré</p>
              <p className="text-sm text-slate-400 mt-1">
                Cliquez sur &quot;Nouveau bail&quot; pour enregistrer votre premier bail signé.
              </p>
            </div>
          ) : (
            bails.map((bail) => (
              <BailCard
                key={bail.id}
                bail={bail}
                bienLabel={bienLabels[bail.bienId] || bail.bienId}
                expanded={expandedBail === bail.id}
                onToggle={() => setExpandedBail(expandedBail === bail.id ? null : bail.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <CreerBailActifModal
          biens={biens}
          onClose={() => setShowModal(false)}
          onCreated={() => {
            setShowModal(false);
            setLoading(true);
            loadData();
          }}
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

/* ─── Bail Card ──────────────────────────────────────────────────────────── */

function BailCard({
  bail,
  bienLabel,
  expanded,
  onToggle,
}: {
  bail: BailAPI;
  bienLabel: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const cfg = STATUT_CONFIG[bail.statut];
  const alertesActives = bail.alertes.filter((a) => !a.traitee).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 hover:shadow-md transition-shadow">
      {/* Header clickable */}
      <button
        onClick={onToggle}
        className="w-full text-left p-5 flex items-start justify-between gap-3"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-base font-black text-slate-900 truncate">{bail.locataireNom}</h3>
            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.bg} ${cfg.text}`}>
              {cfg.label}
            </span>
            {alertesActives > 0 && (
              <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-600">
                {alertesActives} alerte{alertesActives > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 truncate">{bienLabel}</p>
          <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(bail.dateDebut).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
              {bail.dateFin && ` → ${new Date(bail.dateFin).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}`}
            </span>
            <span className="flex items-center gap-1">
              <Euro className="w-3 h-3" />
              <span className="font-bold text-slate-600">
                {(bail.loyerMensuel + bail.chargesMensuelles).toLocaleString('fr-FR')} € CC
              </span>
            </span>
          </div>
        </div>
        <div className="shrink-0 mt-1">
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-400" />
          )}
        </div>
      </button>

      {/* Timeline expanded */}
      {expanded && (
        <div className="px-5 pb-5 border-t border-slate-100 pt-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4 text-xs">
            <InfoPill label="Indice" value={bail.indiceRevision} />
            <InfoPill
              label="Proch. révision"
              value={new Date(bail.dateProchRevision).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
            />
            <InfoPill label="Préavis" value={`${bail.dureePreavisMois} mois`} />
            <InfoPill label="Email" value={bail.locataireEmail} />
          </div>
          <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">
            Chronologie
          </h4>
          <TimelineBail bail={bail} />
        </div>
      )}
    </div>
  );
}

/* ─── Info Pill ───────────────────────────────────────────────────────────── */

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-lg px-3 py-2">
      <p className="text-[10px] font-bold text-slate-400 uppercase">{label}</p>
      <p className="text-sm font-semibold text-slate-700 truncate">{value}</p>
    </div>
  );
}
