import type { RequestRow, RequestUrgency } from "@/lib/actions/requests";

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
  if (min !== null && max !== null) {
    return `₱${min.toLocaleString()} – ₱${max.toLocaleString()}`;
  }
  if (min !== null) return `₱${min.toLocaleString()}`;
  if (max !== null) return `Up to ₱${max.toLocaleString()}`;
  return "Budget flexible";
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

/** Pick the first image URL (lowest order) from a request, or empty string. */
export function getRequestCoverImage(request: RequestRow): string {
  const sorted = [...(request.request_images ?? [])].sort((a, b) => a.order - b.order);
  return sorted[0]?.image_url ?? "";
}
