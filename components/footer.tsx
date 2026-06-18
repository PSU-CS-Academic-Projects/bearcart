import Link from "next/link";
import Image from "next/image";
import { jakarta } from "@/lib/fonts";
import {
  EnvelopeIcon,
  MapPinIcon,
  PhoneIcon,
  //FacebookLogoIcon,
  //InstagramLogoIcon,
  //TiktokLogoIcon,
} from "@phosphor-icons/react/dist/ssr";

const quickLinks = [
  { name: "Browse Listings", href: "/listings" },
  { name: "Post a Listing", href: "/listings/new" },
  { name: "Requests", href: "/requests" },
];

const categories = [
  { name: "Accessories", href: "/listings?category=Accessories" },
  { name: "Electronics", href: "/listings?category=Electronics" },
  { name: "Clothing", href: "/listings?category=Clothing" },
  { name: "Food", href: "/listings?category=Food" },
  { name: "Services", href: "/listings?category=Services" },
  { name: "School Supplies", href: "/listings?category=School%20Supplies" },
  { name: "Others", href: "/listings?category=Others" },
];

export function Footer() {
  return (
    <footer className="border-t bg-card">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="mb-4 flex items-center gap-2">
              <Image src="/bearcart.svg" alt="BearCart logo" width={56} height={56} className="size-14" />
              <span className={`${jakarta.className} text-xl font-bold text-foreground`}>BearCart</span>
            </Link>
            <p className="mb-4 text-sm text-muted-foreground">
              A campus marketplace for Palawan State University.
              Safely buy, sell, and trade with fellow students and faculty
              members.
          </p>
            {/* <div className="flex items-center gap-3">
              <a
                href="#"
                className="rounded-full bg-muted p-2 text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                aria-label="Facebook"
              >
                <FacebookLogoIcon className="size-4" />
              </a>
              <a
                href="#"
                className="rounded-full bg-muted p-2 text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                aria-label="Instagram"
              >
                <InstagramLogoIcon className="size-4" />
              </a>
              <a
                href="#"
                className="rounded-full bg-muted p-2 text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
                aria-label="TikTok"
              >
                <TiktokLogoIcon className="size-4" />
              </a>
            </div> */}
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
                <MapPinIcon className="mt-0.5 size-4 shrink-0" />
                  <a
                  href="https://maps.google.com/?q=Palawan+State+University,+Tiniguiban+Heights,+Puerto+Princesa+City,+Palawan+5300"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary"
                >
                  Palawan State University, Tiniguiban Heights, Puerto Princesa
                  City, Palawan 5300
                </a>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <EnvelopeIcon className="size-4 shrink-0" />
                <a href="mailto:bearcartpalsu@gmail.com" className="hover:text-primary">
                  bearcartpalsu@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-2 text-sm text-muted-foreground">
                <PhoneIcon className="size-4 shrink-0" />
                <a href="tel:+639126214018" className="hover:text-primary">
                  +63 912 621 4018
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 border-t pt-6">
          <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} BearCart. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <Link
                href="/privacy-policy"
                className="text-sm text-muted-foreground hover:text-primary"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms-of-service"
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
