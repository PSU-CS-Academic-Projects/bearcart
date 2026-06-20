"use client";

import { Suspense, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

function LoginRedirect() {
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/listings";
  const triggered = useRef(false);

  useEffect(() => {
    // Prevent double-trigger in React StrictMode
    if (triggered.current) return;
    triggered.current = true;

    const callbackUrl = `${window.location.origin}/auth/callback?returnTo=${encodeURIComponent(returnTo)}`;

    supabase.auth
      .signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl,
          queryParams: {
            hd: "psu.palawan.edu.ph",
          },
        },
      })
      .then(({ data, error }) => {
        if (error) {
          console.error("OAuth error:", error.message);
          window.location.href = "/";
          return;
        }
        if (data?.url) {
          window.location.href = data.url;
        }
      });
  }, [returnTo]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">Redirecting to Google...</p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      }
    >
      <LoginRedirect />
    </Suspense>
  );
}