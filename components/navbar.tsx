"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { signInWithGoogle, signOut } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  MagnifyingGlass,
  List,
  ShoppingCart,
  User as UserIcon,
  SignOut,
} from "@phosphor-icons/react";

const categories = [
  "All Categories",
  "Books",
  "Electronics",
  "Clothing",
  "Food",
  "Supplies",
  "Services",
  "Others",
];

export function Navbar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;
  const displayName = (user?.user_metadata?.full_name as string | undefined) ?? user?.email ?? "";
  const firstName = displayName.split(" ")[0];

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
  };

  // ── Reusable avatar + dropdown (desktop) ──────────────────────────────────
  const UserMenu = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 transition-colors hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName}
              width={32}
              height={32}
              className="size-8 rounded-full object-cover ring-2 ring-primary/30"
            />
          ) : (
            <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
              {firstName.charAt(0).toUpperCase()}
            </span>
          )}
          <span className="hidden text-sm font-medium md:block">{firstName}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold">{displayName}</span>
          <span className="text-xs font-normal text-muted-foreground">{user?.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile" className="flex cursor-pointer items-center gap-2">
            <UserIcon className="size-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="flex cursor-pointer items-center gap-2 text-destructive focus:text-destructive"
        >
          <SignOut className="size-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <header className="sticky top-0 z-50 border-b bg-card">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <ShoppingCart className="size-7 text-primary" weight="fill" />
          <span className="text-xl font-bold text-foreground">PalMart</span>
        </Link>

        {/* Desktop Search */}
        <div className="hidden flex-1 items-center justify-center gap-2 px-8 md:flex">
          <div className="flex w-full max-w-xl items-center rounded-lg border bg-background">
            <div className="flex items-center border-r px-3">
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger className="h-9 w-36 border-0 bg-transparent shadow-none focus:ring-0">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-1 items-center gap-2 px-3">
              <MagnifyingGlass className="size-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search listings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>
        </div>

        {/* Desktop Auth */}
        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <UserMenu />
          ) : (
            <Button size="sm" onClick={signInWithGoogle}>
              <UserIcon className="size-4" />
              Login with Google
            </Button>
          )}
        </div>

        {/* Mobile Menu */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <List className="size-5" />
              <span className="sr-only">Open menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <ShoppingCart className="size-5 text-primary" weight="fill" />
                PalMart
              </SheetTitle>
            </SheetHeader>
            <div className="mt-6 flex flex-col gap-4">
              {/* Mobile Search */}
              <div className="flex flex-col gap-2">
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2 rounded-lg border bg-background px-3">
                  <MagnifyingGlass className="size-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search listings..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                  />
                </div>
              </div>

              <div className="h-px bg-border" />

              {/* Mobile Navigation */}
              <nav className="flex flex-col gap-2">
                {categories.slice(1).map((category) => (
                  <Link
                    key={category}
                    href="#"
                    className="rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {category}
                  </Link>
                ))}
              </nav>

              <div className="h-px bg-border" />

              {/* Mobile Auth */}
              <div className="flex flex-col gap-2">
                {user ? (
                  <>
                    {/* User info row */}
                    <div className="flex items-center gap-3 rounded-lg bg-accent/50 px-3 py-2">
                      {avatarUrl ? (
                        <Image
                          src={avatarUrl}
                          alt={displayName}
                          width={36}
                          height={36}
                          className="size-9 rounded-full object-cover ring-2 ring-primary/30"
                        />
                      ) : (
                        <span className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                          {firstName.charAt(0).toUpperCase()}
                        </span>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="truncate text-sm font-semibold">{displayName}</span>
                        <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </div>

                    {/* Profile link */}
                    <Link
                      href="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent"
                    >
                      <UserIcon className="size-4" />
                      Profile
                    </Link>

                    {/* Sign Out */}
                    <Button
                      variant="outline"
                      className="w-full text-destructive hover:text-destructive"
                      onClick={handleSignOut}
                    >
                      <SignOut className="size-4" />
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => { signInWithGoogle(); setMobileMenuOpen(false); }}
                  >
                    <UserIcon className="size-4" />
                    Login with Google
                  </Button>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
