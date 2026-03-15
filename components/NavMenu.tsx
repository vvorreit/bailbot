"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, ShieldCheck, CreditCard, User, LogOut, Menu, X, ChevronDown, LifeBuoy, Building2, Layers, BarChart2, Mail, Upload, TrendingUp } from "lucide-react";
import { Banknote } from "lucide-react";
import { createPortalSession } from "@/app/dashboard/actions";
import MessageTemplates from "@/components/MessageTemplates";
import SearchDossiers from "@/components/SearchDossiers";
import ThemeToggle from "@/components/ThemeToggle";
import RevisionLoyerModal from "@/components/RevisionLoyerModal";
import { listerImpayes } from "@/lib/db-local";
import { hasAccess, METIER_LABELS } from "@/lib/features";

export default function NavMenu() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [nbImpayes, setNbImpayes] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const user = session?.user as any;
  const isAdmin = user?.role === "ADMIN";
  const showTeam = Boolean(session);
  const isPro = user?.isPro;
  const metier = user?.metier ?? null;

  // Charger le nombre d'impayés
  useEffect(() => {
    listerImpayes().then((list) => setNbImpayes(list.length)).catch(() => {});
  }, []);

  // Fermer le dropdown en cliquant ailleurs
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handlePortal = async () => {
    setPortalLoading(true);
    setDropdownOpen(false);
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

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, show: true },
    { href: "/dashboard/multi", label: "Multi-dossiers", icon: Layers, show: hasAccess(metier, "KANBAN_CANDIDATS") },
    { href: "/dashboard/stats", label: "Statistiques", icon: BarChart2, show: hasAccess(metier, "STATS_DASHBOARD") },
    { href: "/dashboard/team", label: "Mon équipe", icon: Users, show: showTeam && hasAccess(metier, "MULTI_USERS") },
    { href: "/dashboard/depot", label: "Dépôt locataire", icon: Upload, show: true },
    { href: "/dashboard/impayes", label: "Loyers", icon: Banknote, show: hasAccess(metier, "DASHBOARD_IMPAYES") },
    { href: "/admin", label: "Administration", icon: ShieldCheck, show: isAdmin },
  ].filter((l) => l.show);

  return (
    <nav className="bg-white border-b border-slate-100 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-emerald-200 group-hover:scale-105 transition-transform">
            <Building2 className="w-5 h-5" />
          </div>
          <span className="text-lg font-black tracking-tight text-slate-900">BailBot</span>
        </Link>

        {/* Nav links — desktop */}
        <div className="hidden md:flex items-center gap-1 flex-1 ml-4">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                id={href === "/dashboard/multi" ? "nav-multi" : undefined}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                  active
                    ? "bg-emerald-50 text-emerald-600"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                {href === "/dashboard/impayes" && nbImpayes > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                    {nbImpayes}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Search — desktop */}
        <SearchDossiers />

        {/* Révision IRL button */}
        <button
          onClick={() => setRevisionOpen(true)}
          className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
          title="Révision IRL"
        >
          <TrendingUp className="w-4 h-4" />
          <span className="hidden lg:inline">Révision IRL</span>
        </button>

        {/* Messages button */}
        <button
          onClick={() => setMessagesOpen(true)}
          className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors"
        >
          <Mail className="w-4 h-4" />
          <span className="hidden lg:inline">Messages</span>
        </button>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Right side */}
        <div className="flex items-center gap-3">
          {metier && (
            <span className="hidden sm:inline-flex px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-black rounded-full uppercase tracking-wider">
              {METIER_LABELS[metier as keyof typeof METIER_LABELS]}
            </span>
          )}
          {isPro && (
            <span className="hidden sm:inline-flex px-2.5 py-1 bg-emerald-600 text-white text-[10px] font-black rounded-full uppercase tracking-wider">
              PRO
            </span>
          )}

          {/* User dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-slate-50 transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-tr from-slate-700 to-slate-900 rounded-xl flex items-center justify-center text-white text-xs font-black">
                {user?.image ? (
                  <img src={user.image} alt="" className="w-8 h-8 rounded-xl object-cover" />
                ) : (
                  initials
                )}
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 overflow-hidden">
                {/* User info */}
                <div className="px-4 py-2 border-b border-slate-50 mb-1">
                  <p className="text-sm font-bold text-slate-900 truncate">{user?.name || "Mon compte"}</p>
                  <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                </div>

                <Link
                  href="/dashboard/account"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  Mon compte
                </Link>

                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Administration
                  </Link>
                )}

                <button
                  onClick={handlePortal}
                  disabled={portalLoading}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  <CreditCard className="w-4 h-4 text-slate-400" />
                  {portalLoading ? "Chargement..." : "Mon abonnement"}
                </button>

                <Link
                  href="/support"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <LifeBuoy className="w-4 h-4 text-slate-400" />
                  Support
                </Link>

                <div className="border-t border-slate-50 mt-1 pt-1">
                  <button
                    onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Déconnexion
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Hamburger — mobile */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden p-2 rounded-xl hover:bg-slate-50 transition-colors"
          >
            {mobileOpen ? <X className="w-5 h-5 text-slate-700" /> : <Menu className="w-5 h-5 text-slate-700" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-3 space-y-1">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${
                  active ? "bg-emerald-50 text-emerald-600" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                {href === "/dashboard/impayes" && nbImpayes > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                    {nbImpayes}
                  </span>
                )}
              </Link>
            );
          })}
          <button
            onClick={() => { setMobileOpen(false); setRevisionOpen(true); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <TrendingUp className="w-4 h-4" />
            📈 Révision IRL
          </button>
          <button
            onClick={() => { setMobileOpen(false); setMessagesOpen(true); }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <Mail className="w-4 h-4" />
            ✉️ Messages
          </button>
          <div className="border-t border-slate-100 pt-2 mt-2">
            <button
              onClick={() => signOut({ callbackUrl: "/auth/signin" })}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Déconnexion
            </button>
          </div>
        </div>
      )}

      {/* Public landing links */}
      <div className="hidden md:block border-t border-slate-50 py-2 px-4">
        <div className="flex items-center justify-center gap-6 text-[10px] font-bold text-slate-400">
          <span>Vous cherchez une offre ?</span>
          <Link href="/particulier" className="text-emerald-600 hover:underline">Particulier</Link>
          <Link href="/agence" className="text-indigo-600 hover:underline">Agence</Link>
          <Link href="/pro" className="text-violet-600 hover:underline">Pro (ADB)</Link>
        </div>
      </div>

      {/* Message Templates Modal */}
      {messagesOpen && <MessageTemplates onClose={() => setMessagesOpen(false)} />}

      {/* Révision IRL Modal */}
      {revisionOpen && <RevisionLoyerModal onClose={() => setRevisionOpen(false)} />}
    </nav>
  );
}
