'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import type { Candidature, TypeBail } from '@/lib/db-local';

interface Props {
  candidature: Candidature;
  onOuvrir: (id: string) => void;
  onChangerStatut: (id: string, statut: Candidature['statut']) => void;
  typeBail?: TypeBail;
}

function getBailScoreColor(score?: number): string {
  if (!score) return 'bg-slate-200 text-slate-600';
  if (score >= 80) return 'bg-emerald-500 text-white';
  if (score >= 65) return 'bg-blue-500 text-white';
  if (score >= 50) return 'bg-amber-500 text-white';
  if (score >= 35) return 'bg-orange-500 text-white';
  return 'bg-red-500 text-white';
}

function getInitiales(dossier: Candidature['dossier']): string {
  const nom = dossier?.nom?.trim();
  const prenom = dossier?.prenom?.trim();
  if (nom && prenom) return `${prenom[0]}${nom[0]}`.toUpperCase();
  if (nom) return nom.slice(0, 2).toUpperCase();
  if (prenom) return prenom.slice(0, 2).toUpperCase();
  return '??';
}

function getNomComplet(dossier: Candidature['dossier']): string {
  const nom = dossier?.nom?.trim();
  const prenom = dossier?.prenom?.trim();
  if (nom && prenom) return `${prenom} ${nom}`.toUpperCase();
  if (nom) return nom.toUpperCase();
  if (prenom) return prenom.toUpperCase();
  return 'Locataire inconnu';
}

export default function KanbanCard({ candidature, onOuvrir, onChangerStatut, typeBail }: Props) {
  const [showTooltip, setShowTooltip] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: candidature.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const { dossier, bailScore, scoreGrade, eligibleVisale, alertesFraude, statut, completude, aGarant } = candidature;
  const initiales = getInitiales(dossier);
  const nomComplet = getNomComplet(dossier);
  const scoreColor = getBailScoreColor(bailScore);
  const typeContrat = dossier?.typeContrat?.trim() || '';
  const pct = completude?.pourcentage ?? 0;
  const manquants = completude?.manquants ?? [];
  const complet = pct === 100;

  // Nb docs présents sur nb total
  const totalDocs = 6;
  const docsOk = Math.round((pct / 100) * totalDocs);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow select-none"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className={`w-8 h-8 rounded-lg text-white flex items-center justify-center text-xs font-black shrink-0 ${
          typeBail === 'PROFESSIONNEL'
            ? 'bg-gradient-to-tr from-indigo-600 to-indigo-800'
            : 'bg-gradient-to-tr from-slate-700 to-slate-900'
        }`}>
          {initiales}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-black text-slate-800 truncate">{nomComplet}</p>
            {typeBail === 'PROFESSIONNEL' && (
              <span className="shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded-full bg-indigo-600 text-white">PRO</span>
            )}
          </div>
          {typeContrat && (
            <p className="text-[10px] text-slate-400 truncate">{typeContrat}</p>
          )}
        </div>
        {bailScore !== undefined && (
          <span className={`shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full ${scoreColor}`}>
            {bailScore}/100
          </span>
        )}
      </div>

      {/* Complétude */}
      <div
        className="relative mb-2"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-1.5">
          {complet ? (
            <span className="text-[11px] text-emerald-600 font-semibold">✅ Dossier complet ({docsOk}/{totalDocs} docs)</span>
          ) : (
            <span className="text-[11px] text-amber-600 font-semibold">⚠️ Incomplet ({docsOk}/{totalDocs} docs)</span>
          )}
        </div>
        {/* Barre de progression */}
        <div className="mt-1 h-1 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${complet ? 'bg-emerald-500' : 'bg-amber-400'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        {/* Tooltip docs manquants */}
        {showTooltip && !complet && manquants.length > 0 && (
          <div className="absolute bottom-full left-0 mb-1 z-50 bg-slate-900 text-white text-[10px] rounded-lg p-2 shadow-lg min-w-max">
            <p className="font-bold mb-1">Documents manquants :</p>
            {manquants.map((m) => (
              <p key={m}>• {m}</p>
            ))}
          </div>
        )}
      </div>

      {/* Infos */}
      <div className="flex items-center gap-2 flex-wrap mb-3">
        {eligibleVisale !== undefined ? (
          <span className="text-xs">
            {eligibleVisale ? '✅ Visale' : '❌ Visale'}
          </span>
        ) : (
          <span className="text-xs text-slate-400">? Visale</span>
        )}
        {alertesFraude !== undefined && (
          <span className={`text-xs font-semibold ${alertesFraude > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            ⚠️ {alertesFraude} alerte{alertesFraude > 1 ? 's' : ''}
          </span>
        )}
        {aGarant && (
          <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-semibold">🛡 Garant</span>
        )}
        {statut === 'en_analyse' && (
          <span className="text-xs text-blue-500">🔄 analyse</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
        <button
          onClick={() => onOuvrir(candidature.id)}
          className="flex-1 text-[11px] font-bold px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
        >
          {statut === 'complet' ? 'Valider' : statut === 'refuse' ? 'Archiver' : 'Ouvrir'}
        </button>
        {statut === 'complet' && (
          <button
            onClick={() => onChangerStatut(candidature.id, 'selectionne')}
            className="text-[11px] font-bold px-2 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-700 transition-colors"
          >
            ✓
          </button>
        )}
        {statut !== 'refuse' && (
          <button
            onClick={() => onChangerStatut(candidature.id, 'refuse')}
            className="text-[11px] font-bold px-2 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}
