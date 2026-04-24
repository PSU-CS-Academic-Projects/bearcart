"use server";

import { createClient } from "@/lib/supabase-server";
import { uploadImage } from "./storage";

export async function getProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("users").select("*").eq("id", user.id).single();
  return { ...data, auth_avatar: user.user_metadata?.avatar_url as string | undefined, email: user.email };
}

export async function updateProfile(updates: { full_name?: string; bio?: string; college?: string; avatar_base64?: string }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const dbUpdates: Record<string, unknown> = {};
  if (updates.full_name) dbUpdates.full_name = updates.full_name;
  if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
  if (updates.college) dbUpdates.college = updates.college;

  if (updates.avatar_base64) {
    const avatarUrl = await uploadImage("avatars", updates.avatar_base64, user.id);
    dbUpdates.avatar_url = avatarUrl;
  }

  const { error } = await supabase.from("users").update(dbUpdates).eq("id", user.id);
  if (error) throw new Error(`Failed to update profile: ${error.message}`);
}

export async function getProfileStats() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { total: 0, active: 0, sold: 0, views: 0 };

  const { data: listings } = await supabase.from("listings").select("status, views_count").eq("seller_id", user.id).is("deleted_at", null);

  const all = listings ?? [];
  return {
    total: all.length,
    active: all.filter(l => l.status === "available").length,
    sold: all.filter(l => l.status === "sold").length,
    views: all.reduce((sum, l) => sum + (l.views_count ?? 0), 0),
  };
}
