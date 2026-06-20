import type { RequestRow, RequestUrgency } from "@/lib/actions/requests";
import { formatPeso } from "@/lib/currency";

/** Build a "Juan C." style short name from a request's requester. */
export function getRequesterShortName(requester: RequestRow["requester"]): string {
  const first = requester?.first_name?.trim();
  const last = requester?.last_name?.trim();
  if (first && last) return `${first} ${last.charAt(0).toUpperCase()}.`;
  if (first) return first;
  if (requester?.full_name) {
    const parts = requester.full_name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
    }
    return parts[0];
  }
  return "PSU Member";
}

/** Build the display name used on detail pages (full name fallback). */
export function getRequesterFullName(requester: RequestRow["requester"]): string {
  if (requester?.full_name) return requester.full_name;
  const first = requester?.first_name?.trim() ?? "";
  const last = requester?.last_name?.trim() ?? "";
  const combined = [first, last].filter(Boolean).join(" ");
  return combined || "PSU Member";
}

/** Format the budget range as "₱200 - ₱300", "₱200+", "Up to ₱300", or "Budget flexible". */
export function formatBudget(min: number | null, max: number | null): string {
  const positiveMin = min !== null && min > 0 ? min : null;
  const positiveMax = max !== null && max > 0 ? max : null;

  if (positiveMin !== null && positiveMax !== null) {
    return `${formatPeso(positiveMin)} – ${formatPeso(positiveMax)}`;
  }
  if (positiveMin !== null) return formatPeso(positiveMin);
  if (positiveMax !== null) return `Up to ${formatPeso(positiveMax)}`;
  return "Budget flexible";
}

export function hasPositiveBudget(min: number | null, max: number | null): boolean {
  return (min !== null && min > 0) || (max !== null && max > 0);
}

/** Convert urgency value to a human label. */
export function urgencyLabel(urgency: RequestUrgency): string {
  switch (urgency) {
    case "urgent": return "Urgent";
    case "moderate": return "Need Soon";
    case "not_urgent":
    default: return "Flexible";
  }
}

/** All request image URLs ordered by their `order` column (cover first). */
export function getRequestImageUrls(request: RequestRow): string[] {
  return [...(request.request_images ?? [])]
    .sort((a, b) => a.order - b.order)
    .map((img) => img.image_url);
}

/** Pick the first image URL (lowest order) from a request, or empty string. */
export function getRequestCoverImage(request: RequestRow): string {
  return getRequestImageUrls(request)[0] ?? "";
}
