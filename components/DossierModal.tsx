'use client';

import { useState } from 'react';
import { X, Download, Trash2, ChevronDown, Package, FileText, Receipt, Banknote } from 'lucide-react';
import Link from 'next/link';
import GenerateurBailModal from './GenerateurBailModal';
import QuittanceModal from './QuittanceModal';
import ImprimerDossier from './ImprimerDossier';
import type { Candidature, Bien } from '@/lib/db-local';
import { mettreAJourCandidature, supprimerCandidature } from '@/lib/db-local';
import { calculerBailScore } from '@/lib/bailscore';
import { calculerEligibiliteVisale } from '@/lib/eligibilite-visale';
import EligibiliteVisaleCard from './EligibiliteVisaleCard';
import ComparateurGLI from './ComparateurGLI';

interface Props {
  candidature: Candidature;
  bien?: Bien;
  onClose: () => void;
  onUpdated: () => void;
  onDeleted: () => void;
}

const STATUTS: { value: Candidature['statut']; label: string; color: string }[] = [
  { value: 'en_attente', label: 'En attente', color: 'bg-slate-100 text-slate-600' },
  { value: 'en_analyse', label: 'En analyse', color: 'bg-blue-100 text-blue-600' },
  { value: 'complet', label: 'Complet', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'selectionne', label: 'Sélectionné', color: 'bg-purple-100 text-purple-700' },
  { value: 'refuse', label: 'Refusé', color: 'bg-red-100 text-red-600' },
];

function getBailScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  if (score >= 65) return 'text-blue-600 bg-blue-50 border-blue-200';
  if (score >= 50) return 'text-amber-600 bg-amber-50 border-amber-200';
  if (score >= 35) return 'text-orange-600 bg-orange-50 border-orange-200';
  return 'text-red-600 bg-red-50 border-red-200';
}

function Row({ label, value }: { label: string; value?: string | number }) {
  if (!value) return null;
  return (
    <div className="flex justify-between items-start gap-4 py-1.5 border-b border-slate-50 last:border-0">
      <span className="text-xs text-slate-400 font-medium shrink-0">{label}</span>
      <span className="text-xs text-slate-800 font-semibold text-right">{String(value)}</span>
    </div>
  );
}

