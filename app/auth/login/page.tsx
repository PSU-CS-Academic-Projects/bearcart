"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
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

  // Brief loading state while redirect happens (< 1 second)
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">Redirecting to Google...</p>
    </div>
  );
}
