"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import GoogleLoginCard from "@/components/auth/GoogleLoginCard";
import { getAccessToken } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    if (getAccessToken()) {
      router.replace("/app/dashboard");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="flex min-h-16 items-center justify-between bg-blue-600 px-8 text-white shadow-sm">
        <h1 className="text-xl font-semibold">Survey Corp</h1>
        <Link
          href="/"
          className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
        >
          Back to Home
        </Link>
      </nav>

      <main className="grid min-h-[calc(100vh-64px)] place-items-center px-4 py-10">
        <div className="w-full max-w-md">
          <GoogleLoginCard />
        </div>
      </main>
    </div>
  );
}
