import { notFound } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { PhotoGallery } from "@/components/photo-gallery";
import { Breadcrumb } from "@/components/breadcrumb";
import { RequesterInfoCard } from "@/components/requester-info-card";
import { RequestActions } from "@/components/request-actions";
import { RequestOwnerActions } from "@/components/request-owner-actions";
import { RequestRow } from "@/components/request-row";
import { Badge } from "@/components/ui/badge";
import { Clock, Flag, Warning } from "@phosphor-icons/react/dist/ssr";
import { getRequestById, getSimilarRequests } from "@/lib/actions/requests";
import { createClient } from "@/lib/supabase-server";
import { formatTimeAgo } from "@/lib/listing-helpers";
import { formatBudget, hasPositiveBudget, urgencyLabel } from "@/lib/request-helpers";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

const URGENCY_BADGE_STYLES: Record<string, string> = {
  not_urgent: "bg-muted text-muted-foreground",
  moderate: "bg-primary/10 text-primary",
  urgent: "bg-amber-900/10 text-amber-900",
};

export default async function RequestDetailPage({ params }: PageProps) {
  const { id } = await params;

  const request = await getRequestById(id);
  if (!request) notFound();

  const isUnavailable = request.status === "fulfilled" || request.status === "closed";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = user?.id ?? null;

  const photos = (request.request_images ?? [])
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((img) => img.image_url);

  const similar = await getSimilarRequests(request.id, request.category, 5);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-4">
          {/* Breadcrumb */}
          <Breadcrumb
            items={[
              { label: "Requests", href: "/requests" },
              { label: request.title },
            ]}
          />

          {/* Status banner */}
          {isUnavailable && (
            <div className="mt-3 flex items-center gap-2.5 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <Warning className="size-4 shrink-0 text-amber-600" />
              <div>
                <p className="text-sm font-semibold text-amber-800">
                  {request.status === "fulfilled"
                    ? "This request has been fulfilled"
                    : "This request is closed"}
                </p>
                <p className="text-xs text-amber-600">
                  {request.status === "fulfilled"
                    ? "The requester has marked this as completed."
                    : "The requester is no longer looking for this item."}
                </p>
              </div>
            </div>
          )}

          <section className="mt-4 rounded-xl border border-border bg-card p-3 shadow-sm sm:p-4 lg:grid lg:grid-cols-[minmax(0,55fr)_minmax(340px,45fr)] lg:gap-6">
            <div>
              {photos.length > 0 && (
                <div className="max-w-[560px] lg:sticky lg:top-20">
                  <PhotoGallery photos={photos} alt={request.title} />
                </div>
              )}
            </div>

            <div className="mt-4 flex w-full max-w-[500px] flex-col gap-3 justify-self-start lg:mt-0">
              <div className="space-y-2.5">
                <div className="space-y-1">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-primary/80">
                    PSU campus request
                  </p>
                  <h1 className="text-balance text-xl font-semibold leading-[1.18] tracking-[-0.015em] text-foreground sm:text-2xl">
                    {request.title}
                  </h1>
                </div>

                {hasPositiveBudget(request.budget_min, request.budget_max) && (
                  <div className="flex flex-wrap items-end gap-x-2.5 gap-y-1.5">
                    <p className="text-4xl font-bold leading-none tracking-[-0.04em] text-primary sm:text-[2.9rem]">
                      <span className="mr-1.5 text-lg font-semibold text-muted-foreground">Budget:</span>
                      {formatBudget(request.budget_min, request.budget_max)}
                    </p>
                    {request.is_negotiable && (
                      <span className="mb-0.5 inline-flex items-center rounded-full border border-border px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                        Negotiable
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Badge
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-semibold",
                      URGENCY_BADGE_STYLES[request.urgency] ?? "bg-gray-100 text-gray-800"
                    )}
                  >
                    {urgencyLabel(request.urgency)}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className="rounded-full px-2 py-0.5 text-xs font-semibold"
                  >
                    {request.category}
                  </Badge>
                </div>

                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3.5" />
                  Posted {formatTimeAgo(request.created_at)}
                </div>

                <div className="rounded-xl bg-secondary/45 px-3 py-2.5">
                  <h2 className="text-[0.68rem] font-bold uppercase tracking-[0.14em] text-primary/80">
                    Request details
                  </h2>
                  <p className="mt-1 whitespace-pre-line text-sm leading-5 text-foreground/80">
                    {request.description || "No details provided."}
                  </p>
                </div>
              </div>

              <div className="hidden lg:block">
                <RequestActions
                  requestId={request.id}
                  requesterId={request.requester_id}
                  currentUserId={currentUserId}
                  isAvailable={!isUnavailable}
                />
              </div>

              {currentUserId === request.requester_id && !isUnavailable && (
                <RequestOwnerActions requestId={request.id} />
              )}

              <RequesterInfoCard requester={request.requester} />

              <button className="flex items-center gap-1 self-start text-xs text-muted-foreground transition-colors hover:text-destructive">
                <Flag className="size-3.5" />
                Report this request
              </button>
            </div>
          </section>

          {/* Similar requests */}
          {similar.length > 0 && (
            <section className="mt-12 border-t pt-10">
              <h2 className="mb-4 text-xl font-bold text-foreground">
                Similar requests
              </h2>
              <div className="overflow-hidden rounded-xl border bg-card">
                {similar.map((r, idx) => (
                  <div key={r.id} className={idx > 0 ? "border-t" : ""}>
                    <RequestRow request={r} currentUserId={currentUserId} />
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Mobile sticky action bar */}
      <div className="sticky bottom-0 z-40 border-t bg-card p-4 lg:hidden">
        <RequestActions
          requestId={request.id}
          requesterId={request.requester_id}
          currentUserId={currentUserId}
          isAvailable={!isUnavailable}
        />
      </div>

      <Footer />
    </div>
  );
}
