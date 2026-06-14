"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  PencilSimple, GraduationCap, Chalkboard, Tag,
  ShoppingCart, Eye,
} from "@phosphor-icons/react";
import { EditProfileModal } from "@/components/edit-profile-modal";
import type { UserProfile, ProfileStats } from "@/lib/actions/profile";
import { formatTimeAgo } from "@/lib/listing-helpers";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfileHeaderProps {
  profile: UserProfile;
  stats: ProfileStats;
  isOwn: boolean;
  onProfileUpdated?: () => void;
}

// ─── Initials Helper ──────────────────────────────────────────────────────────

function getInitials(profile: UserProfile): string {
  const first = profile.first_name?.charAt(0) ?? "";
  const last = profile.last_name?.charAt(0) ?? "";
  if (first || last) return (first + last).toUpperCase();
  return profile.full_name?.charAt(0)?.toUpperCase() ?? "?";
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ProfileHeader({
  profile,
  stats,
  isOwn,
  onProfileUpdated,
}: ProfileHeaderProps) {
  const [editOpen, setEditOpen] = useState(false);

  const roleLabel = profile.role === "faculty" ? "PSU Faculty" : "PSU Student";
  const RoleIcon = profile.role === "faculty" ? Chalkboard : GraduationCap;

  const statItems = [
    { label: "Active Listings", value: stats.activeListings, icon: Tag },
    { label: "Total Sold", value: stats.totalSold, icon: ShoppingCart },
    { label: "Total Views", value: stats.totalViews, icon: Eye },
  ];

  const memberSince = (() => {
    const d = new Date(profile.created_at);
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  })();

  return (
    <>
      {/* Cover Banner */}
      <div className="relative h-32 w-full bg-muted sm:h-48" />

      <div className="mx-auto max-w-5xl px-4">
        {/* Avatar + Info */}
        <div className="relative -mt-16 pb-6 sm:-mt-20">
          {/* Avatar */}
          <div className="relative mb-4 inline-block">
            <div className="relative size-28 overflow-hidden rounded-full border-4 border-background bg-muted sm:size-36">
              {profile.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center bg-primary text-primary-foreground">
                  <span className="text-4xl font-bold sm:text-5xl">
                    {getInitials(profile)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Name + Actions */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                  {profile.full_name}
                </h1>
                <Badge className="flex items-center gap-1 bg-primary/10 text-primary">
                  <RoleIcon className="size-3" />
                  {roleLabel}
                </Badge>
              </div>
              {profile.college && (
                <p className="mt-1 text-sm text-muted-foreground">{profile.college}</p>
              )}
              <p className="mt-1 text-sm text-muted-foreground">
                Member since {memberSince}
              </p>
              {profile.bio && (
                <p className="mt-3 max-w-xl text-sm text-foreground/80">{profile.bio}</p>
              )}
            </div>

            {isOwn && (
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                <PencilSimple className="size-4" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 pb-6 sm:gap-4">
          {statItems.map((stat) => (
            <Card key={stat.label} className="flex flex-col items-center gap-1 p-4 text-center">
              <stat.icon className="size-5 text-primary" />
              <span className="text-2xl font-bold text-foreground">
                {typeof stat.value === "number" ? stat.value.toLocaleString() : stat.value}
              </span>
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </Card>
          ))}
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isOwn && (
        <EditProfileModal
          open={editOpen}
          onOpenChange={setEditOpen}
          profile={{
            full_name: profile.full_name ?? "",
            bio: profile.bio ?? "",
            college: profile.college ?? "",
            avatar_url: profile.avatar_url ?? "",
            role: profile.role,
          }}
          onSaved={() => {
            if (onProfileUpdated) onProfileUpdated();
            // Force a page refresh to pick up new server data
            window.location.reload();
          }}
        />
      )}
    </>
  );
}
