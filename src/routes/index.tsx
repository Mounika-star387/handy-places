import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { ClientOnly } from "@tanstack/react-router";
import { Search, MapPin, Loader2, LocateFixed, List, Map as MapIcon, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlaceCard } from "@/components/PlaceCard";
import { searchPlaces, reverseGeocode, geocodeText } from "@/lib/places.functions";
import { parseQuery, describeParsed } from "@/lib/nl-search";
import {
  CATEGORIES,
  DISTANCE_OPTIONS,
  PRICE_BUCKETS,
  formatDistance,
  type PlaceResult,
} from "@/lib/places-types";

const PlacesMap = lazy(() => import("@/components/PlacesMap"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LocalSpot — Find restaurants & shops near you" },
      {
        name: "description",
        content:
          "LocalSpot finds real restaurants, fast food, cafes, pharmacies, general stores and supermarkets near you with ratings, price, distance, travel time and opening hours.",
      },
      { property: "og:title", content: "LocalSpot — Find restaurants & shops near you" },
      {
        property: "og:description",
        content: "Discover nearby local businesses with live ratings, distance, travel time and open-now status.",
      },
    ],
  }),
  component: Home,
});

const SUGGESTIONS = [
  "Restaurants near me",
  "Family restaurant within 3 km rating above 4.2 under ₹600",
  "Fast food open now",
  "Medical store near me",
  "Best rated cafes within 5 km",
];

const SORTS = [
  { id: "distance", label: "Nearest" },
  { id: "rating", label: "Highest rated" },
  { id: "reviews", label: "Most reviewed" },
  { id: "price", label: "Lowest price" },
  { id: "best", label: "Best overall" },
  { id: "open", label: "Open now first" },
];

const PRICE_ORDER: Record<string, number> = {
  PRICE_LEVEL_FREE: 0,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
};

