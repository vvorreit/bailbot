'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Home,
  User,
  Calendar,
  Euro,
  FileText,
  AlertTriangle,
  ChevronRight,
  ClipboardList,
  History,
  Download,
} from 'lucide-react';
import { genererQuittancePDF } from '@/lib/generateur-quittance';

interface Colocataire {
  nom: string;
  prenom: string;
  email?: string;
  telephone?: string;
  partLoyer?: number;
}

interface Garant {
  nom: string;
  prenom: string;
  email?: string;
  telephone?: string;
  type: 'physique' | 'organisme';
  organisme?: string;
}

interface Props {
  data: {
    bien: any;
    bailActif: any | null;
    bails: any[];
    paiements: any[];
    edls: any[];
    alertes: any[];
  };
}

const STATUT_BAIL: Record<string, { label: string; bg: string; text: string }> = {
  ACTIF: { label: 'Actif', bg: 'bg-emerald-100', text: 'text-emerald-700' },
  PREAVIS: { label: 'Préavis', bg: 'bg-amber-100', text: 'text-amber-700' },
  TERMINE: { label: 'Terminé', bg: 'bg-slate-100', text: 'text-slate-500' },
  RENOUVELE: { label: 'Renouvelé', bg: 'bg-blue-100', text: 'text-blue-700' },
};

const STATUT_PAIEMENT: Record<string, { label: string; icon: string }> = {
  paye: { label: 'Payé', icon: '✅' },
  attendu: { label: 'Attendu', icon: '⏳' },
  retard: { label: 'Retard', icon: '🟠' },
  impaye: { label: 'Impayé', icon: '🔴' },
  partiel: { label: 'Partiel', icon: '⚠️' },
};

