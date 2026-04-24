"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { EditProfileModal } from "@/components/edit-profile-modal";
import { ProfileListingCard } from "@/components/profile-listing-card";
import { DeleteListingDialog } from "@/components/delete-listing-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User,
  PencilSimple,
  GearSix,
  Envelope,
  Buildings,
  Calendar,
  Package,
  ShoppingCart,
  Tag,
  Eye,
  Heart,
  Storefront,
  MagnifyingGlass,
  GraduationCap,
  Chalkboard,
} from "@phosphor-icons/react";
import { supabase } from "@/lib/supabase";

// Stats data (placeholder until listings are wired up)
const stats = [
  { label: "Total Listings", value: 12, icon: Package },
  { label: "Items Sold", value: 8, icon: ShoppingCart },
  { label: "Active Listings", value: 4, icon: Tag },
  { label: "Profile Views", value: 156, icon: Eye },
];

// Active listings data
const activeListings = [
  {
    id: "1",
    title: "Fundamentals of Accountancy Vol. 1 (2024 Edition)",
    price: 450,
    category: "Books",
    condition: "Like New",
    timePosted: "2 days ago",
    imageUrl:
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=400&fit=crop",
  },
  {
    id: "2",
    title: "Scientific Calculator (Casio fx-991ES Plus)",
    price: 800,
    category: "Electronics",
    condition: "Good",
    timePosted: "5 days ago",
    imageUrl:
      "https://images.unsplash.com/photo-1564466809058-bf4114d55352?w=400&h=400&fit=crop",
  },
  {
    id: "3",
    title: "Business Statistics Textbook",
    price: 350,
    category: "Books",
    condition: "Good",
    timePosted: "1 week ago",
    imageUrl:
      "https://images.unsplash.com/photo-1553729784-e91953dec042?w=400&h=400&fit=crop",
  },
  {
    id: "4",
    title: "USB Flash Drive 64GB",
    price: 250,
    category: "Electronics",
    condition: "New",
    timePosted: "1 week ago",
    imageUrl:
      "https://images.unsplash.com/photo-1618410320928-25228d811631?w=400&h=400&fit=crop",
  },
];

// Sold listings data
const soldListings = [
  {
    id: "5",
    title: "Introduction to Marketing Textbook",
    price: 400,
    category: "Books",
    condition: "Good",
    timePosted: "3 weeks ago",
    dateSold: "Apr 10, 2026",
    imageUrl:
      "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400&h=400&fit=crop",
  },
  {
    id: "6",
    title: "Laptop Stand (Adjustable)",
    price: 500,
    category: "Electronics",
    condition: "Like New",
    timePosted: "1 month ago",
    dateSold: "Apr 5, 2026",
    imageUrl:
      "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=400&fit=crop",
  },
];

// Saved listings data
const savedListings = [
  {
    id: "7",
    title: "Engineering Drawing Set (Complete)",
    price: 650,
    category: "Supplies",
    condition: "New",
    timePosted: "3 days ago",
    imageUrl:
      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400&h=400&fit=crop",
  },
  {
    id: "8",
    title: "Arduino Starter Kit",
    price: 1200,
    category: "Electronics",
    condition: "Like New",
    timePosted: "4 days ago",
    imageUrl:
      "https://images.unsplash.com/photo-1553406830-ef2513450d76?w=400&h=400&fit=crop",
  },
  {
    id: "9",
    title: "Principles of Economics (Mankiw)",
    price: 550,
    category: "Books",
    condition: "Good",
    timePosted: "1 week ago",
    imageUrl:
      "https://images.unsplash.com/photo-1592496431122-2349e0fbc666?w=400&h=400&fit=crop",
  },
];

