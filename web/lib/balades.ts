export type LatLng = [number, number];

export interface Ride {
  name: string;
  km: number;
  dplus: number;
  terrain: string;
  tyre: string;
  pts: LatLng[];
}

/** Decodeur de polyline encodee Strava/Google (algorithme officiel). */
export function decodePolyline(str: string, precision = 5): LatLng[] {
  let index = 0;
  let lat = 0;
  let lng = 0;
  const coords: LatLng[] = [];
  const factor = Math.pow(10, precision);
  while (index < str.length) {
    let shift = 0;
    let result = 0;
    let byte: number;
    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;
    shift = 0;
    result = 0;
    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;
    coords.push([lat / factor, lng / factor]);
  }
  return coords;
}

/** Genere une boucle de demo (a remplacer par decodePolyline(activity.map.summary_polyline)). */
export function loop(cLat: number, cLng: number, r: number, seed: number, n: number): LatLng[] {
  const pts: LatLng[] = [];
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * 2 * Math.PI;
    const wob = 1 + 0.25 * Math.sin(a * 3 + seed) + 0.12 * Math.cos(a * 5 + seed);
    pts.push([cLat + r * wob * Math.sin(a) * 0.9, cLng + r * wob * Math.cos(a)]);
  }
  return pts;
}

export const CENTER: LatLng = [45.7772, 3.087]; // Clermont-Ferrand (siege Michelin)

export const RIDES: Ride[] = [
  { name: "Boucle des Cretes", km: 42, dplus: 850, terrain: "Route", tyre: "MICHELIN Power Cup", pts: loop(45.79, 3.1, 0.05, 1, 80) },
  { name: "Gravel du Cezallier", km: 58, dplus: 600, terrain: "Gravel", tyre: "MICHELIN Power Gravel", pts: loop(45.74, 3.02, 0.07, 3, 90) },
  { name: "Sortie club du dimanche", km: 90, dplus: 1200, terrain: "Route", tyre: "MICHELIN Power Road TLR", pts: loop(45.8, 3.13, 0.09, 5, 110) },
  { name: "Ascension du Puy de Dome", km: 35, dplus: 1600, terrain: "Route", tyre: "MICHELIN Power Cup", pts: loop(45.77, 2.96, 0.04, 7, 70) },
  { name: "Single foret VTT", km: 28, dplus: 700, terrain: "VTT", tyre: "MICHELIN Force AM", pts: loop(45.75, 3.12, 0.045, 9, 75) },
];
