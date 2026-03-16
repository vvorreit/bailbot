"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  CheckCircle2,
  X,
  Camera,
  FileText,
  HardHat,
  Phone,
  Mail,
  Building2,
  Calendar,
  Euro,
  Shield,
  Check,
  Image,
} from "lucide-react";
import {
  getTravauxById,
  updateTravaux,
  deleteTravaux,
  addDevis,
  accepterDevis,
  deleteDevis,
  addPhoto,
  deletePhoto,
  getEdlForBien,
} from "@/app/actions/travaux";
import { compressImage } from "@/lib/compress-image";
import { Tooltip } from "@/components/ui/Tooltip";

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface DevisEntreprise {
  id: string;
  entrepriseNom: string;
  entrepriseTel: string | null;
  entrepriseEmail: string | null;
  entrepriseSiret: string | null;
  montantHT: number;
  montantTTC: number;
  tvaRate: number;
  dateDevis: string | null;
  validiteJours: number;
  statut: string;
  notes: string | null;
}

interface PhotoTravaux {
  id: string;
  url: string;
  type: string;
  description: string | null;
}

interface TravauxDoc {
  id: string;
  nom: string;
  type: string;
  url: string;
  taille: number | null;
}

interface TravauxFull {
  id: string;
  bienId: string;
  titre: string;
  description: string | null;
  statut: string;
  categorie: string;
  montantDevis: number | null;
  montantReel: number | null;
  budgetEstime: number | null;
  montantFinal: number | null;
  dateDebut: string | null;
  dateFin: string | null;
  dateFinReelle: string | null;
  artisanNom: string | null;
  artisanTel: string | null;
  artisanEmail: string | null;
  deductible: boolean;
  notes: string | null;
  edlEntreeId: string | null;
  edlSortieId: string | null;
  documents: TravauxDoc[];
  devis: DevisEntreprise[];
  photos: PhotoTravaux[];
}

interface EdlItem {
  id: string;
  type: string;
  date: string;
}

/* ─── Config ─────────────────────────────────────────────────────────────── */

const STATUT_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  A_FAIRE: { label: "À faire", bg: "bg-slate-100", text: "text-slate-700" },
  EN_COURS: { label: "En cours", bg: "bg-blue-100", text: "text-blue-700" },
  TERMINE: { label: "Terminé", bg: "bg-emerald-100", text: "text-emerald-700" },
  ANNULE: { label: "Annulé", bg: "bg-red-100", text: "text-red-600" },
};

const CATEGORIE_LABELS: Record<string, string> = {
  PLOMBERIE: "Plomberie", ELECTRICITE: "Électricité", CHAUFFAGE: "Chauffage",
  ISOLATION: "Isolation", TOITURE: "Toiture", MENUISERIE: "Menuiserie",
  PEINTURE: "Peinture", CARRELAGE: "Carrelage", SALLE_DE_BAIN: "Salle de bain",
  CUISINE: "Cuisine", EXTERIEUR: "Extérieur", AUTRE: "Autre",
};

const PHOTO_TABS = [
  { key: "avant", label: "Avant" },
  { key: "pendant", label: "Pendant" },
  { key: "apres", label: "Après" },
] as const;

