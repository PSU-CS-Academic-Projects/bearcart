import nodemailer from "nodemailer";
import { formatPeso } from "@/lib/currency";

// ─── Transport ─────────────────────────────────────────────────────────────────

const transporter = nodemailer.createTransport({
  host: process.env.BREVO_SMTP_HOST,
  port: Number(process.env.BREVO_SMTP_PORT ?? 587),
  secure: false, // STARTTLS
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_PASS,
  },
});

const FROM = `"${process.env.BREVO_FROM_NAME ?? "BearCart"}" <${process.env.BREVO_FROM_EMAIL}>`;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const LOGO_URL = `${APP_URL}/bearcart.svg`;

// ─── Brand Tokens (inlined into email HTML) ──────────────────────────────────

const BRAND = {
  primary: "#DD7B2C",
  primaryHover: "#C56E25",
  ink: "#1a1a1a",
  muted: "#666666",
  border: "#e5e5e5",
  bg: "#ffffff",
  wash: "#f9f7f3",
  font: "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  // Brand wordmark font — matches the navbar (Plus Jakarta Sans), with system fallback
  // for email clients that won't load the web font.
  brandFont: "'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
} as const;

// ─── Shared Layout ───────────────────────────────────────────────────────────

interface LayoutSection {
  body: string;
  preheader?: string;
}

function emailShell({ body, preheader }: LayoutSection): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>BearCart</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.wash};font-family:${BRAND.font};color:${BRAND.ink};">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;color:transparent;">${escapeHtml(preheader)}</div>` : ""}
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${BRAND.wash};padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:${BRAND.bg};border:1px solid ${BRAND.border};border-radius:8px;overflow:hidden;">

          <!-- Header / Brand -->
          <tr>
            <td style="padding:24px 28px;border-bottom:1px solid ${BRAND.border};">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td valign="middle" style="vertical-align:middle;">
                    <img src="${LOGO_URL}" alt="BearCart" width="36" height="36" style="display:inline-block;vertical-align:middle;border:0;" />
                    <span style="display:inline-block;vertical-align:middle;margin-left:10px;font-family:${BRAND.brandFont};font-size:20px;font-weight:800;color:${BRAND.ink};letter-spacing:-0.5px;">BearCart</span>
                    <span style="display:block;margin-left:46px;margin-top:2px;font-size:12px;color:${BRAND.muted};font-weight:500;">PalSU Marketplace</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 28px;">
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 28px;background-color:${BRAND.wash};border-top:1px solid ${BRAND.border};text-align:center;">
              <p style="margin:0 0 4px;font-size:12px;color:${BRAND.muted};font-weight:500;">BearCart · PalSU Exclusive</p>
              <p style="margin:0;font-size:11px;color:${BRAND.muted};line-height:1.6;">
                This is an automated email - please do not reply.<br />
                &copy; ${new Date().getFullYear()} BearCart - Palawan State University Marketplace
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

function ctaButton(href: string, label: string): string {
  return `
<table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
  <tr>
    <td align="center" style="border-radius:8px;background-color:${BRAND.primary};">
      <a href="${href}"
         style="display:inline-block;padding:12px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;font-family:${BRAND.font};">
        ${label}
      </a>
    </td>
  </tr>
</table>
`.trim();
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function truncate(text: string, max = 200): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + "…";
}

// ─── Welcome Email ─────────────────────────────────────────────────────────────

export async function sendWelcomeEmail({
  toEmail,
  firstName,
}: {
  toEmail: string;
  firstName: string;
}) {
  const safeName = escapeHtml(firstName);

  const body = `
<h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:${BRAND.ink};line-height:1.3;">
  Welcome, ${safeName}! 
</h1>
<p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:${BRAND.ink};">
  You&rsquo;re now part of BearCart.
  Connect with students and faculty to buy, sell, and find what you need on campus.
</p>

<p style="margin:0 0 12px;font-size:14px;font-weight:600;color:${BRAND.ink};">Here&rsquo;s what you can do:</p>
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 28px;">
  <tr><td style="padding:6px 0;font-size:14px;color:${BRAND.ink};">✅ &nbsp; Post items you want to sell</td></tr>
  <tr><td style="padding:6px 0;font-size:14px;color:${BRAND.ink};">✅ &nbsp; Browse listings from fellow Bearcats</td></tr>
  <tr><td style="padding:6px 0;font-size:14px;color:${BRAND.ink};">✅ &nbsp; Message posters directly</td></tr>
  <tr><td style="padding:6px 0;font-size:14px;color:${BRAND.ink};">✅ &nbsp; Post what you&rsquo;re looking for</td></tr>
