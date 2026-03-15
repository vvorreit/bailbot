'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Home,
  FileText,
  Calendar,
  Euro,
  Download,
  Loader2,
  AlertCircle,
  MessageSquare,
  Send,
  Clock,
  User,
} from 'lucide-react';

interface BailInfo {
  locataireNom: string;
  locataireEmail: string;
  adresseBien: string;
  dateSignature: string;
  dateDebut: string;
  dateFin: string | null;
  loyerMensuel: number;
  chargesMensuelles: number;
  indiceRevision: string;
  dateProchRevision: string;
  statut: string;
  colocataires?: { nom: string; prenom: string }[];
}

interface Quittance {
  mois: string;
  label: string;
  envoye: boolean;
}

interface GestionnaireInfo {
  nom: string;
  email: string | null;
}

interface Document {
  id: string;
  date: string;
  pdfUrl: string | null;
}

export default function EspaceLocatairePage() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bail, setBail] = useState<BailInfo | null>(null);
  const [gestionnaire, setGestionnaire] = useState<GestionnaireInfo | null>(null);
  const [quittances, setQuittances] = useState<Quittance[]>([]);
  const [documents, setDocuments] = useState<{ quittances: any[]; edlEntree: Document | null }>({ quittances: [], edlEntree: null });
  const [loyerInfo, setLoyerInfo] = useState({ loyerMensuel: 0, chargesMensuelles: 0 });

  const [activeTab, setActiveTab] = useState<'bail' | 'quittances' | 'echeances' | 'demandes'>('bail');
  const [demandeType, setDemandeType] = useState('QUESTION');
  const [demandeMessage, setDemandeMessage] = useState('');
  const [sendingDemande, setSendingDemande] = useState(false);
  const [demandeSent, setDemandeSent] = useState(false);

  useEffect(() => {
    loadData();
  }, [token]);

  async function loadData() {
    setLoading(true);
    try {
      const [resInfo, resBail, resQuittances, resDocs] = await Promise.all([
        fetch(`/api/locataire/${token}`),
        fetch(`/api/locataire/${token}/bail`),
        fetch(`/api/locataire/${token}/quittances`),
        fetch(`/api/locataire/${token}/documents`),
      ]);

      if (!resInfo.ok) {
        const data = await resInfo.json();
        throw new Error(data.error || 'Espace introuvable');
      }

      const infoData = await resInfo.json();
      setGestionnaire(infoData.gestionnaire);

      if (resBail.ok) {
        const bailData = await resBail.json();
        setBail(bailData.bail);
      }

      if (resQuittances.ok) {
        const qData = await resQuittances.json();
        setQuittances(qData.quittances || []);
        setLoyerInfo({ loyerMensuel: qData.loyerMensuel || 0, chargesMensuelles: qData.chargesMensuelles || 0 });
      }

      if (resDocs.ok) {
        const dData = await resDocs.json();
        setDocuments(dData.documents || { quittances: [], edlEntree: null });
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendDemande() {
    if (!demandeMessage.trim()) return;
    setSendingDemande(true);
    try {
      const res = await fetch(`/api/locataire/${token}/demandes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: demandeType, message: demandeMessage }),
      });
      if (res.ok) {
        setDemandeSent(true);
        setDemandeMessage('');
        setTimeout(() => setDemandeSent(false), 3000);
      }
    } finally {
      setSendingDemande(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-red-200 p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-lg font-bold text-slate-900 mb-2">Espace indisponible</h1>
          <p className="text-sm text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <User className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900">Mon espace locataire</h1>
              <p className="text-xs text-slate-400">{bail?.locataireNom}</p>
            </div>
          </div>
          {gestionnaire && (
            <p className="text-xs text-slate-400 mt-1">
              Gestionnaire : {gestionnaire.nom}
              {gestionnaire.email && <> &middot; {gestionnaire.email}</>}
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 flex gap-0">
          {[
            { key: 'bail', label: 'Mon bail', icon: <FileText className="w-4 h-4" /> },
            { key: 'quittances', label: 'Quittances', icon: <Euro className="w-4 h-4" /> },
            { key: 'echeances', label: 'Échéances', icon: <Calendar className="w-4 h-4" /> },
            { key: 'demandes', label: 'Contact', icon: <MessageSquare className="w-4 h-4" /> },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* Tab: Mon bail */}
        {activeTab === 'bail' && bail && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Home className="w-4 h-4 text-emerald-600" />
                Informations du bail
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <InfoItem label="Adresse" value={bail.adresseBien} />
                <InfoItem label="Statut" value={bail.statut} />
                <InfoItem label="Date de début" value={new Date(bail.dateDebut).toLocaleDateString('fr-FR')} />
                <InfoItem label="Date de fin" value={bail.dateFin ? new Date(bail.dateFin).toLocaleDateString('fr-FR') : 'Pas de terme'} />
                <InfoItem label="Loyer HC" value={`${bail.loyerMensuel.toLocaleString('fr-FR')} €`} />
                <InfoItem label="Charges" value={`${bail.chargesMensuelles.toLocaleString('fr-FR')} €`} />
                <InfoItem
                  label="Loyer CC total"
                  value={`${(bail.loyerMensuel + bail.chargesMensuelles).toLocaleString('fr-FR')} €`}
                />
                <InfoItem label="Indice" value={bail.indiceRevision} />
              </div>

              {bail.colocataires && bail.colocataires.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <h3 className="text-xs font-bold text-slate-500 mb-2">Colocataires</h3>
                  <div className="flex flex-wrap gap-2">
                    {bail.colocataires.map((c, i) => (
                      <span key={i} className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                        {c.prenom} {c.nom}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Documents */}
            {documents.edlEntree && (
              <div className="bg-white rounded-2xl border border-slate-100 p-6">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4">Documents</h2>
                <div className="bg-slate-50 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-700">État des lieux d&apos;entrée</p>
                    <p className="text-xs text-slate-400">{new Date(documents.edlEntree.date).toLocaleDateString('fr-FR')}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab: Quittances */}
        {activeTab === 'quittances' && (
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Euro className="w-4 h-4 text-blue-600" />
              Mes quittances
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Loyer mensuel : {loyerInfo.loyerMensuel.toLocaleString('fr-FR')} € HC + {loyerInfo.chargesMensuelles.toLocaleString('fr-FR')} € charges
            </p>
            {quittances.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">Aucune quittance disponible</p>
            ) : (
              <div className="space-y-2">
                {quittances.map((q) => (
                  <div
                    key={q.mois}
                    className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-700 capitalize">{q.label}</p>
                      <p className="text-xs text-slate-400">{q.mois}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {q.envoye ? (
                        <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-bold">Envoyée</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full font-bold">En attente</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab: Échéances */}
        {activeTab === 'echeances' && bail && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-100 p-6">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                Mes échéances
              </h2>
              <div className="space-y-3">
                <EcheanceItem
                  label="Prochain loyer"
                  date={getProchainLoyer()}
                  montant={`${(bail.loyerMensuel + bail.chargesMensuelles).toLocaleString('fr-FR')} €`}
                />
                <EcheanceItem
                  label="Prochaine révision du loyer"
                  date={new Date(bail.dateProchRevision).toLocaleDateString('fr-FR')}
                  detail={`Indice ${bail.indiceRevision}`}
                />
                {bail.dateFin && (
                  <EcheanceItem
                    label="Fin du bail"
                    date={new Date(bail.dateFin).toLocaleDateString('fr-FR')}
                    detail="Pensez au renouvellement"
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Demandes */}
        {activeTab === 'demandes' && (
          <div className="bg-white rounded-2xl border border-slate-100 p-6">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              Contacter mon gestionnaire
            </h2>

            {demandeSent && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-4 text-sm text-emerald-700 font-medium">
                Demande envoyée avec succès.
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Type de demande</label>
                <select
                  value={demandeType}
                  onChange={(e) => setDemandeType(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
                >
                  <option value="QUESTION">Question</option>
                  <option value="DOCUMENT">Demande de document</option>
                  <option value="TRAVAUX">Signalement de travaux</option>
                  <option value="CONGE">Congé</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Message</label>
                <textarea
                  value={demandeMessage}
                  onChange={(e) => setDemandeMessage(e.target.value)}
                  rows={4}
                  placeholder="Décrivez votre demande..."
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
                />
              </div>
              <button
                onClick={handleSendDemande}
                disabled={sendingDemande || !demandeMessage.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {sendingDemande ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Envoyer
              </button>
            </div>
          </div>
        )}
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

function EcheanceItem({ label, date, montant, detail }: { label: string; date: string; montant?: string; detail?: string }) {
  return (
    <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3">
      <div>
        <p className="text-sm font-bold text-slate-700">{label}</p>
        <p className="text-xs text-slate-400">{date}</p>
      </div>
      {montant && <span className="text-sm font-black text-slate-900">{montant}</span>}
      {detail && <span className="text-xs text-slate-500">{detail}</span>}
    </div>
  );
}

function getProchainLoyer(): string {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return next.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}
