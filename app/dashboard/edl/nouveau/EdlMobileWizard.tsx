'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Plus,
  Camera,
  X,
  Home,
  Gauge,
  PenTool,
  ClipboardCheck,
  FileText,
  Send,
  Loader2,
} from 'lucide-react';
import PieceEDL, { type PieceData, type EtatElement } from '@/components/edl/PieceEDL';
import { createEDL, sendEdlByEmail, getBiensForEdl, getBailsForBien } from '@/app/actions/edl';
import { genererEdlPDF, PIECES_PAR_DEFAUT, type DonneesEDL } from '@/lib/generateur-edl';
import { compressImage, formatSize } from '@/lib/compress-image';

/* ─── Constants ──────────────────────────────────────────────────────────── */

const STEPS = [
  { label: 'Infos', icon: Home },
  { label: 'Compteurs', icon: Gauge },
  { label: 'Pièces', icon: ClipboardCheck },
  { label: 'Signatures', icon: PenTool },
  { label: 'Récap', icon: FileText },
];

const inputCls =
  'w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-gray-300 transition-all';
const labelCls = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1';

/* ─── Main Component ─────────────────────────────────────────────────────── */

export default function EdlMobileWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  /* Biens & bails from server */
  const [biensList, setBiensList] = useState<{ id: string; adresse: string; locataireNom?: string | null }[]>([]);
  const [bailsList, setBailsList] = useState<{ id: string; locataireNom: string; statut: string }[]>([]);

  /* Step 1 — Infos */
  const [bienId, setBienId] = useState('');
  const [bailId, setBailId] = useState('');
  const [typeEdl, setTypeEdl] = useState<'ENTREE' | 'SORTIE'>('ENTREE');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [heure, setHeure] = useState('10:00');
  const [nomLocataire, setNomLocataire] = useState('');
  const [nomBailleur, setNomBailleur] = useState('');

  /* Step 2 — Compteurs */
  const [compteurEauFroide, setCompteurEauFroide] = useState('');
  const [compteurEauChaude, setCompteurEauChaude] = useState('');
  const [compteurGaz, setCompteurGaz] = useState('');
  const [compteurElec, setCompteurElec] = useState('');
  const [photosCompteurs, setPhotosCompteurs] = useState<string[]>([]);
  const [nbCles, setNbCles] = useState(3);
  const [typeCles, setTypeCles] = useState("Porte d'entrée");

  /* Step 3 — Pièces */
  const [pieces, setPieces] = useState<PieceData[]>(() =>
    PIECES_PAR_DEFAUT.map((p) => ({
      nom: p.nom,
      elements: p.elements.map((e) => ({ ...e })),
    }))
  );
  const [expandedPiece, setExpandedPiece] = useState(0);

  /* Compression info */
  const [compressionInfoCompteur, setCompressionInfoCompteur] = useState<string | null>(null);

  /* Step 4 — Signatures */
  const [signatureBailleur, setSignatureBailleur] = useState<string | undefined>();
  const [signatureLocataire, setSignatureLocataire] = useState<string | undefined>();

  /* Load biens */
  useEffect(() => {
    getBiensForEdl().then((biens) => {
      setBiensList(biens);
      const prefill = searchParams.get('bienId');
      if (prefill && biens.find((b) => b.id === prefill)) {
        setBienId(prefill);
      } else if (biens.length > 0 && !bienId) {
        setBienId(biens[0].id);
      }
    });
  }, []);

  /* Load bails when bien changes */
  useEffect(() => {
    if (!bienId) return;
    getBailsForBien(bienId).then((bails) => {
      setBailsList(bails);
      if (bails.length > 0) {
        setBailId(bails[0].id);
        setNomLocataire(bails[0].locataireNom);
      }
    });
    const bien = biensList.find((b) => b.id === bienId);
    if (bien?.locataireNom) {
      setNomLocataire(bien.locataireNom);
    }
  }, [bienId, biensList]);

  /* ─── Navigation ──────────────────────────────────────────────────────── */

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

  /* ─── Build data ─────────────────────────────────────────────────────── */

  const buildDonnees = (): DonneesEDL => ({
    type: typeEdl,
    date,
    adresseBien: biensList.find((b) => b.id === bienId)?.adresse || '',
    nomBailleur,
    nomLocataire,
    pieces: pieces.map((p) => ({
      nom: p.nom,
      elements: p.elements.map((e) => ({
        nom: e.nom,
        etat: e.etat as EtatElement,
        commentaire: e.commentaire,
        photos: e.photos,
      })),
    })),
    compteurs: {
      eau: compteurEauFroide ? `Froide: ${compteurEauFroide} / Chaude: ${compteurEauChaude}` : '',
      gaz: compteurGaz,
      electricite: compteurElec,
    },
    cles: { nombre: nbCles, type: typeCles },
    signatureLocataire,
    signatureBailleur,
  });

  /* ─── Save ───────────────────────────────────────────────────────────── */

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await createEDL({
        bienId,
        bailId: bailId || undefined,
        type: typeEdl,
        date,
        heure,
        locataireNom: nomLocataire,
        bailleurNom: nomBailleur,
        pieces,
        compteurs: {
          eauFroide: compteurEauFroide,
          eauChaude: compteurEauChaude,
          gaz: compteurGaz,
          electricite: compteurElec,
          photosCompteurs,
        },
        cles: { nombre: nbCles, type: typeCles },
        signatureLocataire,
        signatureBailleur,
      });

      if ('id' in result) {
        setSavedId(result.id);
      }
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

  const handleSendEmail = async () => {
    if (!savedId) return;
    const bail = bailsList.find((b) => b.id === bailId);
    await sendEdlByEmail(savedId, '', '');
  };

  /* ─── Photo compteur ─────────────────────────────────────────────────── */

  const handleCompteurPhoto = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.setAttribute('capture', 'environment');
    input.multiple = true;
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files) return;
      for (const file of Array.from(files)) {
        try {
          const result = await compressImage(file, 1200, 0.75);
          setPhotosCompteurs((prev) => [...prev, result.base64]);
          setCompressionInfoCompteur(`${formatSize(result.originalSize)} → ${formatSize(result.compressedSize)}`);
          setTimeout(() => setCompressionInfoCompteur(null), 3000);
        } catch {
          const reader = new FileReader();
          reader.onload = () => setPhotosCompteurs((prev) => [...prev, reader.result as string]);
          reader.readAsDataURL(file);
        }
      }
    };
    input.click();
  };

  /* ─── Add piece ──────────────────────────────────────────────────────── */

  const [newPieceName, setNewPieceName] = useState('');

  const addPiece = () => {
    const name = newPieceName.trim();
    if (!name) return;
    const defaultElements = ['Murs', 'Sol', 'Plafond', 'Fenêtres', 'Prises électriques', 'Éclairage'];
    setPieces([
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

  /* ─── Render ─────────────────────────────────────────────────────────── */

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24">
      {/* Header */}
      <button
        onClick={() => router.push('/dashboard/etats-des-lieux')}
        className="flex items-center gap-2 text-sm text-slate-500 active:text-slate-700 mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour
      </button>

      <h1 className="text-xl font-black text-slate-900 mb-4">
        Nouvel état des lieux
      </h1>

      {/* Stepper — scrollable horizontalement */}
      <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-2 -mx-2 px-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const done = i < step;
          const active = i === step;
          return (
            <button
              key={i}
              onClick={() => i < step && setStep(i)}
              className={`flex items-center gap-1 px-2.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                active
                  ? 'bg-emerald-600 text-white'
                  : done
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-slate-100 text-slate-400'
              }`}
            >
              {done ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          );
        })}
      </div>

      {/* Step content */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-6 mb-4">
        {/* Step 0: Infos */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Informations générales</h2>

            <div>
              <label className={labelCls}>Bien concerné</label>
              {biensList.length === 0 ? (
                <p className="text-sm text-amber-600">Aucun bien. Ajoutez-en un dans Logements.</p>
              ) : (
                <select value={bienId} onChange={(e) => setBienId(e.target.value)} className={inputCls}>
                  {biensList.map((b) => (
                    <option key={b.id} value={b.id}>{b.adresse}</option>
                  ))}
                </select>
              )}
            </div>

            {bailsList.length > 0 && (
              <div>
                <label className={labelCls}>Bail associé (optionnel)</label>
                <select value={bailId} onChange={(e) => setBailId(e.target.value)} className={inputCls}>
                  <option value="">— Aucun —</option>
                  {bailsList.map((b) => (
                    <option key={b.id} value={b.id}>{b.locataireNom} ({b.statut})</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className={labelCls}>Type</label>
              <div className="flex gap-3">
                {(['ENTREE', 'SORTIE'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTypeEdl(t)}
                    className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${
                      typeEdl === t
                        ? t === 'ENTREE'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-amber-500 bg-amber-50 text-amber-700'
                        : 'border-slate-200 bg-white text-slate-500'
                    }`}
                  >
                    {t === 'ENTREE' ? "Entrée" : 'Sortie'}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Heure</label>
                <input type="time" value={heure} onChange={(e) => setHeure(e.target.value)} className={inputCls} />
              </div>
            </div>

            <div>
              <label className={labelCls}>Locataire</label>
              <input type="text" value={nomLocataire} onChange={(e) => setNomLocataire(e.target.value)} placeholder="Nom du locataire" className={inputCls} />
            </div>

            <div>
              <label className={labelCls}>Bailleur</label>
              <input type="text" value={nomBailleur} onChange={(e) => setNomBailleur(e.target.value)} placeholder="Nom du bailleur" className={inputCls} />
            </div>
          </div>
        )}

        {/* Step 1: Compteurs */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-slate-900">Relevé des compteurs</h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Eau froide (m³)</label>
                <input type="number" value={compteurEauFroide} onChange={(e) => setCompteurEauFroide(e.target.value)} placeholder="0" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Eau chaude (m³)</label>
                <input type="number" value={compteurEauChaude} onChange={(e) => setCompteurEauChaude(e.target.value)} placeholder="0" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Gaz (m³)</label>
                <input type="number" value={compteurGaz} onChange={(e) => setCompteurGaz(e.target.value)} placeholder="0" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Électricité (kWh)</label>
                <input type="number" value={compteurElec} onChange={(e) => setCompteurElec(e.target.value)} placeholder="0" className={inputCls} />
              </div>
            </div>

            {/* Photos compteurs */}
            <div>
              <label className={labelCls}>Photos des compteurs</label>
              <div className="flex items-center gap-2 flex-wrap">
                {photosCompteurs.map((photo, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200">
                    <img src={photo} alt="" className="w-full h-full object-cover" loading="lazy" />
                    <button
                      onClick={() => setPhotosCompteurs(photosCompteurs.filter((_, j) => j !== i))}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-bl-lg p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={handleCompteurPhoto}
                  className="w-20 h-20 rounded-lg border-2 border-dashed border-slate-200 active:border-emerald-400 flex flex-col items-center justify-center text-slate-300 active:text-emerald-500 transition-colors gap-0.5"
                >
                  <Camera className="w-5 h-5" />
                  <span className="text-[10px] font-semibold">Photo</span>
                </button>
              </div>
              {photosCompteurs.length > 0 && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="text-[10px] text-emerald-600 font-semibold">Photos optimisees pour le PDF</span>
                  {compressionInfoCompteur && (
                    <span className="text-[10px] text-slate-400 font-medium">({compressionInfoCompteur})</span>
                  )}
                </div>
              )}
            </div>

            {/* Clés */}
            <div className="border-t border-slate-100 pt-5">
              <h3 className="text-base font-bold text-slate-900 mb-3">Remise des clés</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Nombre</label>
                  <input type="number" value={nbCles} onChange={(e) => setNbCles(parseInt(e.target.value) || 0)} min={0} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Type</label>
                  <input type="text" value={typeCles} onChange={(e) => setTypeCles(e.target.value)} placeholder="Porte d'entrée…" className={inputCls} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Pièces */}
        {step === 2 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Pièces</h2>
              <span className="text-xs text-slate-400">{pieces.length} pièce(s)</span>
            </div>

            {pieces.map((piece, pi) => (
              <PieceEDL
                key={pi}
                piece={piece}
                index={pi}
                expanded={expandedPiece === pi}
                onToggle={() => setExpandedPiece(expandedPiece === pi ? -1 : pi)}
                onChange={(updated) => setPieces(pieces.map((p, i) => i === pi ? updated : p))}
                onRemove={() => {
                  setPieces(pieces.filter((_, i) => i !== pi));
                  if (expandedPiece >= pieces.length - 1) setExpandedPiece(Math.max(0, pieces.length - 2));
                }}
              />
            ))}

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newPieceName}
                onChange={(e) => setNewPieceName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addPiece()}
                placeholder="Nom de la pièce…"
                className={inputCls}
              />
              <button
                onClick={addPiece}
                disabled={!newPieceName.trim()}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 active:bg-emerald-700 disabled:opacity-40 transition-colors whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4" />
                Ajouter
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Signatures */}
        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-slate-900">Signatures</h2>
            <p className="text-sm text-slate-500">
              Signez avec le doigt directement sur l&apos;écran.
            </p>
            <SignaturePad label="Signature du bailleur" value={signatureBailleur} onChange={setSignatureBailleur} />
            <SignaturePad label="Signature du locataire" value={signatureLocataire} onChange={setSignatureLocataire} />
          </div>
        )}

        {/* Step 4: Récap */}
        {step === 4 && (
          <RecapStep
            donnees={buildDonnees()}
            onExportPDF={handleExportPDF}
            onSave={handleSave}
            onSendEmail={handleSendEmail}
            saving={saving}
            savedId={savedId}
          />
        )}
      </div>

      {/* Navigation buttons — sticky en bas */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-3 flex items-center justify-between z-40 safe-area-bottom md:static md:border-0 md:p-0 md:bg-transparent">
        <button
          onClick={prev}
          disabled={step === 0}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-600 bg-white border border-slate-200 disabled:opacity-40 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Préc.
        </button>

        {step < STEPS.length - 1 ? (
          <button
            onClick={next}
            disabled={!canNext()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 active:bg-emerald-700 disabled:opacity-40 transition-colors"
          >
            Suivant
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSave}
            disabled={saving || !!savedId}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 active:bg-emerald-700 disabled:opacity-40 transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {savedId ? 'Enregistré' : saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Signature Pad — touch-optimized
   ═══════════════════════════════════════════════════════════════════════════ */

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
    ctx.lineWidth = 2.5;
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

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className={labelCls}>{label}</label>
        <button onClick={clear} className="text-xs text-red-500 font-semibold">Effacer</button>
      </div>
      <canvas
        ref={canvasRef}
        width={600}
        height={200}
        className="w-full h-28 sm:h-32 border-2 border-slate-200 rounded-xl cursor-crosshair bg-white touch-none"
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

/* ═══════════════════════════════════════════════════════════════════════════
   Step 5 — Récap
   ═══════════════════════════════════════════════════════════════════════════ */

function RecapStep({
  donnees,
  onExportPDF,
  onSave,
  onSendEmail,
  saving,
  savedId,
}: {
  donnees: DonneesEDL;
  onExportPDF: () => void;
  onSave: () => void;
  onSendEmail: () => void;
  saving: boolean;
  savedId: string | null;
}) {
  const totalElements = donnees.pieces.reduce((sum, p) => sum + p.elements.length, 0);
  const totalPhotos = donnees.pieces.reduce(
    (sum, p) => sum + p.elements.reduce((s, e) => s + e.photos.length, 0),
    0
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-bold text-slate-900">Récapitulatif</h2>
        <div className="flex gap-2">
          <button
            onClick={onExportPDF}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 active:bg-emerald-700 transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            PDF
          </button>
          {savedId && (
            <button
              onClick={onSendEmail}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 active:bg-blue-700 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              Envoyer
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { val: donnees.pieces.length, label: 'Pièces' },
          { val: totalElements, label: 'Éléments' },
          { val: totalPhotos, label: 'Photos' },
          { val: donnees.cles.nombre, label: 'Clés' },
        ].map((s) => (
          <div key={s.label} className="bg-slate-50 rounded-xl p-2 text-center">
            <p className="text-xl font-black text-slate-900">{s.val}</p>
            <p className="text-[10px] text-slate-500 font-semibold">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Infos */}
      <div className="bg-slate-50 rounded-xl p-3 space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-500">Type</span>
          <span className={`font-bold ${donnees.type === 'ENTREE' ? 'text-emerald-600' : 'text-amber-600'}`}>
            {donnees.type === 'ENTREE' ? "Entrée" : 'Sortie'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Date</span>
          <span className="font-bold text-slate-900">{new Date(donnees.date).toLocaleDateString('fr-FR')}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Adresse</span>
          <span className="font-bold text-slate-900 text-right max-w-[60%] truncate">{donnees.adresseBien || '—'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Locataire</span>
          <span className="font-bold text-slate-900">{donnees.nomLocataire}</span>
        </div>
      </div>

      {/* Signatures */}
      <div className="flex gap-2">
        <div className={`flex-1 rounded-xl p-2 text-center text-xs font-bold ${
          donnees.signatureBailleur ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
        }`}>
          Bailleur {donnees.signatureBailleur ? '✓' : '—'}
        </div>
        <div className={`flex-1 rounded-xl p-2 text-center text-xs font-bold ${
          donnees.signatureLocataire ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
        }`}>
          Locataire {donnees.signatureLocataire ? '✓' : '—'}
        </div>
      </div>

      {savedId && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
          <p className="text-sm font-bold text-emerald-700">EDL enregistré avec succès</p>
        </div>
      )}
    </div>
  );
}
