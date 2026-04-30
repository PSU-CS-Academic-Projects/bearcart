import { Navbar } from "@/components/navbar";
import { HeroSection } from "@/components/hero-section";
import { ListingsSection } from "@/components/listings-section";
import { RequestsSection } from "@/components/requests-section";
import { HomeTabs } from "@/components/home-tabs";
import { Footer } from "@/components/footer";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <div
          className="pt-6"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
            backgroundColor: "#FAFAF8",
          }}
        >
          <HomeTabs
            listingsTab={<ListingsSection />}
            requestsTab={<RequestsSection />}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
