export type CategoryId =
  | "restaurant"
  | "family_restaurant"
  | "fast_food"
  | "cafe"
  | "bakery"
  | "pharmacy"
  | "hospital"
  | "general_store"
  | "supermarket"
  | "other";

export interface CategoryDef {
  id: CategoryId;
  label: string;
  emoji: string;
  includedTypes: string[];
  textQuery: string;
}

export const CATEGORIES: CategoryDef[] = [
  {
    id: "restaurant",
    label: "Restaurants",
    emoji: "🍴",
    includedTypes: ["restaurant"],
    textQuery: "restaurant",
  },
  {
    id: "family_restaurant",
    label: "Family Restaurants",
    emoji: "👨‍👩‍👧",
    includedTypes: ["restaurant"],
    textQuery: "family restaurant",
  },
  {
    id: "fast_food",
    label: "Fast Food",
    emoji: "🍔",
    includedTypes: ["fast_food_restaurant"],
    textQuery: "fast food",
  },
  { id: "cafe", label: "Cafes", emoji: "☕", includedTypes: ["cafe"], textQuery: "cafe" },
  { id: "bakery", label: "Bakeries", emoji: "🥐", includedTypes: ["bakery"], textQuery: "bakery" },
  {
    id: "pharmacy",
    label: "Medical Stores",
    emoji: "💊",
    includedTypes: ["pharmacy", "drugstore"],
    textQuery: "medical store pharmacy",
  },
  {
    id: "hospital",
    label: "Hospitals",
    emoji: "🏥",
    includedTypes: ["hospital"],
    textQuery: "hospital",
  },
  {
    id: "general_store",
    label: "General Stores",
    emoji: "🛒",
    includedTypes: ["convenience_store", "grocery_store"],
    textQuery: "general store kirana",
  },
  {
    id: "supermarket",
    label: "Supermarkets",
    emoji: "🏪",
    includedTypes: ["supermarket"],
    textQuery: "supermarket",
  },
  {
    id: "other",
    label: "Other Shops",
    emoji: "🧺",
    includedTypes: ["store"],
    textQuery: "local shop",
  },
];

export interface PlaceResult {
  id: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  rating: number | null;
  reviewCount: number | null;
  priceLevel: string | null;
  priceRangeText: string | null;
  openNow: boolean | null;
  openingText: string | null;
  types: string[];
  primaryType: string | null;
  phone: string | null;
  website: string | null;
  photoName: string | null;
  familyFriendly: boolean | null;
  vegetarian: boolean | null;
  summary: string | null;
  distanceMeters: number;
  driveSeconds: number | null;
  walkSeconds: number | null;
}

export const PRICE_BUCKETS = [
  { id: "any", label: "Any price", levels: [] as string[] },
  { id: "under200", label: "Under ₹200", levels: ["PRICE_LEVEL_FREE", "PRICE_LEVEL_INEXPENSIVE"] },
  { id: "200_500", label: "₹200 – ₹500", levels: ["PRICE_LEVEL_INEXPENSIVE", "PRICE_LEVEL_MODERATE"] },
  { id: "500_1000", label: "₹500 – ₹1,000", levels: ["PRICE_LEVEL_MODERATE", "PRICE_LEVEL_EXPENSIVE"] },
  { id: "1000plus", label: "₹1,000+", levels: ["PRICE_LEVEL_EXPENSIVE", "PRICE_LEVEL_VERY_EXPENSIVE"] },
];

export const DISTANCE_OPTIONS = [500, 1000, 3000, 5000, 10000];

export function formatDistance(m: number): string {
  return m < 1000 ? `${Math.round(m)} m away` : `${(m / 1000).toFixed(1)} km away`;
}

export function formatDuration(seconds: number | null): string | null {
  if (seconds == null) return null;
  const mins = Math.max(1, Math.round(seconds / 60));
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)} h ${mins % 60} min`;
}

export function priceLabel(p: PlaceResult): string {
  if (p.priceRangeText) return p.priceRangeText;
  switch (p.priceLevel) {
    case "PRICE_LEVEL_FREE":
      return "Free";
    case "PRICE_LEVEL_INEXPENSIVE":
      return "₹ Budget";
    case "PRICE_LEVEL_MODERATE":
      return "₹₹ Moderate";
    case "PRICE_LEVEL_EXPENSIVE":
      return "₹₹₹ Expensive";
    case "PRICE_LEVEL_VERY_EXPENSIVE":
      return "₹₹₹₹ Very expensive";
    default:
      return "Information unavailable";
  }
}

export function categoryOf(p: PlaceResult): string {
  if (p.primaryType) return p.primaryType;
  const t = p.types[0];
  return t ? t.replace(/_/g, " ") : "Local business";
}
