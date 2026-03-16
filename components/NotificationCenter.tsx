"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, AlertTriangle, Calendar, Stethoscope, ClipboardList, X } from "lucide-react";
import { getNotifications, type Notification } from "@/app/actions/notifications";

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getNotifications()
      .then(setNotifications)
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const nbDanger = notifications.filter((n) => n.severity === "danger").length;

  const iconMap: Record<string, React.ReactNode> = {
    loyer_retard: <AlertTriangle className="w-4 h-4 text-red-500" />,
    diagnostic_expirant: <Stethoscope className="w-4 h-4 text-amber-500" />,
    bail_fin: <Calendar className="w-4 h-4 text-orange-500" />,
    edl_planifier: <ClipboardList className="w-4 h-4 text-blue-500" />,
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {notifications.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center min-w-[18px] px-1">
            {notifications.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-80 max-w-80 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h3 className="text-sm font-black text-slate-900">Notifications</h3>
            <button onClick={() => setOpen(false)} className="p-1 rounded hover:bg-slate-100">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center">
                <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-400">Aucune notification</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 hover:bg-slate-50 transition-colors ${
                      n.severity === "danger" ? "border-l-2 border-red-500" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0">{iconMap[n.type]}</div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900">{n.titre}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{n.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
