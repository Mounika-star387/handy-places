import { useEffect, useRef } from "react";
import { formatDistance, priceLabel, type PlaceResult } from "@/lib/places-types";

declare global {
  interface Window {
    google?: any;
    __localspotMapsReady?: Promise<void>;
  }
}

function loadMaps(): Promise<void> {
  if (window.__localspotMapsReady) return window.__localspotMapsReady;
  const key = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_BROWSER_KEY"];
  const channel = import.meta.env["VITE_LOVABLE_CONNECTOR_GOOGLE_MAPS_TRACKING_ID"] ?? "";
  window.__localspotMapsReady = new Promise<void>((resolve, reject) => {
    if (window.google?.maps) return resolve();
    (window as any).__localspotInitMap = () => resolve();
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&loading=async&callback=__localspotInitMap&channel=${channel}`;
    script.async = true;
    script.onerror = () => reject(new Error("Failed to load the map"));
    document.head.appendChild(script);
  });
  return window.__localspotMapsReady;
}

export default function PlacesMap({
  origin,
  places,
  activeId,
}: {
  origin: { lat: number; lng: number };
  places: PlaceResult[];
  activeId?: string | null;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    loadMaps()
      .then(() => {
        if (cancelled || !ref.current || !window.google) return;
        mapRef.current = new window.google.maps.Map(ref.current, {
          center: origin,
          zoom: 14,
          disableDefaultUI: false,
          streetViewControl: false,
          mapTypeControl: false,
        });
        infoRef.current = new window.google.maps.InfoWindow();
      })
      .catch((e) => console.error(e));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.google) return;
    map.setCenter(origin);
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    new window.google.maps.Marker({
      position: origin,
      map,
      title: "Your location",
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: "#0f766e",
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 3,
      },
    });

    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend(origin);

    places.forEach((p) => {
      const marker = new window.google.maps.Marker({
        position: { lat: p.lat, lng: p.lng },
        map,
        title: p.name,
      });
      bounds.extend({ lat: p.lat, lng: p.lng });
      marker.addListener("click", () => {
        infoRef.current?.setContent(
          `<div style="font-family:system-ui;max-width:230px">
            <strong>${p.name.replace(/</g, "&lt;")}</strong><br/>
            ⭐ ${p.rating ?? "—"} (${p.reviewCount ?? 0}) · ${formatDistance(p.distanceMeters)}<br/>
            💰 ${priceLabel(p)}<br/>
            ${p.openNow === null ? "" : p.openNow ? "🟢 Open now" : "🔴 Closed"}<br/>
            <a target="_blank" rel="noreferrer" href="https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}">Directions</a>
          </div>`,
        );
        infoRef.current?.open({ map, anchor: marker });
      });
      markersRef.current.push(marker);
    });

    if (places.length) map.fitBounds(bounds, 48);
  }, [places, origin.lat, origin.lng]);

  useEffect(() => {
    if (!activeId || !window.google) return undefined;
    const idx = places.findIndex((p) => p.id === activeId);
    const marker = markersRef.current[idx];
    if (marker) {
      marker.setAnimation(window.google.maps.Animation.BOUNCE);
      const t = setTimeout(() => marker.setAnimation(null), 900);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [activeId, places]);

  return <div ref={ref} className="h-full min-h-[420px] w-full rounded-2xl bg-muted" />;
}
