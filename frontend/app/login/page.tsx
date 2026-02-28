"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import GoogleLoginCard from "@/components/auth/GoogleLoginCard";
import SurveyCorpMark from "@/components/branding/SurveyCorpMark";
import { ensureSession } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const check = async () => {
      const ok = await ensureSession();
      if (isMounted && ok) {
        router.replace("/app/dashboard");
      }
    };

    check();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/New landing page.png')" }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-slate-950/80 via-blue-950/70 to-blue-900/50" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900/45 via-transparent to-slate-900/15" />

      <nav className="relative z-10 flex min-h-16 items-center bg-transparent px-6 text-white sm:px-8">
        <Link
          href="/"
          className="ui-btn-swap rounded-md border border-white/20 bg-slate-900/35 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800/50"
        >
          Back to Home
        </Link>
      </nav>

      <main className="relative z-10 grid min-h-[calc(100vh-64px)] place-items-center px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-6 flex justify-center">
            <SurveyCorpMark size="lg" />
          </div>
          <GoogleLoginCard />
        </div>
      </main>
    </div>
  );
}