function fmtDate(d: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function fmtMontant(v: number | null): string {
  if (v == null) return "—";
  return v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

/* ─── Page ────────────────────────────────────────────────────────────────── */

export default function TravauxDetailClient() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [travaux, setTravaux] = useState<TravauxFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [edlList, setEdlList] = useState<EdlItem[]>([]);
  const [showDevisForm, setShowDevisForm] = useState(false);
  const [showTerminerModal, setShowTerminerModal] = useState(false);
  const [photoTab, setPhotoTab] = useState<string>("avant");

  const load = useCallback(async () => {
    try {
      const data = await getTravauxById(id);
      if (!data) { router.push("/dashboard/travaux"); return; }
      setTravaux(data as unknown as TravauxFull);
      const edls = await getEdlForBien(data.bienId);
      setEdlList(edls as unknown as EdlItem[]);
    } catch {
      router.push("/dashboard/travaux");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete() {
    if (!confirm("Supprimer ce chantier et tous ses devis/photos/documents ?")) return;
    await deleteTravaux(id);
    router.push("/dashboard/travaux");
  }

  async function handleAccepterDevis(devisId: string) {
    await accepterDevis(devisId);
    load();
  }

  async function handleDeleteDevis(devisId: string) {
    if (!confirm("Supprimer ce devis ?")) return;
    await deleteDevis(devisId);
    load();
  }

  async function handleDeletePhoto(photoId: string) {
    if (!confirm("Supprimer cette photo ?")) return;
    await deletePhoto(photoId);
    load();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!travaux) return null;

  const statutCfg = STATUT_CONFIG[travaux.statut] || STATUT_CONFIG.A_FAIRE;
  const photosFiltered = travaux.photos.filter((p) => p.type === photoTab);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <Link href="/dashboard/travaux" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Retour aux travaux
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-black text-slate-900">{travaux.titre}</h1>
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${statutCfg.bg} ${statutCfg.text}`}>
              {statutCfg.label}
            </span>
            {travaux.deductible && (
              <Tooltip content="Travaux d'entretien et de réparation : déductibles des revenus fonciers (régime réel)">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold">
                  <Shield className="w-3 h-3" /> Déductible
                </span>
              </Tooltip>
            )}
          </div>
          <p className="text-sm text-slate-500">
            {CATEGORIE_LABELS[travaux.categorie] || travaux.categorie}
            {travaux.description && ` — ${travaux.description}`}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {travaux.statut !== "TERMINE" && travaux.statut !== "ANNULE" && (
            <button onClick={() => setShowTerminerModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-colors">
              <CheckCircle2 className="w-4 h-4" /> Terminer
            </button>
          )}
          <button onClick={handleDelete}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-bold transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Infos */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-4">Informations</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <InfoItem icon={<Calendar className="w-4 h-4" />} label="Début" value={fmtDate(travaux.dateDebut)} />
              <InfoItem icon={<Calendar className="w-4 h-4" />} label="Fin prévue" value={fmtDate(travaux.dateFin)} />
              <InfoItem icon={<Calendar className="w-4 h-4" />} label="Fin réelle" value={fmtDate(travaux.dateFinReelle)} />
              <InfoItem icon={<Euro className="w-4 h-4" />} label="Budget estimé" value={fmtMontant(travaux.budgetEstime)} />
              <InfoItem icon={<Euro className="w-4 h-4" />} label="Montant devis" value={fmtMontant(travaux.montantDevis)} />
              <InfoItem icon={<Euro className="w-4 h-4" />} label="Montant réel" value={fmtMontant(travaux.montantReel)} />
              <InfoItem icon={<Euro className="w-4 h-4" />} label="Montant final" value={fmtMontant(travaux.montantFinal)} />
              {travaux.artisanNom && (
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1"><HardHat className="w-4 h-4" /> Artisan</div>
                  <p className="text-sm font-bold text-slate-900">{travaux.artisanNom}</p>
                  {travaux.artisanTel && (
                    <a href={`tel:${travaux.artisanTel}`} className="flex items-center gap-1 text-xs text-emerald-600 hover:underline mt-0.5">
                      <Phone className="w-3 h-3" /> {travaux.artisanTel}
                    </a>
                  )}
                  {travaux.artisanEmail && (
                    <a href={`mailto:${travaux.artisanEmail}`} className="flex items-center gap-1 text-xs text-emerald-600 hover:underline mt-0.5">
                      <Mail className="w-3 h-3" /> {travaux.artisanEmail}
                    </a>
                  )}
                </div>
              )}
            </div>
            {travaux.notes && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <p className="text-xs font-bold text-slate-400 mb-1">Notes</p>
                <p className="text-sm text-slate-600 whitespace-pre-wrap">{travaux.notes}</p>
              </div>
            )}
          </div>

          {/* Devis */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-wider">
                Devis entreprises ({travaux.devis.length})
              </h2>
              <button onClick={() => setShowDevisForm(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors">
                <Plus className="w-3.5 h-3.5" /> Ajouter un devis
              </button>
            </div>

            {travaux.devis.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400">Aucun devis. Ajoutez des devis pour comparer les entreprises.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left px-3 py-2 text-xs font-black text-slate-400 uppercase">Entreprise</th>
                      <th className="text-right px-3 py-2 text-xs font-black text-slate-400 uppercase">HT</th>
                      <th className="text-right px-3 py-2 text-xs font-black text-slate-400 uppercase">TTC</th>
                      <th className="text-right px-3 py-2 text-xs font-black text-slate-400 uppercase">TVA</th>
                      <th className="text-center px-3 py-2 text-xs font-black text-slate-400 uppercase">Validité</th>
                      <th className="text-center px-3 py-2 text-xs font-black text-slate-400 uppercase">Statut</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {travaux.devis.map((d) => {
                      const isMin = d.montantTTC === Math.min(...travaux.devis.map((dd) => dd.montantTTC));
                      return (
                        <tr key={d.id} className={`hover:bg-slate-50/50 ${isMin ? "bg-emerald-50/30" : ""}`}>
                          <td className="px-3 py-3">
                            <p className="font-bold text-slate-900">{d.entrepriseNom}</p>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                              {d.entrepriseTel && <span>{d.entrepriseTel}</span>}
                              {d.entrepriseSiret && <span>SIRET: {d.entrepriseSiret}</span>}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-right font-mono text-slate-700">{fmtMontant(d.montantHT)}</td>
                          <td className="px-3 py-3 text-right font-mono font-bold text-slate-900">
                            {fmtMontant(d.montantTTC)}
                            {isMin && <span className="block text-[10px] text-emerald-600 font-bold">Moins cher</span>}
                          </td>
                          <td className="px-3 py-3 text-right text-xs text-slate-500">{d.tvaRate}%</td>
                          <td className="px-3 py-3 text-center text-xs text-slate-500">
                            {fmtDate(d.dateDevis)}
                            <span className="block text-[10px] text-slate-400">{d.validiteJours}j</span>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <DevisStatutBadge statut={d.statut} />
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-1">
                              {d.statut === "en_attente" && (
                                <button onClick={() => handleAccepterDevis(d.id)}
                                  className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors" title="Accepter ce devis">
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button onClick={() => handleDeleteDevis(d.id)}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors" title="Supprimer">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Photos */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-4">
              Photos ({travaux.photos.length})
            </h2>

            <div className="flex gap-2 mb-4">
              {PHOTO_TABS.map((tab) => {
                const count = travaux.photos.filter((p) => p.type === tab.key).length;
                return (
                  <button key={tab.key} onClick={() => setPhotoTab(tab.key)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors ${
                      photoTab === tab.key ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}>
                    {tab.label}
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${photoTab === tab.key ? "bg-white/20" : "bg-slate-200 text-slate-500"}`}>{count}</span>
                  </button>
                );
              })}
            </div>

            <PhotoUploader travauxId={travaux.id} type={photoTab} onUploaded={load} />

            {photosFiltered.length === 0 ? (
              <div className="text-center py-6">
                <Image className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400">
                  Aucune photo &laquo;&nbsp;{PHOTO_TABS.find((t) => t.key === photoTab)?.label}&nbsp;&raquo;
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mt-4">
                {photosFiltered.map((p) => (
                  <div key={p.id} className="relative group rounded-xl overflow-hidden border border-slate-100">
                    <img src={p.url} alt={p.description || "Photo"} className="w-full h-32 object-cover" />
                    {p.description && (
                      <p className="px-2 py-1.5 text-[10px] text-slate-500 truncate">{p.description}</p>
                    )}
                    <button onClick={() => handleDeletePhoto(p.id)}
                      className="absolute top-2 right-2 p-1 bg-black/50 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* EDL */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-4">
              <Building2 className="w-4 h-4 inline mr-1" /> Liens EDL
            </h2>
            {edlList.length === 0 ? (
              <p className="text-xs text-slate-400">Aucun EDL pour ce bien</p>
            ) : (
              <div className="space-y-2">
                {edlList.map((edl) => {
                  const isLinked = edl.id === travaux.edlEntreeId || edl.id === travaux.edlSortieId;
                  return (
                    <div key={edl.id} className={`flex items-center justify-between p-3 rounded-xl text-xs ${isLinked ? "bg-emerald-50 border border-emerald-200" : "bg-slate-50"}`}>
                      <div>
                        <span className={`font-bold ${edl.type === "ENTREE" ? "text-blue-600" : "text-orange-600"}`}>
                          {edl.type === "ENTREE" ? "Entrée" : "Sortie"}
                        </span>
                        <span className="text-slate-400 ml-2">{fmtDate(edl.date)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isLinked && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                        <LinkEdlButton edl={edl} travauxId={travaux.id}
                          currentEntreeId={travaux.edlEntreeId} currentSortieId={travaux.edlSortieId} onLinked={load} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Documents */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-4">
              Documents ({travaux.documents.length})
            </h2>
            {travaux.documents.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">Aucun document</p>
            ) : (
              <div className="space-y-2">
                {travaux.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-2 bg-slate-50 rounded-xl p-3">
                    <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-700 truncate">{doc.nom}</p>
                      <p className="text-[10px] text-slate-400">{doc.type}{doc.taille && ` — ${(doc.taille / 1024).toFixed(0)} Ko`}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showDevisForm && (
        <DevisFormModal travauxId={travaux.id} onClose={() => setShowDevisForm(false)}
          onSaved={() => { setShowDevisForm(false); load(); }} />
      )}
      {showTerminerModal && (
        <TerminerModal travaux={travaux} onClose={() => setShowTerminerModal(false)}
          onSaved={() => { setShowTerminerModal(false); load(); }} />
      )}
    </div>
  );
}

/* ─── Subcomponents ──────────────────────────────────────────────────────── */

function InfoItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">{icon} {label}</div>
      <p className="text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}

function DevisStatutBadge({ statut }: { statut: string }) {
  const cfg: Record<string, { label: string; cls: string }> = {
    en_attente: { label: "En attente", cls: "bg-slate-100 text-slate-600" },
    accepte: { label: "Accepté", cls: "bg-emerald-100 text-emerald-700" },
    refuse: { label: "Refusé", cls: "bg-red-100 text-red-600" },
  };
  const c = cfg[statut] || cfg.en_attente;
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${c.cls}`}>{c.label}</span>;
}

function LinkEdlButton({
  edl, travauxId, currentEntreeId, currentSortieId, onLinked,
}: {
  edl: EdlItem; travauxId: string; currentEntreeId: string | null; currentSortieId: string | null; onLinked: () => void;
}) {
  const isLinked = edl.id === currentEntreeId || edl.id === currentSortieId;

  async function handleLink() {
    const field = edl.type === "ENTREE" ? "edlEntreeId" : "edlSortieId";
    await updateTravaux(travauxId, { [field]: isLinked ? null : edl.id });
    onLinked();
  }

  return (
    <button onClick={handleLink}
      className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${
        isLinked ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
      }`}>
      {isLinked ? "Délier" : "Lier"}
    </button>
  );
}

/* ─── Photo Uploader ─────────────────────────────────────────────────────── */

function PhotoUploader({ travauxId, type, onUploaded }: { travauxId: string; type: string; onUploaded: () => void }) {
  const [uploading, setUploading] = useState(false);
  const [description, setDescription] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    try {
      const compressed = await compressImage(file, 1200, 0.75);
      await addPhoto(travauxId, { url: compressed.base64, type, description: description || undefined });
      setDescription("");
      onUploaded();
    } finally {
      setUploading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  return (
    <div className="flex items-center gap-2">
      <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optionnel)"
        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500" />
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />
      <button onClick={() => fileRef.current?.click()} disabled={uploading}
        className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors disabled:opacity-50">
        {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
        Photo
      </button>
    </div>
  );
}

/* ─── Devis Form Modal ───────────────────────────────────────────────────── */

function DevisFormModal({ travauxId, onClose, onSaved }: { travauxId: string; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    entrepriseNom: "", entrepriseTel: "", entrepriseEmail: "", entrepriseSiret: "",
    montantHT: "", tvaRate: "10", dateDevis: "", validiteJours: "30", notes: "",
  });

  const montantTTC = form.montantHT
    ? parseFloat(form.montantHT) * (1 + parseFloat(form.tvaRate || "10") / 100) : 0;

  function update(field: string, value: string) { setForm((p) => ({ ...p, [field]: value })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.entrepriseNom.trim() || !form.montantHT) return;
    setSaving(true);
    try {
      await addDevis(travauxId, {
        entrepriseNom: form.entrepriseNom,
        entrepriseTel: form.entrepriseTel || undefined,
        entrepriseEmail: form.entrepriseEmail || undefined,
        entrepriseSiret: form.entrepriseSiret || undefined,
        montantHT: parseFloat(form.montantHT),
        montantTTC,
        tvaRate: parseFloat(form.tvaRate || "10"),
        dateDevis: form.dateDevis || undefined,
        validiteJours: parseInt(form.validiteJours || "30"),
        notes: form.notes || undefined,
      });
      onSaved();
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-900">Ajouter un devis</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Entreprise *</label>
            <input type="text" value={form.entrepriseNom} onChange={(e) => update("entrepriseNom", e.target.value)} required
              placeholder="Martin Plomberie SARL"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Téléphone</label>
              <input type="tel" value={form.entrepriseTel} onChange={(e) => update("entrepriseTel", e.target.value)} placeholder="06 12 34 56 78"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Email</label>
              <input type="email" value={form.entrepriseEmail} onChange={(e) => update("entrepriseEmail", e.target.value)} placeholder="contact@entreprise.fr"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">SIRET</label>
            <input type="text" value={form.entrepriseSiret} onChange={(e) => update("entrepriseSiret", e.target.value)} placeholder="123 456 789 00012"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Montant HT *</label>
              <input type="number" step="0.01" min="0" value={form.montantHT} onChange={(e) => update("montantHT", e.target.value)} required placeholder="5000"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">TVA %</label>
              <select value={form.tvaRate} onChange={(e) => update("tvaRate", e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="5.5">5,5%</option>
                <option value="10">10%</option>
                <option value="20">20%</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">TTC</label>
              <p className="px-3.5 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-sm font-bold text-emerald-700">
                {montantTTC > 0 ? fmtMontant(montantTTC) : "—"}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Date du devis</label>
              <input type="date" value={form.dateDevis} onChange={(e) => update("dateDevis", e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">Validité (jours)</label>
              <input type="number" min="1" value={form.validiteJours} onChange={(e) => update("validiteJours", e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Notes</label>
            <textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} rows={2} placeholder="Remarques sur ce devis..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Annuler</button>
            <button type="submit" disabled={saving || !form.entrepriseNom.trim() || !form.montantHT}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-colors">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Ajouter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Terminer Modal ─────────────────────────────────────────────────────── */

function TerminerModal({ travaux, onClose, onSaved }: { travaux: TravauxFull; onClose: () => void; onSaved: () => void }) {
  const [saving, setSaving] = useState(false);
  const [dateFinReelle, setDateFinReelle] = useState(new Date().toISOString().split("T")[0]);
  const [montantFinal, setMontantFinal] = useState(travaux.montantReel?.toString() || travaux.montantDevis?.toString() || "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateTravaux(travaux.id, {
        statut: "TERMINE",
        dateFinReelle,
        montantFinal: montantFinal ? parseFloat(montantFinal) : null,
        montantReel: montantFinal ? parseFloat(montantFinal) : travaux.montantReel,
      });
      onSaved();
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-900">Terminer le chantier</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Date de fin réelle</label>
            <input type="date" value={dateFinReelle} onChange={(e) => setDateFinReelle(e.target.value)} required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">Montant final (€)</label>
            <input type="number" step="0.01" min="0" value={montantFinal} onChange={(e) => setMontantFinal(e.target.value)} placeholder="4800"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Annuler</button>
            <button type="submit" disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-colors">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              <CheckCircle2 className="w-4 h-4" /> Marquer terminé
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
