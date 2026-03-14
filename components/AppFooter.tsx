import Link from "next/link";
import { Building2 } from "lucide-react";

export default function AppFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-100 bg-white mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">

        {/* Logo + copyright */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
            <Building2 className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
            © {year} BailBot
          </span>
        </div>

        {/* Links */}
        <div className="flex items-center gap-6 flex-wrap justify-center">
          <Link href="/support" className="text-[11px] font-bold text-emerald-500 hover:text-emerald-700 uppercase tracking-widest transition-colors">
            Support
          </Link>
          <Link href="/legal/confidentialite" className="text-[11px] font-bold text-slate-400 hover:text-slate-700 uppercase tracking-widest transition-colors">
            Confidentialité
          </Link>
          <Link href="/legal/cgu" className="text-[11px] font-bold text-slate-400 hover:text-slate-700 uppercase tracking-widest transition-colors">
            CGU
          </Link>
          <Link href="/legal/mentions-legales" className="text-[11px] font-bold text-slate-400 hover:text-slate-700 uppercase tracking-widest transition-colors">
            Mentions légales
          </Link>
        </div>

      </div>
    </footer>
  );
}
