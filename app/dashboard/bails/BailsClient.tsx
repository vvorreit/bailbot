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
  Download,
  X,
  FileX,
  Share2,
  Check,
  TrendingUp,
  History,
} from 'lucide-react';
import EmptyState from '@/components/EmptyState';
import { genererBailPDF, type DonneesBail } from '@/lib/generateur-bail';
import IRLRevisionBailModal from '@/components/IRLRevisionBailModal';
import {
  envoyerLienProprietaire,
  getTokenInfo,
  renewTokenProprietaire,
  revokeTokenProprietaire,
} from '@/app/actions/portail-proprietaire';
import { useSession } from 'next-auth/react';
import { listerBiens, type Bien } from '@/lib/db-local';
import CreerBailActifModal from '@/components/CreerBailActifModal';
import ClotureBailModal from '@/components/ClotureBailModal';
import TimelineBail from '@/components/TimelineBail';
import TimelineLocataire from '@/components/TimelineLocataire';
import ConformiteReportWidget, { ConformiteBadge } from '@/components/ConformiteReport';
import type { ConformiteReport as ConformiteReportType } from '@/lib/conformite/types';
import AlertesEcheances, { type AlerteDiagnosticUI } from '@/components/AlertesEcheances';
import BiensVacantsWidget from '@/components/BiensVacantsWidget';
import { getAlertesExpirationDiagnostics } from '@/app/actions/alertes-diagnostics';
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
  colocataires?: { nom: string; prenom: string; email?: string; partLoyer?: number }[];
  garants?: { nom: string; prenom: string; email?: string; type: string; organisme?: string }[];
  conformiteReport?: ConformiteReportType | null;
  conformiteAnalysedAt?: string | null;
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
  const [alertesDiagnostics, setAlertesDiagnostics] = useState<AlerteDiagnosticUI[]>([]);

  const loadData = async () => {
    try {
      const [res, localBiens, diagAlertes] = await Promise.all([
        fetch('/api/bails'),
        listerBiens(),
        getAlertesExpirationDiagnostics().catch(() => []),
      ]);
      if (res.ok) {
        const data = await res.json();
        setBails(data.bails || []);
      }
      setBiens(localBiens);
      setAlertesDiagnostics(diagAlertes);
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
        <div className="lg:col-span-1 order-2 lg:order-1 space-y-6">
          <AlertesEcheances
            alertes={toutesAlertes}
            bails={bailsMinimal}
            bienLabels={bienLabels}
            onTraiter={handleTraiter}
            alertesDiagnostics={alertesDiagnostics}
          />
          <BiensVacantsWidget />
        </div>

        {/* Colonne baux */}
        <div className="lg:col-span-2 order-1 lg:order-2 space-y-4">
          {bails.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100">
              <EmptyState
                icon={FileSignature}
                title="Aucun bail actif"
                description="Créez votre premier bail pour suivre vos locataires, loyers et échéances."
                ctaLabel="Créer votre premier bail"
                ctaOnClick={() => setShowModal(true)}
              />
            </div>
          ) : (
            bails.map((bail) => (
              <BailCard
                key={bail.id}
                bail={bail}
                bienLabel={bienLabels[bail.bienId] || bail.bienId}
                expanded={expandedBail === bail.id}
                onToggle={() => setExpandedBail(expandedBail === bail.id ? null : bail.id)}
                onReload={loadData}
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
  onReload,
}: {
  bail: BailAPI;
  bienLabel: string;
  expanded: boolean;
  onToggle: () => void;
  onReload?: () => void;
}) {
  const cfg = STATUT_CONFIG[bail.statut];
  const alertesActives = bail.alertes.filter((a) => !a.traitee).length;
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [showClotureModal, setShowClotureModal] = useState(false);
  const [showIRLModal, setShowIRLModal] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);

  const irlDaysLeft = useMemo(() => {
    const now = new Date();
    const rev = new Date(bail.dateProchRevision);
    return Math.ceil((rev.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }, [bail.dateProchRevision]);
  const [pdfForm, setPdfForm] = useState({
    nomBailleur: '',
    adresseBailleur: '',
    prenomLocataire: '',
    dateNaissanceLocataire: '',
    adresseActuelleLocataire: '',
    typeBien: 'appartement' as 'appartement' | 'maison',
    surface: '',
    depot: '',
    jourPaiement: '5',
    villeSignature: '',
    clauseResolutoire: true,
  });

  function genererPDF() {
    const donnees: DonneesBail = {
      nomBailleur: pdfForm.nomBailleur,
      adresseBailleur: pdfForm.adresseBailleur,
      nomLocataire: bail.locataireNom,
      prenomLocataire: pdfForm.prenomLocataire,
      dateNaissanceLocataire: pdfForm.dateNaissanceLocataire,
      adresseActuelle: pdfForm.adresseActuelleLocataire,
      adresseBien: bienLabel,
      typeBien: pdfForm.typeBien,
      surface: parseFloat(pdfForm.surface) || 0,
      loyerHC: bail.loyerMensuel,
      charges: bail.chargesMensuelles,
      depot: parseFloat(pdfForm.depot) || bail.loyerMensuel,
      dateEffet: new Date(bail.dateDebut).toLocaleDateString('fr-FR'),
      duree: bail.dateFin
        ? Math.round((new Date(bail.dateFin).getTime() - new Date(bail.dateDebut).getTime()) / (30 * 24 * 60 * 60 * 1000))
        : 12,
      jourPaiement: parseInt(pdfForm.jourPaiement) || 5,
      zoneTendue: false,
      clauseResolutoire: pdfForm.clauseResolutoire,
      villeSignature: pdfForm.villeSignature || 'Paris',
      dateSignature: new Date(bail.dateSignature).toLocaleDateString('fr-FR'),
    };
    const blob = genererBailPDF(donnees);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bail-${bail.locataireNom.replace(/\s+/g, '-').toLowerCase()}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    setShowPdfModal(false);
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 hover:shadow-md transition-shadow">
      {/* Header clickable */}
      <button
        onClick={onToggle}
        className="w-full text-left p-5 flex items-start justify-between gap-3"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="text-base font-black text-slate-900 truncate max-w-[200px] sm:max-w-none">{bail.locataireNom}</h3>
            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.bg} ${cfg.text}`}>
              {cfg.label}
            </span>
            {alertesActives > 0 && (
              <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-600">
                {alertesActives} alerte{alertesActives > 1 ? 's' : ''}
              </span>
            )}
            <ConformiteBadge report={bail.conformiteReport ?? null} />
            {irlDaysLeft >= 0 && irlDaysLeft <= 30 && bail.statut === 'ACTIF' && (
              <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-600">
                IRL {irlDaysLeft}j
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-xs">
            <InfoPill label="Indice" value={bail.indiceRevision} />
            <InfoPill
              label="Proch. révision"
              value={new Date(bail.dateProchRevision).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
            />
            <InfoPill label="Préavis" value={`${bail.dureePreavisMois} mois`} />
            <InfoPill label="Email" value={bail.locataireEmail} />
          </div>
          {/* Colocataires */}
          {bail.colocataires && bail.colocataires.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Colocataires</h4>
              <div className="flex flex-wrap gap-2">
                {bail.colocataires.map((c, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                    {c.prenom} {c.nom}
                    {c.partLoyer ? ` (${c.partLoyer}€)` : ''}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Garants */}
          {bail.garants && bail.garants.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Garants</h4>
              <div className="flex flex-wrap gap-2">
                {bail.garants.map((g, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">
                    {g.prenom} {g.nom}
                    {g.type === 'organisme' && g.organisme ? ` (${g.organisme})` : ''}
                  </span>
                ))}
              </div>
            </div>
          )}

          <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">
            Chronologie
          </h4>
          <TimelineBail bail={bail} />

          {/* Conformité réglementaire */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <ConformiteReportWidget bailId={bail.id} initialReport={bail.conformiteReport ?? null} />
          </div>

          {/* Actions bail */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowTimeline(true)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-bold rounded-xl transition-colors"
            >
              <History className="w-4 h-4" />
              Timeline
            </button>
            <button
              onClick={() => setShowPdfModal(true)}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Bail</span> PDF
            </button>
            {(bail.statut === 'ACTIF' || bail.statut === 'PREAVIS') && (
              <>
                <button
                  onClick={() => setShowIRLModal(true)}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs sm:text-sm font-bold rounded-xl transition-colors border border-indigo-200"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span className="hidden sm:inline">Révision</span> IRL
                </button>
                <button
                  onClick={() => setShowClotureModal(true)}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs sm:text-sm font-bold rounded-xl transition-colors border border-red-200"
                >
                  <FileX className="w-4 h-4" />
                  Clôturer
                </button>
                <PartagerProprietaireButton bailId={bail.id} />
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal complétion données PDF */}
      {showPdfModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Générer le bail PDF</h3>
              <button onClick={() => setShowPdfModal(false)} className="p-1 hover:bg-slate-100 rounded-lg">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-xs text-slate-400 mb-2">Complétez les informations manquantes pour générer le PDF.</p>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Nom du bailleur *</label>
                  <input type="text" value={pdfForm.nomBailleur} onChange={(e) => setPdfForm((p) => ({ ...p, nomBailleur: e.target.value }))} placeholder="Jean Martin" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Adresse du bailleur *</label>
                  <input type="text" value={pdfForm.adresseBailleur} onChange={(e) => setPdfForm((p) => ({ ...p, adresseBailleur: e.target.value }))} placeholder="12 rue de la Paix, 75001 Paris" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Prénom locataire</label>
                  <input type="text" value={pdfForm.prenomLocataire} onChange={(e) => setPdfForm((p) => ({ ...p, prenomLocataire: e.target.value }))} placeholder="Marie" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Date naissance locataire</label>
                  <input type="date" value={pdfForm.dateNaissanceLocataire} onChange={(e) => setPdfForm((p) => ({ ...p, dateNaissanceLocataire: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Adresse actuelle locataire</label>
                  <input type="text" value={pdfForm.adresseActuelleLocataire} onChange={(e) => setPdfForm((p) => ({ ...p, adresseActuelleLocataire: e.target.value }))} placeholder="45 avenue Hugo, 69003 Lyon" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Type de bien</label>
                  <select value={pdfForm.typeBien} onChange={(e) => setPdfForm((p) => ({ ...p, typeBien: e.target.value as any }))} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400">
                    <option value="appartement">Appartement</option>
                    <option value="maison">Maison</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Surface (m²) *</label>
                  <input type="number" value={pdfForm.surface} onChange={(e) => setPdfForm((p) => ({ ...p, surface: e.target.value }))} placeholder="42" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Dépôt de garantie (€)</label>
                  <input type="number" value={pdfForm.depot} onChange={(e) => setPdfForm((p) => ({ ...p, depot: e.target.value }))} placeholder={String(bail.loyerMensuel)} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Jour de paiement</label>
                  <input type="number" min="1" max="28" value={pdfForm.jourPaiement} onChange={(e) => setPdfForm((p) => ({ ...p, jourPaiement: e.target.value }))} className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Ville de signature</label>
                  <input type="text" value={pdfForm.villeSignature} onChange={(e) => setPdfForm((p) => ({ ...p, villeSignature: e.target.value }))} placeholder="Paris" className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-slate-100">
              <button onClick={() => setShowPdfModal(false)} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl">Annuler</button>
              <button
                onClick={genererPDF}
                disabled={!pdfForm.nomBailleur || !pdfForm.surface}
                className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors"
              >
                <Download className="w-4 h-4" />
                Générer le PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal clôture bail */}
      {showClotureModal && (
        <ClotureBailModal
          bailId={bail.id}
          locataireNom={bail.locataireNom}
          onClose={() => setShowClotureModal(false)}
          onClotured={() => {
            setShowClotureModal(false);
            onReload?.();
          }}
        />
      )}

      {/* Modal révision IRL */}
      {showIRLModal && (
        <IRLRevisionBailModal
          bailId={bail.id}
          onClose={() => setShowIRLModal(false)}
          onApplied={() => {
            onReload?.();
          }}
        />
      )}

      {/* Modal timeline locataire complète */}
      {showTimeline && (
        <TimelineLocataire
          bailId={bail.id}
          locataireNom={bail.locataireNom}
          onClose={() => setShowTimeline(false)}
        />
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

/* ─── Partager Propriétaire Button (US 24) ───────────────────────────────── */

function PartagerProprietaireButton({ bailId }: { bailId: string }) {
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ lien: string; sent: boolean } | null>(null);
  const [copied, setCopied] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<{ active: boolean; lien: string | null; expiresAt: string | null } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    getTokenInfo(bailId).then(setTokenInfo).catch(() => {});
  }, [bailId]);

  const handleEnvoyer = async () => {
    if (!email) return;
    setLoading(true);
    try {
      const res = await envoyerLienProprietaire(bailId, email);
      setResult({ lien: res.lien, sent: res.sent });
      getTokenInfo(bailId).then(setTokenInfo).catch(() => {});
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (lien: string) => {
    await navigator.clipboard.writeText(lien);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRenew = async () => {
    setActionLoading(true);
    try {
      await renewTokenProprietaire(bailId);
      const info = await getTokenInfo(bailId);
      setTokenInfo(info);
      setResult(null);
    } catch {} finally { setActionLoading(false); }
  };

  const handleRevoke = async () => {
    setActionLoading(true);
    try {
      await revokeTokenProprietaire(bailId);
      setTokenInfo({ active: false, lien: null, expiresAt: null });
      setResult(null);
    } catch {} finally { setActionLoading(false); }
  };

  /* Token actif — afficher infos + actions */
  if (tokenInfo?.active && tokenInfo.lien) {
    const expiresDate = tokenInfo.expiresAt ? new Date(tokenInfo.expiresAt).toLocaleDateString('fr-FR') : null;
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleCopy(tokenInfo.lien!)}
            className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold rounded-xl hover:bg-blue-100 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
            {copied ? 'Copie !' : 'Copier le lien'}
          </button>
          <button
            onClick={handleRenew}
            disabled={actionLoading}
            className="px-3 py-2 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors disabled:opacity-50"
          >
            {actionLoading ? '...' : 'Renouveler'}
          </button>
          <button
            onClick={handleRevoke}
            disabled={actionLoading}
            className="px-3 py-2 text-xs font-bold text-red-700 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors disabled:opacity-50"
          >
            {actionLoading ? '...' : 'Revoquer'}
          </button>
        </div>
        {expiresDate && (
          <p className="text-[10px] text-slate-400">Expire le {expiresDate}</p>
        )}
        {result?.sent && <span className="text-[10px] text-emerald-600 font-bold">Email envoye</span>}
      </div>
    );
  }

  if (result) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleCopy(result.lien)}
          className="flex items-center gap-1.5 px-3 py-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold rounded-xl hover:bg-blue-100 transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
          {copied ? 'Copie !' : 'Copier le lien'}
        </button>
        {result.sent && <span className="text-[10px] text-emerald-600 font-bold">Email envoye</span>}
      </div>
    );
  }

  if (showForm) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@proprietaire.fr"
          className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs w-48 focus:outline-none focus:ring-2 focus:ring-blue-400"
          onKeyDown={(e) => e.key === 'Enter' && handleEnvoyer()}
        />
        <button
          onClick={handleEnvoyer}
          disabled={loading || !email}
          className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? '...' : 'Envoyer'}
        </button>
        <button onClick={() => setShowForm(false)} className="text-xs text-slate-400 hover:text-slate-600">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowForm(true)}
      className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-bold rounded-xl transition-colors border border-blue-200"
    >
      <Share2 className="w-4 h-4" />
      Portail proprietaire
    </button>
  );
}
