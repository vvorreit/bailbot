"use client";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";
import type { Toast as ToastT, ToastType } from "@/hooks/useToast";

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />,
  error: <XCircle className="w-5 h-5 text-red-500 shrink-0" />,
  warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
  info: <Info className="w-5 h-5 text-blue-500 shrink-0" />,
};

const bgColors: Record<ToastType, string> = {
  success: "bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800",
  error: "bg-red-50 border-red-200 dark:bg-red-900/30 dark:border-red-800",
  warning: "bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-800",
  info: "bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800",
};

interface ToastProps {
  toast: ToastT;
  onDismiss: (id: string) => void;
}

export function ToastItem({ toast, onDismiss }: ToastProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg animate-slide-in-toast ${bgColors[toast.type]}`}
    >
      {icons[toast.type]}
      <p className="text-sm text-slate-800 dark:text-slate-200 flex-1">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="Fermer la notification"
        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
