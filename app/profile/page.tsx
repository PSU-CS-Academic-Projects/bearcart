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
  User, PencilSimple, GearSix, Envelope, Buildings, Calendar,
  Package, ShoppingCart, Tag, Eye, Heart, Storefront, MagnifyingGlass,
  GraduationCap, Chalkboard,
} from "@phosphor-icons/react";
import { supabase } from "@/lib/supabase";
import { getListingsBySeller } from "@/lib/actions/listings";
import { getSavedListings, removeSavedListing } from "@/lib/actions/saved";
import { getProfileStats, updateProfile } from "@/lib/actions/profile";
import { deleteListing, updateListingStatus } from "@/lib/actions/listings";
import { toast } from "sonner";

interface UserProfile {
  full_name: string;
  email: string;
  role: "student" | "faculty" | null;
  college: string | null;
  avatar_url: string | null;
  bio: string | null;
  joined: string;
}

interface ListingRow {
  id: string;
  title: string;
  price: number;
  category: string;
  condition: string;
  status: string;
  created_at: string;
  listing_images: { image_url: string; is_cover: boolean; order: number }[];
}

function getTimeAgo(dateString: string) {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

function getCoverImage(listing: ListingRow) {
  const cover = listing.listing_images?.find((img) => img.is_cover);
  return cover?.image_url ?? listing.listing_images?.[0]?.image_url ?? "https://placehold.co/400x400?text=No+Image";
}

function formatCondition(c: string) {
  return c.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [listingToDelete, setListingToDelete] = useState<{ id: string; title: string } | null>(null);
  const [activeTab, setActiveTab] = useState("active");
  const [activeListings, setActiveListings] = useState<ListingRow[]>([]);
  const [soldListings, setSoldListings] = useState<ListingRow[]>([]);
  const [savedListings, setSavedListings] = useState<ListingRow[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, sold: 0, views: 0 });
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: userData } = await supabase.from("users").select("full_name, role, college, bio, avatar_url, created_at").eq("id", user.id).single();
    const joined = userData?.created_at ? new Date(userData.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" }) : "";

    setProfile({
      full_name: userData?.full_name || (user.user_metadata?.full_name as string) || user.email || "",
      email: user.email || "",
      role: userData?.role ?? null,
      college: userData?.college ?? null,
      avatar_url: (userData?.avatar_url || (user.user_metadata?.avatar_url as string | undefined)) ?? null,
      bio: userData?.bio ?? null,
      joined,
    });

    const [active, sold, savedData, profileStats] = await Promise.all([
      getListingsBySeller(user.id, "available"),
      getListingsBySeller(user.id, "sold"),
      getSavedListings(),
      getProfileStats(),
    ]);

    setActiveListings(active as ListingRow[]);
    setSoldListings(sold as ListingRow[]);
    setSavedListings(
      (savedData ?? [])
        .filter((s) => s.listing)
        .map((s) => s.listing as unknown as ListingRow)
    );
    setStats(profileStats);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleEditSave = async (updated: { name: string; bio: string; department: string; avatar: string; meetupSpots: string[] }) => {
    if (!profile) return;
    try {
      await updateProfile({ full_name: updated.name, bio: updated.bio, college: updated.department });
      setProfile((prev) => prev ? { ...prev, full_name: updated.name, college: updated.department, bio: updated.bio } : prev);
      toast.success("Profile updated!");
    } catch { toast.error("Failed to update profile"); }
  };

  const handleDeleteClick = (id: string, title: string) => { setListingToDelete({ id, title }); setDeleteDialogOpen(true); };

  const handleConfirmDelete = async () => {
    if (!listingToDelete) return;
    try {
      await deleteListing(listingToDelete.id);
      setActiveListings((prev) => prev.filter((l) => l.id !== listingToDelete.id));
      setStats((prev) => ({ ...prev, total: prev.total - 1, active: prev.active - 1 }));
      toast.success("Listing deleted!");
    } catch { toast.error("Failed to delete listing"); }
    setListingToDelete(null);
  };

  const handleMarkSold = async (id: string) => {
    try {
      await updateListingStatus(id, "sold");
      const listing = activeListings.find((l) => l.id === id);
      if (listing) {
        setActiveListings((prev) => prev.filter((l) => l.id !== id));
        setSoldListings((prev) => [{ ...listing, status: "sold" }, ...prev]);
        setStats((prev) => ({ ...prev, active: prev.active - 1, sold: prev.sold + 1 }));
      }
      toast.success("Listing marked as sold!");
    } catch { toast.error("Failed to mark as sold"); }
  };

  const handleRemoveSaved = async (listingId: string) => {
    try {
      await removeSavedListing(listingId);
      setSavedListings((prev) => prev.filter((l) => l.id !== listingId));
      toast.success("Removed from saved!");
    } catch { toast.error("Failed to remove saved listing"); }
  };

  const roleLabel = profile?.role === "student" ? "Student" : profile?.role === "faculty" ? "Faculty" : null;
  const RoleIcon = profile?.role === "student" ? GraduationCap : profile?.role === "faculty" ? Chalkboard : null;

  const statItems = [
    { label: "Total Listings", value: stats.total, icon: Package },
    { label: "Items Sold", value: stats.sold, icon: ShoppingCart },
    { label: "Active Listings", value: stats.active, icon: Tag },
    { label: "Profile Views", value: stats.views, icon: Eye },
  ];

  if (loading) {
    return (<div className="flex min-h-screen flex-col"><Navbar /><div className="flex flex-1 items-center justify-center"><div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div></div>);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="relative h-32 w-full bg-gradient-to-r from-primary to-primary/70 sm:h-48" />
        <div className="mx-auto max-w-5xl px-4">
          <div className="relative -mt-16 pb-6 sm:-mt-20">
            <div className="relative mb-4 inline-block">
              <div className="relative size-28 overflow-hidden rounded-full border-4 border-background bg-muted shadow-lg sm:size-36">
                {profile?.avatar_url ? (<Image src={profile.avatar_url} alt={profile.full_name} fill className="object-cover" />) : (
                  <div className="flex size-full items-center justify-center bg-primary text-primary-foreground"><span className="text-4xl font-bold">{profile?.full_name?.charAt(0).toUpperCase() ?? "?"}</span></div>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{profile?.full_name || "Loading…"}</h1>
                  {roleLabel && RoleIcon && (<Badge className="flex items-center gap-1 bg-primary/10 text-primary"><RoleIcon className="size-3" />{roleLabel}</Badge>)}
                </div>
                {profile?.college && <span className="mt-1 text-sm text-muted-foreground">{profile.college}</span>}
                {profile?.joined && <p className="mt-1 text-sm text-muted-foreground">Member since {profile.joined}</p>}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setEditModalOpen(true)}><PencilSimple className="size-4" />Edit Profile</Button>
                <Button variant="ghost" size="icon"><GearSix className="size-5" /></Button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 pb-6 sm:grid-cols-4 sm:gap-4">
            {statItems.map((stat) => (<Card key={stat.label} className="flex flex-col items-center gap-1 p-4 text-center"><stat.icon className="size-5 text-primary" /><span className="text-2xl font-bold text-foreground">{stat.value}</span><span className="text-xs text-muted-foreground">{stat.label}</span></Card>))}
          </div>
          <Card className="mb-6 p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">About</h2>
            <div className="flex flex-col gap-3">
              {profile?.email && (<div className="flex items-center gap-3"><Envelope className="size-5 shrink-0 text-muted-foreground" /><span className="text-sm text-foreground">{profile.email}</span></div>)}
              {profile?.college && (<div className="flex items-center gap-3"><Buildings className="size-5 shrink-0 text-muted-foreground" /><span className="text-sm text-foreground">{profile.college}</span></div>)}
              {profile?.joined && (<div className="flex items-center gap-3"><Calendar className="size-5 shrink-0 text-muted-foreground" /><span className="text-sm text-foreground">Joined {profile.joined}</span></div>)}
              {profile?.bio && <p className="mt-2 text-sm text-muted-foreground">{profile.bio}</p>}
            </div>
          </Card>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="active" className="gap-2"><Tag className="size-4" />Active ({activeListings.length})</TabsTrigger>
              <TabsTrigger value="sold" className="gap-2"><ShoppingCart className="size-4" />Sold ({soldListings.length})</TabsTrigger>
              <TabsTrigger value="saved" className="gap-2"><Heart className="size-4" />Saved ({savedListings.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="active" className="mt-6">
              {activeListings.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {activeListings.map((listing) => (<ProfileListingCard key={listing.id} id={listing.id} title={listing.title} price={listing.price} category={listing.category} condition={formatCondition(listing.condition)} timePosted={getTimeAgo(listing.created_at)} imageUrl={getCoverImage(listing)} variant="active" onEdit={() => {}} onMarkSold={() => handleMarkSold(listing.id)} onDelete={() => handleDeleteClick(listing.id, listing.title)} />))}
                </div>
              ) : (
                <Card className="flex flex-col items-center justify-center p-12 text-center"><div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted"><Storefront className="size-8 text-muted-foreground" /></div><h3 className="mb-2 text-lg font-semibold text-foreground">No active listings yet</h3><p className="mb-4 text-sm text-muted-foreground">Start selling by posting your first listing</p><Button asChild><Link href="/listings/new"><Tag className="size-4" />Post a Listing</Link></Button></Card>
              )}
            </TabsContent>
            <TabsContent value="sold" className="mt-6">
              {soldListings.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {soldListings.map((listing) => (<ProfileListingCard key={listing.id} id={listing.id} title={listing.title} price={listing.price} category={listing.category} condition={formatCondition(listing.condition)} timePosted={getTimeAgo(listing.created_at)} imageUrl={getCoverImage(listing)} variant="sold" />))}
                </div>
              ) : (
                <Card className="flex flex-col items-center justify-center p-12 text-center"><div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted"><ShoppingCart className="size-8 text-muted-foreground" /></div><h3 className="mb-2 text-lg font-semibold text-foreground">No sold items yet</h3><p className="text-sm text-muted-foreground">Items you sell will appear here</p></Card>
              )}
            </TabsContent>
            <TabsContent value="saved" className="mt-6">
              {savedListings.length > 0 ? (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {savedListings.map((listing) => (<ProfileListingCard key={listing.id} id={listing.id} title={listing.title} price={listing.price} category={listing.category} condition={formatCondition(listing.condition)} timePosted={getTimeAgo(listing.created_at)} imageUrl={getCoverImage(listing)} variant="saved" onRemoveSaved={() => handleRemoveSaved(listing.id)} />))}
                </div>
              ) : (
                <Card className="flex flex-col items-center justify-center p-12 text-center"><div className="mb-4 flex size-16 items-center justify-center rounded-full bg-muted"><Heart className="size-8 text-muted-foreground" /></div><h3 className="mb-2 text-lg font-semibold text-foreground">No saved listings yet</h3><p className="mb-4 text-sm text-muted-foreground">Save listings you&apos;re interested in to view them later</p><Button asChild variant="outline"><Link href="/listings"><MagnifyingGlass className="size-4" />Browse Listings</Link></Button></Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <Footer />
      {profile && (<EditProfileModal open={editModalOpen} onOpenChange={setEditModalOpen} profile={{ name: profile.full_name, bio: profile.bio ?? "", department: profile.college ?? "", avatar: profile.avatar_url ?? "", meetupSpots: [] }} onSave={handleEditSave} />)}
      <DeleteListingDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} listingTitle={listingToDelete?.title || ""} onConfirm={handleConfirmDelete} />
    </div>
  );
}
