"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Camera, User } from "@phosphor-icons/react";

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: {
    name: string;
    bio: string;
    department: string;
    avatar: string;
    meetupSpots: string[];
  };
  onSave: (profile: {
    name: string;
    bio: string;
    department: string;
    avatar: string;
    meetupSpots: string[];
  }) => void;
}

const departments = [
  "College of Arts and Humanities",
  "College of Business and Accountancy",
  "College of Education",
  "College of Engineering, Architecture and Technology",
  "College of Hospitality Management and Tourism",
  "College of Nursing and Health Sciences",
  "College of Sciences",
];

const meetupSpotOptions = [
  "Library",
  "Cafeteria",
  "Main Building Lobby",
  "Covered Court",
];

export function EditProfileModal({
  open,
  onOpenChange,
  profile,
  onSave,
}: EditProfileModalProps) {
  const [name, setName] = useState(profile.name);
  const [bio, setBio] = useState(profile.bio);
  const [department, setDepartment] = useState(profile.department);
  const [meetupSpots, setMeetupSpots] = useState<string[]>(profile.meetupSpots);
  const [avatarPreview, setAvatarPreview] = useState(profile.avatar);

  const handleMeetupSpotToggle = (spot: string) => {
    setMeetupSpots((prev) =>
      prev.includes(spot) ? prev.filter((s) => s !== spot) : [...prev, spot]
    );
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatarPreview(url);
    }
  };

  const handleSave = () => {
    onSave({
      name,
      bio,
      department,
      avatar: avatarPreview,
      meetupSpots,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-4">
          {/* Profile Photo */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="relative size-24 overflow-hidden rounded-full bg-muted">
                {avatarPreview ? (
                  <Image
                    src={avatarPreview}
                    alt="Profile"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <User className="size-full p-4 text-muted-foreground" />
                )}
              </div>
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 flex size-8 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-colors hover:bg-primary/90"
              >
                <Camera className="size-4" />
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Click the camera icon to change photo
            </p>
          </div>

          {/* Full Name */}
          <div className="flex flex-col gap-2">
            <label htmlFor="name" className="text-sm font-medium">
              Full Name
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
            />
          </div>

          {/* Bio */}
          <div className="flex flex-col gap-2">
            <label htmlFor="bio" className="text-sm font-medium">
              Bio
            </label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Write a short bio about yourself..."
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              {bio.length}/150 characters
            </p>
          </div>

          {/* Department */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Department</label>
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger>
                <SelectValue placeholder="Select your department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preferred Meetup Spots */}
          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium">
              Preferred Meetup Spots
            </label>
            <div className="flex flex-col gap-2">
              {meetupSpotOptions.map((spot) => (
                <label
                  key={spot}
                  className="flex cursor-pointer items-center gap-3"
                >
                  <Checkbox
                    checked={meetupSpots.includes(spot)}
                    onCheckedChange={() => handleMeetupSpotToggle(spot)}
                  />
                  <span className="text-sm">{spot}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
