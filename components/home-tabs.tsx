"use client";

import { useState, type ReactNode } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StorefrontIcon, MagnifyingGlassIcon } from "@phosphor-icons/react";

interface HomeTabsProps {
  listingsTab: ReactNode;
  requestsTab: ReactNode;
}

export function HomeTabs({ listingsTab, requestsTab }: HomeTabsProps) {
  const [tab, setTab] = useState<"listings" | "requests">("listings");

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as "listings" | "requests")}>
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex justify-center">
          <TabsList className="relative grid w-full grid-cols-2 sm:w-auto sm:inline-grid">
            {/* Sliding active-tab indicator */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-y-[3px] left-[3px] w-[calc(50%-3px)] rounded-md bg-background shadow-sm transition-transform duration-200 ease-out"
              style={{
                transform:
                  tab === "requests" ? "translateX(100%)" : "translateX(0)",
              }}
            />
            <TabsTrigger
              value="listings"
              className="relative z-10 gap-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <StorefrontIcon className="size-4" />
              Listings
            </TabsTrigger>
            <TabsTrigger
              value="requests"
              className="relative z-10 gap-2 data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              <MagnifyingGlassIcon className="size-4" />
              Looking For
            </TabsTrigger>
          </TabsList>
        </div>
        {tab === "requests" && (
          <p className="mt-1.5 text-center text-sm text-muted-foreground">
            Buyers looking for specific items — if you have what they need, reach out directly.
          </p>
        )}
      </div>

      <TabsContent
        value="listings"
        className="mt-0 data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:duration-200"
      >
        {listingsTab}
      </TabsContent>
      <TabsContent
        value="requests"
        className="mt-0 data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:duration-200"
      >
        {requestsTab}
      </TabsContent>
    </Tabs>
  );
}
