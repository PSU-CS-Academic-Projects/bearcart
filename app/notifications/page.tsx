import { redirect } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { NotificationsClient } from "@/components/notifications-client";
import { createClient } from "@/lib/supabase-server";
import { getAllNotifications, markAllNotificationsSeen } from "@/lib/actions/notifications";

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; filter?: string }>;
}) {
  // ── Auth gate ─────────────────────────────────────────────────────────
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login?returnTo=/notifications");

  await markAllNotificationsSeen();

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10) || 1);
  const filter: "all" | "unread" =
    params.filter === "unread" ? "unread" : "all";

  const initial = await getAllNotifications(page, 20, filter);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <NotificationsClient
        userId={user.id}
        initialPage={page}
        initialFilter={filter}
        initialData={initial}
      />
    </div>
  );
}
