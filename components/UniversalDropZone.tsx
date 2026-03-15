'use client';

import { useState, useCallback, useId } from 'react';
import { useDropzone } from 'react-dropzone';
import { processDocument } from '@/lib/ocr';
import {
  detectDocumentType,
  parseDossier,
  DocumentType,
  DossierLocataire,
} from '@/lib/parsers';

// ─── Types ─────────────────────────────────────────────────────────────────────

type TypeDocument = 'CNI' | 'BULLETIN_PAIE' | 'AVIS_IMPOSITION' | 'RIB' | 'JUSTIFICATIF_DOMICILE' | 'INCONNU';
type DropType = 'cni' | 'bulletin' | 'avis_impo' | 'rib' | 'domicile';

interface FichierEnAttente {
  id: string;
  file: File;
  statut: 'attente' | 'ocr' | 'detection' | 'classifié' | 'inconnu';
  typeDetecte?: TypeDocument;
  texteOCR?: string;
  progress?: number;
  confidence?: number;
  label?: string;
}

interface FichierDossier {
  type: DropType;
  file: File;
}

interface Props {
  onDossierUpdate: (patch: Partial<DossierLocataire>) => void;
  onFilesUpdate: (files: FichierDossier[]) => void;
  disabled?: boolean;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const DOC_MAP: Record<TypeDocument, { label: string; icon: string; dropType: DropType; docType: DocumentType }> = {
  CNI:                    { label: 'CNI',                    icon: '🪪', dropType: 'cni',       docType: 'cni' },
  BULLETIN_PAIE:          { label: 'Bulletin de paie',       icon: '💼', dropType: 'bulletin',   docType: 'bulletin_paie' },
  AVIS_IMPOSITION:        { label: "Avis d'imposition",      icon: '📄', dropType: 'avis_impo',  docType: 'avis_imposition' },
  RIB:                    { label: 'RIB',                    icon: '🏦', dropType: 'rib',        docType: 'rib' },
  JUSTIFICATIF_DOMICILE:  { label: 'Justificatif domicile',  icon: '🏠', dropType: 'domicile',   docType: 'domicile' },
  INCONNU:                { label: 'Document inconnu',        icon: '❓', dropType: 'cni',        docType: 'inconnu' },
};

const MANUALLY_SELECTABLE: { value: TypeDocument; label: string }[] = [
  { value: 'CNI', label: '🪪 CNI' },
  { value: 'BULLETIN_PAIE', label: '💼 Bulletin de paie' },
  { value: 'AVIS_IMPOSITION', label: "📄 Avis d'imposition" },
  { value: 'RIB', label: '🏦 RIB' },
  { value: 'JUSTIFICATIF_DOMICILE', label: '🏠 Justificatif domicile' },
];

const STATUT_LABELS: Record<FichierEnAttente['statut'], string> = {
  attente: '⏳ En attente...',
  ocr: '🔍 OCR en cours...',
  detection: '🧠 Détection...',
  classifié: '✅ Classifié',
  inconnu: '⚠️ Non reconnu',
};

const STATUT_COLORS: Record<FichierEnAttente['statut'], string> = {
  attente: 'text-slate-500',
  ocr: 'text-blue-600',
  detection: 'text-purple-600',
  classifié: 'text-emerald-600',
  inconnu: 'text-amber-600',
};

function mapInternalType(t: DocumentType): TypeDocument {
  switch (t) {
    case 'cni': return 'CNI';
    case 'bulletin_paie': return 'BULLETIN_PAIE';
    case 'avis_imposition': return 'AVIS_IMPOSITION';
    case 'rib': return 'RIB';
    case 'domicile': return 'JUSTIFICATIF_DOMICILE';
    default: return 'INCONNU';
  }
}

function extractNomFromDossier(patch: Partial<DossierLocataire>): string {
  const parts = [patch.prenom, patch.nom].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : '';
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function UniversalDropZone({ onDossierUpdate, onFilesUpdate, disabled = false }: Props) {
  const [queue, setQueue] = useState<FichierEnAttente[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<FichierDossier[]>([]);
  const uid = useId();
  let counter = 0;

  const updateItem = useCallback((id: string, patch: Partial<FichierEnAttente>) => {
    setQueue((prev) => prev.map((item) => item.id === id ? { ...item, ...patch } : item));
  }, []);

  const processFile = useCallback(async (id: string, file: File) => {
    // 1. OCR
    updateItem(id, { statut: 'ocr', progress: 0 });

    let text = '';
    try {
      text = await processDocument(file, (pct) => {
        updateItem(id, { progress: pct });
      });
    } catch (err) {
      console.error('[UniversalDropZone] OCR error:', err);
      updateItem(id, { statut: 'inconnu' });
      return;
    }

    // 2. Detect type
    updateItem(id, { statut: 'detection', texteOCR: text });

    const internalType = detectDocumentType(text);
    const externalType = mapInternalType(internalType);

    if (externalType === 'INCONNU') {
      updateItem(id, { statut: 'inconnu', typeDetecte: 'INCONNU', texteOCR: text });
      return;
    }

    // 3. Parse & apply to dossier
    const info = DOC_MAP[externalType];
    const patch = parseDossier(text, info.docType);
    const nomExtrait = extractNomFromDossier(patch);
    const label = nomExtrait
      ? `${info.icon} ${info.label} — ${nomExtrait}`
      : `${info.icon} ${info.label}`;

    updateItem(id, { statut: 'classifié', typeDetecte: externalType, label });
    onDossierUpdate(patch);

    // 4. Track file for ZIP
    setUploadedFiles((prev) => {
      const filtered = prev.filter((f) => f.type !== info.dropType);
      const next = [...filtered, { type: info.dropType, file }];
      onFilesUpdate(next);
      return next;
    });
  }, [updateItem, onDossierUpdate, onFilesUpdate]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (disabled) return;

    const newItems: FichierEnAttente[] = acceptedFiles.map((file) => ({
      id: `${uid}-${++counter}-${Date.now()}`,
      file,
      statut: 'attente' as const,
      progress: 0,
    }));

    setQueue((prev) => [...prev, ...newItems]);

    // Process sequentially (avoid killing CPU with multiple OCR workers)
    (async () => {
      for (const item of newItems) {
        await processFile(item.id, item.file);
      }
    })();
  }, [disabled, processFile, uid]);

  const handleManualType = (id: string, typeStr: string) => {
    const type = typeStr as TypeDocument;
    const item = queue.find((i) => i.id === id);
    if (!item || !item.texteOCR) return;

    const info = DOC_MAP[type];
    const patch = parseDossier(item.texteOCR, info.docType);
    const nomExtrait = extractNomFromDossier(patch);
    const label = nomExtrait
      ? `${info.icon} ${info.label} — ${nomExtrait}`
      : `${info.icon} ${info.label}`;

    updateItem(id, { statut: 'classifié', typeDetecte: type, label });
    onDossierUpdate(patch);

    setUploadedFiles((prev) => {
      const filtered = prev.filter((f) => f.type !== info.dropType);
      const next = [...filtered, { type: info.dropType, file: item.file }];
      onFilesUpdate(next);
      return next;
    });
  };

  const handleRetryOCR = async (id: string) => {
    const item = queue.find((i) => i.id === id);
    if (!item) return;
    updateItem(id, { statut: 'attente', typeDetecte: undefined, texteOCR: undefined, label: undefined });
    await processFile(id, item.file);
  };

  const handleDismiss = (id: string) => {
    setQueue((prev) => prev.filter((i) => i.id !== id));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': [],
      'application/pdf': [],
    },
    multiple: true,
    disabled,
  });

