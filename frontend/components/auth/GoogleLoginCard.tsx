"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithGoogle } from "@/lib/api";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: {
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "small" | "medium" | "large";
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              shape?: "rectangular" | "pill" | "circle" | "square";
              width?: string;
            }
          ) => void;
        };
      };
    };
  }
}

interface GoogleLoginCardProps {
  onSuccessPath?: string;
}

export default function GoogleLoginCard({
  onSuccessPath = "/app/dashboard",
}: GoogleLoginCardProps) {
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
  const configError =
    !googleClientId ? "NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing in frontend .env." : "";

  useEffect(() => {
    if (!googleClientId) return;

    const buttonContainer = document.getElementById("google-signin-button");
    if (!buttonContainer) return;

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]'
    );

    const initGoogle = () => {
      if (!window.google?.accounts?.id) return;

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response: { credential?: string }) => {
          if (!response.credential) {
            setError("Google login failed. Try again.");
            return;
          }

          setIsSubmitting(true);
          setError("");
          try {
            await signInWithGoogle(response.credential);
            router.replace(onSuccessPath);
          } catch {
            setError("Sign-in failed. Please confirm backend Google settings.");
            setIsSubmitting(false);
          }
        },
      });

      buttonContainer.innerHTML = "";
      window.google.accounts.id.renderButton(buttonContainer, {
        theme: "outline",
        size: "large",
        text: "signin_with",
        shape: "pill",
        width: "280",
      });
    };

    if (existingScript) {
      initGoogle();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initGoogle;
    document.head.appendChild(script);
  }, [googleClientId, onSuccessPath, router]);

  return (
    <div className="rounded-2xl border border-white/25 bg-slate-900/25 p-8 text-center shadow-xl backdrop-blur-sm">
      <h2 className="text-4 font-semibold text-white sm:text-3xl">Log in to Survey Corp</h2>
      <p className="mt-2 text-sm text-blue-100/90">
        Sign in with Google to access the dashboard and survey workspace.
      </p>

      <div id="google-signin-button" className="mt-6 flex justify-center" />

      {isSubmitting && (
        <p className="mt-4 text-sm text-blue-100">Completing sign-in...</p>
      )}

      {error && (
        <p className="mt-4 rounded-md border border-red-200/50 bg-red-500/15 px-3 py-2 text-sm text-red-100">
          {error}
        </p>
      )}

      {!error && configError && (
        <p className="mt-4 rounded-md border border-red-200/50 bg-red-500/15 px-3 py-2 text-sm text-red-100">
          {configError}
        </p>
      )}
    </div>
  );
}