</table>

<div style="margin:0 0 28px;text-align:center;">
  ${ctaButton(`${APP_URL}/listings`, "Start Browsing")}
</div>

<div style="border:1px solid ${BRAND.border};border-radius:8px;padding:16px 18px;background-color:${BRAND.wash};">
  <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:${BRAND.ink};">Quick reminders:</p>
  <p style="margin:0;font-size:13px;line-height:1.7;color:${BRAND.muted};">
    → Keep transactions honest and safe<br />
    → Your reports help keep our community trustworthy<br />
    → Be respectful to fellow students and faculty
  </p>
</div>
`;

  await transporter.sendMail({
    from: FROM,
    to: toEmail,
    subject: `Welcome to BearCart, ${firstName} ! `,
    html: emailShell({
      body,
      preheader: `Welcome to BearCart - start browsing campus listings now.`,
    }),
  });
}

// ─── Message Notification ─────────────────────────────────────────────────────

export async function sendMessageNotificationEmail({
  toEmail,
  receiverFirstName,
  senderFullName,
  senderFirstName,
  contextType = "listing",
  listingTitle,
  listingPrice,
  messagePreview,
  conversationId,
}: {
  toEmail: string;
  receiverFirstName: string;
  senderFullName: string;
  senderFirstName: string;
  /** Whether this conversation is about a listing or a request. */
  contextType?: "listing" | "request";
  listingTitle: string | null;
  listingPrice: number | null;
  messagePreview: string;
  conversationId: string;
}) {
  const conversationUrl = `${APP_URL}/messages?conversation=${conversationId}`;
  const safeReceiver = escapeHtml(receiverFirstName);
  const safeSender = escapeHtml(senderFullName);
  const safeMessage = escapeHtml(truncate(messagePreview, 200));
  const safeContextTitle = listingTitle ? escapeHtml(listingTitle) : null;
  const contextWord = contextType === "request" ? "request" : "listing";

  const subject = safeContextTitle
    ? `${senderFirstName} sent you a message about ${listingTitle}`
    : `${senderFirstName} sent you a message on BearCart`;

  const listingBlock = safeContextTitle
    ? `
<p style="margin:20px 0 8px;font-size:13px;font-weight:600;color:${BRAND.ink};">About this ${contextWord}:</p>
<div style="border:1px solid ${BRAND.border};border-radius:8px;padding:14px 16px;margin:0 0 20px;background-color:${BRAND.wash};">
  <p style="margin:0;font-size:15px;font-weight:600;color:${BRAND.ink};line-height:1.4;">${safeContextTitle}</p>
  ${
    listingPrice !== null
      ? `<p style="margin:6px 0 0;font-size:15px;font-weight:700;color:${BRAND.primary};">${formatPeso(listingPrice)}</p>`
      : ""
  }
</div>
`
    : `
<div style="margin:20px 0;"></div>
`;

  const body = `
<p style="margin:0 0 8px;font-size:14px;color:${BRAND.muted};">Hi ${safeReceiver},</p>
<p style="margin:0 0 4px;font-size:17px;font-weight:600;color:${BRAND.ink};line-height:1.5;">
  <span style="color:${BRAND.ink};">${safeSender}</span> ${safeContextTitle ? "has messaged you about:" : "has messaged you."}
</p>

${listingBlock}

<p style="margin:0 0 8px;font-size:13px;font-weight:600;color:${BRAND.ink};">Their message:</p>
<div style="border:1px solid ${BRAND.border};border-left:3px solid ${BRAND.primary};border-radius:8px;padding:14px 16px;margin:0 0 28px;background-color:${BRAND.wash};">
  <p style="margin:0;font-size:14px;line-height:1.6;color:${BRAND.ink};font-style:italic;">&ldquo;${safeMessage}&rdquo;</p>
</div>

<div style="margin:0 0 24px;text-align:center;">
  ${ctaButton(conversationUrl, "View Conversation")}
</div>

<p style="margin:0;font-size:12px;color:${BRAND.muted};text-align:center;line-height:1.6;">
  If you&rsquo;ve already seen this message, you can ignore this email.
