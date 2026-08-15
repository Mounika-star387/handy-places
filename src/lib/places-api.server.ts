import { CATEGORIES } from "./places-types";
import type { PlaceResult } from "./places-types";
import { gateway, haversine, routeMatrix } from "./places.server";

const LIST_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.rating",
  "places.userRatingCount",
  "places.priceLevel",
  "places.priceRange",
  "places.currentOpeningHours.openNow",
  "places.regularOpeningHours.weekdayDescriptions",
  "places.nationalPhoneNumber",
  "places.websiteUri",
  "places.photos",
  "places.types",
  "places.primaryTypeDisplayName",
  "places.goodForChildren",
  "places.servesVegetarianFood",
  "places.editorialSummary",
].join(",");

const DETAIL_MASK = LIST_MASK.replace(/places\./g, "");

interface RawPlace {
  id: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  rating?: number;
  userRatingCount?: number;
  priceLevel?: string;
  priceRange?: { startPrice?: { units?: string; currencyCode?: string }; endPrice?: { units?: string } };
  currentOpeningHours?: { openNow?: boolean };
  regularOpeningHours?: { weekdayDescriptions?: string[] };
  nationalPhoneNumber?: string;
  websiteUri?: string;
  photos?: { name: string }[];
  types?: string[];
  primaryTypeDisplayName?: { text?: string };
  goodForChildren?: boolean;
  servesVegetarianFood?: boolean;
  editorialSummary?: { text?: string };
}

function todayHours(raw: RawPlace): string | null {
  const list = raw.regularOpeningHours?.weekdayDescriptions;
  if (!list?.length) return null;
  const idx = (new Date().getDay() + 6) % 7;
  return list[idx] ?? null;
}

function priceRangeText(raw: RawPlace): string | null {
  const start = raw.priceRange?.startPrice?.units;
  const end = raw.priceRange?.endPrice?.units;
  const cur = raw.priceRange?.startPrice?.currencyCode === "INR" ? "₹" : "";
  if (start && end) return `${cur}${start} – ${cur}${end} for two`;
  if (start) return `From ${cur}${start} for two`;
  return null;
}

function mapPlace(raw: RawPlace, origin: { lat: number; lng: number }): PlaceResult | null {
  if (!raw.location || !raw.id) return null;
  const lat = raw.location.latitude;
  const lng = raw.location.longitude;
  return {
    id: raw.id,
    name: raw.displayName?.text ?? "Unnamed business",
    address: raw.formattedAddress ?? null,
    lat,
    lng,
    rating: raw.rating ?? null,
    reviewCount: raw.userRatingCount ?? null,
    priceLevel: raw.priceLevel ?? null,
    priceRangeText: priceRangeText(raw),
    openNow: raw.currentOpeningHours?.openNow ?? null,
    openingText: todayHours(raw),
    types: raw.types ?? [],
    primaryType: raw.primaryTypeDisplayName?.text ?? null,
    phone: raw.nationalPhoneNumber ?? null,
    website: raw.websiteUri ?? null,
    photoName: raw.photos?.[0]?.name ?? null,
    familyFriendly: raw.goodForChildren ?? null,
    vegetarian: raw.servesVegetarianFood ?? null,
    summary: raw.editorialSummary?.text ?? null,
    distanceMeters: haversine(origin, { lat, lng }),
    driveSeconds: null,
    walkSeconds: null,
  };
}

