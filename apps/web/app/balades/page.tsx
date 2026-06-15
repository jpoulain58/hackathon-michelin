"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Brand } from "@/components/Brand";
import { TyreImage, kindFromText } from "@/components/TyreImage";
import { RIDES, CENTER } from "@/lib/balades";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    L?: any;
  }
}

const LEAFLET_VERSION = "1.9.4";

function loadLeaflet(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.L) return Promise.resolve(window.L);
  return new Promise((resolve, reject) => {
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = `https://cdnjs.cloudflare.com/ajax/libs/leaflet/${LEAFLET_VERSION}/leaflet.min.css`;
      document.head.appendChild(link);
    }
    const script = document.createElement("script");
    script.src = `https://cdnjs.cloudflare.com/ajax/libs/leaflet/${LEAFLET_VERSION}/leaflet.min.js`;
    script.onload = () => resolve(window.L);
    script.onerror = () => reject(new Error("Leaflet non charge"));
    document.body.appendChild(script);
  });
}

export default function Balades() {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layersRef = useRef<any[]>([]);
  const [selected, setSelected] = useState(0);
  const [ready, setReady] = useState(false);

  // Init carte
  useEffect(() => {
    let cancelled = false;
    loadLeaflet()
      .then((L) => {
        if (cancelled || !mapEl.current || mapRef.current) return;
        const map = L.map(mapEl.current, { zoomControl: true }).setView(CENTER, 12);
        L.tileLayer(`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`, {
          maxZoom: 18,
          attribution: "(c) OpenStreetMap",
        }).addTo(map);
        mapRef.current = map;
        setReady(true);
      })
      .catch(() => setReady(false));
    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Dessine la balade selectionnee
  useEffect(() => {
    const L = typeof window !== "undefined" ? window.L : null;
    const map = mapRef.current;
    if (!ready || !L || !map) return;
    layersRef.current.forEach((l) => map.removeLayer(l));
    layersRef.current = [];
    RIDES.forEach((r, idx) => {
      const active = idx === selected;
      const line = L.polyline(r.pts, {
        color: active ? "#FCE500" : "#27509B",
        weight: active ? 6 : 3,
        opacity: active ? 1 : 0.5,
      }).addTo(map);
      layersRef.current.push(line);
      if (active) {
        const start = r.pts[0];
        const mid = r.pts[Math.floor(r.pts.length / 2)];
        layersRef.current.push(
          L.circleMarker(start, { radius: 7, color: "#2E7D32", fillColor: "#2E7D32", fillOpacity: 1 }).addTo(map),
        );
        layersRef.current.push(
          L.circleMarker(mid, { radius: 7, color: "#000C34", fillColor: "#fff", fillOpacity: 1, weight: 3 })
            .addTo(map)
            .bindPopup(`<b>${r.name}</b><br>${r.km} km · ${r.dplus} m D+<br>Pneu : <b>${r.tyre}</b>`),
        );
        map.fitBounds(line.getBounds(), { padding: [50, 50] });
      }
    });
  }, [ready, selected]);

  return (
    <main className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/">
          <Brand />
        </Link>
        <nav className="flex items-center gap-4 text-sm font-semibold text-michelin-blue">
          <Link href="/communaute" className="hover:underline">Communaute</Link>
          <Link href="/club" className="hover:underline">Club</Link>
          <Link href="/trouve-ton-pneu" className="btn-primary">Trouve ton pneu</Link>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-10">
        <div className="h-1 w-12 bg-michelin-yellow" />
        <h1 className="mt-4 text-3xl font-bold text-michelin-navy">Balades de la semaine</h1>
        <p className="mt-2 flex flex-wrap items-center gap-3 text-michelin-ink">
          5 itineraires, et le pneu Michelin qu&apos;il te faut.
          <span className="rounded-pill bg-[#FC5200] px-3 py-1 text-xs font-semibold text-white">Powered by Strava</span>
        </p>

        <div className="mt-6 grid gap-5 lg:grid-cols-[340px_1fr]">
          {/* Liste */}
          <div className="space-y-3">
            {RIDES.map((r, i) => (
              <button
                key={r.name}
                onClick={() => setSelected(i)}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  i === selected
                    ? "border-michelin-blue bg-[#EAF0F9]"
                    : "border-michelin-gray-line bg-white hover:border-michelin-blue"
                }`}
              >
                <div className="flex gap-3">
                  <TyreImage kind={kindFromText(r.terrain)} className="h-12 w-12 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-michelin-navy">
                        {i + 1}. {r.name}
                      </span>
                      <span className="chip">{r.terrain}</span>
                    </div>
                    <div className="mt-1 text-sm text-michelin-ink">
                      {r.km} km · {r.dplus} m D+
                    </div>
                    <div className="mt-1 text-sm font-semibold text-michelin-green">{r.tyre}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Carte */}
          <div className="overflow-hidden rounded-2xl border border-michelin-gray-line">
            <div ref={mapEl} className="h-[460px] w-full bg-michelin-gray-light" />
            {!ready && (
              <p className="p-3 text-center text-sm text-michelin-ink">
                Chargement de la carte… (necessite une connexion pour les tuiles OpenStreetMap)
              </p>
            )}
          </div>
        </div>

        <p className="mt-4 text-xs text-michelin-ink">
          Prototype : traces issus de <code>map.summary_polyline</code> (API Strava), decodes cote
          client et rendus avec Leaflet + OpenStreetMap.
        </p>
      </section>
    </main>
  );
}
