"use client";

import { useEffect, useMemo, useState } from "react";
import SurveyForm from "@/components/survey/SurveyForm";
import {
  clearAccessToken,
  getAccessToken,
  signInWithGoogle,
} from "@/lib/api";
import { AuthUser } from "@/types/survey";

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

type AuthStatus = "checking" | "signed_out" | "signed_in" | "error";

export default function SurveyCorpAuthGate() {
  const [status, setStatus] = useState<AuthStatus>("checking");
  const [authError, setAuthError] = useState("");
  const [user, setUser] = useState<AuthUser | null>(null);

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

  const authReady = useMemo(
    () => status === "signed_in" && !!getAccessToken(),
    [status]
  );

  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      setStatus("signed_in");
      return;
    }
    setStatus("signed_out");
  }, []);

  useEffect(() => {
    if (status !== "signed_out") return;

    if (!googleClientId) {
      setStatus("error");
      setAuthError("NEXT_PUBLIC_GOOGLE_CLIENT_ID is missing in frontend .env.");
      return;
    }

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
            setStatus("error");
            setAuthError("Google login failed. Try again.");
            return;
          }

          try {
            const auth = await signInWithGoogle(response.credential);
            setUser(auth.user);
            setStatus("signed_in");
            setAuthError("");
          } catch {
            clearAccessToken();
            setStatus("error");
            setAuthError("Sign-in failed. Please confirm backend Google settings.");
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
  }, [googleClientId, status]);

  function handleSignOut() {
    clearAccessToken();
    setUser(null);
    setStatus("signed_out");
  }

  if (!authReady) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">Survey Corp</h2>
        <p className="mt-2 text-sm text-gray-600">
          Sign in with Google to access the survey form.
        </p>

        <div id="google-signin-button" className="mt-6" />

        {status === "error" && (
          <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {authError}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-3 shadow-sm">
        <div>
          <p className="text-sm font-medium text-gray-800">Signed in</p>
          <p className="text-xs text-gray-500">{user?.email ?? "Authenticated user"}</p>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200"
        >
          Sign out
        </button>
      </div>

      <SurveyForm />
    </div>
  );
}
