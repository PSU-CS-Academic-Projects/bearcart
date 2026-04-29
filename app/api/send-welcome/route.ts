import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Fetch the user's profile to get their first name
    const { data: profile } = await supabase
      .from("users")
      .select("full_name, welcome_email_sent")
      .eq("id", user.id)
      .single();

    // Guard: only send once
    if (profile?.welcome_email_sent) {
      return NextResponse.json({ skipped: true });
    }

    const firstName =
      (user.user_metadata?.given_name as string | undefined) ??
      profile?.full_name?.split(" ")[0] ??
      user.email.split("@")[0];

    await sendWelcomeEmail({ toEmail: user.email, firstName });

    // Mark as sent so we never send it again
    await supabase
      .from("users")
      .update({ welcome_email_sent: true })
      .eq("id", user.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[send-welcome] Error:", err);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
