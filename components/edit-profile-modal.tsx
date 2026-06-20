"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Camera, User, SpinnerGap, ArrowCounterClockwiseIcon } from "@phosphor-icons/react";
import { updateProfile, revertAvatarToGoogle } from "@/lib/actions/profile";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useNoChangesHint } from "@/lib/hooks/no-changes-hints";
import { toStorageUrl } from "@/lib/storage-url";

// ─── Constants ────────────────────────────────────────────────────────────────

const COLLEGES = [
  "College of Architecture and Design",
  "College of Arts and Humanities",
  "College of Business and Accountancy",
  "College of Criminal Justice Education",
  "College of Engineering",
  "College of Hospitality Management and Tourism",
  "College of Nursing and Health Sciences",
  "College of Sciences",
  "College of Teacher Education",
  "Junior High School (JHS)",
  "Senior High School (SHS)",
  "Others",
];

const BIO_MAX = 200;
const AVATAR_MAX_MB = 2;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// ─── Types ────────────────────────────────────────────────────────────────────

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: {
    full_name: string;
    bio: string;
    college: string;
    avatar_url: string;
    role: string;
  };
  onSaved: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EditProfileModal({
  open,
  onOpenChange,
  profile,
  onSaved,
}: EditProfileModalProps) {
  const [bio, setBio] = useState(profile.bio);
  const [college, setCollege] = useState(profile.college);
  const [avatarPreview, setAvatarPreview] = useState(profile.avatar_url);
  const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [googleAvatarUrl, setGoogleAvatarUrl] = useState<string | null>(null);
  const [revertConfirmOpen, setRevertConfirmOpen] = useState(false);
  const [reverting, setReverting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      const meta = user?.user_metadata;
      const url = (meta?.avatar_url ?? meta?.picture) as string | undefined;
      if (url) setGoogleAvatarUrl(url);
    });
  }, []);

  // ── Change tracking ──────────────────────────────────────────────────────
  // Selecting a new avatar, or editing bio/college, counts as a change.
  const hasChanges =
    bio !== profile.bio ||
    college !== profile.college ||
    !!avatarBase64;

  // "No changes to save yet." hint shown when Save is pressed with no changes.
  const { showNoChanges, flashNoChanges, hideNoChanges } = useNoChangesHint();

  // Hide the hint as soon as the user edits anything (skips the initial mount).
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    hideNoChanges();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bio, college, avatarBase64]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarError(null);

    // Type check
    if (!ALLOWED_TYPES.includes(file.type)) {
      setAvatarError("Only JPG, JPEG, PNG, and WEBP files are allowed");
      return;
    }

    // Size check
    if (file.size > AVATAR_MAX_MB * 1024 * 1024) {
      setAvatarError(`Photo must be under ${AVATAR_MAX_MB}MB`);
      return;
    }

    // Read as base64 for upload + preview
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setAvatarPreview(result);
      setAvatarBase64(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (saving) return;
    if (!hasChanges) {
      flashNoChanges();
      return;
    }
    hideNoChanges();
    setSaving(true);
    try {
      await updateProfile({
        bio: bio.trim(),
        college: college || undefined,
        avatar_base64: avatarBase64 || undefined,
      });

      toast.success("Profile updated!");
      onSaved();
      onOpenChange(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update profile";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleRevert = async () => {
    setReverting(true);
    try {
      const newUrl = await revertAvatarToGoogle();
      setAvatarPreview(newUrl);
      setAvatarBase64(null);
      toast.success("Reverted to Google account photo.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to revert photo");
    } finally {
      setReverting(false);
      setRevertConfirmOpen(false);
    }
  };

  const canRevert =
    !!googleAvatarUrl &&
    avatarPreview !== googleAvatarUrl &&
    !avatarBase64;

  const bioRatio = bio.length / BIO_MAX;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-4">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="relative size-24 overflow-hidden rounded-full bg-muted">
                {avatarPreview ? (
                  <Image
                    src={toStorageUrl(avatarPreview)}
                    alt="Profile"
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <User className="size-full p-4 text-muted-foreground" />
                )}
              </div>
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 flex size-8 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <Camera className="size-4" />
              </label>
              <input
                ref={fileInputRef}
                id="avatar-upload"
                type="file"
                accept=".jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </div>
            {avatarError ? (
              <p className="text-sm text-destructive">{avatarError}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                JPG, JPEG, PNG, or WEBP. Max {AVATAR_MAX_MB}MB.
              </p>
            )}
            {canRevert && (
              <button
                type="button"
                onClick={() => setRevertConfirmOpen(true)}
                disabled={saving || reverting}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                <ArrowCounterClockwiseIcon className="size-3.5" />
                Use Google account photo
              </button>
            )}
          </div>

          {/* Name (read-only) */}
          <div className="flex flex-col gap-2">
            <Label>Name</Label>
            <p className="text-sm font-medium text-foreground">{profile.full_name}</p>
            <p className="text-xs text-muted-foreground">
              Your name is pulled from your PalSU Google account and cannot be changed here.
            </p>
          </div>

          {/* Bio */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-bio">Bio</Label>
            <Textarea
              id="edit-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, BIO_MAX))}
              placeholder="Tell others about yourself..."
              rows={3}
              maxLength={BIO_MAX}
              disabled={saving}
            />
            <span
              className={cn(
                "text-xs",
                bioRatio > 0.8 ? "text-destructive font-medium" : "text-muted-foreground"
              )}
            >
              {bio.length} / {BIO_MAX} characters
            </span>
          </div>

          {/* College */}
          <div className="flex flex-col gap-2">
            <Label>College</Label>
            <Select value={college} onValueChange={setCollege} disabled={saving}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select your college" />
              </SelectTrigger>
              <SelectContent>
                {COLLEGES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Role (read-only) */}
          <div className="flex flex-col gap-2">
            <Label>Role</Label>
            <Input
              value={profile.role === "student" ? "Student" : "Faculty"}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Role cannot be changed here
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={saving}
            className={cn(!hasChanges && "cursor-not-allowed opacity-50",
              saving && "cursor-wait"
            )}
            >
            {saving ? (
              <>
                <SpinnerGap className="size-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
        {showNoChanges && (
          <p className="text-xs text-destructive text-right">
            No changes to save yet.
          </p>
        )}
      </DialogContent>

      <AlertDialog open={revertConfirmOpen} onOpenChange={setRevertConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Use Google account photo?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revert to your Google account photo? Your current profile picture will be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={reverting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleRevert(); }}
              disabled={reverting}
            >
              {reverting ? (
                <>
                  <SpinnerGap className="size-4 animate-spin" />
                  Reverting...
                </>
              ) : (
                "Yes, revert"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
