import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Star,
  MapPin,
  Phone,
  Globe,
  Navigation,
  Share2,
  Car,
  Footprints,
  Clock,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { placeDetails, photoUrl } from "@/lib/places.functions";
import { formatDistance, formatDuration, priceLabel, categoryOf } from "@/lib/places-types";

const searchSchema = z.object({
  lat: fallback(z.number(), 0).default(0),
  lng: fallback(z.number(), 0).default(0),
});

export const Route = createFileRoute("/place/$placeId")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Business details — LocalSpot" },
      {
        name: "description",
        content:
          "Ratings, price range, opening hours, distance, travel time, contact details and directions for a nearby local business.",
      },
      { property: "og:title", content: "Business details — LocalSpot" },
      {
        property: "og:description",
        content: "Real place details: ratings, price, hours, distance and directions.",
      },
    ],
  }),
  component: PlaceDetailsPage,
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-2xl p-10 text-center" role="alert">
      <h1 className="text-xl font-semibold">We couldn't load this place</h1>
      <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
      <Button asChild className="mt-6">
        <Link to="/">Back to LocalSpot</Link>
      </Button>
    </div>
  ),
});

function Info({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium">{value ?? "Information unavailable"}</p>
    </div>
  );
}

function PlaceDetailsPage() {
  const { placeId } = Route.useParams();
  const { lat, lng } = Route.useSearch();
  const fetchDetails = useServerFn(placeDetails);
  const fetchPhoto = useServerFn(photoUrl);
  const [photo, setPhoto] = useState<string | null>(null);
  const [shared, setShared] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ["place", placeId, lat, lng],
    queryFn: () => fetchDetails({ data: { id: placeId, lat, lng } }),
  });

  const place = data?.place;

  useEffect(() => {
    if (!place?.photoName) return;
    let alive = true;
    fetchPhoto({ data: { name: place.photoName } })
      .then((url) => alive && setPhoto(url))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [place?.photoName, fetchPhoto]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl animate-pulse space-y-4 p-6">
        <div className="h-64 rounded-2xl bg-muted" />
        <div className="h-6 w-1/2 rounded bg-muted" />
        <div className="h-24 rounded bg-muted" />
      </div>
    );
  }

  if (error || !place) {
    return (
      <div className="mx-auto max-w-2xl p-10 text-center">
        <h1 className="text-xl font-semibold">Information unavailable</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {error instanceof Error ? error.message : "This business could not be found."}
        </p>
        <Button asChild className="mt-6">
          <Link to="/">Back to LocalSpot</Link>
        </Button>
      </div>
    );
  }

  const directions = `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lng}&destination_place_id=${place.id}`;
  const mapEmbed = `https://www.google.com/maps/embed/v1/place?key=${import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY"]}&q=place_id:${place.id}`;

  return (
    <main className="mx-auto max-w-5xl px-4 pb-16 pt-6">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to results
      </Link>

      <div
        className="mt-4 flex h-64 items-end overflow-hidden rounded-3xl hero-surface bg-cover bg-center"
        style={photo ? { backgroundImage: `url(${photo})` } : undefined}
      >
        <div className="w-full bg-gradient-to-t from-black/70 to-transparent p-6">
          <h1 className="text-3xl font-bold text-white">{place.name}</h1>
          <p className="mt-1 text-sm capitalize text-white/85">{categoryOf(place)}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {place.phone && (
          <Button asChild>
            <a href={`tel:${place.phone}`}>
              <Phone className="size-4" /> Call
            </a>
          </Button>
        )}
        <Button asChild variant="secondary">
          <a href={directions} target="_blank" rel="noreferrer">
            <Navigation className="size-4" /> Directions
          </a>
        </Button>
        {place.website && (
          <Button asChild variant="outline">
            <a href={place.website} target="_blank" rel="noreferrer">
              <Globe className="size-4" /> Website
            </a>
          </Button>
        )}
        <Button
          variant="outline"
          onClick={() => {
            navigator.clipboard?.writeText(window.location.href);
            setShared(true);
            setTimeout(() => setShared(false), 2000);
          }}
        >
          <Share2 className="size-4" /> {shared ? "Link copied" : "Share"}
        </Button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Info
          label="Rating"
          value={
            place.rating
              ? `⭐ ${place.rating} (${place.reviewCount?.toLocaleString("en-IN") ?? 0} reviews)`
              : null
          }
        />
        <Info label="Price" value={priceLabel(place) === "Information unavailable" ? null : priceLabel(place)} />
        <Info label="Distance" value={formatDistance(place.distanceMeters)} />
        <Info
          label="Travel time"
          value={
            [
              place.driveSeconds ? `🚗 ${formatDuration(place.driveSeconds)}` : null,
              place.walkSeconds ? `🚶 ${formatDuration(place.walkSeconds)}` : null,
            ]
              .filter(Boolean)
              .join(" · ") || null
          }
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <section className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-lg font-semibold">About</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {place.summary ?? "Information unavailable"}
            </p>
            <div className="mt-4 space-y-2 text-sm">
              <p className="flex items-start gap-2">
                <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                {place.address ?? "Information unavailable"}
              </p>
              <p className="flex items-center gap-2">
                <Phone className="size-4 text-muted-foreground" />
                {place.phone ?? "Information unavailable"}
              </p>
              <p className="flex items-center gap-2">
                <Wallet className="size-4 text-muted-foreground" />
                {priceLabel(place)}
              </p>
              <p className="flex items-center gap-2">
                <Car className="size-4 text-muted-foreground" />
                {formatDuration(place.driveSeconds) ?? "Information unavailable"} driving
              </p>
              <p className="flex items-center gap-2">
                <Footprints className="size-4 text-muted-foreground" />
                {formatDuration(place.walkSeconds) ?? "Information unavailable"} walking
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              {place.familyFriendly != null && (
                <span className="rounded-full bg-secondary px-2.5 py-1 font-medium">
                  👨‍👩‍👧 {place.familyFriendly ? "Family friendly" : "Not marked family friendly"}
                </span>
              )}
              {place.vegetarian != null && (
                <span className="rounded-full bg-secondary px-2.5 py-1 font-medium">
                  🥗 {place.vegetarian ? "Serves vegetarian food" : "Vegetarian options not listed"}
                </span>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Clock className="size-4" /> Opening hours
            </h2>
            {place.openNow !== null && (
              <p className={`mt-1 text-sm font-medium ${place.openNow ? "text-success" : "text-destructive"}`}>
                {place.openNow ? "🟢 Open now" : "🔴 Closed"}
              </p>
            )}
            <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
              {data.weekdayDescriptions.length ? (
                data.weekdayDescriptions.map((d) => <li key={d}>{d}</li>)
              ) : (
                <li>Information unavailable</li>
              )}
            </ul>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-lg font-semibold">Quality signals</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Derived from public Google ratings and reviews — not an official quality certification.
            </p>
            <div className="mt-3 space-y-2 text-sm">
              <p>
                Overall rating:{" "}
                <span className="font-medium">
                  {place.rating ? `${place.rating}/5` : "Information unavailable"}
                </span>
              </p>
              <p>
                Review volume:{" "}
                <span className="font-medium">
                  {place.reviewCount ? place.reviewCount.toLocaleString("en-IN") : "Information unavailable"}
                </span>
              </p>
              <p className="text-muted-foreground">
                Separate food quality, service, cleanliness and ambience scores are not published for this
                business, so they are shown as information unavailable rather than estimated.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <iframe
            title={`Map of ${place.name}`}
            src={mapEmbed}
            className="h-72 w-full rounded-2xl border border-border"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="text-lg font-semibold">Reviews</h2>
            {data.reviews.length === 0 && (
              <p className="mt-2 text-sm text-muted-foreground">Information unavailable</p>
            )}
            <ul className="mt-3 space-y-4">
              {data.reviews.map((r) => (
                <li key={r.id} className="border-b border-border pb-3 last:border-0">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <Star className="size-4 fill-accent text-accent" />
                    {r.rating ?? "—"} · {r.author}
                    <span className="font-normal text-muted-foreground">{r.when}</span>
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">{r.text ?? "No written review"}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
