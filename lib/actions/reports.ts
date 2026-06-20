"use server";

import { createClient } from "@/lib/supabase-server";
import {
  sendReportAdminEmail,
  sendPostDelistedEmail,
} from "@/lib/email";
import { REPORT_DETAILS_MAX, type ReportTargetType } from "@/lib/report-constants";
import { logActivity } from "@/lib/activity-log";
import { enforceRateLimit } from "@/lib/ratelimit";

// ─── Types ────────────────────────────────────────────────────────────────────
// Report reasons / constants / target-type live in lib/report-constants.ts so
// they can be imported by client components ("use server" allows only async exports).

// ─── Core ─────────────────────────────────────────────────────────────────────

async function createReport(
  targetType: ReportTargetType,
  targetId: string,
  reason: string,
  details: string | null
): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be logged in to report.");

  // Rate limit: 10 reports per hour per ID.
  await enforceRateLimit("reports", `user:${user.id}`);

  if (!reason || !reason.trim()) throw new Error("Please select a reason.");

  const cleanDetails = details?.trim().slice(0, REPORT_DETAILS_MAX) || null;

  // Snapshot the message so the report survives deletion. Reporter is a
  // conversation participant, so RLS lets them read it.
  let snapshot: {
    message_content?: string;
    message_sender_id?: string;
    message_recipient_id?: string | null;
    message_created_at?: string;
  } = {};
  let messageLabel = "";

  if (targetType === "message") {
    const { data: msg } = await supabase
      .from("messages")
      .select("content, sender_id, created_at, conversation_id")
      .eq("id", targetId)
      .single();
    if (!msg) throw new Error("Message not found.");

    const { data: conv } = await supabase
      .from("conversations")
      .select("buyer_id, seller_id")
      .eq("id", msg.conversation_id)
      .single();
    const recipient = conv
      ? conv.buyer_id === msg.sender_id ? conv.seller_id : conv.buyer_id
      : null;

    snapshot = {
      message_content: msg.content,
      message_sender_id: msg.sender_id,
      message_recipient_id: recipient,
      message_created_at: msg.created_at,
    };
    messageLabel = (msg.content ?? "").slice(0, 80);
  }

  // Insert the report (unique per reporter+target → dedupe)
  const { error: insErr } = await supabase.from("reports").insert({
    reporter_id: user.id,
    target_type: targetType,
    target_id: targetId,
    reason,
    details: cleanDetails,
    ...snapshot,
  });

  if (insErr) {
    if (insErr.code === "23505") throw new Error("You've already reported this.");
    throw new Error("Failed to submit report. Please try again.");
  }

  // Privileged effects: count, auto-delist at 2, in-app notifications
  const { data: effects } = await supabase.rpc("process_report_effects", {
    p_target_type: targetType,
    p_target_id: targetId,
  });

  const count: number = effects?.count ?? 1;
  const didDelist: boolean = effects?.did_delist ?? false;
  const ownerId: string | null = effects?.owner_id ?? null;
  const title: string = effects?.title ?? "";
  const label = targetType === "message" ? messageLabel || "a message" : title || `a ${targetType}`;

  // Audit: record automatic delisting (triggered at the 2-report threshold).
  if (didDelist && targetType === "listing") {
    await logActivity({
      type: "listing_auto_delisted",
      actorId: user.id,
      actorName: null,
      targetType: "listing",
      targetId,
      targetTitle: title || null,
    });
  }

  // Emails — awaited so they actually send in serverless, but never block
  // report success on email failure.
  try {
    const { data: admins } = await supabase
      .from("users")
      .select("email")
      .eq("is_admin", true);

    await Promise.all(
      (admins ?? [])
        .filter((a) => a.email)
        .map((a) =>
          sendReportAdminEmail({
            toEmail: a.email,
            targetType,
            targetLabel: label,
            reason,
            details: cleanDetails,
            reportCount: count,
          })
        )
    );

    if (didDelist && ownerId && targetType !== "message") {
      const { data: owner } = await supabase
        .from("users")
        .select("email, first_name")
        .eq("id", ownerId)
        .single();
      if (owner?.email) {
        await sendPostDelistedEmail({
          toEmail: owner.email,
          firstName: owner.first_name ?? "there",
          postType: targetType,
          postTitle: title,
          reason: null,
        });
      }
    }
  } catch (err) {
    console.error("[reports] email error:", err);
  }
}

// ─── Public actions ───────────────────────────────────────────────────────────

export async function reportListing(listingId: string, reason: string, details: string | null) {
  return createReport("listing", listingId, reason, details);
}

export async function reportRequest(requestId: string, reason: string, details: string | null) {
  return createReport("request", requestId, reason, details);
}

export async function reportMessage(messageId: string, reason: string, details: string | null) {
  return createReport("message", messageId, reason, details);
}
