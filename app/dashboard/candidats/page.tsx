'use client';

import { useState, useEffect, useCallback } from 'react';
import { FeatureGate } from '@/components/FeatureGate';
import RelanceCandidatModal from '@/components/RelanceCandidatModal';
import {
  Users,
  Mail,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Send,
  Filter,
  Loader2,
  FileText,
  RefreshCw,
} from 'lucide-react';

interface DepotTokenInfo {
  id: string;
  token: string;
  bienAdresse: string;
  message: string | null;
  expiresAt: string;
  used: boolean;
  createdAt: string;
  _count: { fichiers: number };
}

interface RelanceInfo {
  id: string;
  depotToken: string;
  email: string;
  telephone: string | null;
  sequence: number;
  statut: string;
  derniereRelance: string | null;
  createdAt: string;
}

interface CandidatRow {
  depot: DepotTokenInfo;
  relance: RelanceInfo | null;
  completionPct: number;
  docsManquants: string[];
}

const TOTAL_DOCS = 6;
const DOC_LABELS = [
  'CNI / Identité',
  'Bulletin de paie',
  'Contrat de travail',
  'Avis d\'imposition',
  'RIB',
  'Justificatif de domicile',
];

function calculerCompletion(fichiersCount: number): { pct: number; manquants: string[] } {
  const docsPresents = Math.min(fichiersCount, TOTAL_DOCS);
  const pct = Math.round((docsPresents / TOTAL_DOCS) * 100);
  const manquants = DOC_LABELS.slice(docsPresents);
  return { pct, manquants };
}

function statutBadge(statut: string) {
  switch (statut) {
    case 'COMPLET':
      return (
        <span className="flex items-center gap-1 text-xs font-bold text-emerald-600">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Complet
        </span>
      );
    case 'RELANCE_1':
      return (
        <span className="flex items-center gap-1 text-xs font-bold text-blue-600">
          <Mail className="w-3.5 h-3.5" />
          Relance 1
        </span>
      );
    case 'RELANCE_2':
      return (
        <span className="flex items-center gap-1 text-xs font-bold text-amber-600">
          <AlertTriangle className="w-3.5 h-3.5" />
          Relance 2
        </span>
      );
    case 'RELANCE_3':
      return (
        <span className="flex items-center gap-1 text-xs font-bold text-red-600">
          <XCircle className="w-3.5 h-3.5" />
          Relance 3
        </span>
      );
    case 'ABANDONNE':
      return <span className="text-xs font-bold text-slate-400">Abandonné</span>;
    default:
      return (
        <span className="flex items-center gap-1 text-xs font-bold text-slate-500">
          <Clock className="w-3.5 h-3.5" />
          En attente
        </span>
      );
  }
}

