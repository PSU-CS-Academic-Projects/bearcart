import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  GraduationCap,
  User,
} from "@phosphor-icons/react/dist/ssr";
import { formatTimeAgo } from "@/lib/listing-helpers";

interface SellerInfoCardProps {
  seller: {
    id: string;
    full_name: string | null;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    role: string;
    college: string | null;
    created_at: string;
  };
}

export function SellerInfoCard({ seller }: SellerInfoCardProps) {
  const displayName =
    seller.full_name ??
    ([seller.first_name, seller.last_name].filter(Boolean).join(" ") ||
    "PSU Member");

  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Card className="p-5">
      <div className="flex flex-col gap-4">
        {/* Seller Header */}
        <div className="flex items-center gap-3">
          <div className="relative flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
            {seller.avatar_url ? (
              <Image
                src={seller.avatar_url}
                alt={displayName}
                fill
                className="object-cover"
              />
            ) : (
              <span className="text-lg font-semibold text-muted-foreground">
                {initials || <User className="size-6" />}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold text-foreground">
              {displayName}
            </h3>
            <Badge variant="secondary" className="mt-1">
              {seller.role === "student" ? "PSU Student" : "PSU Faculty"}
            </Badge>
          </div>
        </div>

        {/* Seller Details */}
        <div className="space-y-2 border-y py-4">
          {seller.college && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <GraduationCap className="size-4 shrink-0 text-primary" />
              <span className="truncate">{seller.college}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="size-4 shrink-0 text-primary" />
            <span>Member since {formatTimeAgo(seller.created_at)}</span>
          </div>
        </div>

        {/* View Profile Button */}
        <Button variant="outline" asChild className="w-full">
          <Link href={`/profile/${seller.id}`}>View Profile</Link>
        </Button>
      </div>
    </Card>
  );
}
