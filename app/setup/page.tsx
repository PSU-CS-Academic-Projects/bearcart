"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import { GraduationCap, Chalkboard } from "@phosphor-icons/react";
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

      if (data?.college && data?.terms_accepted) {
        router.replace(returnTo);
        return;
      }

      if (data?.college && !data?.terms_accepted) {
        router.replace(`/consent?returnTo=${encodeURIComponent(returnTo)}`);
        return;
      }

      setUser(session.user);
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

    const { error } = await supabase
      .from("users")
      .upsert(
        { id: user.id, full_name: fullName, email: user.email, role, college },
        { onConflict: "id" }
      );

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

            {/* Logo */}
            <div className="mb-8 flex flex-col items-center gap-2 text-center">
              <Link href="/" className="flex items-center gap-2">
                <Image src="/bearcart.svg" alt="BearCart" width={40} height={40} className="size-10" />
                <span className="text-2xl font-bold text-foreground">BearCart</span>
              </Link>
              <h1 className="mt-2 text-xl font-bold text-foreground">
                Welcome to BearCart, {firstName}!
              </h1>
              <p className="text-sm text-muted-foreground">
                Just one quick step before you start
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
                  <GraduationCap
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
                  <Chalkboard
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
