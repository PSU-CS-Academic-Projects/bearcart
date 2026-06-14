"use server";

import { createClient } from "@/lib/supabase-server";
import { uploadImage } from "./storage";
import { moderateImageOrThrow } from "@/lib/moderation";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  full_name: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  avatar_url: string | null;
  role: "student" | "faculty";
  college: string | null;
  bio: string | null;
  created_at: string;
}

export interface ProfileStats {
  activeListings: number;
  totalSold: number;
  totalViews: number;
}

// ─── READ (current user) ─────────────────────────────────────────────────────

export async function getOwnProfile(): Promise<UserProfile | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("users")
    .select("id, full_name, first_name, last_name, email, avatar_url, role, college, bio, created_at")
    .eq("id", user.id)
    .single();

  if (!data) return null;

  return {
    ...data,
    email: data.email ?? user.email ?? "",
  } as UserProfile;
}

// ─── READ (public profile by ID) ─────────────────────────────────────────────

export async function getPublicProfile(userId: string): Promise<UserProfile | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("users")
    .select("id, full_name, first_name, last_name, email, avatar_url, role, college, bio, created_at, deleted_at")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;
  // User is soft-deleted
  if (data.deleted_at) return null;

  return data as UserProfile;
}

// ─── STATS ────────────────────────────────────────────────────────────────────

export async function getProfileStats(userId: string): Promise<ProfileStats> {
  const supabase = await createClient();

  const { data: listings } = await supabase
    .from("listings")
    .select("status, views_count")
    .eq("seller_id", userId)
    .is("deleted_at", null);

  const all = listings ?? [];
  const activeListings = all.filter(l => l.status === "available").length;
  const totalSold = all.filter(l => l.status === "sold").length;
  const totalViews = all.reduce((sum, l) => sum + (l.views_count ?? 0), 0);

  return { activeListings, totalSold, totalViews };
}

// ─── UPDATE ───────────────────────────────────────────────────────────────────

export async function updateProfile(updates: {
  bio?: string;
  college?: string;
  avatar_base64?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const dbUpdates: Record<string, unknown> = {};
  if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
  if (updates.college !== undefined) dbUpdates.college = updates.college;

  if (updates.avatar_base64) {
    await moderateImageOrThrow(updates.avatar_base64);
    const avatarUrl = await uploadImage("avatars", updates.avatar_base64, user.id);
    dbUpdates.avatar_url = avatarUrl;
  }

  if (Object.keys(dbUpdates).length === 0) return;

  const { error } = await supabase.from("users").update(dbUpdates).eq("id", user.id);
  if (error) throw new Error(`Failed to update profile: ${error.message}`);
}

// ─── LEGACY COMPAT ────────────────────────────────────────────────────────────
// Keep the old function signatures for existing callers

export async function getProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("users").select("*").eq("id", user.id).single();
  return { ...data, auth_avatar: user.user_metadata?.avatar_url as string | undefined, email: user.email };
}
