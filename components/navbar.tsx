import { createClient } from "@/lib/supabase-server";
import { getUnreadMessageCount } from "@/lib/actions/messages";
import {
  getRecentNotifications,
  getUnseenNotificationCount,
  type NotificationRow,
} from "@/lib/actions/notifications";
import { NavbarClient } from "@/components/navbar-client";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NavbarUser {
  id: string;
  full_name: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  avatar_url: string | null;
  is_admin: boolean;
}

// ─── Server Component ─────────────────────────────────────────────────────────

export async function Navbar() {
  // Auth + user profile fetch
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  let navbarUser: NavbarUser | null = null;
  let initialUnreadCount = 0;
  let initialNotificationCount = 0;
  let initialNotifications: NotificationRow[] = [];

  if (authUser) {
    // Fetch full user record from users table
    const { data: profile } = await supabase
      .from("users")
      .select("id, full_name, first_name, last_name, email, avatar_url, is_admin")
      .eq("id", authUser.id)
      .single();

    if (profile) {
      navbarUser = profile as NavbarUser;
    }

    // Fetch initial counts and notifications in parallel
    const [unreadMsgs, unseenNotifs, recentNotifs] = await Promise.all([
      getUnreadMessageCount(),
      getUnseenNotificationCount(),
      getRecentNotifications(10),
    ]);
    initialUnreadCount = unreadMsgs;
    initialNotificationCount = unseenNotifs;
    initialNotifications = recentNotifs;
  }

  return (
    <NavbarClient
      user={navbarUser}
      initialUnreadCount={initialUnreadCount}
      initialNotificationCount={initialNotificationCount}
      initialNotifications={initialNotifications}
    />
  );
}