</p>
`;

  await transporter.sendMail({
    from: FROM,
    to: toEmail,
    subject,
    html: emailShell({
      body,
      preheader: `${senderFirstName} sent you a message - ${truncate(messagePreview, 80)}`,
    }),
  });
}

// ─── Moderation: shared notice block ──────────────────────────────────────────

function noticeBox(label: string, value: string): string {
  return `
<div style="border:1px solid ${BRAND.border};border-radius:8px;padding:14px 16px;margin:0 0 20px;background-color:${BRAND.wash};">
  <p style="margin:0 0 4px;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;color:${BRAND.muted};">${escapeHtml(label)}</p>
  <p style="margin:0;font-size:14px;line-height:1.6;color:${BRAND.ink};">${escapeHtml(value)}</p>
</div>`.trim();
}

// ─── Admin: new report submitted ──────────────────────────────────────────────

export async function sendReportAdminEmail({
  toEmail,
  targetType,
  targetLabel,
  reason,
  details,
  reportCount,
}: {
  toEmail: string;
  targetType: "listing" | "request" | "message";
  targetLabel: string;
  reason: string;
  details: string | null;
  reportCount: number;
}) {
  const body = `
<h1 style="margin:0 0 16px;font-size:20px;font-weight:700;color:${BRAND.ink};">New ${escapeHtml(targetType)} report</h1>
<p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:${BRAND.ink};">
  A ${escapeHtml(targetType)} has been reported on BearCart and needs review.
</p>
${noticeBox("Reported " + targetType, targetLabel)}
${noticeBox("Reason", reason)}
${details ? noticeBox("Additional details", details) : ""}
${noticeBox("Total reports on this item", String(reportCount))}
<div style="margin:8px 0 0;text-align:center;">
  ${ctaButton(`${APP_URL}/admin`, "Open Admin Dashboard")}
</div>`;

  await transporter.sendMail({
    from: FROM,
    to: toEmail,
    subject: `[BearCart Admin] ${targetType} reported - ${truncate(reason, 40)}`,
    html: emailShell({ body, preheader: `A ${targetType} was reported and needs review.` }),
  });
}

// ─── User: post delisted / restored / taken down ──────────────────────────────

export async function sendPostDelistedEmail({
  toEmail, firstName, postType, postTitle, reason,
}: { toEmail: string; firstName: string; postType: "listing" | "request"; postTitle: string; reason: string | null }) {
  const body = `
<p style="margin:0 0 8px;font-size:14px;color:${BRAND.muted};">Hi ${escapeHtml(firstName)},</p>
<h1 style="margin:0 0 14px;font-size:20px;font-weight:700;color:${BRAND.ink};">Your ${escapeHtml(postType)} has been temporarily removed</h1>
<p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:${BRAND.ink};">
  Your ${escapeHtml(postType)} <strong>&ldquo;${escapeHtml(postTitle)}&rdquo;</strong> has been delisted by a BearCart admin and is no longer visible to other users. It still appears in your profile, marked as delisted.
</p>
${reason ? noticeBox("Reason", reason) : ""}
<p style="margin:0;font-size:13px;line-height:1.6;color:${BRAND.muted};">If you believe this was a mistake, please review our community guidelines.</p>`;
  await transporter.sendMail({
    from: FROM, to: toEmail,
    subject: `Your BearCart ${postType} was removed`,
    html: emailShell({ body, preheader: `Your ${postType} "${truncate(postTitle, 50)}" was temporarily removed.` }),
  });
}

export async function sendPostRestoredEmail({
  toEmail, firstName, postType, postTitle,
}: { toEmail: string; firstName: string; postType: "listing" | "request"; postTitle: string }) {
  const body = `
<p style="margin:0 0 8px;font-size:14px;color:${BRAND.muted};">Hi ${escapeHtml(firstName)},</p>
<h1 style="margin:0 0 14px;font-size:20px;font-weight:700;color:${BRAND.ink};">Your ${escapeHtml(postType)} is live again</h1>
<p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:${BRAND.ink};">
  Good news - your ${escapeHtml(postType)} <strong>&ldquo;${escapeHtml(postTitle)}&rdquo;</strong> has been reviewed and restored. It is once again visible to everyone on BearCart.
