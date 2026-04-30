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
      <article className="overflow-hidden border-[3px] border-[oklch(0.2_0_0)] bg-white shadow-[4px_4px_0_oklch(0.2_0_0)] group-hover:shadow-[6px_6px_0_oklch(0.585_0.144_55)]">
        <div className="relative aspect-square overflow-hidden bg-[oklch(0.95_0_0)]">
          {imageUrl ? (
            <Image src={imageUrl} alt={title} fill className="object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center">
              <ShoppingBag className="size-12 text-[oklch(0.7_0_0)]" />
            </div>
          )}
          {/* Category sticker */}
          <div className="absolute left-0 top-3">
            <span className="bg-[oklch(0.585_0.144_55)] px-2.5 py-1 text-xs font-black uppercase text-white border-y-2 border-r-2 border-[oklch(0.2_0_0)]">
              {category}
            </span>
          </div>
        </div>
        <div className="border-t-[3px] border-[oklch(0.2_0_0)] p-3">
          <p className="text-2xl font-black text-[oklch(0.585_0.144_55)] leading-none">₱{price.toLocaleString()}</p>
          <h3 className="mt-1.5 line-clamp-2 text-sm font-bold text-[oklch(0.2_0_0)]">{title}</h3>
          <p className="mt-1.5 text-xs font-medium text-[oklch(0.45_0_0)]">{timePosted} · {condition}</p>
        </div>
      </article>
    </Link>
  );
}
