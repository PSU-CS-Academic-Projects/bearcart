import Link from "next/link";
import { createClient } from "@/lib/supabase-server";
import { getUnreadMessageCount } from "@/lib/actions/messages";
import { NavbarClient } from "@/components/navbar-client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NavbarUser {
  id: string;
  full_name: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  avatar_url: string | null;
}

// ─── Server Component ─────────────────────────────────────────────────────────

export async function Navbar() {
  // Auth + user profile fetch
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  let navbarUser: NavbarUser | null = null;
  let initialUnreadCount = 0;

  if (authUser) {
    // Fetch full user record from users table
    const { data: profile } = await supabase
      .from("users")
      .select("id, full_name, first_name, last_name, email, avatar_url")
      .eq("id", authUser.id)
      .single();

    if (profile) {
      navbarUser = profile as NavbarUser;
    }

    // Fetch unread count server-side for initial render
    initialUnreadCount = await getUnreadMessageCount();
  }

  return (
    <NavbarClient
      user={navbarUser}
      initialUnreadCount={initialUnreadCount}
    />
  );
}
