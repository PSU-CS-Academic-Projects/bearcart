"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { X } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { OnboardingSteps } from "@/components/onboarding-steps";
import { supabase } from "@/lib/supabase";

// ─── Document content ────────────────────────────────────────────────────────

const TERMS_CONTENT = `1. ACCEPTANCE OF TERMS

By accessing or using BearCart, you agree to be bound by these Terms of Service. If you do not agree to these terms, you must not use the platform. These terms apply to all users of BearCart, including buyers, sellers, and visitors.

BearCart reserves the right to update or modify these Terms of Service at any time. Continued use of the platform after changes are posted constitutes your acceptance of the revised terms.

2. ELIGIBILITY

BearCart is exclusively available to currently enrolled students and faculty of Palawan State University (PalSU). To use the platform, you must:

• Have a valid and active PalSU institutional Google account (@psu.palawan.edu.ph)
• Be at least 18 years of age, or have the consent of a parent or guardian if younger
• Agree to these Terms of Service and our Privacy Policy

Users under 18 years of age must have the consent of a parent or guardian to use BearCart.

BearCart reserves the right to suspend or terminate accounts of users who no longer meet these eligibility requirements.

3. ACCOUNT RESPONSIBILITIES

Your BearCart account is tied to your PalSU Google account. You are responsible for:

• All activity that occurs under your account
• Keeping your account credentials secure and confidential
• Ensuring your profile information is accurate and up to date
• Notifying us immediately if you suspect unauthorized use of your account

You may not create multiple accounts, share your account with others, or use another user's account without permission.

4. ACCEPTABLE USE

4.1 Permitted Activities

• Posting legitimate items for sale that you personally own
• Posting requests for items you wish to purchase
• Communicating with other users through in-app chat in a respectful manner
• Completing in-person transactions on the PalSU campus

4.2 Prohibited Activities

The following are strictly prohibited on BearCart:

• Listing or selling illegal items, including but not limited to prohibited drugs, weapons, counterfeit goods, and stolen property
• Listing items that violate PalSU's student conduct policies or Philippine law
• Posting false, misleading, or fraudulent listings
• Scamming, deceiving, or defrauding other users
• Harassing, threatening, or abusing other users through chat or any other feature
• Uploading violent, sexually explicit, or otherwise inappropriate content including images and text
• Impersonating another person or entity
• Creating fake accounts or manipulating the platform in any unauthorized way
• Using the platform for any commercial purpose outside of personal student-to-student transactions

Violations of these prohibited activities may result in immediate account suspension or permanent ban without prior notice.

5. LISTINGS AND CONTENT

When you post a listing or request on BearCart, you agree that:

• All information provided is accurate, complete, and not misleading
• You are the rightful owner of the item being listed
• Images uploaded are of the actual item and do not infringe on the rights of any third party
• The listed price is the actual price you intend to transact at

BearCart uses automated content moderation to screen listings, images, and messages for inappropriate content. Content that is flagged as violating these terms will be blocked or removed without notice.

BearCart reserves the right to remove any listing or request at any time, with or without notice, if it is deemed to violate these Terms of Service or for any other reason at our discretion.

6. TRANSACTIONS

6.1 In-Person Only - All transactions facilitated through BearCart are conducted in person on the PalSU campus. BearCart does not support, facilitate, or guarantee online payments, deliveries, or remote exchanges of any kind.

6.2 No Platform Involvement - BearCart acts solely as a platform connecting buyers and sellers. We are not a party to any transaction between users. All agreements, negotiations, and exchanges are made directly between the buyer and seller.

6.3 No Refund Guarantee - BearCart does not guarantee refunds, returns, or any form of buyer or seller protection. Once a transaction is completed in person, it is final. Users are encouraged to inspect items thoroughly before completing any exchange.

6.4 Transaction at Your Own Risk - By using BearCart to facilitate a transaction, you acknowledge that you do so at your own risk. BearCart is not liable for any loss, damage, or dispute arising from transactions between users.

7. CONTENT MODERATION

BearCart employs automated content moderation powered by OpenAI to screen user-submitted content including listing titles, descriptions, images, profile pictures, and chat images. Content identified as inappropriate will be blocked before it is published or delivered.

Users who repeatedly submit content that violates these terms may have their accounts suspended or permanently banned.

While we strive to maintain a safe and respectful platform, BearCart does not guarantee that all inappropriate content will be detected and removed. Users are encouraged to report any content that they believe violates these terms using the report feature.

8. REPORTING AND ENFORCEMENT

BearCart provides a reporting feature that allows users to flag listings, requests, and other users for violations of these Terms of Service. Reports are reviewed by platform administrators.

Upon review, BearCart may take any of the following actions:

• Remove the reported content
• Issue a warning to the offending user
• Temporarily suspend the offending user's account
• Permanently ban the offending user from the platform

BearCart's decisions on enforcement are final. Repeated violations or confirmed cases of scamming, harassment, or fraud will result in permanent account termination.

9. INTELLECTUAL PROPERTY

BearCart and its original content, features, and functionality are owned by its student developers and are protected under applicable intellectual property laws of the Philippines.

By posting content on BearCart (including listing images, descriptions, and profile information), you grant BearCart a non-exclusive, royalty-free license to display and use that content solely for the purpose of operating the platform.

You represent and warrant that you own or have the necessary rights to all content you post on BearCart, and that such content does not infringe on the intellectual property rights of any third party.

10. LIMITATION OF LIABILITY

BearCart is a student-developed project provided on an as-is and as-available basis. We make no warranties, express or implied, regarding the availability, reliability, or accuracy of the platform.

To the fullest extent permitted by Philippine law, BearCart and its developers shall not be liable for:

• Any loss or damage arising from transactions between users
• Any interruption, suspension, or termination of the platform
• Any unauthorized access to or alteration of your data
• Any content posted by other users
• Any other matter relating to your use of the platform

BearCart is not affiliated with or officially endorsed by Palawan State University in its capacity as a student project.

11. TERMINATION

BearCart reserves the right to suspend or terminate your account at any time, with or without cause, and with or without notice. Grounds for termination include but are not limited to violation of these Terms of Service, fraudulent activity, or prolonged inactivity.

You may request deletion of your account at any time. Upon termination, your listings will be removed from public view. Certain data may be retained as required by law or for platform integrity purposes, as described in our Privacy Policy.

12. GOVERNING LAW AND JURISDICTION

These Terms of Service are governed by and construed in accordance with the laws of the Republic of the Philippines, including but not limited to:

• Republic Act No. 10173 - Data Privacy Act of 2012
• Republic Act No. 8792 - Electronic Commerce Act of 2000
• The Revised Penal Code of the Philippines, as applicable

Any disputes arising from the use of BearCart shall be subject to the jurisdiction of the appropriate courts of the Philippines.

13. CONTACT

For questions, concerns, or feedback regarding these Terms of Service, you may contact us at bearcartpalsu@gmail.com.

Effective Date: June 2026`;

