import nodemailer from "nodemailer";

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

// ─── Welcome Email ─────────────────────────────────────────────────────────────

export async function sendWelcomeEmail({
  toEmail,
  firstName,
}: {
  toEmail: string;
  firstName: string;
}) {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to BearCart!</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f0;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f0;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td align="center" style="background:linear-gradient(135deg,#6b3a2a 0%,#a05c3c 100%);border-radius:16px 16px 0 0;padding:48px 32px 36px;">
              <div style="font-size:48px;margin-bottom:12px;">🐻</div>
              <h1 style="margin:0;color:#fff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">Welcome to BearCart!</h1>
              <p style="margin:10px 0 0;color:rgba(255,255,255,0.85);font-size:16px;">The official PalSU student marketplace</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#fff;padding:40px 40px 32px;">
              <p style="margin:0 0 20px;font-size:18px;color:#1a1a1a;font-weight:600;">Hey ${firstName}! 🎉</p>
              <p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.7;">
                Your PalSU account is all set and you're officially part of the <strong>BearCart</strong> family —
                the campus marketplace built by Bearcats, for Bearcats!
              </p>
              <p style="margin:0 0 24px;font-size:15px;color:#444;line-height:1.7;">
                Here's what you can do:
              </p>

              <!-- Feature list -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;">
                    <span style="font-size:20px;vertical-align:middle;">🛍️</span>
                    <span style="font-size:14px;color:#333;margin-left:12px;vertical-align:middle;">Browse and buy listings from fellow PalSU students</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;">
                    <span style="font-size:20px;vertical-align:middle;">📦</span>
                    <span style="font-size:14px;color:#333;margin-left:12px;vertical-align:middle;">List your own items and reach the whole campus</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding:10px 0;">
                    <span style="font-size:20px;vertical-align:middle;">💬</span>
                    <span style="font-size:14px;color:#333;margin-left:12px;vertical-align:middle;">Message sellers and buyers directly — no middlemen</span>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <div style="text-align:center;margin-top:8px;">
                <a href="${APP_URL}/listings"
                   style="display:inline-block;background:linear-gradient(135deg,#6b3a2a,#a05c3c);color:#fff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:50px;letter-spacing:0.3px;">
                  Explore BearCart →
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9f6f3;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#999;line-height:1.6;">
                You're receiving this because you signed up for BearCart with your PalSU account.<br/>
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

  await transporter.sendMail({
    from: FROM,
    to: toEmail,
    subject: "🐻 Welcome to BearCart, Bearcat!",
    html,
  });
}

// ─── Message Inquiry Notification ─────────────────────────────────────────────

export async function sendMessageNotificationEmail({
  toEmail,
  sellerName,
  buyerName,
  listingTitle,
  messagePreview,
  conversationId,
}: {
  toEmail: string;
  sellerName: string;
  buyerName: string;
  listingTitle: string;
  messagePreview: string;
  conversationId: string;
}) {
  const conversationUrl = `${APP_URL}/messages?conversation=${conversationId}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New message on BearCart</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f5f0;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f0;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

          <!-- Header -->
          <tr>
            <td align="center" style="background:linear-gradient(135deg,#6b3a2a 0%,#a05c3c 100%);border-radius:16px 16px 0 0;padding:36px 32px 28px;">
              <div style="font-size:36px;margin-bottom:8px;">💬</div>
              <h1 style="margin:0;color:#fff;font-size:22px;font-weight:800;">New Message on BearCart</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#fff;padding:36px 40px 28px;">
              <p style="margin:0 0 6px;font-size:15px;color:#666;">Hi ${sellerName},</p>
              <p style="margin:0 0 24px;font-size:17px;color:#1a1a1a;font-weight:600;line-height:1.5;">
                <strong>${buyerName}</strong> has messaged about <strong>${listingTitle}</strong>
              </p>

              <!-- Message bubble -->
              <div style="background:#f7f3f0;border-left:4px solid #a05c3c;border-radius:0 12px 12px 0;padding:16px 20px;margin-bottom:28px;">
                <p style="margin:0;font-size:14px;color:#333;line-height:1.7;font-style:italic;">${messagePreview}</p>
              </div>

              <!-- CTA -->
              <div style="text-align:center;">
                <a href="${conversationUrl}"
                   style="display:inline-block;background:linear-gradient(135deg,#6b3a2a,#a05c3c);color:#fff;text-decoration:none;font-size:15px;font-weight:700;padding:14px 36px;border-radius:50px;letter-spacing:0.3px;">
                  Reply Now →
                </a>
              </div>

              <p style="margin:24px 0 0;font-size:12px;color:#aaa;text-align:center;line-height:1.6;">
                Responding quickly increases your chances of a successful sale!
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9f6f3;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#999;line-height:1.6;">
                You're receiving this because you have an active listing on BearCart.<br/>
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

  await transporter.sendMail({
    from: FROM,
    to: toEmail,
    subject: `💬 ${buyerName} has messaged about "${listingTitle}"`,
    html,
  });
}
