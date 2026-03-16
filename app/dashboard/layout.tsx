import SessionGuard from "@/components/SessionGuard";
import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-slate-50">
      <SessionGuard />
      <Sidebar />
      <div className="flex-1 min-w-0">
        <div className="max-w-6xl mx-auto px-4 pt-4">
        </div>
        {children}
      </div>
    </div>
  );
}