const PRIVACY_CONTENT = `1. INTRODUCTION

BearCart is a campus marketplace web application developed as a student project for Palawan State University (PalSU). It allows verified PalSU students and faculty to buy and sell items through in-person transactions on campus.

This Privacy Policy explains how we collect, use, store, and protect your personal data in accordance with Republic Act No. 10173, also known as the Data Privacy Act of 2012 (DPA), and its Implementing Rules and Regulations (IRR).

By using BearCart, you acknowledge that you have read and understood this Privacy Policy and consent to the collection and processing of your personal data as described herein.

2. PERSONAL INFORMATION CONTROLLER

BearCart is operated by PalSU students as an academic project under the supervision of Palawan State University. As the Personal Information Controller (PIC) under RA 10173, we are responsible for the processing of your personal data collected through this platform.

As this is currently a student project, a formal Data Protection Officer (DPO) has not yet been designated. For privacy-related concerns, you may reach us through the platform's support channels.

3. WHAT PERSONAL DATA WE COLLECT

We collect only the minimum personal data necessary to operate the marketplace. This includes:

3.1 Data Collected Automatically from Your PalSU Google Account

• Full name
• PalSU institutional email address (@psu.palawan.edu.ph)
• Profile picture from your Google account
• University role (Student or Faculty)

3.2 Data You Provide

• College or department
• Bio or profile description (optional)
• Listing information: title, description, price, category, and images of items for sale
• Request posts: title, description, budget, and reference images
• Messages sent through the in-app chat
• Profile picture uploads (if changed from Google account default)

3.3 Data Generated by Platform Activity

• Transaction records: items marked as sold and the associated buyer (if selected)
• Saved listings
• Reports submitted against listings, requests, or users
• Activity timestamps

4. PURPOSE AND LEGAL BASIS FOR PROCESSING

We process your personal data for the following purposes, consistent with Section 13 of RA 10173:

• To verify that users are legitimate PalSU students or faculty members
• To operate and display listings and requests on the marketplace
• To facilitate communication between buyers and sellers through in-app messaging
• To maintain transaction records for platform integrity
• To moderate content and enforce community standards using automated tools
• To allow administrators to manage the platform and respond to reports
• To improve the platform based on usage patterns

The legal bases for processing your data are: (a) your consent given upon registration and use of the platform; (b) the fulfillment of our obligations to you as a user of the marketplace; and (c) the legitimate interests of the platform in ensuring a safe and functional campus marketplace.

5. AUTOMATED CONTENT MODERATION

BearCart uses OpenAI's content moderation API (Omni Moderation) to automatically screen the following types of content before they are published or delivered:

• Listing titles and descriptions
• Images uploaded to listings
• Profile pictures uploaded by users
• Images sent through in-app chat messages

This automated screening is done to detect and block content that is violent, sexually explicit, or otherwise inappropriate. Images and text submitted for moderation are processed by OpenAI's systems. Please refer to OpenAI's Privacy Policy (openai.com/policies/privacy-policy) for information on how OpenAI handles this data.

Content flagged by the moderation system is blocked and not stored. Users are notified when their content is rejected.

6. DATA SHARING AND DISCLOSURE

We do not sell, trade, or rent your personal data to third parties. Your data may be shared only in the following circumstances:

• With other BearCart users to the extent necessary to operate the marketplace (e.g., your name and profile picture are visible to other users on listings and in chat)
• With OpenAI solely for the purpose of automated content moderation as described in Section 5
• With Supabase, our database and storage provider, which processes your data on our behalf as a data processor
• With PalSU administrators if required for academic or disciplinary purposes
• With law enforcement or government authorities if required by applicable Philippine law

Third-party service providers (OpenAI, Supabase, Google, Vercel) are engaged as data processors and are bound by their respective data protection agreements and privacy policies.

7. DATA STORAGE AND RETENTION

Your personal data is stored on Supabase servers. We retain your personal data for as long as your account remains active or as necessary to fulfill the purposes described in this policy.

If you request deletion of your account, we will remove your personal data from active databases within a reasonable period, subject to any legal or academic obligations to retain certain records.

Transaction records may be retained for a longer period for platform integrity and dispute resolution purposes.

8. YOUR RIGHTS AS A DATA SUBJECT

Under Republic Act No. 10173 and its IRR, you have the following rights regarding your personal data:

• Right to be informed - You have the right to know what personal data we collect, how it is used, and with whom it is shared.
• Right to access - You may request a copy of your personal data that we hold.
• Right to rectification - You may correct inaccurate or incomplete personal data through your profile settings.
• Right to erasure or blocking - You may request the deletion or blocking of your personal data under circumstances provided by law.
• Right to object - You may object to the processing of your personal data for certain purposes.
• Right to data portability - You may request a copy of your data in a structured, commonly used format.
• Right to lodge a complaint - You have the right to file a complaint with the National Privacy Commission (NPC) at www.privacy.gov.ph if you believe your data privacy rights have been violated.

To exercise any of these rights, please contact us through the platform's available support channels.

9. SECURITY MEASURES

We implement reasonable technical and organizational measures to protect your personal data against unauthorized access, disclosure, alteration, or destruction. These include:

• Authentication through PalSU Google accounts
• Row-level security policies on our database
• Automated content moderation to prevent harmful content
• HTTPS encryption for all data in transit

However, no system is completely secure. While we strive to protect your data, we cannot guarantee absolute security. You are responsible for maintaining the confidentiality of your account credentials.

10. COOKIES AND SESSION DATA

BearCart uses cookies and session tokens solely to maintain your login session. We do not use cookies for advertising or tracking purposes. By using the platform, you consent to the use of session cookies as described here.

11. CHANGES TO THIS PRIVACY POLICY

We may update this Privacy Policy from time to time. Changes will be posted on the platform and the effective date will be updated accordingly. Continued use of BearCart after any changes constitutes your acceptance of the updated policy.

12. CONTACT AND COMPLAINTS

For questions, concerns, or requests related to this Privacy Policy or the processing of your personal data, you may contact us at bearcartpalsu@gmail.com.

You also have the right to file a complaint directly with the National Privacy Commission of the Philippines:

National Privacy Commission
5th Floor Delegation Building, PICC Complex, Pasay City, Metro Manila
Website: www.privacy.gov.ph
Email: info@privacy.gov.ph

In compliance with Republic Act No. 10173 (Data Privacy Act of 2012)
Effective Date: June 2026`;

