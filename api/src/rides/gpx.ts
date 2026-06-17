import type { LatLng } from "./polyline";

export type ParsedGpx = {
  pts: LatLng[];
  km: number;
  dplus: number;
  durationSeconds: number;
};

const TRKPT_REGEX = /<trkpt\b[^>]*\blat="(-?[\d.]+)"[^>]*\blon="(-?[\d.]+)"[^>]*>([\s\S]*?)<\/trkpt>/g;
const ELE_REGEX = /<ele>(-?[\d.]+)<\/ele>/;
const TIME_REGEX = /<time>([^<]+)<\/time>/;

/**
 * Parseur GPX minimal (regex sur <trkpt>) : suffisant pour les exports Strava/
 * Garmin/Komoot standards, sans tirer une dependance XML pour le hackathon.
 */
export function parseGpx(xml: string): ParsedGpx {
  const pts: LatLng[] = [];
  const elevations: number[] = [];
  const times: (number | null)[] = [];

  for (const match of xml.matchAll(TRKPT_REGEX)) {
    const lat = Number.parseFloat(match[1]);
    const lon = Number.parseFloat(match[2]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    pts.push([lat, lon]);

    const body = match[3];
    const ele = ELE_REGEX.exec(body)?.[1];
    elevations.push(ele ? Number.parseFloat(ele) : NaN);

    const time = TIME_REGEX.exec(body)?.[1];
    const parsed = time ? Date.parse(time) : NaN;
    times.push(Number.isFinite(parsed) ? parsed : null);
  }

  if (pts.length === 0) {
    throw new Error("Fichier GPX sans point de trace (<trkpt>) exploitable.");
  }

  let km = 0;
  for (let i = 1; i < pts.length; i++) {
    km += haversineKm(pts[i - 1], pts[i]);
  }

  let dplus = 0;
  for (let i = 1; i < elevations.length; i++) {
    const delta = elevations[i] - elevations[i - 1];
    if (Number.isFinite(delta) && delta > 0) dplus += delta;
  }

  const validTimes = times.filter((t): t is number => t !== null);
  const durationSeconds =
    validTimes.length >= 2 ? Math.round((validTimes[validTimes.length - 1] - validTimes[0]) / 1000) : 0;

  return { pts, km: roundOne(km), dplus: Math.round(dplus), durationSeconds };
}

function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * sinLng * sinLng;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

function roundOne(value: number): number {
  return Math.round(value * 10) / 10;
}
