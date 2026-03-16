"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2, FileSearch, Home, FileSignature, Banknote, Calculator,
  Users, MessageSquare, ClipboardList, Wrench, Layers, BarChart2,
  Settings, ShieldCheck, CreditCard, LogOut, ChevronsLeft, ChevronsRight,
  Menu, X, TrendingUp, Mail, Lock, Bell,
} from "lucide-react";
import { createPortalSession } from "@/app/dashboard/actions";
import MessageTemplates from "@/components/MessageTemplates";
import RevisionLoyerModal from "@/components/RevisionLoyerModal";
import { getNbImpayes } from "@/app/actions/stats-nav";
import { hasAccess, METIER_LABELS } from "@/lib/features";
import { Tooltip } from "@/components/ui/Tooltip";
import type { LucideIcon } from "lucide-react";

const SIDEBAR_KEY = "sidebar-collapsed";

interface NavGroup {
  label: string;
  items: { href: string; label: string; icon: LucideIcon; badge?: number; show: boolean }[];
}

export default function Sidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [nbImpayes, setNbImpayes] = useState(0);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  const user = session?.user as any;
  const isAdmin = user?.role === "ADMIN";
  const showTeam = Boolean(session);
  const isPro = user?.isPro;
  const metier = user?.metier ?? null;

  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_KEY);
    if (stored === "true") setIsCollapsed(true);
  }, []);

  useEffect(() => {
    getNbImpayes().then(setNbImpayes).catch(() => {});
  }, []);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_KEY, String(next));
      return next;
    });
  }, []);

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const { url } = await createPortalSession();
      if (url) window.location.href = url;
    } catch {
      alert("Aucun abonnement actif trouvé.");
    } finally {
      setPortalLoading(false);
    }
  };

  const initials = user?.name
    ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? "?";

  const isActive = (href: string) =>
    pathname === href || (href !== "/dashboard" && pathname.startsWith(href));

  const navGroups: NavGroup[] = [
    {
      label: "CANDIDATURES",
      items: [
        { href: "/dashboard/analyse", label: "Analyser un dossier", icon: FileSearch, show: true },
        { href: "/dashboard/depot", label: "Tous les candidats", icon: Users, show: true },
      ],
    },
    {
      label: "BIENS",
      items: [
        { href: "/dashboard", label: "Mes biens", icon: Home, show: hasAccess(metier, "MES_LOGEMENTS") },
        { href: "/dashboard/copro", label: "Copropriete", icon: Building2, show: hasAccess(metier, "ANALYSE_COPRO") },
      ],
    },
    {
      label: "GESTION",
      items: [
        { href: "/dashboard/bails", label: "Baux actifs", icon: FileSignature, show: hasAccess(metier, "VIE_DU_BAIL") },
        { href: "/dashboard/impayes", label: "Paiements & impayes", icon: Banknote, badge: nbImpayes, show: hasAccess(metier, "DASHBOARD_IMPAYES") || hasAccess(metier, "SUIVI_PAIEMENTS") },
        { href: "/dashboard/comptabilite", label: "Comptabilite", icon: Calculator, show: hasAccess(metier, "COMPTABILITE_FISCALE") },

        { href: "/dashboard/espaces-locataires", label: "Demandes locataires", icon: MessageSquare, show: hasAccess(metier, "ESPACE_LOCATAIRE") },
      ],
    },
    {
      label: "OUTILS",
      items: [
        { href: "/dashboard/etats-des-lieux", label: "Etats des lieux", icon: ClipboardList, show: hasAccess(metier, "ETAT_DES_LIEUX") },
        { href: "/dashboard/travaux", label: "Travaux", icon: Wrench, show: hasAccess(metier, "MES_LOGEMENTS") },
        { href: "/dashboard/multi", label: "Multi-dossiers", icon: Layers, show: hasAccess(metier, "KANBAN_CANDIDATS") },
        { href: "/dashboard/stats", label: "Statistiques", icon: BarChart2, show: hasAccess(metier, "STATS_DASHBOARD") },
      ],
    },
    {
      label: "COMPTE",
      items: [
        { href: "/dashboard/account", label: "Parametres", icon: Settings, show: true },
        { href: "/dashboard/team", label: "Equipe", icon: Users, show: showTeam && hasAccess(metier, "MULTI_USERS") },
        ...(isAdmin ? [{ href: "/admin", label: "Administration", icon: ShieldCheck, show: true }] : []),
      ],
    },
  ];

  const visibleGroups = navGroups
    .map((g) => ({ ...g, items: g.items.filter((i) => i.show) }))
    .filter((g) => g.items.length > 0);

  function NavItem({ href, label, icon: Icon, badge, onClick }: {
    href: string; label: string; icon: LucideIcon; badge?: number; onClick?: () => void;
  }) {
    const active = isActive(href);
    const linkContent = (
      <Link
        href={href}
        onClick={onClick}
        aria-current={active ? "page" : undefined}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors relative ${
          active
            ? "bg-emerald-50 text-emerald-700 border-l-[3px] border-emerald-600 pl-[9px]"
            : "text-slate-600 hover:bg-slate-100"
        } ${isCollapsed && !mobileOpen ? "justify-center px-0 mx-2" : ""}`}
      >
        <Icon className="w-[18px] h-[18px] shrink-0" aria-hidden="true" />
        {(!isCollapsed || mobileOpen) && (
          <>
            <span className="truncate">{label}</span>
            {badge != null && badge > 0 && (
              <span className="ml-auto bg-red-500 text-white text-[10px] rounded-full px-1.5 py-0.5 leading-none font-bold">
                {badge}
              </span>
            )}
          </>
        )}
        {isCollapsed && !mobileOpen && badge != null && badge > 0 && (
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
        )}
      </Link>
    );

    if (isCollapsed && !mobileOpen) {
      return <Tooltip content={label} position="right">{linkContent}</Tooltip>;
    }
    return linkContent;
  }

  function ActionButton({ label, icon: Icon, onClick }: {
    label: string; icon: LucideIcon; onClick: () => void;
  }) {
    const btn = (
      <button
        onClick={onClick}
        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors w-full ${
          isCollapsed && !mobileOpen ? "justify-center px-0 mx-2" : ""
        }`}
      >
        <Icon className="w-[18px] h-[18px] shrink-0" aria-hidden="true" />
        {(!isCollapsed || mobileOpen) && <span>{label}</span>}
      </button>
    );
    if (isCollapsed && !mobileOpen) {
      return <Tooltip content={label} position="right">{btn}</Tooltip>;
    }
    return btn;
  }

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className={`flex items-center h-14 border-b border-slate-200 shrink-0 ${isCollapsed && !mobileOpen ? "justify-center px-2" : "px-4 gap-3"}`}>
        <Link href="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-3">
          <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-emerald-200 shrink-0">
            <Building2 className="w-5 h-5" aria-hidden="true" />
          </div>
          {(!isCollapsed || mobileOpen) && (
            <span className="text-lg font-black tracking-tight text-slate-900">BailBot</span>
          )}
        </Link>
        {mobileOpen && (
          <button onClick={() => setMobileOpen(false)} className="ml-auto p-1.5 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-600" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-4" aria-label="Navigation principale">
        {visibleGroups.map((group) => (
          <div key={group.label}>
            {(!isCollapsed || mobileOpen) && (
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-3 py-1 mb-1">
                {group.label}
              </p>
            )}
            {isCollapsed && !mobileOpen && group !== visibleGroups[0] && (
              <div className="mx-3 mb-2 border-t border-slate-100" />
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavItem
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  badge={item.badge}
                  onClick={() => setMobileOpen(false)}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Quick actions */}
        <div className={`border-t border-slate-100 pt-3 ${isCollapsed && !mobileOpen ? "" : "mt-2"}`}>
          {(!isCollapsed || mobileOpen) && (
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-3 py-1 mb-1">
              RAPIDE
            </p>
          )}
          <ActionButton label="Revision IRL" icon={TrendingUp} onClick={() => { setMobileOpen(false); setRevisionOpen(true); }} />
          <ActionButton label="Messages" icon={Mail} onClick={() => { setMobileOpen(false); setMessagesOpen(true); }} />
        </div>
      </nav>

      {/* User section at bottom */}
      <div className="border-t border-slate-200 shrink-0">
        {/* User info */}
        <div className={`flex items-center gap-3 p-3 ${isCollapsed && !mobileOpen ? "justify-center" : ""}`}>
          <div className="w-8 h-8 bg-gradient-to-tr from-slate-700 to-slate-900 rounded-xl flex items-center justify-center text-white text-xs font-black shrink-0">
            {user?.image ? (
              <img src={user.image} alt={`Photo de ${user.name || "profil"}`} className="w-8 h-8 rounded-xl object-cover" loading="lazy" />
            ) : (
              initials
            )}
          </div>
          {(!isCollapsed || mobileOpen) && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-slate-900 truncate">{user?.name || "Mon compte"}</p>
              <div className="flex items-center gap-1.5">
                {isPro && (
                  <span className="px-1.5 py-0.5 bg-emerald-600 text-white text-[9px] font-black rounded-full uppercase">PRO</span>
                )}
                {metier && (
                  <span className="text-[10px] text-slate-400 font-medium truncate">
                    {METIER_LABELS[metier as keyof typeof METIER_LABELS]}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Facturation + Deconnexion */}
        {(!isCollapsed || mobileOpen) && (
          <div className="px-2 pb-2 space-y-0.5">
            <button
              onClick={handlePortal}
              disabled={portalLoading}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors w-full disabled:opacity-50"
            >
              <CreditCard className="w-[18px] h-[18px] shrink-0" aria-hidden="true" />
              {portalLoading ? "Chargement..." : "Facturation"}
            </button>
            <button
              onClick={() => signOut({ callbackUrl: "/auth/signin" })}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors w-full"
            >
              <LogOut className="w-[18px] h-[18px] shrink-0" aria-hidden="true" />
              Deconnexion
            </button>
          </div>
        )}

        {/* Collapse toggle — desktop only */}
        <div className="hidden md:block border-t border-slate-100">
          <button
            onClick={toggleCollapse}
            aria-label={isCollapsed ? "Ouvrir la sidebar" : "Replier la sidebar"}
            className="flex items-center justify-center w-full py-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
          >
            {isCollapsed ? (
              <ChevronsRight className="w-4 h-4" />
            ) : (
              <ChevronsLeft className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-slate-200 z-40 flex items-center justify-between px-4">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Ouvrir le menu"
          className="p-2 -ml-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <Menu className="w-5 h-5 text-slate-700" />
        </button>
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-600 rounded-xl flex items-center justify-center text-white">
            <Building2 className="w-4 h-4" aria-hidden="true" />
          </div>
          <span className="text-base font-black text-slate-900">BailBot</span>
        </Link>
        <Link href="/dashboard/account" className="p-2 -mr-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-slate-700 to-slate-900 rounded-xl flex items-center justify-center text-white text-xs font-black">
            {user?.image ? (
              <img src={user.image} alt="Profil" className="w-8 h-8 rounded-xl object-cover" loading="lazy" />
            ) : (
              initials
            )}
          </div>
        </Link>
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-[280px] bg-white z-50 md:hidden flex flex-col shadow-xl transition-transform duration-200 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Navigation"
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex flex-col fixed top-0 left-0 bottom-0 bg-white border-r border-slate-200 z-30 transition-[width] duration-200 ease-in-out ${
          isCollapsed ? "w-16" : "w-60"
        }`}
        aria-label="Navigation"
      >
        {sidebarContent}
      </aside>

      {/* Spacer for main content — desktop */}
      <div
        className={`hidden md:block shrink-0 transition-[width] duration-200 ease-in-out ${
          isCollapsed ? "w-16" : "w-60"
        }`}
      />

      {/* Mobile top padding */}
      <div className="md:hidden h-14" />

      {/* Modals */}
      {messagesOpen && <MessageTemplates onClose={() => setMessagesOpen(false)} />}
      {revisionOpen && <RevisionLoyerModal onClose={() => setRevisionOpen(false)} />}
    </>
  );
}
