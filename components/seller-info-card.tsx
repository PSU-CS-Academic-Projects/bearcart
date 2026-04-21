import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  Calendar,
  Tag,
  User,
} from "@phosphor-icons/react/dist/ssr";

interface SellerInfoCardProps {
  seller: {
    id: string;
    name: string;
    avatar: string;
    role: "student" | "faculty";
    memberSince: string;
    totalListings: number;
    rating: number;
  };
}

export function SellerInfoCard({ seller }: SellerInfoCardProps) {
  return (
    <Card className="p-5">
      <div className="flex flex-col gap-4">
        {/* Seller Header */}
        <div className="flex items-center gap-3">
          <div className="relative size-14 shrink-0 overflow-hidden rounded-full bg-muted">
            {seller.avatar ? (
              <Image
                src={seller.avatar}
                alt={seller.name}
                fill
                className="object-cover"
              />
            ) : (
              <User className="size-full p-3 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold text-foreground">
              {seller.name}
            </h3>
            <Badge variant="secondary" className="mt-1">
              {seller.role === "student" ? "PSU Student" : "PSU Faculty"}
            </Badge>
          </div>
        </div>

        {/* Seller Stats */}
        <div className="grid grid-cols-3 gap-3 border-y py-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Star className="size-4 text-primary" weight="fill" />
              <span className="font-semibold text-foreground">
                {seller.rating.toFixed(1)}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">Rating</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Tag className="size-4 text-primary" />
              <span className="font-semibold text-foreground">
                {seller.totalListings}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">Listings</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Calendar className="size-4 text-primary" />
              <span className="font-semibold text-foreground">
                {seller.memberSince}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">Joined</p>
          </div>
        </div>

        {/* View Profile Button */}
        <Button variant="outline" asChild className="w-full">
          <Link href={`/sellers/${seller.id}`}>View Profile</Link>
        </Button>
      </div>
    </Card>
  );
}
