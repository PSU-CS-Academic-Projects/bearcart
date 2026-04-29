import { notFound } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { PhotoGallery } from "@/components/photo-gallery";
import { Breadcrumb } from "@/components/breadcrumb";
import { MeetupInfo } from "@/components/meetup-info";
import { RequesterInfoCard } from "@/components/requester-info-card";
import { RequestActions } from "@/components/request-actions";
import { RequestRow } from "@/components/request-row";
import { Badge } from "@/components/ui/badge";
import { Clock, Flag, Warning } from "@phosphor-icons/react/dist/ssr";
import { getRequestById, getSimilarRequests } from "@/lib/actions/requests";
import { createClient } from "@/lib/supabase-server";
import { formatTimeAgo } from "@/lib/listing-helpers";
import { formatBudget, urgencyLabel } from "@/lib/request-helpers";
import { cn } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

const URGENCY_BADGE_STYLES: Record<string, string> = {
  not_urgent: "bg-muted text-muted-foreground",
  moderate: "bg-amber-100 text-amber-800",
  urgent: "bg-destructive/10 text-destructive",
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
        <div className="mx-auto max-w-7xl px-4 py-6">
          {/* Breadcrumb */}
          <Breadcrumb
            items={[
              { label: "Looking For", href: "/requests" },
              { label: request.title },
            ]}
          />

          {/* Status banner */}
          {isUnavailable && (
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <Warning className="size-5 shrink-0 text-amber-600" />
              <div>
                <p className="font-semibold text-amber-800">
                  {request.status === "fulfilled"
                    ? "This request has been fulfilled"
                    : "This request is closed"}
                </p>
                <p className="text-sm text-amber-600">
                  {request.status === "fulfilled"
                    ? "The requester has marked this as completed."
                    : "The requester is no longer looking for this item."}
                </p>
              </div>
            </div>
          )}

          {/* Two-column layout */}
          <div className="mt-6 grid gap-8 lg:grid-cols-5">
            {/* Main column */}
            <div className="flex flex-col gap-6 lg:col-span-3">
              {/* Photos (only if exist) */}
              {photos.length > 0 && (
                <PhotoGallery photos={photos} alt={request.title} />
              )}

              {/* Title & meta */}
              <div>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <Badge
                    className={cn(
                      URGENCY_BADGE_STYLES[request.urgency] ?? "bg-gray-100 text-gray-800"
                    )}
                  >
                    {urgencyLabel(request.urgency)}
                  </Badge>
                  <Badge variant="secondary">{request.category}</Badge>
                </div>

                <h1 className="text-balance text-2xl font-bold text-foreground md:text-3xl">
                  {request.title}
                </h1>

                <p className="mt-2 text-xl font-bold text-primary">
                  {formatBudget(request.budget_min, request.budget_max)}
                </p>

                <div className="mt-3 flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="size-4" />
                  Posted {formatTimeAgo(request.created_at)}
                </div>
              </div>

              {/* Description */}
              {request.description && (
                <div>
                  <h2 className="mb-3 text-lg font-semibold text-foreground">
                    Details
                  </h2>
                  <p className="max-w-[65ch] whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                    {request.description}
                  </p>
                </div>
              )}

              {/* Meetup Info */}
              <MeetupInfo />

              {/* Report */}
              <button className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-destructive">
                <Flag className="size-4" />
                Report this request
              </button>
            </div>

            {/* Side column */}
            <div className="flex flex-col gap-6 lg:col-span-2">
              <RequesterInfoCard requester={request.requester} />

              {/* Action button */}
              <div className="hidden lg:block">
                <RequestActions
                  requestId={request.id}
                  requesterId={request.requester_id}
                  currentUserId={currentUserId}
                  isAvailable={!isUnavailable}
                />
              </div>
            </div>
          </div>

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