  const hasItems = queue.length > 0;

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`
          relative flex flex-col items-center justify-center gap-3 p-8 rounded-2xl border-2 border-dashed
          cursor-pointer transition-all duration-200 select-none
          ${isDragActive
            ? 'border-emerald-500 bg-emerald-50 scale-[1.01]'
            : disabled
            ? 'border-slate-200 bg-slate-50 cursor-not-allowed opacity-50'
            : 'border-slate-300 bg-white hover:border-emerald-400 hover:bg-emerald-50/30'
          }
        `}
      >
        <input {...getInputProps()} />

        <div className="text-4xl">
          {isDragActive ? '📂' : '🗂️'}
        </div>

        <div className="text-center">
          <p className="text-base font-bold text-slate-800">
            {isDragActive ? 'Déposez vos documents ici !' : 'Déposez tous vos documents ici'}
          </p>
          <p className="text-sm text-slate-500 mt-1">
            BailBot les trie automatiquement
          </p>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap justify-center mt-1">
          {['🪪 CNI', '💼 Bulletins', "📄 Avis d'imposition", '🏦 RIB', '🏠 Domicile'].map((tag) => (
            <span key={tag} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[11px] font-semibold rounded-full">
              {tag}
            </span>
          ))}
        </div>

        <p className="text-[11px] text-slate-400 mt-1">
          PDF, JPG, PNG, WEBP • Plusieurs fichiers acceptés
        </p>
      </div>

      {/* Processing Queue */}
      {hasItems && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
            Tri en cours — {queue.filter((i) => i.statut === 'classifié').length}/{queue.length} classifié(s)
          </p>
          <div className="space-y-2">
            {queue.map((item) => (
              <div
                key={item.id}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl border transition-all
                  ${item.statut === 'classifié'
                    ? 'bg-emerald-50 border-emerald-200'
                    : item.statut === 'inconnu'
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-white border-slate-200'
                  }
                `}
              >
                {/* Spinner or icon */}
                <div className="shrink-0 w-8 h-8 flex items-center justify-center">
                  {(item.statut === 'ocr' || item.statut === 'detection' || item.statut === 'attente') ? (
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  ) : item.statut === 'classifié' ? (
                    <span className="text-xl">{item.typeDetecte ? DOC_MAP[item.typeDetecte].icon : '✅'}</span>
                  ) : (
                    <span className="text-xl">⚠️</span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {item.label || item.file.name}
                  </p>
                  {item.statut === 'ocr' && item.progress !== undefined && (
                    <div className="mt-1 h-1 bg-slate-200 rounded-full overflow-hidden w-full">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-200"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  )}
                  {item.statut !== 'ocr' && (
                    <p className={`text-[11px] font-semibold ${STATUT_COLORS[item.statut]}`}>
                      {STATUT_LABELS[item.statut]}
                    </p>
                  )}
                  {item.statut === 'ocr' && (
                    <p className="text-[11px] text-blue-600 font-semibold">
                      OCR… {item.progress ?? 0}%
                    </p>
                  )}
                </div>

                {/* Actions for unknown */}
                {item.statut === 'inconnu' && (
                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      defaultValue=""
                      onChange={(e) => { if (e.target.value) handleManualType(item.id, e.target.value); }}
                      className="text-xs border border-amber-300 rounded-lg px-2 py-1 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    >
                      <option value="" disabled>Choisir le type…</option>
                      {MANUALLY_SELECTABLE.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleRetryOCR(item.id)}
                      className="text-[11px] font-bold px-2 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 transition-colors"
                    >
                      🔄 Réessayer
                    </button>
                  </div>
                )}

                {/* Dismiss button */}
                {(item.statut === 'classifié' || item.statut === 'inconnu') && (
                  <button
                    onClick={() => handleDismiss(item.id)}
                    className="shrink-0 text-slate-300 hover:text-slate-500 transition-colors text-lg leading-none"
                    title="Retirer de la liste"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