interface UserProfile {
  full_name: string;
  email: string;
  role: "student" | "faculty" | null;
  college: string | null;
  avatar_url: string | null;
  joined: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [listingToDelete, setListingToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState("active");

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from("users")
        .select("full_name, role, college, created_at")
        .eq("id", user.id)
        .single();

      const joined = userData?.created_at
        ? new Date(userData.created_at).toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })
        : "";

      setProfile({
        full_name:
          userData?.full_name ||
          (user.user_metadata?.full_name as string) ||
          user.email ||
          "",
        email: user.email || "",
        role: userData?.role ?? null,
        college: userData?.college ?? null,
        avatar_url:
          (user.user_metadata?.avatar_url as string | undefined) ?? null,
        joined,
      });
    };

    load();
  }, []);

  const handleEditSave = async (updated: {
    name: string;
    bio: string;
    department: string;
    avatar: string;
    meetupSpots: string[];
  }) => {
    if (!profile) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("users")
      .update({ full_name: updated.name, college: updated.department })
      .eq("id", user.id);

    setProfile((prev) =>
      prev ? { ...prev, full_name: updated.name, college: updated.department } : prev
    );
  };

  const handleDeleteClick = (id: string, title: string) => {
    setListingToDelete({ id, title });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (listingToDelete) {
      console.log("Deleting listing:", listingToDelete.id);
    }
    setListingToDelete(null);
  };

  const roleLabel =
    profile?.role === "student"
      ? "Student"
      : profile?.role === "faculty"
        ? "Faculty"
        : null;

  const RoleIcon =
    profile?.role === "student"
      ? GraduationCap
      : profile?.role === "faculty"
        ? Chalkboard
        : null;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Cover Photo */}
        <div className="relative h-32 w-full bg-gradient-to-r from-primary to-primary/70 sm:h-48" />

        {/* Profile Header */}
        <div className="mx-auto max-w-5xl px-4">
          <div className="relative -mt-16 pb-6 sm:-mt-20">
            {/* Avatar */}
            <div className="relative mb-4 inline-block">
              <div className="relative size-28 overflow-hidden rounded-full border-4 border-background bg-muted shadow-lg sm:size-36">
                {profile?.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={profile.full_name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center bg-primary text-primary-foreground">
                    <span className="text-4xl font-bold">
                      {profile?.full_name?.charAt(0).toUpperCase() ?? "?"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Info & Actions */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
                    {profile?.full_name || "Loading…"}
                  </h1>
                  {roleLabel && RoleIcon && (
                    <Badge className="flex items-center gap-1 bg-primary/10 text-primary">
                      <RoleIcon className="size-3" />
                      {roleLabel}
                    </Badge>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {profile?.college && (
                    <span className="text-sm text-muted-foreground">
                      {profile.college}
                    </span>
                  )}
                </div>
                {profile?.joined && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Member since {profile.joined}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setEditModalOpen(true)}>
                  <PencilSimple className="size-4" />
                  Edit Profile
                </Button>
                <Button variant="ghost" size="icon">
                  <GearSix className="size-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-3 pb-6 sm:grid-cols-4 sm:gap-4">
            {stats.map((stat) => (
              <Card
                key={stat.label}
                className="flex flex-col items-center gap-1 p-4 text-center"
              >
                <stat.icon className="size-5 text-primary" />
                <span className="text-2xl font-bold text-foreground">
                  {stat.value}
                </span>
                <span className="text-xs text-muted-foreground">
                  {stat.label}
                </span>
              </Card>
            ))}
          </div>

          {/* About Card */}
          <Card className="mb-6 p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              About
            </h2>
            <div className="flex flex-col gap-3">
              {profile?.email && (
                <div className="flex items-center gap-3">
                  <Envelope className="size-5 shrink-0 text-muted-foreground" />
                  <span className="text-sm text-foreground">
                    {profile.email}
                  </span>
                </div>
              )}
              {profile?.college && (
                <div className="flex items-center gap-3">
                  <Buildings className="size-5 shrink-0 text-muted-foreground" />
                  <span className="text-sm text-foreground">
                    {profile.college}
                  </span>
                </div>
              )}
              {profile?.joined && (
                <div className="flex items-center gap-3">
                  <Calendar className="size-5 shrink-0 text-muted-foreground" />
                  <span className="text-sm text-foreground">
                    Joined {profile.joined}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Tabs Section */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="mb-8"
          >
            <TabsList className="w-full justify-start">
              <TabsTrigger value="active" className="gap-2">
                <Tag className="size-4" />
                Active Listings
              </TabsTrigger>
              <TabsTrigger value="sold" className="gap-2">
                <ShoppingCart className="size-4" />
                Sold Items
              </TabsTrigger>
              <TabsTrigger value="saved" className="gap-2">
                <Heart className="size-4" />
                Saved
              </TabsTrigger>
            </TabsList>

            {/* Active Listings Tab */}
            <TabsContent value="active" className="mt-6">
              {activeListings.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {activeListings.map((listing) => (
                    <ProfileListingCard
                      key={listing.id}
                      {...listing}
                      variant="active"
                      onEdit={() => console.log("Edit", listing.id)}
                      onMarkSold={() => console.log("Mark sold", listing.id)}
                      onDelete={() =>
                        handleDeleteClick(listing.id, listing.title)
                      }
                    />
                  ))}
                </div>
              ) : (
                <Card className="flex flex-col items-center justify-center p-12 text-center">
                  <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
                    <Storefront className="size-8 text-muted-foreground" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">
                    No active listings yet
                  </h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Start selling by posting your first listing
                  </p>
                  <Button asChild>
                    <Link href="/listings/new">
                      <Tag className="size-4" />
                      Post a Listing
                    </Link>
                  </Button>
                </Card>
              )}
            </TabsContent>

            {/* Sold Items Tab */}
            <TabsContent value="sold" className="mt-6">
              {soldListings.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {soldListings.map((listing) => (
                    <ProfileListingCard
                      key={listing.id}
                      {...listing}
                      variant="sold"
                    />
                  ))}
                </div>
              ) : (
                <Card className="flex flex-col items-center justify-center p-12 text-center">
                  <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
                    <ShoppingCart className="size-8 text-muted-foreground" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">
                    No sold items yet
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Items you sell will appear here
                  </p>
                </Card>
              )}
            </TabsContent>

            {/* Saved Listings Tab */}
            <TabsContent value="saved" className="mt-6">
              {savedListings.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {savedListings.map((listing) => (
                    <ProfileListingCard
                      key={listing.id}
                      {...listing}
                      variant="saved"
                      onRemoveSaved={() =>
                        console.log("Remove saved", listing.id)
                      }
                    />
                  ))}
                </div>
              ) : (
                <Card className="flex flex-col items-center justify-center p-12 text-center">
                  <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted">
                    <Heart className="size-8 text-muted-foreground" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">
                    No saved listings yet
                  </h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Save listings you&apos;re interested in to view them later
                  </p>
                  <Button asChild variant="outline">
                    <Link href="/listings">
                      <MagnifyingGlass className="size-4" />
                      Browse Listings
                    </Link>
                  </Button>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />

      {/* Edit Profile Modal */}
      {profile && (
        <EditProfileModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          profile={{
            name: profile.full_name,
            bio: "",
            department: profile.college ?? "",
            avatar: profile.avatar_url ?? "",
            meetupSpots: [],
          }}
          onSave={handleEditSave}
        />
      )}

      {/* Delete Listing Dialog */}
      <DeleteListingDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        listingTitle={listingToDelete?.title || ""}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
