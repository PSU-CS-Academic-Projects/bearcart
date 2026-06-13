import { redirect } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { AdminDashboard } from "@/components/admin-dashboard";
import { createClient } from "@/lib/supabase-server";
import {
  isCurrentUserAdmin,
  getAdminOverviewStats,
  getReportedListings,
  getReportedRequests,
  getReportedMessages,
  searchAdminUsers,
} from "@/lib/actions/admin";

export const metadata = {
  title: "Admin Dashboard — BearCart",
};

export default async function AdminPage() {
  const admin = await isCurrentUserAdmin();
  if (!admin) redirect("/");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [stats, reportedListings, reportedRequests, reportedMessages, users] =
    await Promise.all([
      getAdminOverviewStats(),
      getReportedListings(),
      getReportedRequests(),
      getReportedMessages(),
      searchAdminUsers(""),
    ]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        <AdminDashboard
          currentUserId={user?.id ?? ""}
          stats={stats}
          reportedListings={reportedListings}
          reportedRequests={reportedRequests}
          reportedMessages={reportedMessages}
          initialUsers={users}
        />
      </main>
      <Footer />
    </div>
  );
}
