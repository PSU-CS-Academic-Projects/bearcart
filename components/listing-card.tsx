import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Clock, User, ShoppingBag } from "@phosphor-icons/react/dist/ssr";

interface ListingCardProps {
  id: string;
  title: string;
  price: number;
  category: string;
  condition: string;
  sellerName: string;
  sellerAvatar: string;
  timePosted: string;
  imageUrl: string;
}

export function ListingCard({
  id,
  title,
  price,
  category,
  condition,
  sellerName,
  sellerAvatar,
  timePosted,
  imageUrl,
}: ListingCardProps) {
  return (
    <Link href={`/listings/${id}`} className="block">
    <Card className="group cursor-pointer overflow-hidden p-0 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <ShoppingBag className="size-12 text-muted-foreground/40" />
          </div>
        )}
        {/* Badges overlay */}
        <div className="absolute left-2 top-2 flex flex-wrap gap-1.5">
          <Badge className="bg-primary text-primary-foreground">{category}</Badge>
          <Badge variant="secondary">{condition}</Badge>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-3 p-4">
        {/* Title and Price */}
        <div>
          <h3 className="line-clamp-2 font-semibold text-foreground transition-colors group-hover:text-primary">
            {title}
          </h3>
          <p className="mt-1 text-lg font-bold text-primary">
            ₱{price.toLocaleString()}
          </p>
        </div>

        {/* Seller Info */}
        <div className="flex items-center justify-between border-t pt-3">
          <div className="flex items-center gap-2">
            <div className="relative size-6 overflow-hidden rounded-full bg-muted">
              {sellerAvatar ? (
                <Image
                  src={sellerAvatar}
                  alt={sellerName}
                  fill
                  className="object-cover"
                />
              ) : (
                <User className="size-full p-1 text-muted-foreground" />
              )}
            </div>
            <span className="text-xs text-muted-foreground">{sellerName}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="size-3" />
            {timePosted}
          </div>
        </div>
      </div>
    </Card>
    </Link>
  );
}
