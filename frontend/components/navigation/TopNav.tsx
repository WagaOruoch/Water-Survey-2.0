"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { clearSessionTokens, getAuthUser } from "@/lib/api";

export default function TopNav() {
  const router = useRouter();
  const authUser = useMemo(() => getAuthUser(), []);

  function handleLogout() {
    clearSessionTokens();
    router.replace("/login");
  }

  return (
    <nav className="flex min-h-16 items-center justify-between bg-blue-600 px-8 text-white shadow-sm">
      <h1 className="text-xl font-semibold">Water Survey System</h1>

      <div className="flex items-center gap-4">
        <div className="px-1 py-1 text-right leading-tight">
          <p className="text-sm font-semibold text-gray-900">
            {authUser?.name || authUser?.email || "[My email]"}
          </p>
          <p className="text-xs text-gray-700">{authUser?.email ?? "[My email]"}</p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="ui-btn-swap rounded-md bg-white px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
        >
          Log Out
        </button>
      </div>
    </nav>
  );
}