export default function FicheBienClient({ data }: Props) {
  const { bien, bailActif, bails, paiements, edls, alertes } = data;

  const colocataires: Colocataire[] = bailActif?.colocataires ?? [];
  const garants: Garant[] = bailActif?.garants ?? [];
  const bauxTermines = bails.filter((b: any) => b.statut === 'TERMINE');

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-400 mb-6">
        <Link href="/dashboard" className="hover:text-slate-600">Tableau de bord</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/dashboard/logements" className="hover:text-slate-600">Mes biens</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-slate-700 font-bold">{bien.adresse}</span>
      </nav>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-3">
              <Home className="w-6 h-6 text-emerald-600" />
              {bien.adresse}
            </h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
              <span>{bien.loyer?.toLocaleString('fr-FR')} € HC</span>
              <span>+{bien.charges?.toLocaleString('fr-FR')} € charges</span>
              <span className="font-bold text-slate-700">
                = {((bien.loyer ?? 0) + (bien.charges ?? 0)).toLocaleString('fr-FR')} € CC
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {bien.typeBail === 'PROFESSIONNEL' && (
              <span className="text-xs font-black px-2 py-1 rounded-full bg-indigo-600 text-white">PRO</span>
            )}
            {bien.typeBail === 'HABITATION_MEUBLE' && (
              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-amber-100 text-amber-700">Meublé</span>
            )}
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              bailActif ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
            }`}>
              {bailActif ? 'Occupé' : 'Vacant'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bail actif */}
          {bailActif && (
            <section className="bg-white rounded-2xl border border-slate-100 p-6">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-600" />
                Bail actif
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <InfoItem label="Locataire" value={bailActif.locataireNom} />
                <InfoItem label="Email" value={bailActif.locataireEmail} />
                <InfoItem label="Début" value={new Date(bailActif.dateDebut).toLocaleDateString('fr-FR')} />
                <InfoItem label="Fin" value={bailActif.dateFin ? new Date(bailActif.dateFin).toLocaleDateString('fr-FR') : 'Pas de terme'} />
                <InfoItem label="Loyer HC" value={`${bailActif.loyerMensuel.toLocaleString('fr-FR')} €`} />
                <InfoItem label="Charges" value={`${bailActif.chargesMensuelles.toLocaleString('fr-FR')} €`} />
                <InfoItem label="Proch. révision" value={new Date(bailActif.dateProchRevision).toLocaleDateString('fr-FR')} />
                <InfoItem label="Indice" value={bailActif.indiceRevision} />
              </div>

              {/* Colocataires */}
              {colocataires.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <h3 className="text-xs font-bold text-slate-500 mb-2">Colocataires ({colocataires.length})</h3>
                  <div className="space-y-2">
                    {colocataires.map((c, i) => (
                      <div key={i} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                        <span className="text-sm font-medium text-slate-700">{c.prenom} {c.nom}</span>
                        <span className="text-xs text-slate-400">{c.email}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Garants */}
              {garants.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <h3 className="text-xs font-bold text-slate-500 mb-2">Garants ({garants.length})</h3>
                  <div className="space-y-2">
                    {garants.map((g, i) => (
                      <div key={i} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                        <div>
                          <span className="text-sm font-medium text-slate-700">{g.prenom} {g.nom}</span>
                          {g.organisme && <span className="text-xs text-slate-400 ml-2">({g.organisme})</span>}
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-bold">
                          {g.type === 'organisme' ? 'Organisme' : 'Personne physique'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* Historique paiements */}
          <section className="bg-white rounded-2xl border border-slate-100 p-6">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Euro className="w-4 h-4 text-blue-600" />
              Historique des paiements (12 derniers mois)
            </h2>
            {paiements.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">Aucun paiement enregistré</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-slate-400 uppercase border-b border-slate-100">
                      <th className="text-left py-2 px-2">Mois</th>
                      <th className="text-left py-2 px-2">Locataire</th>
                      <th className="text-right py-2 px-2">Montant</th>
                      <th className="text-center py-2 px-2">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paiements.map((p: any) => {
                      const cfg = STATUT_PAIEMENT[p.statut] || { label: p.statut, icon: '❓' };
                      return (
                        <tr key={p.id} className="border-b border-slate-50">
                          <td className="py-2 px-2 font-medium text-slate-700">{p.mois}</td>
                          <td className="py-2 px-2 text-slate-500">{p.locataireNom}</td>
                          <td className="py-2 px-2 text-right text-slate-700">{p.loyerCC?.toLocaleString('fr-FR')} €</td>
                          <td className="py-2 px-2 text-center">
                            <span className="text-xs">{cfg.icon} {cfg.label}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Historique des locataires */}
          {bauxTermines.length > 0 && (
            <section className="bg-white rounded-2xl border border-slate-100 p-6">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <History className="w-4 h-4 text-slate-500" />
                Historique des locataires
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-slate-400 uppercase border-b border-slate-100">
                      <th className="text-left py-2 px-2">Locataire</th>
                      <th className="text-left py-2 px-2">Entrée</th>
                      <th className="text-left py-2 px-2">Sortie</th>
                      <th className="text-right py-2 px-2">Loyer</th>
                      <th className="text-left py-2 px-2">Motif</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bauxTermines.map((b: any) => (
                      <tr key={b.id} className="border-b border-slate-50">
                        <td className="py-2 px-2 font-medium text-slate-700">{b.locataireNom}</td>
                        <td className="py-2 px-2 text-slate-500">{new Date(b.dateDebut).toLocaleDateString('fr-FR')}</td>
                        <td className="py-2 px-2 text-slate-500">
                          {b.dateSortie ? new Date(b.dateSortie).toLocaleDateString('fr-FR') : '—'}
                        </td>
                        <td className="py-2 px-2 text-right text-slate-700">{b.loyerMensuel?.toLocaleString('fr-FR')} €</td>
                        <td className="py-2 px-2 text-slate-400 text-xs">{b.motifSortie || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>

        {/* Colonne latérale */}
        <div className="space-y-6">
          {/* États des lieux */}
          <section className="bg-white rounded-2xl border border-slate-100 p-6">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-purple-600" />
              États des lieux
            </h2>
            {edls.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-3">Aucun EDL</p>
            ) : (
              <div className="space-y-2">
                {edls.map((edl: any) => (
                  <div key={edl.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                    <div>
                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                        edl.type === 'ENTREE' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {edl.type === 'ENTREE' ? 'Entrée' : 'Sortie'}
                      </span>
                      <span className="text-xs text-slate-500 ml-2">
                        {new Date(edl.date).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Alertes */}
          <section className="bg-white rounded-2xl border border-slate-100 p-6">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              Alertes actives ({alertes.length})
            </h2>
            {alertes.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-3">Aucune alerte</p>
            ) : (
              <div className="space-y-2">
                {alertes.map((a: any) => (
                  <div key={a.id} className="bg-red-50 rounded-lg px-3 py-2">
                    <p className="text-xs font-bold text-red-700">{a.type.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-red-500">
                      {new Date(a.dateEcheance).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase">{label}</p>
      <p className="text-sm font-semibold text-slate-700">{value}</p>
    </div>
  );
}