function CompletionBar({ pct }: { pct: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            pct === 100 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-400' : 'bg-red-400'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-xs font-bold ${
        pct === 100 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-red-600'
      }`}>
        {pct}%
      </span>
    </div>
  );
}

export default function CandidatsPage() {
  const [depots, setDepots] = useState<DepotTokenInfo[]>([]);
  const [relances, setRelances] = useState<RelanceInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatut, setFilterStatut] = useState<string>('');
  const [relanceModal, setRelanceModal] = useState<CandidatRow | null>(null);
  const [emailInputs, setEmailInputs] = useState<Record<string, string>>({});

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const [depotRes, relanceRes] = await Promise.all([
        fetch('/api/depot/liste'),
        fetch('/api/relances/candidat'),
      ]);
      if (depotRes.ok) {
        const d = await depotRes.json();
        setDepots(d.tokens || []);
      }
      if (relanceRes.ok) {
        const r = await relanceRes.json();
        setRelances(r.relances || []);
        const emailMap: Record<string, string> = {};
        for (const rel of r.relances || []) {
          emailMap[rel.depotToken] = rel.email;
        }
        setEmailInputs((prev) => ({ ...emailMap, ...prev }));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    charger();
  }, [charger]);

  const relanceMap = new Map<string, RelanceInfo>();
  for (const r of relances) {
    relanceMap.set(r.depotToken, r);
  }

  const rows: CandidatRow[] = depots.map((depot) => {
    const relance = relanceMap.get(depot.token) || null;
    const { pct, manquants } = calculerCompletion(depot._count.fichiers);
    return { depot, relance, completionPct: pct, docsManquants: manquants };
  });

  const filteredRows = filterStatut
    ? rows.filter((r) => {
        const statut = r.relance?.statut || 'EN_ATTENTE';
        if (filterStatut === 'INCOMPLET') return r.completionPct < 100;
        if (filterStatut === 'COMPLET') return r.completionPct === 100;
        return statut === filterStatut;
      })
    : rows;

  const nbIncomplets = rows.filter((r) => r.completionPct < 100).length;
  const nbComplets = rows.filter((r) => r.completionPct === 100).length;
  const nbRelances = rows.filter((r) => r.relance && r.relance.sequence > 0).length;

  const handleOpenRelance = (row: CandidatRow) => {
    const email = emailInputs[row.depot.token];
    if (!email) {
      return;
    }
    setRelanceModal(row);
  };

  return (
    <FeatureGate feature="RELANCES_CANDIDAT">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" />
            Candidats & Relances
            {nbIncomplets > 0 && (
              <span className="ml-2 text-sm bg-amber-500 text-white rounded-full px-2.5 py-0.5">
                {nbIncomplets} incomplet{nbIncomplets > 1 ? 's' : ''}
              </span>
            )}
          </h1>
          <button
            onClick={charger}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Actualiser
          </button>
        </div>

        {/* Stats */}
        <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-200 rounded-2xl p-5 mb-6">
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-slate-400" />
              <span className="font-bold text-slate-800">{rows.length} dépôt{rows.length > 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <span className="font-bold text-emerald-700">{nbComplets} complet{nbComplets > 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <span className="font-bold text-amber-700">{nbIncomplets} incomplet{nbIncomplets > 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5 text-blue-500" />
              <span className="font-bold text-blue-700">{nbRelances} relancé{nbRelances > 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              className="bg-transparent text-slate-700 font-semibold focus:outline-none"
            >
              <option value="">Tous les statuts</option>
              <option value="INCOMPLET">Dossier incomplet</option>
              <option value="COMPLET">Dossier complet</option>
              <option value="EN_ATTENTE">En attente</option>
              <option value="RELANCE_1">Relance 1</option>
              <option value="RELANCE_2">Relance 2</option>
              <option value="RELANCE_3">Relance 3</option>
              <option value="ABANDONNE">Abandonné</option>
            </select>
          </div>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-500">Aucun candidat</p>
            <p className="text-sm text-slate-400 mt-1">
              Créez des liens de dépôt pour recevoir des dossiers candidats.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                {filteredRows.length} candidat{filteredRows.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="divide-y divide-slate-50">
              {filteredRows.map((row) => {
                const expired = new Date(row.depot.expiresAt) < new Date();
                const emailVal = emailInputs[row.depot.token] || '';

                return (
                  <div
                    key={row.depot.token}
                    className={`px-5 py-4 hover:bg-slate-50/50 transition-colors ${
                      expired ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex flex-wrap items-center gap-4">
                      {/* Bien */}
                      <div className="flex-1 min-w-[180px]">
                        <p className="text-sm font-bold text-slate-800">{row.depot.bienAdresse}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {row.depot._count.fichiers} fichier{row.depot._count.fichiers !== 1 ? 's' : ''} reçu{row.depot._count.fichiers !== 1 ? 's' : ''}
                          {expired && ' · Expiré'}
                        </p>
                      </div>

                      {/* Email */}
                      <div className="w-48">
                        {row.relance ? (
                          <p className="text-sm text-slate-600 truncate">{row.relance.email}</p>
                        ) : (
                          <input
                            type="email"
                            placeholder="email@candidat.fr"
                            value={emailVal}
                            onChange={(e) =>
                              setEmailInputs((prev) => ({ ...prev, [row.depot.token]: e.target.value }))
                            }
                            className="w-full text-sm border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                          />
                        )}
                      </div>

                      {/* Completion */}
                      <div className="w-28">
                        <CompletionBar pct={row.completionPct} />
                      </div>

                      {/* Statut relance */}
                      <div className="w-28">
                        {statutBadge(row.relance?.statut || 'EN_ATTENTE')}
                        {row.relance?.derniereRelance && (
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {new Date(row.relance.derniereRelance).toLocaleDateString('fr-FR')}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5">
                        {row.completionPct < 100 && !expired && (
                          <button
                            onClick={() => handleOpenRelance(row)}
                            disabled={!emailInputs[row.depot.token]}
                            title={!emailInputs[row.depot.token] ? 'Saisissez l\'email du candidat' : 'Envoyer une relance'}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <Send className="w-3.5 h-3.5" />
                            Relancer
                          </button>
                        )}
                        {row.completionPct === 100 && (
                          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Complet
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Modal relance */}
        {relanceModal && (
          <RelanceCandidatModal
            depot={{ token: relanceModal.depot.token, bienAdresse: relanceModal.depot.bienAdresse }}
            email={emailInputs[relanceModal.depot.token] || relanceModal.relance?.email || ''}
            telephone={relanceModal.relance?.telephone || undefined}
            docsManquants={relanceModal.docsManquants}
            relance={relanceModal.relance}
            onClose={() => setRelanceModal(null)}
            onSent={() => {
              setRelanceModal(null);
              charger();
            }}
          />
        )}
      </div>
    </FeatureGate>
  );
}
