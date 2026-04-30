import Image from "next/image";
import Link from "next/link";
import { User, ShoppingBag } from "@phosphor-icons/react/dist/ssr";

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
  const firstName = sellerName.split(" ")[0] || sellerName;

  return (
    <Link href={`/listings/${id}`} className="group block">
      <article className="overflow-hidden rounded-[8px] border border-border bg-card transition-[box-shadow,transform] duration-[120ms] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0_rgba(0,0,0,0.12)]">
        <div className="relative aspect-square overflow-hidden bg-muted">
          {imageUrl ? (
            <Image src={imageUrl} alt={title} fill className="object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center">
              <ShoppingBag className="size-12 text-muted-foreground/40" />
            </div>
          )}
        </div>
        <div className="p-3">
          <p className="text-[1.375rem] font-extrabold leading-tight text-primary">₱{price.toLocaleString()}</p>
          <h3 className="mt-1 line-clamp-2 text-sm text-foreground/90">{title}</h3>
          <p className="mt-1.5 text-xs text-muted-foreground">{timePosted} · {condition}</p>
        </div>
      </article>
    </Link>
  );
}