</p>`;
  await transporter.sendMail({
    from: FROM, to: toEmail,
    subject: `Your BearCart ${postType} has been restored`,
    html: emailShell({ body, preheader: `Your ${postType} is visible again.` }),
  });
}

export async function sendPostTakedownEmail({
  toEmail, firstName, postType, postTitle, reason,
}: { toEmail: string; firstName: string; postType: "listing" | "request"; postTitle: string; reason: string }) {
  const body = `
<p style="margin:0 0 8px;font-size:14px;color:${BRAND.muted};">Hi ${escapeHtml(firstName)},</p>
<h1 style="margin:0 0 14px;font-size:20px;font-weight:700;color:${BRAND.ink};">Your ${escapeHtml(postType)} has been permanently removed</h1>
<p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:${BRAND.ink};">
  Your ${escapeHtml(postType)} <strong>&ldquo;${escapeHtml(postTitle)}&rdquo;</strong> has been permanently taken down by a BearCart admin for violating our community guidelines. This action cannot be undone.
</p>
${noticeBox("Reason", reason)}`;
  await transporter.sendMail({
    from: FROM, to: toEmail,
    subject: `Your BearCart ${postType} was permanently removed`,
    html: emailShell({ body, preheader: `Your ${postType} was permanently taken down.` }),
  });
}

// ─── User: account warned / banned ────────────────────────────────────────────

const BAN_TYPE_LABEL: Record<string, string> = {
  post: "posting listings and requests",
  chat: "sending messages",
  full: "posting and messaging",
};

export async function sendAccountWarnedEmail({
  toEmail, firstName, reason,
}: { toEmail: string; firstName: string; reason: string }) {
  const body = `
<p style="margin:0 0 8px;font-size:14px;color:${BRAND.muted};">Hi ${escapeHtml(firstName)},</p>
<h1 style="margin:0 0 14px;font-size:20px;font-weight:700;color:${BRAND.ink};">You&rsquo;ve received a warning</h1>
<p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:${BRAND.ink};">
  A BearCart admin has issued a warning on your account. Please review our community guidelines to avoid further action.
</p>
${noticeBox("Reason", reason)}`;
  await transporter.sendMail({
    from: FROM, to: toEmail,
    subject: `A warning has been issued on your BearCart account`,
    html: emailShell({ body, preheader: `You've received a warning on BearCart.` }),
  });
}

export async function sendAccountBannedEmail({
  toEmail, firstName, banType, reason,
}: { toEmail: string; firstName: string; banType: "post" | "chat" | "full"; reason: string }) {
  const scope = BAN_TYPE_LABEL[banType] ?? "some features";
  const body = `
<p style="margin:0 0 8px;font-size:14px;color:${BRAND.muted};">Hi ${escapeHtml(firstName)},</p>
<h1 style="margin:0 0 14px;font-size:20px;font-weight:700;color:${BRAND.ink};">Your account has been restricted</h1>
<p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:${BRAND.ink};">
  A BearCart admin has restricted your account. You are now banned from <strong>${escapeHtml(scope)}</strong>. You can still browse and log in.
</p>
${noticeBox("Restriction", banType === "full" ? "Full ban" : banType === "post" ? "Post ban" : "Chat ban")}
${noticeBox("Reason", reason)}`;
  await transporter.sendMail({
    from: FROM, to: toEmail,
    subject: `Your BearCart account has been restricted`,
    html: emailShell({ body, preheader: `Your account has been restricted from ${scope}.` }),
  });
}

export async function sendAccountUnbannedEmail({
  toEmail, firstName,
}: { toEmail: string; firstName: string }) {
  const body = `
<p style="margin:0 0 8px;font-size:14px;color:${BRAND.muted};">Hi ${escapeHtml(firstName)},</p>
<h1 style="margin:0 0 14px;font-size:20px;font-weight:700;color:${BRAND.ink};">Your account restriction has been lifted</h1>
<p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:${BRAND.ink};">
  Good news - a BearCart admin has reviewed your account and <strong>removed the restriction</strong>. You now have full access again: you can post listings and requests and message other Bearcats.
</p>
<p style="margin:0;font-size:13px;line-height:1.6;color:${BRAND.muted};">Thanks for being part of the community - please keep our guidelines in mind.</p>`;
  await transporter.sendMail({
    from: FROM, to: toEmail,
    subject: `Your BearCart account restriction has been lifted`,
    html: emailShell({ body, preheader: `Your account restriction has been lifted - full access restored.` }),
  });
}
