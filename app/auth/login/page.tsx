"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "@phosphor-icons/react";

export default function LoginPage() {
  useEffect(() => {
    console.log("LoginPage mounted successfully");
    alert("Page loaded! JavaScript is active.");
  }, []);

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

            {/* Debug Button to check if JS is running */}
            <button 
              className="w-full mb-4 p-2 bg-red-500 text-white rounded" 
              onClick={() => alert("JavaScript is working!")}
            >
              1. Click me first (Debug)
            </button>

            {/* Google Login Button */}
            <Button 
              className="w-full" 
              onClick={async () => {
                alert("Login button clicked, contacting Supabase...");
                const { signInWithGoogle } = await import("@/lib/auth");
                await signInWithGoogle();
              }}
            >
              2. Login with Google
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
