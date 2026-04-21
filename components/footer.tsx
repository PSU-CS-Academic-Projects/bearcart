import Link from "next/link";
import {
  ShoppingCart,
  Envelope,
  MapPin,
  Phone,
  FacebookLogo,
  InstagramLogo,
  TwitterLogo,
} from "@phosphor-icons/react/dist/ssr";

const quickLinks = [
  { name: "Browse Listings", href: "#" },
  { name: "Post a Listing", href: "#" },
  { name: "How It Works", href: "#" },
  { name: "Safety Tips", href: "#" },
  { name: "FAQs", href: "#" },
];

const categories = [
  { name: "Books", href: "#" },
  { name: "Electronics", href: "#" },
  { name: "Clothing", href: "#" },
  { name: "Food", href: "#" },
  { name: "Services", href: "#" },
];

export function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="mb-4 flex items-center gap-2">
              <ShoppingCart className="size-7 text-primary" weight="fill" />
              <span className="text-xl font-bold text-foreground">PalMart</span>
            </Link>
            <p className="mb-4 text-sm text-muted-foreground">
              The official campus marketplace for Palawan State University.
              Safely buy, sell, and trade with fellow students and faculty
              members.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="#"
                className="rounded-full bg-muted p-2 text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                aria-label="Facebook"
              >
                <FacebookLogo className="size-4" />
              </a>
              <a
                href="#"
                className="rounded-full bg-muted p-2 text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                aria-label="Instagram"
              >
                <InstagramLogo className="size-4" />
              </a>
              <a
                href="#"
                className="rounded-full bg-muted p-2 text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                aria-label="Twitter"
              >
                <TwitterLogo className="size-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 font-semibold text-foreground">Quick Links</h3>
            <ul className="flex flex-col gap-2">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="mb-4 font-semibold text-foreground">Categories</h3>
            <ul className="flex flex-col gap-2">
              {categories.map((category) => (
                <li key={category.name}>
                  <Link
                    href={category.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-primary"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 font-semibold text-foreground">Contact Us</h3>
            <ul className="flex flex-col gap-3">
              <li className="flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="mt-0.5 size-4 shrink-0" />
                <span>
                  Palawan State University, Tiniguiban Heights, Puerto Princesa
                  City, Palawan 5300
                </span>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Envelope className="size-4 shrink-0" />
                <a href="mailto:support@palmart.ph" className="hover:text-primary">
                  support@palmart.ph
                </a>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="size-4 shrink-0" />
                <a href="tel:+639123456789" className="hover:text-primary">
                  +63 912 345 6789
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 border-t pt-6">
          <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} PalMart. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <Link
                href="#"
                className="text-sm text-muted-foreground hover:text-primary"
              >
                Privacy Policy
              </Link>
              <Link
                href="#"
                className="text-sm text-muted-foreground hover:text-primary"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