export default function DossierModal({ candidature, bien, onClose, onUpdated, onDeleted }: Props) {
  const [statut, setStatut] = useState<Candidature['statut']>(candidature.statut);
  const [loading, setLoading] = useState(false);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showBailModal, setShowBailModal] = useState(false);
  const [showQuittanceModal, setShowQuittanceModal] = useState(false);

  const { dossier, bailScore, scoreGrade, alertesFraude, completude, aGarant, dossierGarant } = candidature;

  const loyer = bien ? bien.loyer + bien.charges : 0;
  const bailScoreCalc = bailScore ?? (dossier ? calculerBailScore(dossier, loyer).total : 0);
  const scoreColor = getBailScoreColor(bailScoreCalc);

  // Eligibilité Visale
  const visaleResult = dossier ? calculerEligibiliteVisale(dossier as any, loyer) : null;
  const hasVisaleData = !!(dossier?.dateNaissance && dossier?.salaireNetMensuel);

  // Score garant
  const garantScore = aGarant && dossierGarant
    ? calculerBailScore(
        {
          nom: dossierGarant.nom,
          prenom: dossierGarant.prenom,
          dateNaissance: dossierGarant.dateNaissance,
          salaireNetMensuel: dossierGarant.salaireNetMensuel,
          typeContrat: dossierGarant.typeContrat,
          revenusN1: dossierGarant.revenusN1,
          iban: dossierGarant.iban,
        } as any,
        loyer
      )
    : null;

  const handleStatutChange = async (newStatut: Candidature['statut']) => {
    setLoading(true);
    try {
      await mettreAJourCandidature(candidature.id, { statut: newStatut });
      setStatut(newStatut);
      onUpdated();
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setLoading(true);
    try {
      await supprimerCandidature(candidature.id);
      onDeleted();
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async () => {
    setArchiveLoading(true);
    try {
      const { genererArchiveMulti } = await import('@/lib/archive-dossier');
      await genererArchiveMulti(candidature, bien);
    } finally {
      setArchiveLoading(false);
    }
  };

  const nomComplet = [dossier?.prenom, dossier?.nom].filter(Boolean).join(' ') || 'Locataire inconnu';
  const currentStatut = STATUTS.find((s) => s.value === statut);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="text-lg font-black text-slate-900">👤 {nomComplet}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${currentStatut?.color}`}>
                {currentStatut?.label}
              </span>
              {bien && (
                <span className="text-xs text-slate-400">📍 {bien.adresse}</span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* BailScore */}
          <div className={`rounded-2xl border p-4 ${scoreColor}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-black text-lg">🏆 BailScore</h3>
              <div className="text-3xl font-black">{bailScoreCalc}/100</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold">{scoreGrade ?? (candidature.dossier ? calculerBailScore(candidature.dossier as any, loyer).grade : '')}</span>
            </div>
          </div>

          {/* Alertes fraude */}
          {alertesFraude !== undefined && (
            <div className={`rounded-2xl border p-4 ${alertesFraude > 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
              <h3 className="font-black text-sm mb-1">
                {alertesFraude > 0 ? `⚠️ ${alertesFraude} Alerte${alertesFraude > 1 ? 's' : ''} fraude` : '✅ Aucune alerte fraude'}
              </h3>
              <p className="text-xs text-slate-500">
                {alertesFraude > 0 ? 'Vérifiez manuellement les incohérences du dossier.' : 'Dossier cohérent, aucune anomalie détectée.'}
              </p>
            </div>
          )}

          {/* Complétude */}
          <div className="bg-slate-50 rounded-2xl p-4">
            <h3 className="font-black text-sm text-slate-700 mb-2">
              📄 Complétude — {completude?.pourcentage ?? 0}%
            </h3>
            <div className="h-2 bg-slate-200 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full rounded-full ${(completude?.pourcentage ?? 0) === 100 ? 'bg-emerald-500' : 'bg-amber-400'}`}
                style={{ width: `${completude?.pourcentage ?? 0}%` }}
              />
            </div>
            {completude?.manquants?.length ? (
              <div className="space-y-1">
                <p className="text-xs font-bold text-amber-600">Documents manquants :</p>
                {completude.manquants.map((m) => (
                  <p key={m} className="text-xs text-slate-500">• {m}</p>
                ))}
              </div>
            ) : (
              <p className="text-xs text-emerald-600 font-semibold">✅ Tous les documents sont présents</p>
            )}
          </div>

          {/* Infos locataire */}
          <div className="bg-slate-50 rounded-2xl p-4">
            <h3 className="font-black text-sm text-slate-700 mb-3">🪪 Identité</h3>
            <Row label="Nom" value={dossier?.nom} />
            <Row label="Prénom" value={dossier?.prenom} />
            <Row label="Date de naissance" value={dossier?.dateNaissance} />
            <Row label="Nationalité" value={dossier?.nationalite} />
            <Row label="N° CNI" value={dossier?.numeroCNI} />
            <Row label="Adresse actuelle" value={dossier?.adresseActuelle} />
          </div>

          {/* Situation pro */}
          <div className="bg-slate-50 rounded-2xl p-4">
            <h3 className="font-black text-sm text-slate-700 mb-3">💼 Situation professionnelle</h3>
            <Row label="Employeur" value={dossier?.employeur} />
            <Row label="Type contrat" value={dossier?.typeContrat} />
            <Row label="Ancienneté" value={dossier?.anciennete} />
            <Row label="Salaire net mensuel" value={dossier?.salaireNetMensuel ? `${dossier.salaireNetMensuel.toLocaleString('fr-FR')} €` : undefined} />
            <Row label="Revenus N-1" value={dossier?.revenusN1 ? `${dossier.revenusN1.toLocaleString('fr-FR')} €` : undefined} />
            <Row label="Revenus N-2" value={dossier?.revenusN2 ? `${dossier.revenusN2.toLocaleString('fr-FR')} €` : undefined} />
          </div>

          {/* Eligibilité Visale */}
          <EligibiliteVisaleCard result={visaleResult} hasData={hasVisaleData} />

          {/* Comparateur GLI */}
          {dossier && loyer > 0 && (
            <ComparateurGLI dossier={dossier as any} loyerCC={loyer} />
          )}

          {/* Garant */}
          {aGarant && dossierGarant && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <h3 className="font-black text-sm text-blue-800 mb-3">🛡 Garant</h3>
              <Row label="Nom" value={`${dossierGarant.prenom ?? ''} ${dossierGarant.nom ?? ''}`.trim()} />
              <Row label="Lien de parenté" value={dossierGarant.lienParente} />
              <Row label="Type contrat" value={dossierGarant.typeContrat} />
              <Row label="Salaire net mensuel" value={dossierGarant.salaireNetMensuel ? `${dossierGarant.salaireNetMensuel.toLocaleString('fr-FR')} €` : undefined} />
              <Row label="Revenus N-1" value={dossierGarant.revenusN1 ? `${dossierGarant.revenusN1.toLocaleString('fr-FR')} €` : undefined} />
              <Row label="IBAN" value={dossierGarant.iban} />
              {garantScore && (
                <div className={`mt-3 rounded-xl border p-3 ${getBailScoreColor(garantScore.total)}`}>
                  <p className="text-xs font-black">BailScore garant : {garantScore.total}/100 ({garantScore.grade})</p>
                  <p className="text-xs mt-1">{garantScore.recommandation}</p>
                </div>
              )}
            </div>
          )}

          {/* Changer statut */}
          <div className="bg-slate-50 rounded-2xl p-4">
            <h3 className="font-black text-sm text-slate-700 mb-3">🔄 Changer le statut</h3>
            <div className="flex flex-wrap gap-2">
              {STATUTS.map((s) => (
                <button
                  key={s.value}
                  disabled={loading || statut === s.value}
                  onClick={() => handleStatutChange(s.value)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${
                    statut === s.value
                      ? `${s.color} ring-2 ring-offset-1 ring-current`
                      : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-400'
                  } disabled:opacity-50`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="sticky bottom-0 bg-white border-t border-slate-100 px-6 py-4 flex items-center gap-3 rounded-b-2xl flex-wrap">
          <button
            onClick={handleArchive}
            disabled={archiveLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-700 transition-colors disabled:opacity-60"
          >
            <Package className="w-4 h-4" />
            {archiveLoading ? '⏳ Génération...' : '📦 Télécharger ZIP'}
          </button>
          <ImprimerDossier
            dossier={dossier || {}}
            bailScore={dossier && loyer > 0 ? calculerBailScore(dossier as any, loyer) : undefined}
            visaleResult={visaleResult}
            compact
          />
          {dossier?.nom && (
            <button
              onClick={() => setShowBailModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 transition-colors"
            >
              <FileText className="w-4 h-4" />
              📄 Générer le bail
            </button>
          )}
          <button
            onClick={() => setShowQuittanceModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-bold hover:bg-amber-600 transition-colors"
          >
            <Receipt className="w-4 h-4" />
            🧾 Quittance
          </button>
          {statut === 'selectionne' && (
            <Link
              href="/dashboard/impayes"
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-blue-700 text-sm font-bold hover:bg-blue-100 transition-colors"
            >
              <Banknote className="w-4 h-4" />
              💸 Suivi des loyers
            </Link>
          )}
          <div className="flex-1" />
          <button
            onClick={handleDelete}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 ${
              confirmDelete
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-red-50 text-red-600 hover:bg-red-100'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            {confirmDelete ? 'Confirmer la suppression' : 'Supprimer'}
          </button>
        </div>
      </div>

      {/* Générateur de bail */}
      {showBailModal && (
        <GenerateurBailModal
          dossier={dossier as any}
          loyerHC={bien ? bien.loyer : undefined}
          charges={bien ? bien.charges : undefined}
          onClose={() => setShowBailModal(false)}
        />
      )}

      {/* Quittance */}
      {showQuittanceModal && (
        <QuittanceModal
          nomLocataire={dossier?.nom ?? ''}
          prenomLocataire={dossier?.prenom ?? ''}
          adresseBien={bien?.adresse ?? ''}
          loyerHC={bien?.loyer ?? 0}
          charges={bien?.charges ?? 0}
          onClose={() => setShowQuittanceModal(false)}
        />
      )}
    </div>
  );
}
