import NavMenu from "@/components/NavMenu";
import AppFooter from "@/components/AppFooter";
import SessionGuard from "@/components/SessionGuard";
import MigrationBanner from "@/components/MigrationBanner";
import DashboardBottomNav from "@/components/DashboardBottomNav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <SessionGuard />
      <NavMenu />
      <div className="flex-1 pb-20 lg:pb-0">
        <div className="max-w-6xl mx-auto px-4 pt-4">
          <MigrationBanner />
        </div>
        {children}
      </div>
      <AppFooter />
      <DashboardBottomNav />
    </div>
  );
}
