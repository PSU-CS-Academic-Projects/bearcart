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
const LOGO_URL = `${APP_URL}/bearcart.png`;

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
                    <span style="display:inline-block;vertical-align:middle;margin-left:10px;font-size:20px;font-weight:700;color:${BRAND.primary};letter-spacing:-0.3px;">BearCart</span>
                    <span style="display:block;margin-left:46px;margin-top:2px;font-size:12px;color:${BRAND.muted};font-weight:500;">The PSU Marketplace</span>
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
              <p style="margin:0 0 4px;font-size:12px;color:${BRAND.muted};font-weight:500;">BearCart · PSU Exclusive</p>
              <p style="margin:0;font-size:11px;color:${BRAND.muted};line-height:1.6;">
                This is an automated email — please do not reply.<br />
                &copy; ${new Date().getFullYear()} BearCart — Palawan State University Marketplace
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
  Welcome, ${safeName}! 👋
</h1>
<p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:${BRAND.ink};">
  You&rsquo;re now part of the official PSU marketplace.
  Connect with classmates and faculty to buy, sell, and find what you need on campus.
</p>

<p style="margin:0 0 12px;font-size:14px;font-weight:600;color:${BRAND.ink};">Here&rsquo;s what you can do:</p>
<table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:0 0 28px;">
  <tr><td style="padding:6px 0;font-size:14px;color:${BRAND.ink};">✅ &nbsp; Post items you want to sell</td></tr>
  <tr><td style="padding:6px 0;font-size:14px;color:${BRAND.ink};">✅ &nbsp; Browse listings from fellow Bearcats</td></tr>
  <tr><td style="padding:6px 0;font-size:14px;color:${BRAND.ink};">✅ &nbsp; Message sellers directly</td></tr>
  <tr><td style="padding:6px 0;font-size:14px;color:${BRAND.ink};">✅ &nbsp; Post what you&rsquo;re looking for</td></tr>
</table>

<div style="margin:0 0 28px;text-align:center;">
  ${ctaButton(`${APP_URL}/listings`, "Start Browsing")}
</div>

<div style="border:1px solid ${BRAND.border};border-radius:8px;padding:16px 18px;background-color:${BRAND.wash};">
  <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:${BRAND.ink};">Quick reminders:</p>
  <p style="margin:0;font-size:13px;line-height:1.7;color:${BRAND.muted};">
    → Meetups happen on PSU campus only<br />
    → Cash on meetup — no shipping<br />
    → Be respectful 🙏
  </p>
</div>
`;

  await transporter.sendMail({
    from: FROM,
    to: toEmail,
    subject: `Welcome to BearCart, ${firstName}! 🎉`,
    html: emailShell({
      body,
      preheader: `Welcome to BearCart — start browsing campus listings now.`,
    }),
  });
}

// ─── Message Notification ─────────────────────────────────────────────────────

export async function sendMessageNotificationEmail({
  toEmail,
  receiverFirstName,
  senderFullName,
  senderFirstName,
  listingTitle,
  listingPrice,
  messagePreview,
  conversationId,
}: {
  toEmail: string;
  receiverFirstName: string;
  senderFullName: string;
  senderFirstName: string;
  listingTitle: string | null;
  listingPrice: number | null;
  messagePreview: string;
  conversationId: string;
}) {
  const conversationUrl = `${APP_URL}/messages?conversation=${conversationId}`;
  const safeReceiver = escapeHtml(receiverFirstName);
  const safeSender = escapeHtml(senderFullName);
  const safeMessage = escapeHtml(truncate(messagePreview, 200));
  const safeListingTitle = listingTitle ? escapeHtml(listingTitle) : null;

  const subject = safeListingTitle
    ? `${senderFirstName} sent you a message about ${listingTitle}`
    : `${senderFirstName} sent you a message on BearCart`;

  const listingBlock = safeListingTitle
    ? `
<p style="margin:20px 0 8px;font-size:13px;font-weight:600;color:${BRAND.ink};">About this listing:</p>
<div style="border:1px solid ${BRAND.border};border-radius:8px;padding:14px 16px;margin:0 0 20px;background-color:${BRAND.wash};">
  <p style="margin:0;font-size:15px;font-weight:600;color:${BRAND.ink};line-height:1.4;">${safeListingTitle}</p>
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
  <span style="color:${BRAND.ink};">${safeSender}</span> ${safeListingTitle ? "has messaged you about:" : "has messaged you."}
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
      preheader: `${senderFirstName} sent you a message — ${truncate(messagePreview, 80)}`,
    }),
  });
}
