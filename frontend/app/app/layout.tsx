import { ReactNode } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import TopNav from "@/components/navigation/TopNav";
import SidebarNav from "@/components/navigation/SidebarNav";

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-100">
        <TopNav />
        <div className="flex min-h-[calc(100vh-64px)]">
          <SidebarNav />
          <main className="flex-1 overflow-y-auto p-8">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
