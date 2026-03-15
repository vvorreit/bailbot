'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Plus,
  Trash2,
  Camera,
  X,
  FileText,
  Home,
  Gauge,
  PenTool,
  ClipboardCheck,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  listerBiens,
  creerEdl,
  type Bien,
  type EdlLocal,
} from '@/lib/db-local';
import {
  PIECES_PAR_DEFAUT,
  genererEdlPDF,
  type Piece,
  type EtatElement,
  type DonneesEDL,
} from '@/lib/generateur-edl';

/* ─── Constants ──────────────────────────────────────────────────────────────── */

const STEPS = [
  { label: 'Infos', icon: Home },
  { label: 'Pièces', icon: ClipboardCheck },
  { label: 'Compteurs', icon: Gauge },
  { label: 'Signatures', icon: PenTool },
  { label: 'Récap', icon: FileText },
];

const ETATS: EtatElement[] = ['Très bon', 'Bon', 'Usure normale', 'Mauvais état', 'À remplacer'];

const ETAT_COLORS: Record<EtatElement, string> = {
  'Très bon': 'bg-emerald-100 text-emerald-700 border-emerald-300',
  'Bon': 'bg-green-100 text-green-700 border-green-300',
  'Usure normale': 'bg-amber-100 text-amber-700 border-amber-300',
  'Mauvais état': 'bg-red-100 text-red-700 border-red-300',
  'À remplacer': 'bg-red-200 text-red-800 border-red-400',
};

const inputCls =
  'w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-gray-300 transition-all';
const labelCls = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1';

/* ─── Main Component ─────────────────────────────────────────────────────────── */