// ─── Modal ───────────────────────────────────────────────────────────────────

type DocType = "tos" | "pp";

function DocModal({
  title,
  content,
  onClose,
}: {
  title: string;
  content: string;
  onClose: () => void;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Check on mount too, in case the content is short enough to not need scrolling.
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    if (el.scrollHeight <= el.clientHeight) {
      setScrolledToBottom(true);
    }
  }, []);

  const handleScroll = () => {
    const el = bodyRef.current;
    if (!el) return;
    const reachedBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < 10; // small buffer
    if (reachedBottom) setScrolledToBottom(true);
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="relative flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl border bg-card shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Close"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div ref={bodyRef} onScroll={handleScroll} className="overflow-y-auto px-6 py-5">
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground/80">
            {content}
          </pre>
        </div>

        {/* Footer */}
        <div className="border-t px-6 py-4">
          <Button className="w-full" onClick={onClose} disabled={!scrolledToBottom}>
            Done Reading
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

import { Suspense } from "react";

function ConsentPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo") || "/listings";

  const [loading, setLoading] = useState(true);
  const [agreed, setAgreed] = useState(false);
  const [saving, setSaving] = useState(false);

  const [openDoc, setOpenDoc] = useState<DocType | null>(null);
  const [readTos, setReadTos] = useState(false);
  const [readPp, setReadPp] = useState(false);
  const bothRead = readTos && readPp;

  const openModal = (doc: DocType) => {
    setOpenDoc(doc);
    if (doc === "tos") setReadTos(true);
    if (doc === "pp") setReadPp(true);
  };

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        router.replace("/");
        return;
      }

      const { data } = await supabase
        .from("users")
        .select("college, terms_accepted")
        .eq("id", user.id)
        .single();

      if (!data?.college) {
        router.replace(`/setup?returnTo=${encodeURIComponent(returnTo)}`);
        return;
      }

      if (data?.terms_accepted) {
        router.replace(returnTo);
        return;
      }

      setLoading(false);
    });
  }, [router, returnTo]);

  const handleContinue = async () => {
    if (!agreed || !bothRead) return;
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/"); return; }

    const { error } = await supabase
      .from("users")
      .update({
        terms_accepted: true,
        terms_accepted_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      console.error("Consent error:", error.message);
      setSaving(false);
      return;
    }

    router.replace(returnTo);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      {/* Modal */}
      {openDoc === "tos" && (
        <DocModal
          title="Terms of Service"
          content={TERMS_CONTENT}
          onClose={() => setOpenDoc(null)}
        />
      )}
      {openDoc === "pp" && (
        <DocModal
          title="Privacy Policy"
          content={PRIVACY_CONTENT}
          onClose={() => setOpenDoc(null)}
        />
      )}

      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 md:p-8">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border bg-card p-6 shadow-sm md:p-10">

            {/* Step Indicator */}
            <OnboardingSteps active={2} />

            {/* Logo */}
            <div className="mb-6 flex flex-col items-center gap-2 text-center">
              <Link href="/" className="flex items-center gap-2">
                <Image src="/bearcart.svg" alt="BearCart" width={56} height={56} className="size-14" />
                <span className="text-2xl font-bold text-foreground">BearCart</span>
              </Link>
              <h1 className="mt-2 text-xl font-bold text-foreground">Before you continue</h1>
            </div>

            {/* Body */}
            <p className="mb-6 text-center text-sm text-muted-foreground">
              Please review and accept our Terms of Service and Privacy Policy to use BearCart.
            </p>

            {/* Document buttons */}
            <div className="mb-6 flex flex-col gap-2 rounded-xl border bg-muted/40 p-4">
              <button
                type="button"
                onClick={() => openModal("tos")}
                className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                <span className="flex items-center gap-2">
                  {readTos && <span className="size-1.5 rounded-full bg-emerald-500" />}
                  Terms of Service
                </span>
                <span className="text-xs text-muted-foreground">Read ↗</span>
              </button>
              <div className="h-px bg-border" />
              <button
                type="button"
                onClick={() => openModal("pp")}
                className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                <span className="flex items-center gap-2">
                  {readPp && <span className="size-1.5 rounded-full bg-emerald-500" />}
                  Privacy Policy
                </span>
                <span className="text-xs text-muted-foreground">Read ↗</span>
              </button>
            </div>

            {/* Hint when not both read */}
            {!bothRead && (
              <p className="mb-4 text-center text-xs text-muted-foreground">
                Please review both documents before continuing.
              </p>
            )}

            {/* Checkbox */}
            <div
              className={[
                "mb-6 flex items-start gap-3",
                bothRead ? "cursor-pointer" : "cursor-not-allowed opacity-50",
              ].join(" ")}
              onClick={() => { if (bothRead) setAgreed((v) => !v); }}
            >
              <Checkbox
                checked={agreed}
                disabled={!bothRead}
                className="mt-0.5 shrink-0 pointer-events-none"
              />
              <span
                className={["text-sm text-foreground leading-relaxed", bothRead ? "cursor-pointer" : "cursor-not-allowed"].join(" ")}
              >
                I have read and agree to the{" "}
                <button
                  type="button"
                  className="font-medium text-primary underline underline-offset-2 hover:text-primary/80"
                  onClick={(e) => { e.stopPropagation(); openModal("tos"); }}
                >
                  Terms of Service
                </button>{" "}
                and{" "}
                <button
                  type="button"
                  className="font-medium text-primary underline underline-offset-2 hover:text-primary/80"
                  onClick={(e) => { e.stopPropagation(); openModal("pp"); }}
                >
                  Privacy Policy
                </button>
              </span>
            </div>

            {/* Continue */}
            <Button
              className="w-full"
              disabled={!agreed || !bothRead || saving}
              onClick={handleContinue}
            >
              {saving ? "Saving…" : "Continue"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function ConsentPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      }
    >
      <ConsentPageInner />
    </Suspense>
  );
}
