import { useState } from "react";
import { Image, StyleSheet, Text, View, type LayoutChangeEvent, type ViewStyle } from "react-native";
import { colors, font, radius } from "../theme";

type LatLng = [number, number];

const TILE_SIZE = 256;
const MIN_ZOOM = 9;
const MAX_ZOOM = 15;

type Layout = {
  width: number;
  height: number;
};

type WorldPoint = {
  x: number;
  y: number;
};

export function RideMapPreview({
  points,
  style,
}: {
  points?: LatLng[];
  style?: ViewStyle;
}) {
  const [layout, setLayout] = useState<Layout | null>(null);
  const route = points?.length ? points : [[45.7772, 3.087] as LatLng];
  const model = layout ? buildMapModel(route, layout) : null;

  function onLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) setLayout({ width, height });
  }

  return (
    <View onLayout={onLayout} style={[styles.shell, style]}>
      {model?.tiles.map((tile) => (
        <Image
          key={`${tile.z}-${tile.x}-${tile.y}`}
          source={{ uri: tile.url }}
          style={[
            styles.tile,
            {
              left: tile.left,
              top: tile.top,
              width: TILE_SIZE,
              height: TILE_SIZE,
            },
          ]}
        />
      ))}

      {model?.segments.map((segment, index) => (
        <View
          key={`${index}-${Math.round(segment.x)}-${Math.round(segment.y)}`}
          style={[
            styles.routeSegment,
            {
              left: segment.x - segment.length / 2,
              top: segment.y - 2,
              width: segment.length,
              transform: [{ rotateZ: `${segment.angle}deg` }],
            },
          ]}
        />
      ))}

      {model?.start && <View style={[styles.marker, styles.markerStart, markerPosition(model.start)]} />}
      {model?.end && <View style={[styles.marker, styles.markerEnd, markerPosition(model.end)]} />}

      <Text style={styles.attribution}>© OpenStreetMap © CARTO</Text>
    </View>
  );
}

function buildMapModel(points: LatLng[], layout: Layout) {
  const zoom = chooseZoom(points, layout);
  const projected = points.map((point) => project(point, zoom));
  const bounds = boundsFor(projected);
  const center = {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2,
  };
  const topLeft = {
    x: center.x - layout.width / 2,
    y: center.y - layout.height / 2,
  };

  const tiles = buildTiles(zoom, topLeft, layout);
  const screenPoints = projected.map((point) => ({
    x: point.x - topLeft.x,
    y: point.y - topLeft.y,
  }));

  return {
    tiles,
    segments: buildSegments(screenPoints),
    start: screenPoints[0],
    end: screenPoints.length > 1 ? screenPoints[screenPoints.length - 1] : null,
  };
}

function chooseZoom(points: LatLng[], layout: Layout): number {
  if (points.length < 2) return 12;
  const padding = 44;
  for (let zoom = MAX_ZOOM; zoom >= MIN_ZOOM; zoom -= 1) {
    const projected = points.map((point) => project(point, zoom));
    const bounds = boundsFor(projected);
    if (bounds.maxX - bounds.minX <= layout.width - padding && bounds.maxY - bounds.minY <= layout.height - padding) {
      return zoom;
    }
  }
  return MIN_ZOOM;
}

function buildTiles(zoom: number, topLeft: WorldPoint, layout: Layout) {
  const maxTile = 2 ** zoom;
  const startX = Math.floor(topLeft.x / TILE_SIZE);
  const endX = Math.floor((topLeft.x + layout.width) / TILE_SIZE);
  const startY = Math.floor(topLeft.y / TILE_SIZE);
  const endY = Math.floor((topLeft.y + layout.height) / TILE_SIZE);
  const tiles: Array<{ z: number; x: number; y: number; left: number; top: number; url: string }> = [];

  for (let tileX = startX; tileX <= endX; tileX += 1) {
    for (let tileY = startY; tileY <= endY; tileY += 1) {
      if (tileY < 0 || tileY >= maxTile) continue;
      const wrappedX = ((tileX % maxTile) + maxTile) % maxTile;
      const subdomain = ["a", "b", "c"][Math.abs(tileX + tileY) % 3];
      tiles.push({
        z: zoom,
        x: wrappedX,
        y: tileY,
        left: tileX * TILE_SIZE - topLeft.x,
        top: tileY * TILE_SIZE - topLeft.y,
        url: `https://${subdomain}.basemaps.cartocdn.com/light_all/${zoom}/${wrappedX}/${tileY}.png`,
      });
    }
  }

  return tiles;
}

function buildSegments(points: WorldPoint[]) {
  const stride = Math.max(1, Math.ceil(points.length / 60));
  const sampled = points.filter((_, index) => index % stride === 0);
  const last = points[points.length - 1];
  if (last && sampled[sampled.length - 1] !== last) sampled.push(last);

  return sampled.slice(0, -1).map((point, index) => {
    const next = sampled[index + 1];
    const dx = next.x - point.x;
    const dy = next.y - point.y;
    return {
      x: (point.x + next.x) / 2,
      y: (point.y + next.y) / 2,
      length: Math.max(1, Math.sqrt(dx * dx + dy * dy)),
      angle: (Math.atan2(dy, dx) * 180) / Math.PI,
    };
  });
}

function project([lat, lon]: LatLng, zoom: number): WorldPoint {
  const sinLat = Math.sin((Math.max(-85.0511, Math.min(85.0511, lat)) * Math.PI) / 180);
  const scale = TILE_SIZE * 2 ** zoom;
  return {
    x: ((lon + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * scale,
  };
}

function boundsFor(points: WorldPoint[]) {
  return points.reduce(
    (bounds, point) => ({
      minX: Math.min(bounds.minX, point.x),
      maxX: Math.max(bounds.maxX, point.x),
      minY: Math.min(bounds.minY, point.y),
      maxY: Math.max(bounds.maxY, point.y),
    }),
    { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity },
  );
}

function markerPosition(point: WorldPoint): ViewStyle {
  return {
    left: point.x - 6,
    top: point.y - 6,
  };
}

const styles = StyleSheet.create({
  shell: {
    backgroundColor: "#DCE6D8",
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  tile: {
    position: "absolute",
  },
  routeSegment: {
    position: "absolute",
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.yellow,
    shadowColor: colors.navy,
    shadowOpacity: 0.22,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  marker: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.white,
  },
  markerStart: {
    backgroundColor: colors.navy,
  },
  markerEnd: {
    backgroundColor: colors.yellow,
  },
  attribution: {
    position: "absolute",
    right: 6,
    bottom: 5,
    borderRadius: 6,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.78)",
    paddingHorizontal: 5,
    paddingVertical: 2,
    color: colors.textMuted,
    fontSize: font.tiny,
    fontWeight: "600",
  },
});
