"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShoppingCart, GraduationCap, Chalkboard } from "@phosphor-icons/react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

const COLLEGES = [
  "Engineering",
  "Education",
  "Business",
  "Arts and Sciences",
  "Nursing",
  "Agriculture",
  "Others",
];

type Role = "student" | "faculty";

export default function SetupPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<Role | null>(null);
  const [college, setCollege] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) {
        // Not logged in → go to homepage
        router.replace("/");
        return;
      }

      // Already has college set → skip setup
      const { data } = await supabase
        .from("users")
        .select("college")
        .eq("id", session.user.id)
        .single();

      if (data?.college) {
        router.replace("/listings");
        return;
      }

      setUser(session.user);
      setLoading(false);
    });
  }, [router]);

  const firstName = (
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email ??
    ""
  ).split(" ")[0];

  const canSubmit = role !== null && college !== "";

  const handleSubmit = async () => {
    if (!user || !canSubmit) return;
    setSaving(true);

    const { error } = await supabase
      .from("users")
      .upsert({ id: user.id, role, college }, { onConflict: "id" });

    if (error) {
      console.error("Setup error:", error.message);
      setSaving(false);
      return;
    }

    router.replace("/listings");
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
          {/* Card */}
          <div className="rounded-2xl border bg-card p-6 shadow-sm md:p-10">

            {/* Logo */}
            <div className="mb-8 flex flex-col items-center gap-2 text-center">
              <Link href="/" className="flex items-center gap-2">
                <ShoppingCart className="size-10 text-primary" weight="fill" />
                <span className="text-2xl font-bold text-foreground">PalMart</span>
              </Link>
              <h1 className="mt-2 text-xl font-bold text-foreground">
                Welcome to PalMart, {firstName}! 👋
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
                {/* Student Card */}
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

                {/* Faculty Card */}
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
            </div>

            {/* Submit */}
            <Button
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              style={{ backgroundColor: canSubmit ? undefined : undefined }}
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
