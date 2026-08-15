import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { searchPlacesImpl, placeDetailsImpl, reverseGeocodeImpl, photoUrlImpl } from "./places-api.server";

const searchSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  radius: z.number().min(100).max(50000),
  category: z.string().nullable().optional(),
  keyword: z.string().max(120).nullable().optional(),
  openNow: z.boolean().optional(),
});

export const searchPlaces = createServerFn({ method: "POST" })
  .inputValidator((data) => searchSchema.parse(data))
  .handler(async ({ data }) => searchPlacesImpl(data));

export const placeDetails = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z.object({ id: z.string().min(3).max(300), lat: z.number(), lng: z.number() }).parse(data),
  )
  .handler(async ({ data }) => placeDetailsImpl(data));

export const reverseGeocode = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ lat: z.number(), lng: z.number() }).parse(data))
  .handler(async ({ data }) => reverseGeocodeImpl(data));

export const geocodeText = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ query: z.string().min(2).max(120) }).parse(data))
  .handler(async ({ data }) => {
    const { geocodeTextImpl } = await import("./places-api.server");
    return geocodeTextImpl(data.query);
  });

export const photoUrl = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ name: z.string().min(5).max(600) }).parse(data))
  .handler(async ({ data }) => photoUrlImpl(data.name));