export async function searchPlacesImpl(input: {
  lat: number;
  lng: number;
  radius: number;
  category?: string | null;
  keyword?: string | null;
  openNow?: boolean;
}): Promise<{ places: PlaceResult[] }> {
  const origin = { lat: input.lat, lng: input.lng };
  const cat = CATEGORIES.find((c) => c.id === input.category);
  const textQuery = [input.keyword, cat?.textQuery].filter(Boolean).join(" ").trim();

  let raws: RawPlace[] = [];
  if (textQuery) {
    const data = (await gateway("/places/v1/places:searchText", {
      method: "POST",
      fieldMask: LIST_MASK,
      body: {
        textQuery,
        maxResultCount: 20,
        openNow: input.openNow || undefined,
        locationBias: {
          circle: { center: { latitude: input.lat, longitude: input.lng }, radius: input.radius },
        },
      },
    })) as { places?: RawPlace[] };
    raws = data.places ?? [];
  } else {
    const data = (await gateway("/places/v1/places:searchNearby", {
      method: "POST",
      fieldMask: LIST_MASK,
      body: {
        includedTypes: cat?.includedTypes ?? ["restaurant", "store"],
        maxResultCount: 20,
        locationRestriction: {
          circle: { center: { latitude: input.lat, longitude: input.lng }, radius: input.radius },
        },
      },
    })) as { places?: RawPlace[] };
    raws = data.places ?? [];
  }

  const places = raws
    .map((r) => mapPlace(r, origin))
    .filter((p): p is PlaceResult => p !== null)
    .filter((p) => p.distanceMeters <= input.radius * 1.15)
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
    .slice(0, 20);

  const [drive, walk] = await Promise.all([
    routeMatrix(origin, places, "DRIVE"),
    routeMatrix(origin, places.slice(0, 10), "WALK"),
  ]);
  places.forEach((p, i) => {
    p.driveSeconds = drive[i] ?? null;
    p.walkSeconds = walk[i] ?? null;
  });

  return { places };
}

export async function placeDetailsImpl(input: { id: string; lat: number; lng: number }) {
  const raw = (await gateway(`/places/v1/places/${encodeURIComponent(input.id)}`, {
    fieldMask: DETAIL_MASK + ",reviews",
  })) as RawPlace & {
    reviews?: {
      name: string;
      rating?: number;
      text?: { text?: string };
      relativePublishTimeDescription?: string;
      authorAttribution?: { displayName?: string; photoUri?: string };
    }[];
  };
  const origin = { lat: input.lat, lng: input.lng };
  const place = mapPlace(raw, origin);
  if (!place) throw new Error("Place not found");
  const [drive, walk] = await Promise.all([
    routeMatrix(origin, [place], "DRIVE"),
    routeMatrix(origin, [place], "WALK"),
  ]);
  place.driveSeconds = drive[0] ?? null;
  place.walkSeconds = walk[0] ?? null;

  return {
    place,
    weekdayDescriptions: raw.regularOpeningHours?.weekdayDescriptions ?? [],
    reviews: (raw.reviews ?? []).slice(0, 6).map((r) => ({
      id: r.name,
      rating: r.rating ?? null,
      text: r.text?.text ?? null,
      when: r.relativePublishTimeDescription ?? null,
      author: r.authorAttribution?.displayName ?? "Google user",
    })),
  };
}

export async function reverseGeocodeImpl(input: { lat: number; lng: number }) {
  const data = (await gateway(`/maps/api/geocode/json?latlng=${input.lat},${input.lng}`)) as {
    results?: { formatted_address?: string; address_components?: { long_name: string; types: string[] }[] }[];
  };
  const first = data.results?.[0];
  const locality = first?.address_components?.find((c) =>
    c.types.some((t) => ["locality", "sublocality", "administrative_area_level_3"].includes(t)),
  )?.long_name;
  return { label: locality ?? first?.formatted_address ?? null };
}

export async function geocodeTextImpl(query: string) {
  const data = (await gateway(`/maps/api/geocode/json?address=${encodeURIComponent(query)}`)) as {
    results?: { formatted_address?: string; geometry?: { location?: { lat: number; lng: number } } }[];
  };
  const first = data.results?.[0];
  if (!first?.geometry?.location) return null;
  return {
    lat: first.geometry.location.lat,
    lng: first.geometry.location.lng,
    label: first.formatted_address ?? query,
  };
}

export async function photoUrlImpl(name: string) {
  if (!/^places\/[^/]+\/photos\/[^/]+$/.test(name)) return null;
  const data = (await gateway(`/places/v1/${name}/media?maxHeightPx=600&skipHttpRedirect=true`)) as {
    photoUri?: string;
  };
  return data.photoUri ?? null;
}
