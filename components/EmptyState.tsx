"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaHref?: string;
  ctaOnClick?: () => void;
}

export default function EmptyState({ icon: Icon, title, description, ctaLabel, ctaHref, ctaOnClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-slate-300" />
      </div>
      <p className="text-lg font-bold text-slate-700 mb-2">{title}</p>
      <p className="text-sm text-slate-500 mb-6 max-w-sm">{description}</p>
      {ctaLabel && ctaHref && (
        <Link
          href={ctaHref}
          className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
        >
          {ctaLabel}
        </Link>
      )}
      {ctaLabel && ctaOnClick && !ctaHref && (
        <button
          onClick={ctaOnClick}
          className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm"
        >
          {ctaLabel}
        </button>
      )}
    </div>
  );
}
