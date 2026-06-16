"use client";

import { useEffect, useRef, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Reveal } from "@/components/Reveal";
import { TyreImage, kindFromText } from "@/components/TyreImage";
import { RIDES, CENTER } from "@/lib/balades";

/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-img-element */
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
      <SiteHeader />

      {/* Banniere */}
      <section className="relative overflow-hidden text-white">
        <div className="absolute inset-0 -z-10">
          <img src="/photos/road-forest.jpg" alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 hero-veil" />
        </div>
        <div className="pointer-events-none absolute right-0 top-0 -z-10 h-64 w-64 rounded-full bg-michelin-blue/40 blur-3xl" />
        <div className="mx-auto max-w-6xl px-6 py-20">
          <Reveal as="span" className="inline-block">
            <span className="kicker">Balades de la semaine</span>
          </Reveal>
          <Reveal as="h1" delay={60} className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
            5 itineraires, 1 pneu par terrain
          </Reveal>
          <Reveal as="p" delay={120} className="mt-3 flex flex-wrap items-center gap-3 text-lg text-white/85">
            Le pneu Michelin qu&apos;il te faut, pour chaque sortie.
            <span className="rounded-pill bg-[#FC5200] px-3 py-1 text-xs font-semibold text-white">Powered by Strava</span>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">

        <div className="mt-6 grid gap-5 lg:grid-cols-[340px_1fr]">
          {/* Liste */}
          <div className="space-y-3">
            {RIDES.map((r, i) => (
              <Reveal key={r.name} delay={i * 60}>
                <button
                  onClick={() => setSelected(i)}
                  aria-pressed={i === selected}
                  className={`group relative w-full overflow-hidden rounded-2xl border p-4 text-left transition-[transform,box-shadow,background-color,border-color] duration-300 ease-out-strong ${
                    i === selected
                      ? "border-michelin-blue bg-[#EAF0F9] shadow-soft"
                      : "border-michelin-gray-line bg-white hover:-translate-y-0.5 hover:border-michelin-blue hover:shadow-soft"
                  }`}
                >
                  {/* Accent lateral de l'item actif */}
                  <span
                    className={`absolute inset-y-3 left-0 w-1 rounded-pill bg-michelin-yellow transition-opacity duration-300 ${
                      i === selected ? "opacity-100" : "opacity-0"
                    }`}
                  />
                  <div className="flex gap-3">
                    <TyreImage kind={kindFromText(r.terrain)} className="h-12 w-12 shrink-0 transition-transform duration-300 ease-out-strong group-hover:rotate-[8deg]" />
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
              </Reveal>
            ))}
          </div>

          {/* Carte */}
          <div className="overflow-hidden rounded-2xl border border-michelin-gray-line shadow-soft">
            <div ref={mapEl} className="h-[460px] w-full bg-michelin-gray-light" />
            {!ready && (
              <p className="p-3 text-center text-sm text-michelin-ink">Chargement de la carte…</p>
            )}
          </div>
        </div>

      </section>

      <SiteFooter />
    </main>
  );
}
