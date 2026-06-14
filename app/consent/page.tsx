"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/lib/supabase";

export default function ConsentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/listings";

  const [loading, setLoading] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) {
        router.replace("/");
        return;
      }

      const { data } = await supabase
        .from("users")
        .select("college, terms_accepted")
        .eq("id", session.user.id)
        .single();

      // Not set up yet → back to setup
      if (!data?.college) {
        router.replace(`/setup?returnTo=${encodeURIComponent(returnTo)}`);
        return;
      }

      // Already accepted → go straight through
      if (data?.terms_accepted) {
        router.replace(returnTo);
        return;
      }

      setLoading(false);
    });
  }, [router, returnTo]);

  const handleContinue = async () => {
    if (!agreed) return;
    setSaving(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { router.replace("/"); return; }

    const { error } = await supabase
      .from("users")
      .update({
        terms_accepted: true,
        terms_accepted_at: new Date().toISOString(),
      })
      .eq("id", session.user.id);

    if (error) {
      console.error("Consent error:", error.message);
      setSaving(false);
      return;
    }

    router.replace(returnTo);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 md:p-8">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border bg-card p-6 shadow-sm md:p-10">

          {/* Logo */}
          <div className="mb-6 flex flex-col items-center gap-2 text-center">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/bearcart.svg" alt="BearCart" width={40} height={40} className="size-10" />
              <span className="text-2xl font-bold text-foreground">BearCart</span>
            </Link>
            <h1 className="mt-2 text-xl font-bold text-foreground">Before you continue</h1>
          </div>

          {/* Body */}
          <p className="mb-6 text-center text-sm text-muted-foreground">
            Please review and accept our Terms of Service and Privacy Policy to use BearCart.
          </p>

          {/* Links */}
          <div className="mb-6 flex flex-col gap-2 rounded-xl border bg-muted/40 p-4">
            <Link
              href="/terms-of-service"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              Terms of Service
              <span className="text-xs text-muted-foreground">Opens in new tab ↗</span>
            </Link>
            <div className="h-px bg-border" />
            <Link
              href="/privacy-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            >
              Privacy Policy
              <span className="text-xs text-muted-foreground">Opens in new tab ↗</span>
            </Link>
          </div>

          {/* Checkbox */}
          <div
            className="mb-6 flex cursor-pointer items-start gap-3"
            onClick={() => setAgreed((v) => !v)}
          >
            <Checkbox
              id="consent-checkbox"
              checked={agreed}
              onCheckedChange={(v) => setAgreed(v as boolean)}
              className="mt-0.5 shrink-0"
            />
            <label
              htmlFor="consent-checkbox"
              className="cursor-pointer text-sm text-foreground leading-relaxed"
            >
              I have read and agree to the{" "}
              <Link
                href="/terms-of-service"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary underline underline-offset-2 hover:text-primary/80"
                onClick={(e) => e.stopPropagation()}
              >
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link
                href="/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary underline underline-offset-2 hover:text-primary/80"
                onClick={(e) => e.stopPropagation()}
              >
                Privacy Policy
              </Link>
            </label>
          </div>

          {/* Continue */}
          <Button
            className="w-full"
            disabled={!agreed || saving}
            onClick={handleContinue}
          >
            {saving ? "Saving…" : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}
