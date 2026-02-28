import { ReactNode } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import TopNav from "@/components/navigation/TopNav";
import SidebarNav from "@/components/navigation/SidebarNav";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="relative min-h-screen overflow-hidden text-blue-50">
        {/* Same background image + overlays as front page */}
        <div
          className="pointer-events-none fixed inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('/images/New landing page.png')" }}
        />
        <div className="pointer-events-none fixed inset-0 bg-gradient-to-r from-slate-950/80 via-blue-950/70 to-blue-900/50" />
        <div className="pointer-events-none fixed inset-0 bg-gradient-to-t from-slate-900/45 via-transparent to-slate-900/15" />

        <div className="relative z-10">
          <TopNav />
          <div className="flex min-h-[calc(100vh-64px)]">
            <SidebarNav />
            <main className="flex-1 overflow-y-auto p-8">{children}</main>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
