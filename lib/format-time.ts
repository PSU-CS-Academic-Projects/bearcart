/**
 * Compact timestamp formatting shared by the conversation list and the admin
 * activity feed, so both read the same way:
 *   - today      → time, e.g. "2:14 PM"
 *   - yesterday  → "Yesterday"
 *   - < 7 days   → weekday short name, e.g. "Tue"
 *   - older      → date, e.g. "Jun 12"
 */
export function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } else if (days === 1) {
    return "Yesterday";
  } else if (days < 7) {
    return date.toLocaleDateString("en-US", { weekday: "short" });
  } else {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
}

/**
 * Full, precise timestamp for tooltips / audit display, e.g.
 * "Jun 20, 2026, 2:14:32 PM". Used where the short label is relative but the
 * exact moment still matters (e.g. the admin moderation feed).
 */
export function formatExactTime(date: Date): string {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}
