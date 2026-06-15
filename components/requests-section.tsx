import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RequestRow } from "@/components/request-row";
import { MagnifyingGlass, Plus } from "@phosphor-icons/react/dist/ssr";
import { getRecentRequests } from "@/lib/actions/requests";
import { createClient } from "@/lib/supabase-server";

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-accent">
        <MagnifyingGlass className="size-8 text-primary" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-foreground">No requests yet</h3>
      <p className="mb-6 max-w-sm text-sm text-muted-foreground">
        Be the first to post what you&apos;re looking for
      </p>
      <Button asChild>
        <Link href="/requests/new">
          <Plus className="size-4" />
          Post a Request
        </Link>
      </Button>
    </div>
  );
}

export async function RequestsSection() {
  const [requests, supabase] = await Promise.all([
    getRecentRequests(10),
    createClient(),
  ]);
  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = user?.id ?? null;

  return (
    <section className="py-10">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Requests</h2>
            <p className="text-muted-foreground">
              Help PalSU students and faculty find what they need
            </p>
          </div>
          {user && (
            <Button asChild>
              <Link href="/requests/new">
                <Plus className="size-4" />
                Post a Request
              </Link>
            </Button>
          )}
        </div>

        {requests.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="overflow-hidden rounded-xl border bg-card">
              {requests.map((req, idx) => (
                <div key={req.id} className={idx > 0 ? "border-t" : ""}>
                  <RequestRow request={req} currentUserId={currentUserId} />
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <Button asChild variant="link">
                <Link href="/requests">View all requests →</Link>
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
