"use client";

import { BailScore } from "@/lib/bailscore";

interface Props {
  score: BailScore | null;
  onExportPDF?: () => void;
}

const GRADE_COLORS: Record<BailScore["grade"], { bg: string; text: string; ring: string; stroke: string }> = {
  EXCELLENT:    { bg: "bg-emerald-50",  text: "text-emerald-700",  ring: "ring-emerald-200", stroke: "#10b981" },
  BON:          { bg: "bg-sky-50",      text: "text-sky-700",      ring: "ring-sky-200",     stroke: "#0ea5e9" },
  ACCEPTABLE:   { bg: "bg-amber-50",    text: "text-amber-700",    ring: "ring-amber-200",   stroke: "#f59e0b" },
  FAIBLE:       { bg: "bg-orange-50",   text: "text-orange-700",   ring: "ring-orange-200",  stroke: "#f97316" },
  INSUFFISANT:  { bg: "bg-red-50",      text: "text-red-700",      ring: "ring-red-200",     stroke: "#ef4444" },
};

const DIMENSIONS = [
  { key: "solvabilite",  label: "Solvabilité",     max: 40, emoji: "💰" },
  { key: "stabilite",   label: "Stabilité",        max: 30, emoji: "📋" },
  { key: "completude",  label: "Complétude",       max: 20, emoji: "📁" },
  { key: "profil",      label: "Profil",           max: 10, emoji: "👤" },
] as const;

function CircularScore({ total, stroke }: { total: number; stroke: string }) {
  const R = 52;
  const C = 2 * Math.PI * R;
  const offset = C - (total / 100) * C;

  return (
    <svg width="140" height="140" viewBox="0 0 140 140" className="rotate-[-90deg]">
      {/* Track */}
      <circle cx="70" cy="70" r={R} fill="none" stroke="#e5e7eb" strokeWidth="12" />
      {/* Progress */}
      <circle
        cx="70" cy="70" r={R}
        fill="none"
        stroke={stroke}
        strokeWidth="12"
        strokeDasharray={C}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.7s ease" }}
      />
      {/* Text — rotate back to normal */}
      <text
        x="70" y="70"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="28"
        fontWeight="800"
        fill="#1e293b"
        style={{ transform: "rotate(90deg)", transformOrigin: "70px 70px" }}
      >
        {total}
      </text>
    </svg>
  );
}

function DimBar({ label, emoji, score, max }: { label: string; emoji: string; score: number; max: number }) {
  const pct = Math.round((score / max) * 100);
  const barColor = pct >= 75 ? "bg-emerald-400" : pct >= 50 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-xs font-semibold text-slate-600">{emoji} {label}</span>
        <span className="text-xs font-bold text-slate-800">{score}/{max}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function BailScoreCard({ score, onExportPDF }: Props) {
  if (!score) return null;

  const colors = GRADE_COLORS[score.grade];

  const handlePrint = () => {
    if (onExportPDF) {
      onExportPDF();
    } else {
      window.print();
    }
  };

  return (
    <div className={`bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden`}>
      {/* Header */}
      <div className={`${colors.bg} px-5 py-4 flex items-center justify-between`}>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">BailScore™</p>
          <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ring-1 ${colors.ring} ${colors.text} ${colors.bg}`}>
            {score.grade}
          </span>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-slate-600 text-[11px] font-bold hover:bg-slate-50 border border-slate-200 transition-colors shadow-sm"
        >
          📄 Exporter PDF
        </button>
      </div>

      <div className="p-5 space-y-5">
        {/* Score circulaire + recommandation */}
        <div className="flex items-center gap-5">
          <div className="shrink-0">
            <CircularScore total={score.total} stroke={colors.stroke} />
          </div>
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-700 leading-snug">{score.recommandation}</p>
          </div>
        </div>

        {/* Barres dimensions */}
        <div className="space-y-3 pt-1 border-t border-slate-50">
          {DIMENSIONS.map(({ key, label, max, emoji }) => (
            <DimBar
              key={key}
              label={label}
              emoji={emoji}
              score={score.dimensions[key].score}
              max={max}
            />
          ))}
        </div>

        {/* Points forts */}
        {score.pointsForts.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Points forts</p>
            <ul className="space-y-1">
              {score.pointsForts.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                  <span className="text-emerald-500 shrink-0">✅</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Points d'attention */}
        {score.pointsAttention.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Points d'attention</p>
            <ul className="space-y-1">
              {score.pointsAttention.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-700">
                  <span className="text-amber-500 shrink-0">⚠️</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
