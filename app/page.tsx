import { Navbar } from "@/components/navbar";
import { HeroSection } from "@/components/hero-section";
import { ListingsSection } from "@/components/listings-section";
import { Footer } from "@/components/footer";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <ListingsSection />
      </main>
      <Footer />
    </div>
  );
}
