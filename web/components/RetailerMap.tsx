"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from "react";
import { loadLeaflet } from "@/lib/leaflet";
import { normalizeRetailerUrl, type RetailerStore } from "@/lib/retailers";

export interface MapStore extends RetailerStore {
  distanceKm?: number;
  inStock?: boolean;
}

const COLOR_IN = "#1FA463";
const COLOR_OUT = "#C0341D";
const COLOR_NEUTRAL = "#27509B";

export function RetailerMap({
  stores,
  user,
  height = 380,
  className,
}: {
  stores: MapStore[];
  user?: { lat: number; lng: number } | null;
  height?: number;
  className?: string;
}) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    loadLeaflet()
      .then((L) => {
        if (cancelled || !elRef.current) return;
        if (!mapRef.current) {
          mapRef.current = L.map(elRef.current, {
            zoomControl: true,
            scrollWheelZoom: false,
          }).setView([48.8566, 2.3522], 5);
          L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 18,
            attribution: "© OpenStreetMap",
          }).addTo(mapRef.current);
        }
        const map = mapRef.current;
        if (layerRef.current) map.removeLayer(layerRef.current);
        const layer = L.layerGroup().addTo(map);
        layerRef.current = layer;

        const bounds: Array<[number, number]> = [];

        for (const s of stores) {
          const color =
            s.inStock === undefined ? COLOR_NEUTRAL : s.inStock ? COLOR_IN : COLOR_OUT;
          const marker = L.circleMarker([s.lat, s.lng], {
            radius: 8,
            color,
            fillColor: color,
            fillOpacity: 0.9,
            weight: 2,
          }).addTo(layer);
          const dist =
            s.distanceKm !== undefined ? ` · ${Math.round(s.distanceKm)} km` : "";
          const stockLine =
            s.inStock === undefined
              ? ""
              : s.inStock
                ? `<br/><b style="color:${COLOR_IN}">En stock</b>`
                : `<br/><b style="color:${COLOR_OUT}">Rupture</b>`;
          marker.bindPopup(
            `<b>${s.name}</b><br/>${s.city ?? ""}${dist}${stockLine}` +
              `<br/><a href="${normalizeRetailerUrl(s.website)}" target="_blank" rel="noopener noreferrer">Voir le site</a>`,
          );
          bounds.push([s.lat, s.lng]);
        }

        if (user) {
          const um = L.circleMarker([user.lat, user.lng], {
            radius: 9,
            color: "#FCE500",
            fillColor: COLOR_NEUTRAL,
            fillOpacity: 1,
            weight: 3,
          }).addTo(layer);
          um.bindPopup("Vous êtes ici");
          bounds.push([user.lat, user.lng]);
        }

        if (bounds.length === 1) map.setView(bounds[0], 11);
        else if (bounds.length > 1) map.fitBounds(bounds, { padding: [40, 40] });

        setTimeout(() => map.invalidateSize(), 120);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [stores, user]);

  useEffect(
    () => () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        layerRef.current = null;
      }
    },
    [],
  );

  return (
    <div
      ref={elRef}
      className={className}
      style={{
        height,
        width: "100%",
        borderRadius: "1.25rem",
        overflow: "hidden",
        isolation: "isolate",
        zIndex: 0,
      }}
    />
  );
}
