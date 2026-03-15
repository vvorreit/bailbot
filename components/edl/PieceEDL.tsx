'use client';

import { useState, useRef } from 'react';
import { Camera, Plus, Trash2, X, ChevronDown, ChevronUp } from 'lucide-react';

export type EtatElement = 'Très bon' | 'Bon' | 'Usure normale' | 'Mauvais état' | 'À remplacer';

export interface ElementPiece {
  nom: string;
  etat: EtatElement;
  commentaire: string;
  photos: string[];
}

export interface PieceData {
  nom: string;
  elements: ElementPiece[];
}

const ETATS: EtatElement[] = ['Très bon', 'Bon', 'Usure normale', 'Mauvais état', 'À remplacer'];

const ETAT_COLORS: Record<EtatElement, string> = {
  'Très bon': 'bg-emerald-100 text-emerald-700 border-emerald-300',
  'Bon': 'bg-green-100 text-green-700 border-green-300',
  'Usure normale': 'bg-amber-100 text-amber-700 border-amber-300',
  'Mauvais état': 'bg-red-100 text-red-700 border-red-300',
  'À remplacer': 'bg-red-200 text-red-800 border-red-400',
};

const ETAT_SCORES: Record<EtatElement, number> = {
  'Très bon': 4,
  'Bon': 3,
  'Usure normale': 2,
  'Mauvais état': 1,
  'À remplacer': 0,
};

export function etatToScore(etat: EtatElement): number {
  return ETAT_SCORES[etat] ?? 2;
}

export function scoreToEtat(score: number): EtatElement {
  if (score >= 4) return 'Très bon';
  if (score >= 3) return 'Bon';
  if (score >= 2) return 'Usure normale';
  if (score >= 1) return 'Mauvais état';
  return 'À remplacer';
}

interface Props {
  piece: PieceData;
  index: number;
  expanded: boolean;
  onToggle: () => void;
  onChange: (piece: PieceData) => void;
  onRemove: () => void;
}

export default function PieceEDL({ piece, index, expanded, onToggle, onChange, onRemove }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activePhotoUpload, setActivePhotoUpload] = useState<number | null>(null);

  const updateElement = (elemIdx: number, field: string, value: string | string[]) => {
    const next = {
      ...piece,
      elements: piece.elements.map((e, i) =>
        i === elemIdx ? { ...e, [field]: value } : e
      ),
    };
    onChange(next);
  };

  const addElement = () => {
    onChange({
      ...piece,
      elements: [
        ...piece.elements,
        { nom: 'Nouvel élément', etat: 'Bon', commentaire: '', photos: [] },
      ],
    });
  };

  const removeElement = (elemIdx: number) => {
    onChange({
      ...piece,
      elements: piece.elements.filter((_, i) => i !== elemIdx),
    });
  };

  const handlePhotoCapture = (elemIdx: number) => {
    setActivePhotoUpload(elemIdx);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || activePhotoUpload === null) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        const elem = piece.elements[activePhotoUpload!];
        if (elem) {
          updateElement(activePhotoUpload!, 'photos', [...elem.photos, base64]);
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const removePhoto = (elemIdx: number, photoIdx: number) => {
    const elem = piece.elements[elemIdx];
    updateElement(elemIdx, 'photos', elem.photos.filter((_, i) => i !== photoIdx));
  };

  const avgScore = piece.elements.length > 0
    ? piece.elements.reduce((sum, e) => sum + etatToScore(e.etat), 0) / piece.elements.length
    : 3;

  const avgLabel = scoreToEtat(Math.round(avgScore));

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 active:bg-slate-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-slate-900">{piece.nom}</span>
          <span className="text-xs text-slate-400">{piece.elements.length} éléments</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${ETAT_COLORS[avgLabel]}`}>
            {avgLabel}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="p-1 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {/* Content */}
      {expanded && (
        <div className="p-3 space-y-3">
          {piece.elements.map((elem, ei) => (
            <div key={ei} className="border border-slate-100 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  value={elem.nom}
                  onChange={(e) => updateElement(ei, 'nom', e.target.value)}
                  className="text-sm font-semibold text-slate-800 bg-transparent border-none outline-none flex-1 min-w-0"
                />
                <button
                  onClick={() => removeElement(ei)}
                  className="p-1 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* État selector — scrollable horizontalement sur mobile */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
                {ETATS.map((etat) => (
                  <button
                    key={etat}
                    onClick={() => updateElement(ei, 'etat', etat)}
                    className={`shrink-0 px-2 py-1 rounded-lg text-xs font-semibold border transition-all ${
                      elem.etat === etat
                        ? ETAT_COLORS[etat]
                        : 'border-slate-200 text-slate-400 active:border-slate-300'
                    }`}
                  >
                    {etat}
                  </button>
                ))}
              </div>

              {/* Commentaire */}
              <textarea
                value={elem.commentaire}
                onChange={(e) => updateElement(ei, 'commentaire', e.target.value)}
                placeholder="Notes / observations…"
                rows={2}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />

              {/* Photos */}
              <div className="flex items-center gap-2 flex-wrap">
                {elem.photos.map((photo, phi) => (
                  <div key={phi} className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200">
                    <img src={photo} alt="" className="w-full h-full object-cover" loading="lazy" />
                    <button
                      onClick={() => removePhoto(ei, phi)}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-bl-lg p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => handlePhotoCapture(ei)}
                  className="w-16 h-16 rounded-lg border-2 border-dashed border-slate-200 active:border-emerald-400 flex flex-col items-center justify-center text-slate-300 active:text-emerald-500 transition-colors gap-0.5"
                >
                  <Camera className="w-5 h-5" />
                  <span className="text-[9px] font-semibold">Photo</span>
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={addElement}
            className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 active:text-emerald-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Ajouter un élément
          </button>
        </div>
      )}
    </div>
  );
}