export default function EdlWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [biens, setBiens] = useState<Bien[]>([]);
  const [saving, setSaving] = useState(false);

  /* Step 1 — Infos générales */
  const [bienId, setBienId] = useState('');
  const [typeEdl, setTypeEdl] = useState<'ENTREE' | 'SORTIE'>('ENTREE');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [nomLocataire, setNomLocataire] = useState('');
  const [nomBailleur, setNomBailleur] = useState('');

  /* Step 2 — Pièces */
  const [pieces, setPieces] = useState<Piece[]>(() =>
    PIECES_PAR_DEFAUT.map((p) => ({
      ...p,
      elements: p.elements.map((e) => ({ ...e })),
    }))
  );

  /* Step 3 — Compteurs */
  const [compteurEauFroide, setCompteurEauFroide] = useState('');
  const [compteurEauChaude, setCompteurEauChaude] = useState('');
  const [compteurGaz, setCompteurGaz] = useState('');
  const [compteurElec, setCompteurElec] = useState('');
  const [photosCompteurs, setPhotosCompteurs] = useState<string[]>([]);

  /* Step 3 — Clés */
  const [nbCles, setNbCles] = useState(3);
  const [typeCles, setTypeCles] = useState('Porte d\'entrée');

  /* Step 4 — Signatures */
  const [signatureBailleur, setSignatureBailleur] = useState<string | undefined>();
  const [signatureLocataire, setSignatureLocataire] = useState<string | undefined>();

  /* Load biens */
  useEffect(() => {
    listerBiens().then((b) => {
      setBiens(b);
      if (b.length > 0 && !bienId) {
        setBienId(b[0].id);
        if (b[0].locataireNom) {
          setNomLocataire(`${b[0].locatairePrenom || ''} ${b[0].locataireNom}`.trim());
        }
      }
    });
  }, []);

  /* Auto-fill locataire when bien changes */
  const handleBienChange = (id: string) => {
    setBienId(id);
    const bien = biens.find((b) => b.id === id);
    if (bien?.locataireNom) {
      setNomLocataire(`${bien.locatairePrenom || ''} ${bien.locataireNom}`.trim());
    }
  };

  const selectedBien = biens.find((b) => b.id === bienId);

  /* ─── Navigation ───────────────────────────────────────────────────────── */

  const canNext = () => {
    if (step === 0) return bienId && date && nomLocataire;
    return true;
  };

  const next = () => {
    if (step < STEPS.length - 1 && canNext()) setStep(step + 1);
  };
  const prev = () => {
    if (step > 0) setStep(step - 1);
  };

  /* ─── Save ─────────────────────────────────────────────────────────────── */

  const buildDonnees = (): DonneesEDL => ({
    type: typeEdl,
    date,
    adresseBien: selectedBien?.adresse || '',
    nomBailleur,
    nomLocataire,
    pieces,
    compteurs: {
      eau: compteurEauFroide ? `Froide: ${compteurEauFroide} / Chaude: ${compteurEauChaude}` : '',
      gaz: compteurGaz,
      electricite: compteurElec,
    },
    cles: { nombre: nbCles, type: typeCles },
    signatureLocataire,
    signatureBailleur,
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await creerEdl({
        bienId,
        adresseBien: selectedBien?.adresse || '',
        type: typeEdl,
        date,
        nomLocataire,
        nomBailleur,
        pieces,
        compteurs: {
          eau: compteurEauFroide,
          gaz: compteurGaz,
          electricite: compteurElec,
          eauChaude: compteurEauChaude,
          photosCompteurs,
        },
        cles: { nombre: nbCles, type: typeCles },
        signatureLocataire,
        signatureBailleur,
      });

      router.push('/dashboard/etats-des-lieux');
    } catch (err) {
      console.error('Erreur sauvegarde EDL:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleExportPDF = () => {
    const donnees = buildDonnees();
    const blob = genererEdlPDF(donnees);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EDL_${typeEdl}_${date}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ─── Render ───────────────────────────────────────────────────────────── */

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <button
        onClick={() => router.push('/dashboard/etats-des-lieux')}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour aux états des lieux
      </button>

      <h1 className="text-2xl font-black text-slate-900 mb-6">
        Nouvel état des lieux
      </h1>

      {/* Stepper */}
      <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const done = i < step;
          const active = i === step;
          return (
            <button
              key={i}
              onClick={() => i < step && setStep(i)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                active
                  ? 'bg-emerald-600 text-white'
                  : done
                  ? 'bg-emerald-50 text-emerald-700 cursor-pointer hover:bg-emerald-100'
                  : 'bg-slate-100 text-slate-400 cursor-default'
              }`}
            >
              {done ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Icon className="w-3.5 h-3.5" />
              )}
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Step content */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6 mb-6">
        {step === 0 && (
          <StepInfos
            biens={biens}
            bienId={bienId}
            onBienChange={handleBienChange}
            typeEdl={typeEdl}
            onTypeChange={setTypeEdl}
            date={date}
            onDateChange={setDate}
            nomLocataire={nomLocataire}
            onNomLocataireChange={setNomLocataire}
            nomBailleur={nomBailleur}
            onNomBailleurChange={setNomBailleur}
          />
        )}
        {step === 1 && (
          <StepPieces pieces={pieces} onPiecesChange={setPieces} />
        )}
        {step === 2 && (
          <StepCompteurs
            eauFroide={compteurEauFroide}
            onEauFroideChange={setCompteurEauFroide}
            eauChaude={compteurEauChaude}
            onEauChaudeChange={setCompteurEauChaude}
            gaz={compteurGaz}
            onGazChange={setCompteurGaz}
            elec={compteurElec}
            onElecChange={setCompteurElec}
            photos={photosCompteurs}
            onPhotosChange={setPhotosCompteurs}
            nbCles={nbCles}
            onNbClesChange={setNbCles}
            typeCles={typeCles}
            onTypeClesChange={setTypeCles}
          />
        )}
        {step === 3 && (
          <StepSignatures
            signatureBailleur={signatureBailleur}
            onSignatureBailleurChange={setSignatureBailleur}
            signatureLocataire={signatureLocataire}
            onSignatureLocataireChange={setSignatureLocataire}
          />
        )}
        {step === 4 && (
          <StepRecap
            donnees={buildDonnees()}
            onExportPDF={handleExportPDF}
          />
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={prev}
          disabled={step === 0}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Précédent
        </button>

        {step < STEPS.length - 1 ? (
          <button
            onClick={next}
            disabled={!canNext()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Suivant
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Check className="w-4 h-4" />
            {saving ? 'Enregistrement…' : 'Enregistrer l\'EDL'}
          </button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   STEP 1 — Infos générales
   ═══════════════════════════════════════════════════════════════════════════════ */

function StepInfos({
  biens,
  bienId,
  onBienChange,
  typeEdl,
  onTypeChange,
  date,
  onDateChange,
  nomLocataire,
  onNomLocataireChange,
  nomBailleur,
  onNomBailleurChange,
}: {
  biens: Bien[];
  bienId: string;
  onBienChange: (id: string) => void;
  typeEdl: 'ENTREE' | 'SORTIE';
  onTypeChange: (t: 'ENTREE' | 'SORTIE') => void;
  date: string;
  onDateChange: (d: string) => void;
  nomLocataire: string;
  onNomLocataireChange: (n: string) => void;
  nomBailleur: string;
  onNomBailleurChange: (n: string) => void;
}) {
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-slate-900">Informations générales</h2>

      <div>
        <label className={labelCls}>Bien concerné</label>
        {biens.length === 0 ? (
          <p className="text-sm text-amber-600">
            Aucun bien enregistré. Ajoutez un bien dans l&apos;onglet Logements.
          </p>
        ) : (
          <select
            value={bienId}
            onChange={(e) => onBienChange(e.target.value)}
            className={inputCls}
          >
            {biens.map((b) => (
              <option key={b.id} value={b.id}>
                {b.adresse}
              </option>
            ))}
          </select>
        )}
      </div>

      <div>
        <label className={labelCls}>Type d&apos;état des lieux</label>
        <div className="flex gap-3">
          {(['ENTREE', 'SORTIE'] as const).map((t) => (
            <button
              key={t}
              onClick={() => onTypeChange(t)}
              className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                typeEdl === t
                  ? t === 'ENTREE'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-amber-500 bg-amber-50 text-amber-700'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
              }`}
            >
              {t === 'ENTREE' ? "Entrée" : 'Sortie'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Nom du locataire</label>
          <input
            type="text"
            value={nomLocataire}
            onChange={(e) => onNomLocataireChange(e.target.value)}
            placeholder="Jean Dupont"
            className={inputCls}
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>Nom du bailleur / propriétaire</label>
        <input
          type="text"
          value={nomBailleur}
          onChange={(e) => onNomBailleurChange(e.target.value)}
          placeholder="Marie Martin"
          className={inputCls}
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   STEP 2 — Pièces
   ═══════════════════════════════════════════════════════════════════════════════ */

function StepPieces({
  pieces,
  onPiecesChange,
}: {
  pieces: Piece[];
  onPiecesChange: (p: Piece[]) => void;
}) {
  const [expandedPiece, setExpandedPiece] = useState<number>(0);
  const [newPieceName, setNewPieceName] = useState('');

  const updateElement = (
    pieceIdx: number,
    elemIdx: number,
    field: string,
    value: string | string[]
  ) => {
    const next = pieces.map((p, pi) =>
      pi === pieceIdx
        ? {
            ...p,
            elements: p.elements.map((e, ei) =>
              ei === elemIdx ? { ...e, [field]: value } : e
            ),
          }
        : p
    );
    onPiecesChange(next);
  };

  const addPiece = () => {
    const name = newPieceName.trim();
    if (!name) return;
    const defaultElements = ['Murs', 'Sol', 'Plafond', 'Fenêtres', 'Prises électriques', 'Éclairage'];
    onPiecesChange([
      ...pieces,
      {
        nom: name,
        elements: defaultElements.map((n) => ({
          nom: n,
          etat: 'Bon' as EtatElement,
          commentaire: '',
          photos: [],
        })),
      },
    ]);
    setNewPieceName('');
    setExpandedPiece(pieces.length);
  };

  const removePiece = (idx: number) => {
    onPiecesChange(pieces.filter((_, i) => i !== idx));
    if (expandedPiece >= pieces.length - 1) setExpandedPiece(Math.max(0, pieces.length - 2));
  };

  const addElement = (pieceIdx: number) => {
    const next = pieces.map((p, pi) =>
      pi === pieceIdx
        ? {
            ...p,
            elements: [
              ...p.elements,
              { nom: 'Nouvel élément', etat: 'Bon' as EtatElement, commentaire: '', photos: [] },
            ],
          }
        : p
    );
    onPiecesChange(next);
  };

  const removeElement = (pieceIdx: number, elemIdx: number) => {
    const next = pieces.map((p, pi) =>
      pi === pieceIdx
        ? { ...p, elements: p.elements.filter((_, ei) => ei !== elemIdx) }
        : p
    );
    onPiecesChange(next);
  };

  const handlePhotoUpload = (pieceIdx: number, elemIdx: number) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files) return;
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          const current = pieces[pieceIdx].elements[elemIdx].photos;
          updateElement(pieceIdx, elemIdx, 'photos', [...current, base64]);
        };
        reader.readAsDataURL(file);
      });
    };
    input.click();
  };

  const removePhoto = (pieceIdx: number, elemIdx: number, photoIdx: number) => {
    const current = pieces[pieceIdx].elements[elemIdx].photos;
    updateElement(
      pieceIdx,
      elemIdx,
      'photos',
      current.filter((_, i) => i !== photoIdx)
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Pièces & éléments</h2>
        <span className="text-xs text-slate-400">{pieces.length} pièce(s)</span>
      </div>

      {/* Piece accordion */}
      {pieces.map((piece, pi) => (
        <div
          key={pi}
          className="border border-slate-200 rounded-xl overflow-hidden"
        >
          {/* Piece header */}
          <button
            onClick={() => setExpandedPiece(expandedPiece === pi ? -1 : pi)}
            className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-slate-900">{piece.nom}</span>
              <span className="text-xs text-slate-400">{piece.elements.length} éléments</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removePiece(pi);
                }}
                className="p-1 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              {expandedPiece === pi ? (
                <ChevronUp className="w-4 h-4 text-slate-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400" />
              )}
            </div>
          </button>

          {/* Piece content */}
          {expandedPiece === pi && (
            <div className="p-4 space-y-4">
              {piece.elements.map((elem, ei) => (
                <div key={ei} className="border border-slate-100 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={elem.nom}
                      onChange={(e) => updateElement(pi, ei, 'nom', e.target.value)}
                      className="text-sm font-semibold text-slate-800 bg-transparent border-none outline-none flex-1"
                    />
                    <button
                      onClick={() => removeElement(pi, ei)}
                      className="p-1 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* État selector */}
                  <div className="flex flex-wrap gap-1.5">
                    {ETATS.map((etat) => (
                      <button
                        key={etat}
                        onClick={() => updateElement(pi, ei, 'etat', etat)}
                        className={`px-2 py-1 rounded-lg text-xs font-semibold border transition-all ${
                          elem.etat === etat
                            ? ETAT_COLORS[etat]
                            : 'border-slate-200 text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        {etat}
                      </button>
                    ))}
                  </div>

                  {/* Notes */}
                  <textarea
                    value={elem.commentaire}
                    onChange={(e) => updateElement(pi, ei, 'commentaire', e.target.value)}
                    placeholder="Notes / observations…"
                    rows={2}
                    className={`${inputCls} resize-none`}
                  />

                  {/* Photos */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {elem.photos.map((photo, phi) => (
                      <div key={phi} className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200">
                        <img src={photo} alt="" className="w-full h-full object-cover" />
                        <button
                          onClick={() => removePhoto(pi, ei, phi)}
                          className="absolute top-0 right-0 bg-red-500 text-white rounded-bl-lg p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => handlePhotoUpload(pi, ei)}
                      className="w-16 h-16 rounded-lg border-2 border-dashed border-slate-200 hover:border-emerald-400 flex items-center justify-center text-slate-300 hover:text-emerald-500 transition-colors"
                    >
                      <Camera className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}

              <button
                onClick={() => addElement(pi)}
                className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Ajouter un élément
              </button>
            </div>
          )}
        </div>
      ))}

      {/* Add piece */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={newPieceName}
          onChange={(e) => setNewPieceName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addPiece()}
          placeholder="Nom de la pièce (ex: Cave, Garage…)"
          className={inputCls}
        />
        <button
          onClick={addPiece}
          disabled={!newPieceName.trim()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Ajouter
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   STEP 3 — Compteurs & clés
   ═══════════════════════════════════════════════════════════════════════════════ */

function StepCompteurs({
  eauFroide,
  onEauFroideChange,
  eauChaude,
  onEauChaudeChange,
  gaz,
  onGazChange,
  elec,
  onElecChange,
  photos,
  onPhotosChange,
  nbCles,
  onNbClesChange,
  typeCles,
  onTypeClesChange,
}: {
  eauFroide: string;
  onEauFroideChange: (v: string) => void;
  eauChaude: string;
  onEauChaudeChange: (v: string) => void;
  gaz: string;
  onGazChange: (v: string) => void;
  elec: string;
  onElecChange: (v: string) => void;
  photos: string[];
  onPhotosChange: (p: string[]) => void;
  nbCles: number;
  onNbClesChange: (n: number) => void;
  typeCles: string;
  onTypeClesChange: (t: string) => void;
}) {
  const handlePhotoUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files) return;
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = () => {
          onPhotosChange([...photos, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    };
    input.click();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-slate-900">Relevé des compteurs</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Eau froide (m³)</label>
          <input
            type="number"
            value={eauFroide}
            onChange={(e) => onEauFroideChange(e.target.value)}
            placeholder="0"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Eau chaude (m³)</label>
          <input
            type="number"
            value={eauChaude}
            onChange={(e) => onEauChaudeChange(e.target.value)}
            placeholder="0"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Gaz (m³)</label>
          <input
            type="number"
            value={gaz}
            onChange={(e) => onGazChange(e.target.value)}
            placeholder="0"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Électricité (kWh)</label>
          <input
            type="number"
            value={elec}
            onChange={(e) => onElecChange(e.target.value)}
            placeholder="0"
            className={inputCls}
          />
        </div>
      </div>

      {/* Photos compteurs */}
      <div>
        <label className={labelCls}>Photos des compteurs</label>
        <div className="flex items-center gap-2 flex-wrap">
          {photos.map((photo, i) => (
            <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200">
              <img src={photo} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => onPhotosChange(photos.filter((_, j) => j !== i))}
                className="absolute top-0 right-0 bg-red-500 text-white rounded-bl-lg p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          <button
            onClick={handlePhotoUpload}
            className="w-20 h-20 rounded-lg border-2 border-dashed border-slate-200 hover:border-emerald-400 flex flex-col items-center justify-center text-slate-300 hover:text-emerald-500 transition-colors gap-1"
          >
            <Camera className="w-5 h-5" />
            <span className="text-[10px] font-semibold">Photo</span>
          </button>
        </div>
      </div>

      {/* Clés */}
      <div className="border-t border-slate-100 pt-6">
        <h2 className="text-lg font-bold text-slate-900 mb-4">Remise des clés</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Nombre de clés</label>
            <input
              type="number"
              value={nbCles}
              onChange={(e) => onNbClesChange(parseInt(e.target.value) || 0)}
              min={0}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Type</label>
            <input
              type="text"
              value={typeCles}
              onChange={(e) => onTypeClesChange(e.target.value)}
              placeholder="Porte d'entrée, boîte aux lettres…"
              className={inputCls}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   STEP 4 — Signatures (canvas pad)
   ═══════════════════════════════════════════════════════════════════════════════ */

function SignaturePad({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: string;
  onChange: (data: string | undefined) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    isDrawing.current = true;
    lastPos.current = getPos(e);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing.current) return;
    e.preventDefault();
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    lastPos.current = pos;
  };

  const endDraw = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    const canvas = canvasRef.current!;
    onChange(canvas.toDataURL('image/png'));
  };

  const clear = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onChange(undefined);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (value) {
      const img = new Image();
      img.onload = () => {
        const ctx = canvas.getContext('2d')!;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
      };
      img.src = value;
    }
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className={labelCls}>{label}</label>
        <button
          onClick={clear}
          className="text-xs text-red-500 hover:text-red-600 font-semibold transition-colors"
        >
          Effacer
        </button>
      </div>
      <canvas
        ref={canvasRef}
        width={600}
        height={200}
        className="w-full h-32 border-2 border-slate-200 rounded-xl cursor-crosshair bg-white touch-none"
        onMouseDown={startDraw}
        onMouseMove={draw}
        onMouseUp={endDraw}
        onMouseLeave={endDraw}
        onTouchStart={startDraw}
        onTouchMove={draw}
        onTouchEnd={endDraw}
      />
      {value && (
        <p className="text-xs text-emerald-600 font-semibold mt-1">
          <Check className="w-3 h-3 inline mr-1" />
          Signature enregistrée
        </p>
      )}
    </div>
  );
}

function StepSignatures({
  signatureBailleur,
  onSignatureBailleurChange,
  signatureLocataire,
  onSignatureLocataireChange,
}: {
  signatureBailleur?: string;
  onSignatureBailleurChange: (s: string | undefined) => void;
  signatureLocataire?: string;
  onSignatureLocataireChange: (s: string | undefined) => void;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-slate-900">Signatures</h2>
      <p className="text-sm text-slate-500">
        Signez directement dans les zones ci-dessous. Utilisez la souris ou le doigt sur tablette.
      </p>

      <SignaturePad
        label="Signature du bailleur / propriétaire"
        value={signatureBailleur}
        onChange={onSignatureBailleurChange}
      />

      <SignaturePad
        label="Signature du locataire"
        value={signatureLocataire}
        onChange={onSignatureLocataireChange}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════
   STEP 5 — Récapitulatif
   ═══════════════════════════════════════════════════════════════════════════════ */

function StepRecap({
  donnees,
  onExportPDF,
}: {
  donnees: DonneesEDL;
  onExportPDF: () => void;
}) {
  const totalElements = donnees.pieces.reduce((sum, p) => sum + p.elements.length, 0);
  const totalPhotos = donnees.pieces.reduce(
    (sum, p) => sum + p.elements.reduce((s, e) => s + e.photos.length, 0),
    0
  );

  const etatStats = donnees.pieces.reduce(
    (acc, p) => {
      p.elements.forEach((e) => {
        acc[e.etat] = (acc[e.etat] || 0) + 1;
      });
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Récapitulatif</h2>
        <button
          onClick={onExportPDF}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
        >
          <FileText className="w-4 h-4" />
          Exporter PDF
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-50 rounded-xl p-3 text-center">
          <p className="text-2xl font-black text-slate-900">{donnees.pieces.length}</p>
          <p className="text-xs text-slate-500 font-semibold">Pièces</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-3 text-center">
          <p className="text-2xl font-black text-slate-900">{totalElements}</p>
          <p className="text-xs text-slate-500 font-semibold">Éléments</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-3 text-center">
          <p className="text-2xl font-black text-slate-900">{totalPhotos}</p>
          <p className="text-xs text-slate-500 font-semibold">Photos</p>
        </div>
        <div className="bg-slate-50 rounded-xl p-3 text-center">
          <p className="text-2xl font-black text-slate-900">{donnees.cles.nombre}</p>
          <p className="text-xs text-slate-500 font-semibold">Clés</p>
        </div>
      </div>

      {/* Info */}
      <div className="bg-slate-50 rounded-xl p-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Type</span>
          <span className={`font-bold ${donnees.type === 'ENTREE' ? 'text-emerald-600' : 'text-amber-600'}`}>
            {donnees.type === 'ENTREE' ? "État des lieux d'entrée" : 'État des lieux de sortie'}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Date</span>
          <span className="font-bold text-slate-900">
            {new Date(donnees.date).toLocaleDateString('fr-FR')}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Adresse</span>
          <span className="font-bold text-slate-900">{donnees.adresseBien || '—'}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Locataire</span>
          <span className="font-bold text-slate-900">{donnees.nomLocataire}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Bailleur</span>
          <span className="font-bold text-slate-900">{donnees.nomBailleur || '—'}</span>
        </div>
      </div>

      {/* État distribution */}
      {Object.keys(etatStats).length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-2">Répartition des états</h3>
          <div className="flex flex-wrap gap-2">
            {ETATS.filter((e) => etatStats[e]).map((etat) => (
              <span
                key={etat}
                className={`px-3 py-1 rounded-full text-xs font-bold border ${ETAT_COLORS[etat]}`}
              >
                {etat}: {etatStats[etat]}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Compteurs */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-2">Compteurs</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          {donnees.compteurs.eau && (
            <div className="bg-blue-50 rounded-lg px-3 py-2">
              <span className="text-blue-600 font-semibold">Eau : </span>
              <span className="text-blue-800">{donnees.compteurs.eau}</span>
            </div>
          )}
          {donnees.compteurs.gaz && (
            <div className="bg-orange-50 rounded-lg px-3 py-2">
              <span className="text-orange-600 font-semibold">Gaz : </span>
              <span className="text-orange-800">{donnees.compteurs.gaz}</span>
            </div>
          )}
          {donnees.compteurs.electricite && (
            <div className="bg-yellow-50 rounded-lg px-3 py-2">
              <span className="text-yellow-600 font-semibold">Élec : </span>
              <span className="text-yellow-800">{donnees.compteurs.electricite}</span>
            </div>
          )}
        </div>
      </div>

      {/* Signatures status */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-2">Signatures</h3>
        <div className="flex gap-3">
          <div
            className={`flex-1 rounded-xl p-3 text-center text-sm font-bold ${
              donnees.signatureBailleur
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-red-50 text-red-600'
            }`}
          >
            {donnees.signatureBailleur ? 'Bailleur ✓' : 'Bailleur — manquante'}
          </div>
          <div
            className={`flex-1 rounded-xl p-3 text-center text-sm font-bold ${
              donnees.signatureLocataire
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-red-50 text-red-600'
            }`}
          >
            {donnees.signatureLocataire ? 'Locataire ✓' : 'Locataire — manquante'}
          </div>
        </div>
      </div>
    </div>
  );
}
