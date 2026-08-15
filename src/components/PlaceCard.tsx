import { Link } from "@tanstack/react-router";
import { Star, MapPin, Car, Footprints, Clock, Wallet, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  formatDistance,
  formatDuration,
  priceLabel,
  categoryOf,
  type PlaceResult,
} from "@/lib/places-types";

function directionsUrl(p: PlaceResult) {
  return `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}&destination_place_id=${p.id}`;
}

export function PlaceCard({
  place,
  origin,
  onHover,
  active,
}: {
  place: PlaceResult;
  origin: { lat: number; lng: number };
  onHover?: (id: string | null) => void;
  active?: boolean;
}) {
  const drive = formatDuration(place.driveSeconds);
  const walk = formatDuration(place.walkSeconds);

  return (
    <article
      onMouseEnter={() => onHover?.(place.id)}
      onMouseLeave={() => onHover?.(null)}
      className={`card-lift hover:card-lift-hover rounded-2xl border bg-card p-5 ${
        active ? "border-primary" : "border-border"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold">{place.name}</h3>
          <p className="mt-0.5 truncate text-sm capitalize text-muted-foreground">
            {categoryOf(place)}
            {place.summary ? ` • ${place.summary}` : ""}
          </p>
        </div>
        {place.openNow === null ? null : (
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
              place.openNow
                ? "bg-success/12 text-success"
                : "bg-destructive/10 text-destructive"
            }`}
          >
            {place.openNow ? "Open now" : "Closed"}
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
        <span className="inline-flex items-center gap-1 font-medium">
          <Star className="size-4 fill-accent text-accent" />
          {place.rating ?? "—"}
          <span className="font-normal text-muted-foreground">
            ({place.reviewCount?.toLocaleString("en-IN") ?? "no"} reviews)
          </span>
        </span>
        <span className="inline-flex items-center gap-1 text-muted-foreground">
          <MapPin className="size-4" />
          {formatDistance(place.distanceMeters)}
        </span>
        {drive && (
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Car className="size-4" />
            {drive}
          </span>
        )}
        {walk && (
          <span className="inline-flex items-center gap-1 text-muted-foreground">
            <Footprints className="size-4" />
            {walk}
          </span>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Wallet className="size-4" />
          {priceLabel(place)}
        </span>
        {place.openingText && (
          <span className="inline-flex items-center gap-1">
            <Clock className="size-4" />
            {place.openingText}
          </span>
        )}
      </div>

      {place.address && <p className="mt-2 text-sm text-muted-foreground">{place.address}</p>}

      <div className="mt-3 flex flex-wrap gap-2">
        {place.familyFriendly && (
          <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
            👨‍👩‍👧 Family friendly
          </span>
        )}
        {place.vegetarian && (
          <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
            🥗 Vegetarian options
          </span>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <Button asChild size="sm">
          <Link to="/place/$placeId" params={{ placeId: place.id }} search={{ lat: origin.lat, lng: origin.lng }}>
            View details
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <a href={directionsUrl(place)} target="_blank" rel="noreferrer">
            <Navigation className="size-4" /> Directions
          </a>
        </Button>
      </div>
    </article>
  );
}
