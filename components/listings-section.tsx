import { ListingCard } from "@/components/listing-card";
import { FiltersSidebar, MobileFiltersSheet } from "@/components/filters-sidebar";

// Placeholder listings data
const listings = [
  {
    id: 1,
    title: "Calculus Early Transcendentals 8th Edition - James Stewart",
    price: 450,
    category: "Books",
    condition: "Good",
    sellerName: "Maria Santos",
    sellerAvatar: "https://i.pravatar.cc/100?img=1",
    timePosted: "2h ago",
    imageUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=400&fit=crop",
  },
  {
    id: 2,
    title: "iPhone 13 Mini 128GB - Midnight Black",
    price: 28500,
    category: "Electronics",
    condition: "Like New",
    sellerName: "Juan Dela Cruz",
    sellerAvatar: "https://i.pravatar.cc/100?img=3",
    timePosted: "5h ago",
    imageUrl: "https://images.unsplash.com/photo-1632661674596-df8be59a3d40?w=400&h=400&fit=crop",
  },
  {
    id: 3,
    title: "PSU College of Engineering Jacket - Size L",
    price: 850,
    category: "Clothing",
    condition: "New",
    sellerName: "Ana Reyes",
    sellerAvatar: "https://i.pravatar.cc/100?img=5",
    timePosted: "1d ago",
    imageUrl: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&h=400&fit=crop",
  },
  {
    id: 4,
    title: "Homemade Empanadas - 12 pieces (Beef/Chicken)",
    price: 180,
    category: "Food",
    condition: "New",
    sellerName: "Rosa Garcia",
    sellerAvatar: "https://i.pravatar.cc/100?img=9",
    timePosted: "3h ago",
    imageUrl: "https://images.unsplash.com/photo-1604579839181-8682c58e47e6?w=400&h=400&fit=crop",
  },
  {
    id: 5,
    title: "Complete Art Supplies Kit - Watercolors, Brushes, Canvas",
    price: 1200,
    category: "Supplies",
    condition: "New",
    sellerName: "Carlos Mendoza",
    sellerAvatar: "https://i.pravatar.cc/100?img=12",
    timePosted: "6h ago",
    imageUrl: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=400&fit=crop",
  },
  {
    id: 6,
    title: "Tutoring Services - Math & Physics (Per Hour)",
    price: 300,
    category: "Services",
    condition: "New",
    sellerName: "Miguel Torres",
    sellerAvatar: "https://i.pravatar.cc/100?img=15",
    timePosted: "1d ago",
    imageUrl: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=400&fit=crop",
  },
];

export function ListingsSection() {
  return (
    <section className="py-10">
      <div className="mx-auto max-w-7xl px-4">
        {/* Section Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Latest Listings</h2>
            <p className="text-muted-foreground">
              Discover what&apos;s available on campus
            </p>
          </div>
          <MobileFiltersSheet />
        </div>

        {/* Main Content */}
        <div className="flex gap-8">
          {/* Sidebar - Desktop */}
          <FiltersSidebar className="hidden w-64 shrink-0 lg:block" />

          {/* Listings Grid */}
          <div className="flex-1">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  title={listing.title}
                  price={listing.price}
                  category={listing.category}
                  condition={listing.condition}
                  sellerName={listing.sellerName}
                  sellerAvatar={listing.sellerAvatar}
                  timePosted={listing.timePosted}
                  imageUrl={listing.imageUrl}
                />
              ))}
            </div>

            {/* Load More */}
            <div className="mt-8 text-center">
              <button className="text-sm font-medium text-primary hover:underline">
                View all listings →
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
