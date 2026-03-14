import NavMenu from "@/components/NavMenu";
import AppFooter from "@/components/AppFooter";
import SessionGuard from "@/components/SessionGuard";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <SessionGuard />
      <NavMenu />
      <div className="flex-1">{children}</div>
      <AppFooter />
    </div>
  );
}
