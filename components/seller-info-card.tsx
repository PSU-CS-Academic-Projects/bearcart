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
    first_name?: string | null;
    last_name?: string | null;
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
    <Card className="p-3.5">
      <div className="flex flex-col gap-3">
        {/* Seller Header */}
        <div className="flex items-center gap-2.5">
          <div className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
            {seller.avatar_url ? (
              <Image
                src={seller.avatar_url}
                alt={displayName}
                fill
                unoptimized
                className="object-cover"
              />
            ) : (
              <span className="text-sm font-semibold text-muted-foreground">
                {initials || <User className="size-5" />}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold text-foreground">
              {displayName}
            </h3>
            <Badge variant="secondary" className="mt-1 px-2 py-0 text-xs">
              {seller.role === "student" ? "Student" : "Faculty"}
            </Badge>
          </div>
        </div>

        {/* Seller Details */}
        <div className="space-y-1.5 border-y py-2.5">
          {seller.college && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <GraduationCap className="size-3.5 shrink-0 text-primary" />
              <span className="truncate">{seller.college}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="size-3.5 shrink-0 text-primary" />
            <span>Member since {formatTimeAgo(seller.created_at)}</span>
          </div>
        </div>

        {/* View Profile Button */}
        <Button variant="outline" asChild className="h-8 w-full text-xs">
          <Link href={`/profile/${seller.id}`}>View Profile</Link>
        </Button>
      </div>
    </Card>
  );
}
