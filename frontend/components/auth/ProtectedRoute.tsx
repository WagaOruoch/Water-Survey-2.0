"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AUTH_EXPIRED_EVENT, clearAccessToken, getAccessToken } from "@/lib/api";

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      router.replace("/login");
      setIsChecking(false);
      return;
    }

    const onAuthExpired = () => {
      clearAccessToken();
      router.replace("/login");
    };

    window.addEventListener(AUTH_EXPIRED_EVENT, onAuthExpired);
    setIsChecking(false);

    return () => {
      window.removeEventListener(AUTH_EXPIRED_EVENT, onAuthExpired);
    };
  }, [router]);

  if (isChecking) {
    return (
      <div className="grid min-h-screen place-items-center bg-gray-50 px-4">
        <p className="text-sm text-gray-600">Checking session...</p>
      </div>
    );
  }

  return <>{children}</>;
}
