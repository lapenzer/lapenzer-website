import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const key = process.env.GOOGLE_MAPS_SERVER_API_KEY;
  if (!key) return NextResponse.json({ error: "GOOGLE_MAPS_SERVER_API_KEY is not configured." }, { status: 503 });
  const body = await request.json(), origin = body.origin, destination = body.destination;
  if (!origin || !destination) return NextResponse.json({ error: "origin and destination coordinates are required." }, { status: 400 });
  const payload = { origin: { location: { latLng: { latitude: Number(origin.lat), longitude: Number(origin.lon) } } }, destination: { location: { latLng: { latitude: Number(destination.lat), longitude: Number(destination.lon) } } }, travelMode: body.travelMode === "WALK" ? "WALK" : "DRIVE", computeAlternativeRoutes: false, polylineQuality: "HIGH_QUALITY", routingPreference: body.travelMode === "WALK" ? undefined : "TRAFFIC_AWARE" };
  const response = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", { method: "POST", headers: { "content-type": "application/json", "X-Goog-Api-Key": key, "X-Goog-FieldMask": "routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline,routes.legs" }, body: JSON.stringify(payload), cache: "no-store" });
  const json = await response.json();
  if (!response.ok) return NextResponse.json({ error: json.error?.message ?? `Routes API ${response.status}` }, { status: response.status });
  return NextResponse.json({ ...json, timestamp: new Date().toISOString(), source: "Google Routes API ComputeRoutes" });
}
