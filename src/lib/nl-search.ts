import { CATEGORIES, type CategoryId } from "./places-types";

export interface ParsedQuery {
  category: CategoryId | null;
  keyword: string | null;
  radius: number | null;
  minRating: number | null;
  maxPrice: number | null;
  openNow: boolean;
  familyFriendly: boolean;
  vegetarian: boolean;
  sort: string | null;
}

/** Turns natural language like "family restaurant within 3 km rating above 4.2 under ₹600" into filters. */
export function parseQuery(input: string): ParsedQuery {
  const q = input.toLowerCase();
  const out: ParsedQuery = {
    category: null,
    keyword: null,
    radius: null,
    minRating: null,
    maxPrice: null,
    openNow: /open now|open right now|currently open/.test(q),
    familyFriendly: /family/.test(q),
    vegetarian: /\bveg\b|vegetarian/.test(q) && !/non.?veg/.test(q),
    sort: null,
  };

  if (/fast food|burger|pizza/.test(q)) out.category = "fast_food";
  else if (/pharmac|medical store|medicine|chemist/.test(q)) out.category = "pharmacy";
  else if (/hospital|clinic/.test(q)) out.category = "hospital";
  else if (/supermarket|mart\b/.test(q)) out.category = "supermarket";
  else if (/kirana|general store|grocery/.test(q)) out.category = "general_store";
  else if (/cafe|coffee/.test(q)) out.category = "cafe";
  else if (/bakery|cake|bread/.test(q)) out.category = "bakery";
  else if (/family restaurant/.test(q)) out.category = "family_restaurant";
  else if (/restaurant|food|dine|biryani|meal/.test(q)) out.category = "restaurant";

  const km = q.match(/(?:within|under|in)\s*(\d+(?:\.\d+)?)\s*(km|kilometer)/);
  const m = q.match(/(?:within|under|in)\s*(\d+)\s*(m|meter)\b/);
  if (km) out.radius = Math.round(parseFloat(km[1]) * 1000);
  else if (m) out.radius = parseInt(m[1], 10);

  const rating = q.match(/(?:rating|rated|stars?)\D{0,12}(\d(?:\.\d)?)|(\d(?:\.\d)?)\s*\+?\s*stars?/);
  if (rating) out.minRating = parseFloat(rating[1] ?? rating[2]);
  if (/best rated|top rated|highest rated/.test(q)) {
    out.sort = "rating";
    out.minRating = out.minRating ?? 4;
  }
  if (/most reviewed/.test(q)) out.sort = "reviews";
  if (/nearest|closest/.test(q)) out.sort = "distance";
  if (/cheap|budget|low price|lowest price/.test(q)) {
    out.sort = out.sort ?? "price";
    out.maxPrice = out.maxPrice ?? 300;
  }

  const price = q.match(/(?:under|below|less than|upto|up to)\s*(?:₹|rs\.?|inr)?\s*(\d{2,5})/);
  if (price && !km && !m) out.maxPrice = parseInt(price[1], 10);
  const priceWithSymbol = q.match(/(?:under|below|less than)\s*(?:₹|rs\.?|inr)\s*(\d{2,5})/);
  if (priceWithSymbol) out.maxPrice = parseInt(priceWithSymbol[1], 10);

  const cleaned = input
    .replace(/near me/gi, "")
    .replace(/within[^,]*?(km|m)\b/gi, "")
    .replace(/(under|below|less than)\s*(₹|rs\.?|inr)?\s*\d+/gi, "")
    .replace(/rating\s*(above|over)?\s*\d(\.\d)?/gi, "")
    .trim();
  out.keyword = cleaned.length > 2 ? cleaned : null;
  if (!out.category && out.keyword) out.category = null;
  return out;
}

export function describeParsed(p: ParsedQuery): string[] {
  const chips: string[] = [];
  if (p.category) chips.push(CATEGORIES.find((c) => c.id === p.category)?.label ?? p.category);
  if (p.radius) chips.push(p.radius >= 1000 ? `Within ${p.radius / 1000} km` : `Within ${p.radius} m`);
  if (p.minRating) chips.push(`⭐ ${p.minRating}+`);
  if (p.maxPrice) chips.push(`Under ₹${p.maxPrice}`);
  if (p.openNow) chips.push("Open now");
  if (p.familyFriendly) chips.push("Family friendly");
  if (p.vegetarian) chips.push("Vegetarian");
  return chips;
}
