import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";

export const metadata = {
  title: "Terms of Service - BearCart",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-foreground/80">{children}</div>
    </section>
  );
}

function Sub({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </div>
  );
}

function Ul({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-1 pl-5">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export default function TermsOfServicePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-12">

          {/* Header */}
          <div className="mb-10 border-b pb-8">
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary">
              Legal
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Terms of Service</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              BearCart — PalSU Campus Marketplace
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Effective Date: June 2026</p>
          </div>

          <div className="space-y-10">

            <Section title="1. Acceptance of Terms">
              <p>
                By accessing or using BearCart, you agree to be bound by these Terms of Service. If you do not agree to these terms, you must not use the platform. These terms apply to all users of BearCart, including buyers, sellers, and visitors.
              </p>
              <p>
                BearCart reserves the right to update or modify these Terms of Service at any time. Continued use of the platform after changes are posted constitutes your acceptance of the revised terms.
              </p>
            </Section>

            <Section title="2. Eligibility">
              <p>
                BearCart is exclusively available to currently enrolled students and faculty of Palawan State University (PalSU). To use the platform, you must:
              </p>
              <Ul items={[
                "Have a valid and active PalSU institutional Google account (@psu.palawan.edu.ph)",
                "Be at least 18 years of age, or have the consent of a parent or guardian if younger",
                "Agree to these Terms of Service and our Privacy Policy",
              ]} />
              <p>
                Users under 18 years of age must have the consent of a parent or guardian to use BearCart.
              </p>
              <p>
                BearCart reserves the right to suspend or terminate accounts of users who no longer meet these eligibility requirements.
              </p>
            </Section>

            <Section title="3. Account Responsibilities">
              <p>Your BearCart account is tied to your PalSU Google account. You are responsible for:</p>
              <Ul items={[
                "All activity that occurs under your account",
                "Keeping your account credentials secure and confidential",
                "Ensuring your profile information is accurate and up to date",
                "Notifying us immediately if you suspect unauthorized use of your account",
              ]} />
              <p>
                You may not create multiple accounts, share your account with others, or use another user's account without permission.
              </p>
            </Section>

            <Section title="4. Acceptable Use">
              <Sub title="4.1 Permitted Activities">
                <Ul items={[
                  "Posting legitimate items for sale that you personally own",
                  "Posting requests for items you wish to purchase",
                  "Communicating with other users through in-app chat in a respectful manner",
                  "Completing in-person transactions on the PalSU campus",
                ]} />
              </Sub>
              <Sub title="4.2 Prohibited Activities">
                <p>The following are strictly prohibited on BearCart:</p>
                <Ul items={[
                  "Listing or selling illegal items, including but not limited to prohibited drugs, weapons, counterfeit goods, and stolen property",
                  "Listing items that violate PalSU's student conduct policies or Philippine law",
                  "Posting false, misleading, or fraudulent listings",
                  "Scamming, deceiving, or defrauding other users",
                  "Harassing, threatening, or abusing other users through chat or any other feature",
                  "Uploading violent, sexually explicit, or otherwise inappropriate content including images and text",
                  "Impersonating another person or entity",
                  "Creating fake accounts or manipulating the platform in any unauthorized way",
                  "Using the platform for any commercial purpose outside of personal student-to-student transactions",
                ]} />
                <p>
                  Violations of these prohibited activities may result in immediate account suspension or permanent ban without prior notice.
                </p>
              </Sub>
            </Section>

            <Section title="5. Listings and Content">
              <p>When you post a listing or request on BearCart, you agree that:</p>
              <Ul items={[
                "All information provided is accurate, complete, and not misleading",
                "You are the rightful owner of the item being listed",
                "Images uploaded are of the actual item and do not infringe on the rights of any third party",
                "The listed price is the actual price you intend to transact at",
              ]} />
              <p>
                BearCart uses automated content moderation to screen listings, images, and messages for inappropriate content. Content that is flagged as violating these terms will be blocked or removed without notice.
              </p>
              <p>
                BearCart reserves the right to remove any listing or request at any time, with or without notice, if it is deemed to violate these Terms of Service or for any other reason at our discretion.
              </p>
            </Section>

            <Section title="6. Transactions">
              <Sub title="6.1 In-Person Only">
                <p>
                  All transactions facilitated through BearCart are conducted in person on the PalSU campus. BearCart does not support, facilitate, or guarantee online payments, deliveries, or remote exchanges of any kind.
                </p>
              </Sub>
              <Sub title="6.2 No Platform Involvement">
                <p>
                  BearCart acts solely as a platform connecting buyers and sellers. We are not a party to any transaction between users. All agreements, negotiations, and exchanges are made directly between the buyer and seller.
                </p>
              </Sub>
              <Sub title="6.3 No Refund Guarantee">
                <p>
                  BearCart does not guarantee refunds, returns, or any form of buyer or seller protection. Once a transaction is completed in person, it is final. Users are encouraged to inspect items thoroughly before completing any exchange.
                </p>
              </Sub>
              <Sub title="6.4 Transaction at Your Own Risk">
                <p>
                  By using BearCart to facilitate a transaction, you acknowledge that you do so at your own risk. BearCart is not liable for any loss, damage, or dispute arising from transactions between users.
                </p>
              </Sub>
            </Section>

            <Section title="7. Content Moderation">
              <p>
                BearCart employs automated content moderation powered by OpenAI to screen user-submitted content including listing titles, descriptions, images, profile pictures, and chat images. Content identified as inappropriate will be blocked before it is published or delivered.
              </p>
              <p>
                Users who repeatedly submit content that violates these terms may have their accounts suspended or permanently banned.
              </p>
              <p>
                While we strive to maintain a safe and respectful platform, BearCart does not guarantee that all inappropriate content will be detected and removed. Users are encouraged to report any content that they believe violates these terms using the report feature.
              </p>
            </Section>

            <Section title="8. Reporting and Enforcement">
              <p>
                BearCart provides a reporting feature that allows users to flag listings, requests, and other users for violations of these Terms of Service. Reports are reviewed by platform administrators.
              </p>
              <p>Upon review, BearCart may take any of the following actions:</p>
              <Ul items={[
                "Remove the reported content",
                "Issue a warning to the offending user",
                "Temporarily suspend the offending user's account",
                "Permanently ban the offending user from the platform",
              ]} />
              <p>
                BearCart's decisions on enforcement are final. Repeated violations or confirmed cases of scamming, harassment, or fraud will result in permanent account termination.
              </p>
            </Section>

            <Section title="9. Intellectual Property">
              <p>
                BearCart and its original content, features, and functionality are owned by its student developers and are protected under applicable intellectual property laws of the Philippines.
              </p>
              <p>
                By posting content on BearCart (including listing images, descriptions, and profile information), you grant BearCart a non-exclusive, royalty-free license to display and use that content solely for the purpose of operating the platform.
              </p>
              <p>
                You represent and warrant that you own or have the necessary rights to all content you post on BearCart, and that such content does not infringe on the intellectual property rights of any third party.
              </p>
            </Section>

            <Section title="10. Limitation of Liability">
              <p>
                BearCart is a student-developed project provided on an as-is and as-available basis. We make no warranties, express or implied, regarding the availability, reliability, or accuracy of the platform.
              </p>
              <p>To the fullest extent permitted by Philippine law, BearCart and its developers shall not be liable for:</p>
              <Ul items={[
                "Any loss or damage arising from transactions between users",
                "Any interruption, suspension, or termination of the platform",
                "Any unauthorized access to or alteration of your data",
                "Any content posted by other users",
                "Any other matter relating to your use of the platform",
              ]} />
              <p>
                BearCart is not affiliated with or officially endorsed by Palawan State University in its capacity as a student project.
              </p>
            </Section>

            <Section title="11. Termination">
              <p>
                BearCart reserves the right to suspend or terminate your account at any time, with or without cause, and with or without notice. Grounds for termination include but are not limited to violation of these Terms of Service, fraudulent activity, or prolonged inactivity.
              </p>
              <p>
                You may request deletion of your account at any time. Upon termination, your listings will be removed from public view. Certain data may be retained as required by law or for platform integrity purposes, as described in our Privacy Policy.
              </p>
            </Section>

            <Section title="12. Governing Law and Jurisdiction">
              <p>
                These Terms of Service are governed by and construed in accordance with the laws of the Republic of the Philippines, including but not limited to:
              </p>
              <Ul items={[
                "Republic Act No. 10173 — Data Privacy Act of 2012",
                "Republic Act No. 8792 — Electronic Commerce Act of 2000",
                "The Revised Penal Code of the Philippines, as applicable",
              ]} />
              <p>
                Any disputes arising from the use of BearCart shall be subject to the jurisdiction of the appropriate courts of the Philippines.
              </p>
            </Section>

            <Section title="13. Contact">
              <p>
                For questions, concerns, or feedback regarding these Terms of Service, you may contact us at bearcartpalsu@gmail.com.
              </p>
            </Section>

          </div>

          {/* Footer note */}
          <div className="mt-12 border-t pt-6 text-xs text-muted-foreground">
            <p>BearCart — PalSU Campus Marketplace · Effective Date: June 2026</p>
            <p>Governed by the laws of the Republic of the Philippines.</p>
            <div className="mt-4">
              <Link href="/privacy-policy" className="text-primary hover:underline">
                View Privacy Policy →
              </Link>
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}
