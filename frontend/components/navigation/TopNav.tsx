"use client";

import { useRouter } from "next/navigation";
import { clearAccessToken } from "@/lib/api";

export default function TopNav() {
  const router = useRouter();

  function handleLogout() {
    clearAccessToken();
    router.replace("/login");
  }

  return (
    <nav className="flex min-h-16 items-center justify-between bg-blue-600 px-8 text-white shadow-sm">
      <h1 className="text-xl font-semibold">Water Survey System</h1>

      <div className="flex items-center gap-4">
        <div className="min-w-60 rounded-md bg-white/20 px-3 py-2">
          <input
            type="text"
            placeholder="Search..."
            className="w-full bg-transparent text-sm text-white placeholder:text-white/75 focus:outline-none"
          />
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
        >
          Log Out
        </button>
      </div>
    </nav>
  );
}
