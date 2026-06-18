"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { jakarta } from "@/lib/fonts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import { StudentIcon, ChalkboardTeacherIcon } from "@phosphor-icons/react";
import { OnboardingSteps } from "@/components/onboarding-steps";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

const COLLEGES = [
  "College of Architecture and Design",
  "College of Arts and Humanities",
  "College of Business and Accountancy",
  "College of Criminal Justice Education",
  "College of Engineering",
  "College of Hospitality Management and Tourism",
  "College of Nursing and Health Sciences",
  "College of Sciences",
  "College of Teacher Education",
  "Junior High School (JHS)",
  "Senior High School (SHS)",
  "Others",
];

type Role = "student" | "faculty";

// Build a URL-safe user slug matching the DB trigger logic:
//   first_last (lowercased, underscore separated); on collision append 6 id chars.
function slugifyPart(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
}

async function buildUserSlug(user: User, fullName: string): Promise<string> {
  const first = (user.user_metadata?.given_name as string | undefined)?.trim();
  const last = (user.user_metadata?.family_name as string | undefined)?.trim();

  let base = "";
  if (first && last) {
    base = `${slugifyPart(first)}_${slugifyPart(last)}`;
  } else if (fullName?.trim()) {
    const parts = fullName.trim().split(/\s+/);
    base =
      parts.length >= 2
        ? `${slugifyPart(parts[0])}_${slugifyPart(parts[parts.length - 1])}`
        : slugifyPart(fullName);
  }

  if (!base || /^_+$/.test(base)) base = `user_${user.id.slice(0, 6)}`;

  // Collision check
  const { data: clash } = await supabase
    .from("users")
    .select("id")
    .eq("slug", base)
    .neq("id", user.id)
    .maybeSingle();

  return clash ? `${base}_${user.id.slice(0, 6)}` : base;
}

export default function SetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/listings";
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<Role | null>(null);
  const [college, setCollege] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.replace("/");
        return;
      }

      const { data } = await supabase
        .from("users")
        .select("college, terms_accepted")
        .eq("id", user.id)
        .single();

      if (data?.college && data?.terms_accepted) {
        router.replace(returnTo);
        return;
      }

      if (data?.college && !data?.terms_accepted) {
        router.replace(`/consent?returnTo=${encodeURIComponent(returnTo)}`);
        return;
      }

      setUser(user);
      setLoading(false);
    });
  }, [router, returnTo]);

  const firstName =
    (user?.user_metadata?.given_name as string | undefined) ??
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email ??
    "";

  const canSubmit = role !== null && college !== "";

  const handleSubmit = async () => {
    if (!user || !canSubmit) return;
    setSaving(true);

    const fullName =
      (user.user_metadata?.full_name as string | undefined) ??
      (user.user_metadata?.name as string | undefined) ??
      user.email ??
      "";

    // Ensure the user row has a slug. The DB trigger normally sets it, but if
    // this upsert ends up INSERTING a fresh row the NOT-NULL slug column would
    // be violatedd so generate one here when the row has none yet.
    const { data: existing } = await supabase
      .from("users")
      .select("slug")
      .eq("id", user.id)
      .maybeSingle();

    const upsertData: Record<string, unknown> = {
      id: user.id,
      full_name: fullName,
      email: user.email,
      role,
      college,
    };

    if (!existing?.slug) {
      upsertData.slug = await buildUserSlug(user, fullName);
    }

    const { error } = await supabase
      .from("users")
      .upsert(upsertData, { onConflict: "id" });

    if (error) {
      console.error("Setup error:", error.message);
      setSaving(false);
      return;
    }

    fetch("/api/send-welcome", { method: "POST" }).catch(() => {});

    router.replace(`/consent?returnTo=${encodeURIComponent(returnTo)}`);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex flex-1 items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-lg">
          <div className="rounded-2xl border bg-card p-6 shadow-sm md:p-10">

            {/* Step Indicator */}
            <OnboardingSteps active={1} />

            {/* Logo */}
            <div className="mb-8 flex flex-col items-center gap-2 text-center">
              <div className="flex w-full items-center justify-center gap-3">
                <Image src="/bearcart.svg" alt="BearCart" width={48} height={48} className="size-12" />
                <span className={`text-2xl font-bold text-foreground ${jakarta.className}`}>
                  BearCart
                </span>
                <Image src="/palsu-logo.svg" alt="PalSU" width={56} height={56} className="size-14 opacity-80" />
              </div>
              <h1 className="mt-2 text-xl font-bold text-foreground">
                Welcome to <span className={jakarta.className}>BearCart</span>, {firstName} !
              </h1>
              <p className="text-sm text-muted-foreground">
                Just two quick steps before you start
              </p>
            </div>

            {/* Role Selector */}
            <div className="mb-6">
              <p className="mb-3 text-sm font-medium text-foreground">
                I am a…
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole("student")}
                  className={[
                    "flex flex-col items-center gap-3 rounded-xl border-2 px-4 py-5 transition-all duration-150",
                    role === "student"
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border bg-background hover:border-primary/40 hover:bg-accent",
                  ].join(" ")}
                >
                  <StudentIcon
                    className={[
                      "size-10",
                      role === "student" ? "text-primary" : "text-muted-foreground",
                    ].join(" ")}
                  />
                  <span
                    className={[
                      "text-sm font-semibold",
                      role === "student" ? "text-primary" : "text-foreground",
                    ].join(" ")}
                  >
                    Student
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setRole("faculty")}
                  className={[
                    "flex flex-col items-center gap-3 rounded-xl border-2 px-4 py-5 transition-all duration-150",
                    role === "faculty"
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "border-border bg-background hover:border-primary/40 hover:bg-accent",
                  ].join(" ")}
                >
                  <ChalkboardTeacherIcon
                    className={[
                      "size-10",
                      role === "faculty" ? "text-primary" : "text-muted-foreground",
                    ].join(" ")}
                  />
                  <span
                    className={[
                      "text-sm font-semibold",
                      role === "faculty" ? "text-primary" : "text-foreground",
                    ].join(" ")}
                  >
                    Faculty
                  </span>
                </button>
              </div>
            </div>

            {/* College Dropdown */}
            <div className="mb-8">
              <label className="mb-2 block text-sm font-medium text-foreground">
                Your College
              </label>
              <Select value={college} onValueChange={setCollege}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select your college…" />
                </SelectTrigger>
                <SelectContent>
                  {COLLEGES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-2 text-xs text-muted-foreground">
                You can update your college anytime.
              </p>
            </div>

            {/* Submit */}
            <Button
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={!canSubmit || saving}
              onClick={handleSubmit}
            >
              {saving ? "Saving…" : "Get Started"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
