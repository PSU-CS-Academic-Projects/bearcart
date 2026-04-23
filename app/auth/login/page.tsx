"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "@phosphor-icons/react";
import { signInWithGoogle } from "@/lib/auth";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex flex-1 items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="rounded-xl border bg-card p-6 shadow-sm md:p-8">
            {/* Logo */}
            <div className="mb-6 flex flex-col items-center gap-2">
              <Link href="/" className="flex items-center gap-2">
                <ShoppingCart
                  className="size-10 text-primary"
                  weight="fill"
                />
                <span className="text-2xl font-bold text-foreground">
                  PalMart
                </span>
              </Link>
              <p className="text-muted-foreground">Welcome back to PalMart</p>
            </div>

            {/* Google Login Button */}
            <Button className="w-full" onClick={signInWithGoogle}>
              Login with Google
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
