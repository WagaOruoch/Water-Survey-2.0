"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { clearSessionTokens, getAuthUser } from "@/lib/api";
import SurveyCorpMark from "@/components/branding/SurveyCorpMark";

export default function TopNav() {
  const router = useRouter();
  const authUser = useMemo(() => getAuthUser(), []);

  function handleLogout() {
    clearSessionTokens();
    router.replace("/login");
  }

  return (
    <nav className="flex min-h-16 items-center justify-between border-b border-white/10 bg-slate-900/25 px-8 text-white backdrop-blur-sm">
      <div>
        <div className="flex items-center gap-2.5">
          <SurveyCorpMark size="sm" />
          <h1 className="text-4 font-semibold leading-none text-white sm:text-xl">Survey Corp</h1>
        </div>
        <p className="mt-1 text-xs text-blue-100/95">Survey Operations Platform</p>
      </div>

      <div className="flex items-center gap-4">
        <div className="px-1 py-1 text-right leading-tight">
          <p className="text-sm font-semibold text-blue-50">
            {authUser?.name || authUser?.email || "[My email]"}
          </p>
          <p className="text-xs text-blue-200/90">{authUser?.email ?? "[My email]"}</p>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="ui-btn-swap rounded-md border border-white/25 bg-blue-500/80 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500"
        >
          Log Out
        </button>
      </div>
    </nav>
  );
}
