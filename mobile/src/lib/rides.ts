import type { ApiRide } from "./api";
import type { Ride, Tyre } from "../types";

function mapImageUrl(lat: number, lon: number, zoom = 12, w = 640, h = 360): string {
  return `https://maps.wikimedia.org/img/osm-intl,${zoom},${lat},${lon},${w}x${h}@2x.png`;
}

function centroid(pts: [number, number][]): [number, number] {
  if (pts.length === 0) return [45.7772, 3.087];
  const lat = pts.reduce((sum, p) => sum + p[0], 0) / pts.length;
  const lng = pts.reduce((sum, p) => sum + p[1], 0) / pts.length;
  return [lat, lng];
}

export function formatRideDuration(seconds: number): string {
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) return `${minutes} min`;
  return `${hours}h${String(minutes).padStart(2, "0")}`;
}

/** Carte statique centree sur la balade : pas de trace dessine (pas de lib carto interactive sur mobile). */
export function apiRideToMobileRide(api: ApiRide): Ride {
  const [lat, lng] = centroid(api.pts);
  const recommendedTyres: Tyre[] = api.tyreDetail
    ? [
        {
          id: `${api.id}-tyre`,
          name: `${api.tyreDetail.name} ${api.tyreDetail.designation}`.trim(),
          weight: `${api.tyreDetail.weightG} g`,
          dimensions: `${api.tyreDetail.dimensions} dimensions disponibles`,
          matchScore: 100,
          categories: [],
        },
      ]
    : [];

  return {
    id: api.id,
    title: api.name,
    distanceKm: `${api.km} km`,
    elevation: `${api.dplus} m`,
    duration: formatRideDuration(api.durationSeconds),
    tags: api.tags,
    mapUrl: mapImageUrl(lat, lng),
    summary: api.description,
    startInstructions: api.instructions,
    proTip: api.proTip ?? { author: "", text: "" },
    recommendedTyres,
  };
}
