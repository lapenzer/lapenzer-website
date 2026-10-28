/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const key = process.env.GOOGLE_MAPS_SERVER_API_KEY;
  if (!key) return NextResponse.json({ error: "GOOGLE_MAPS_SERVER_API_KEY is not configured for the production Routes API adapter." }, { status: 503 });
  const body = await request.json();
  const nodes = Array.isArray(body.nodes) ? body.nodes.slice(0, 20) : [];
  if (nodes.length < 2) return NextResponse.json({ error: "At least two nodes are required." }, { status: 400 });
  const origins = nodes.map((n: any) => ({ waypoint: { location: { latLng: { latitude: Number(n.lat), longitude: Number(n.lon) } } } }));
  const destinations = origins;
  const payload = { origins, destinations, travelMode: body.travelMode === "WALK" ? "WALK" : "DRIVE", routingPreference: body.travelMode === "WALK" ? undefined : "TRAFFIC_AWARE", departureTime: new Date(Date.now() + 60_000).toISOString() };
  const response = await fetch("https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": "originIndex,destinationIndex,status,condition,distanceMeters,duration,staticDuration,travelAdvisory",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const text = await response.text();
  if (!response.ok) return NextResponse.json({ error: `Google Routes API ${response.status}: ${text.slice(0, 700)}` }, { status: response.status });
  let rows: any[] = [];
  const trimmed = text.trim();
  try {
    const parsed = JSON.parse(trimmed);
    rows = Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    rows = trimmed.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
  }
  const matrix = rows.filter((r: any) => r.status?.code == null || r.status.code === 0).map((r: any) => ({ originIndex: Number(r.originIndex), destinationIndex: Number(r.destinationIndex), distanceMeters: Number(r.distanceMeters ?? 0), durationSeconds: Number(String(r.duration ?? "0s").replace("s", "")), condition: String(r.condition ?? "ROUTE_EXISTS") }));
  return NextResponse.json({ matrix, timestamp: new Date().toISOString(), source: "Google Routes API ComputeRouteMatrix", nodeCount: nodes.length });
}
