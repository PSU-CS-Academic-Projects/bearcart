// Plain (non-"use server") module so these can be imported by client components.
// A "use server" file may only export async functions.

export type ReportTargetType = "listing" | "request" | "message";

export const REPORT_REASONS = [
  "Fake or misleading",
  "Inappropriate content",
  "Spam",
  "Harassment or abuse",
  "Other",
] as const;

export const REPORT_DETAILS_MAX = 300;