function Home() {
  const runSearch = useServerFn(searchPlaces);
  const runReverse = useServerFn(reverseGeocode);
  const runGeocode = useServerFn(geocodeText);

  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [manualPlace, setManualPlace] = useState("");

  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [category, setCategory] = useState<string | null>("restaurant");
  const [radius, setRadius] = useState(3000);
  const [minRating, setMinRating] = useState(0);
  const [priceBucket, setPriceBucket] = useState("any");
  const [openNow, setOpenNow] = useState(false);
  const [familyOnly, setFamilyOnly] = useState(false);
  const [vegOnly, setVegOnly] = useState(false);
  const [sort, setSort] = useState("distance");
  const [view, setView] = useState<"list" | "map">("list");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const detect = () => {
    setLocating(true);
    setLocationError(null);
    if (!("geolocation" in navigator)) {
      setLocating(false);
      setLocationError("Your browser does not support location detection. Enter a location instead.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setOrigin(next);
        setLocating(false);
        runReverse({ data: next })
          .then((r) => setLocationLabel(r.label))
          .catch(() => setLocationLabel(null));
      },
      (err) => {
        setLocating(false);
        setLocationError(
          err.code === err.PERMISSION_DENIED
            ? "Location permission denied. Enter your area manually below."
            : "We couldn't get your location. Enter your area manually below.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  useEffect(() => {
    detect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyManual = async () => {
    if (manualPlace.trim().length < 2) return;
    setLocating(true);
    setLocationError(null);
    try {
      const res = await runGeocode({ data: { query: manualPlace.trim() } });
      if (!res) {
        setLocationError("We couldn't find that location. Try a different area or city.");
      } else {
        setOrigin({ lat: res.lat, lng: res.lng });
        setLocationLabel(res.label);
      }
    } catch {
      setLocationError("Location lookup failed. Please check your connection and try again.");
    } finally {
      setLocating(false);
    }
  };

  const parsed = useMemo(() => (submitted ? parseQuery(submitted) : null), [submitted]);

  const effective = useMemo(
    () => ({
      category: parsed?.category ?? category,
      keyword: parsed?.keyword ?? null,
      radius: parsed?.radius ?? radius,
      minRating: parsed?.minRating ?? minRating,
      openNow: parsed?.openNow || openNow,
      family: parsed?.familyFriendly || familyOnly,
      veg: parsed?.vegetarian || vegOnly,
      sort: parsed?.sort ?? sort,
    }),
    [parsed, category, radius, minRating, openNow, familyOnly, vegOnly, sort],
  );

  const { data, isFetching, error } = useQuery({
    queryKey: [
      "places",
      origin?.lat,
      origin?.lng,
      effective.radius,
      effective.category,
      effective.keyword,
      effective.openNow,
    ],
    enabled: !!origin,
    queryFn: () =>
      runSearch({
        data: {
          lat: origin!.lat,
          lng: origin!.lng,
          radius: effective.radius,
          category: effective.category,
          keyword: effective.keyword,
          openNow: effective.openNow,
        },
      }),
  });

  const priceLevels = PRICE_BUCKETS.find((b) => b.id === priceBucket)?.levels ?? [];

  const results: PlaceResult[] = useMemo(() => {
    let list = data?.places ?? [];
    list = list.filter((p) => p.distanceMeters <= effective.radius);
    if (effective.minRating) list = list.filter((p) => (p.rating ?? 0) >= effective.minRating);
    if (effective.openNow) list = list.filter((p) => p.openNow !== false);
    if (effective.family) list = list.filter((p) => p.familyFriendly === true);
    if (effective.veg) list = list.filter((p) => p.vegetarian === true);
    if (priceLevels.length) list = list.filter((p) => !p.priceLevel || priceLevels.includes(p.priceLevel));

    const sorted = [...list];
    switch (effective.sort) {
      case "rating":
        sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
        break;
      case "reviews":
        sorted.sort((a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0));
        break;
      case "price":
        sorted.sort(
          (a, b) => (PRICE_ORDER[a.priceLevel ?? ""] ?? 9) - (PRICE_ORDER[b.priceLevel ?? ""] ?? 9),
        );
        break;
      case "open":
        sorted.sort((a, b) => Number(b.openNow ?? 0) - Number(a.openNow ?? 0));
        break;
      case "best":
        sorted.sort(
          (a, b) =>
            (b.rating ?? 0) * Math.log10((b.reviewCount ?? 0) + 10) -
            (a.rating ?? 0) * Math.log10((a.reviewCount ?? 0) + 10),
        );
        break;
      default:
        sorted.sort((a, b) => a.distanceMeters - b.distanceMeters);
    }
    return sorted;
  }, [data, effective, priceLevels]);

  const recommendations = useMemo(() => {
    const all = data?.places ?? [];
    return [
      { title: "🔥 Best rated near you", items: [...all].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 3) },
      {
        title: "💰 Budget friendly",
        items: [...all]
          .filter((p) => p.priceLevel)
          .sort((a, b) => (PRICE_ORDER[a.priceLevel ?? ""] ?? 9) - (PRICE_ORDER[b.priceLevel ?? ""] ?? 9))
          .slice(0, 3),
      },
      { title: "📍 Closest places", items: [...all].sort((a, b) => a.distanceMeters - b.distanceMeters).slice(0, 3) },
      { title: "🕐 Open now", items: all.filter((p) => p.openNow).slice(0, 3) },
    ].filter((s) => s.items.length > 0);
  }, [data]);

  const chips = parsed ? describeParsed(parsed) : [];

  return (
    <div className="min-h-screen bg-background">
      <header className="hero-surface">
        <div className="mx-auto max-w-6xl px-4 py-10 text-white">
          <div className="flex items-center gap-2">
            <span className="grid size-10 place-items-center rounded-2xl sun-surface text-xl">📍</span>
            <span className="font-display text-2xl font-bold">LocalSpot</span>
          </div>
          <h1 className="mt-6 max-w-2xl text-3xl font-bold sm:text-4xl">
            Real places around you — ratings, price, distance and open-now, in one view.
          </h1>
          <p className="mt-2 max-w-xl text-sm text-white/80">
            Powered by live Google Places data. Nothing here is invented — when a business doesn't publish
            something, we say "Information unavailable".
          </p>

          <form
            className="mt-6 flex flex-col gap-2 sm:flex-row"
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted(query.trim());
            }}
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Try: family restaurant within 3 km, rating above 4.2, under ₹600"
                className="h-12 rounded-xl border-0 bg-card pl-9 text-foreground"
              />
            </div>
            <Button type="submit" size="lg" variant="secondary" className="h-12 rounded-xl">
              Search
            </Button>
            <Button
              type="button"
              size="lg"
              className="h-12 rounded-xl"
              onClick={detect}
              disabled={locating}
            >
              {locating ? <Loader2 className="size-4 animate-spin" /> : <LocateFixed className="size-4" />}
              Use my location
            </Button>
          </form>

          <div className="mt-3 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setQuery(s);
                  setSubmitted(s);
                }}
                className="rounded-full bg-white/12 px-3 py-1 text-xs text-white/90 transition hover:bg-white/20"
              >
                {s}
              </button>
            ))}
          </div>

          <p className="mt-4 flex items-center gap-2 text-sm text-white/90">
            <MapPin className="size-4" />
            {origin
              ? `Your location: ${locationLabel ?? `${origin.lat.toFixed(4)}, ${origin.lng.toFixed(4)}`}`
              : "Location not set yet"}
          </p>

          {(locationError || !origin) && (
            <div className="mt-3 flex flex-col gap-2 rounded-xl bg-white/10 p-3 sm:flex-row sm:items-center">
              <p className="flex-1 text-sm text-white/90">
                {locationError ?? "Allow location access, or enter your area manually."}
              </p>
              <div className="flex gap-2">
                <Input
                  value={manualPlace}
                  onChange={(e) => setManualPlace(e.target.value)}
                  placeholder="Enter area or city"
                  className="h-10 w-48 border-0 bg-card text-foreground"
                />
                <Button type="button" variant="secondary" onClick={applyManual} className="h-10">
                  Set
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-3">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setCategory(c.id);
                setSubmitted("");
                setQuery("");
              }}
              className={`whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm transition ${
                (parsed?.category ?? category) === c.id
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:bg-secondary"
              }`}
            >
              {c.emoji} {c.label}
            </button>
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowFilters((v) => !v)}>
            <SlidersHorizontal className="size-4" /> Filters
          </Button>
          <div className="flex rounded-lg border border-border p-0.5">
            <button
              onClick={() => setView("list")}
              className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm ${view === "list" ? "bg-secondary" : ""}`}
            >
              <List className="size-4" /> List
            </button>
            <button
              onClick={() => setView("map")}
              className={`inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm ${view === "map" ? "bg-secondary" : ""}`}
            >
              <MapIcon className="size-4" /> Map
            </button>
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm"
          >
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>
                Sort: {s.label}
              </option>
            ))}
          </select>
          {chips.map((c) => (
            <span key={c} className="rounded-full bg-accent/20 px-3 py-1 text-xs font-medium text-accent-foreground">
              {c}
            </span>
          ))}
          {submitted && (
            <button
              onClick={() => {
                setSubmitted("");
                setQuery("");
              }}
              className="text-xs text-muted-foreground underline"
            >
              clear smart search
            </button>
          )}
        </div>

        {showFilters && (
          <div className="mt-4 grid gap-4 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">Distance</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {DISTANCE_OPTIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setRadius(d)}
                    className={`rounded-full border px-2.5 py-1 text-xs ${radius === d ? "border-primary bg-primary/10" : "border-border"}`}
                  >
                    {d < 1000 ? `${d} m` : `${d / 1000} km`}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">Rating</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[0, 3, 3.5, 4, 4.5].map((r) => (
                  <button
                    key={r}
                    onClick={() => setMinRating(r)}
                    className={`rounded-full border px-2.5 py-1 text-xs ${minRating === r ? "border-primary bg-primary/10" : "border-border"}`}
                  >
                    {r === 0 ? "Any" : `⭐ ${r}+`}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">Price</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {PRICE_BUCKETS.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setPriceBucket(b.id)}
                    className={`rounded-full border px-2.5 py-1 text-xs ${priceBucket === b.id ? "border-primary bg-primary/10" : "border-border"}`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">Type</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[
                  { label: "Open now", on: openNow, toggle: () => setOpenNow((v) => !v) },
                  { label: "Family friendly", on: familyOnly, toggle: () => setFamilyOnly((v) => !v) },
                  { label: "Vegetarian", on: vegOnly, toggle: () => setVegOnly((v) => !v) },
                ].map((t) => (
                  <button
                    key={t.label}
                    onClick={t.toggle}
                    className={`rounded-full border px-2.5 py-1 text-xs ${t.on ? "border-primary bg-primary/10" : "border-border"}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        <h2 className="mt-8 text-2xl font-bold">Places near you</h2>
        <p className="text-sm text-muted-foreground">
          {isFetching
            ? "Searching real businesses around you…"
            : `${results.length} result${results.length === 1 ? "" : "s"} within ${
                effective.radius >= 1000 ? `${effective.radius / 1000} km` : `${effective.radius} m`
              }`}
        </p>

        {error && (
          <div className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            {(error as Error).message || "Something went wrong while loading places. Please try again."}
          </div>
        )}

        {isFetching && (
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-44 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        )}

        {!isFetching && origin && results.length === 0 && !error && (
          <div className="mt-6 rounded-2xl border border-dashed border-border p-10 text-center">
            <p className="text-lg font-semibold">No places found within {effective.radius / 1000} km</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Try increasing the distance, lowering the rating filter, or clearing the price filter.
            </p>
            <Button className="mt-4" onClick={() => setRadius(Math.min(10000, effective.radius * 2))}>
              Search a wider area
            </Button>
          </div>
        )}

        {!isFetching && results.length > 0 && (
          <div className="mt-4 grid gap-6 lg:grid-cols-[1.15fr_1fr]">
            <div className={view === "map" ? "hidden lg:block" : ""}>
              <div className="grid gap-4">
                {results.map((p) => (
                  <PlaceCard
                    key={p.id}
                    place={p}
                    origin={origin!}
                    onHover={setActiveId}
                    active={activeId === p.id}
                  />
                ))}
              </div>
            </div>
            <div className={`${view === "list" ? "hidden lg:block" : ""} lg:sticky lg:top-20 lg:h-[calc(100vh-6rem)]`}>
              <ClientOnly fallback={<div className="h-full min-h-[420px] rounded-2xl bg-muted" />}>
                <Suspense fallback={<div className="h-full min-h-[420px] animate-pulse rounded-2xl bg-muted" />}>
                  <PlacesMap origin={origin!} places={results} activeId={activeId} />
                </Suspense>
              </ClientOnly>
            </div>
          </div>
        )}

        {recommendations.length > 0 && !isFetching && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold">Recommended for you</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {recommendations.map((rec) => (
                <div key={rec.title} className="card-lift rounded-2xl border border-border bg-card p-4">
                  <p className="font-semibold">{rec.title}</p>
                  <ul className="mt-3 space-y-3">
                    {rec.items.map((p) => (
                      <li key={p.id} className="text-sm">
                        <p className="truncate font-medium">{p.name}</p>
                        <p className="text-muted-foreground">
                          ⭐ {p.rating ?? "—"} · {formatDistance(p.distanceMeters)}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        LocalSpot · Business data, ratings and reviews from Google Places. Travel times from Google Routes.
      </footer>
    </div>
  );
}
