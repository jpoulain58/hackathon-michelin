export type LatLng = [number, number];

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
