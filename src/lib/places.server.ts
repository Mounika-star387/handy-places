const GATEWAY = "https://connector-gateway.lovable.dev/google_maps";

function creds() {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const mapsKey = process.env["GOOGLE_MAPS_API_KEY"];
  if (!lovableKey || !mapsKey) throw new Error("Google Maps connection is not configured.");
  return { lovableKey, mapsKey };
}

export async function gateway(
  path: string,
  init: { method?: string; body?: unknown; fieldMask?: string } = {},
) {
  const { lovableKey, mapsKey } = creds();
  const headers: Record<string, string> = {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": mapsKey,
    "Content-Type": "application/json",
  };
  if (init.fieldMask) headers["X-Goog-FieldMask"] = init.fieldMask;

  const res = await fetch(`${GATEWAY}${path}`, {
    method: init.method ?? "GET",
    headers,
    body: init.body ? JSON.stringify(init.body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    if (res.status === 403) {
      const reason = (() => {
        try {
          return JSON.parse(text)?.error?.details?.find((d: { reason?: string }) => d.reason)?.reason;
        } catch {
          return undefined;
        }
      })();
      if (reason === "API_KEY_HTTP_REFERRER_BLOCKED")
        throw new Error(
          'Google Maps server key is referrer-restricted. Set its application restrictions to "None" or "IP addresses".',
        );
      if (reason === "API_KEY_SERVICE_BLOCKED")
        throw new Error("Google Maps server key does not allow this API. Add it to the key's allowed-APIs list.");
    }
    console.error(`Google Maps gateway failed [${res.status}]: ${text}`);
    throw new Error(`Places request failed [${res.status}]: ${text.slice(0, 300)}`);
  }
  return res.json();
}

export function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export async function routeMatrix(
  origin: { lat: number; lng: number },
  destinations: { lat: number; lng: number }[],
  mode: "DRIVE" | "WALK",
): Promise<(number | null)[]> {
  if (destinations.length === 0) return [];
  try {
    const data = (await gateway("/routes/distanceMatrix/v2:computeRouteMatrix", {
      method: "POST",
      fieldMask: "originIndex,destinationIndex,duration,condition",
      body: {
        origins: [{ waypoint: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } } }],
        destinations: destinations.map((d) => ({
          waypoint: { location: { latLng: { latitude: d.lat, longitude: d.lng } } },
        })),
        travelMode: mode,
      },
    })) as Array<{ destinationIndex: number; duration?: string; condition?: string }>;

    const out: (number | null)[] = destinations.map(() => null);
    for (const row of data ?? []) {
      if (row.condition && row.condition !== "ROUTE_EXISTS") continue;
      if (typeof row.duration === "string")
        out[row.destinationIndex] = parseInt(row.duration.replace("s", ""), 10);
    }
    return out;
  } catch (err) {
    console.error("routeMatrix failed", err);
    return destinations.map(() => null);
  }
}
