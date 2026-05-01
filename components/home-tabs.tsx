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
        <div className="flex flex-col gap-1.5">
          <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:inline-grid">
            <TabsTrigger value="listings" className="gap-2">
              <StorefrontIcon className="size-4" />
              Listings
            </TabsTrigger>
            <TabsTrigger value="requests" className="gap-2">
              <MagnifyingGlassIcon className="size-4" />
              Looking For
            </TabsTrigger>
          </TabsList>
          {tab === "requests" && (
            <p className="text-sm text-muted-foreground">
              Buyers looking for specific items — if you have what they need, reach out directly.
            </p>
          )}
        </div>
      </div>

      <TabsContent value="listings" className="mt-0">
        {listingsTab}
      </TabsContent>
      <TabsContent value="requests" className="mt-0">
        {requestsTab}
      </TabsContent>
    </Tabs>
  );
}
