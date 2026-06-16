"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Brand } from "@/components/Brand";
import { TyreImage, kindFromText } from "@/components/TyreImage";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/BottomNav";
import { RIDES, CENTER } from "@/lib/balades";
import { loadLeaflet } from "@/lib/leaflet";

export default function Balades() {
  const mapEl = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layersRef = useRef<any[]>([]);
  const [selected, setSelected] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadLeaflet()
      .then((L) => {
        if (cancelled || !mapEl.current || mapRef.current) return;
        const map = L.map(mapEl.current, { zoomControl: true }).setView(CENTER, 12);
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 18,
          attribution: "© OpenStreetMap",
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

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const L = typeof window !== "undefined" ? (window as any).L : null;
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
          L.circleMarker(start, {
            radius: 7,
            color: "#27509B",
            fillColor: "#27509B",
            fillOpacity: 1,
          }).addTo(map),
        );
        layersRef.current.push(
          L.circleMarker(mid, { radius: 7, color: "#27509B", fillColor: "#fff", fillOpacity: 1, weight: 3 })
            .addTo(map)
            .bindPopup(`<b>${r.name}</b><br>${r.km} km · ${r.dplus} m D+<br>Pneu : <b>${r.tyre}</b>`),
        );
        map.fitBounds(line.getBounds(), { padding: [50, 50] });
      }
    });
  }, [ready, selected]);

  return (
    <main className="min-h-screen pb-20 lg:pb-0">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/accueil">
          <Brand />
        </Link>
        <nav className="hidden items-center gap-4 text-sm font-semibold text-michelin-blue lg:flex">
          <Link href="/communaute" className="hover:underline">Communauté</Link>
          <Link href="/club" className="hover:underline">Club</Link>
          <Button asChild size="sm">
            <Link href="/trouve-ton-pneu">Trouve ton pneu</Link>
          </Button>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-10">
        <div className="h-1 w-12 bg-michelin-yellow" />
        <h1 className="mt-4 text-3xl font-bold text-michelin-navy">Balades de la semaine</h1>
        <p className="mt-2 flex flex-wrap items-center gap-3 text-michelin-ink">
          5 itinéraires, et le pneu Michelin qu&apos;il te faut.
          <span className="rounded-pill bg-[#FC5200] px-3 py-1 text-xs font-semibold text-white">
            Powered by Strava
          </span>
        </p>

        <div className="mt-6 grid gap-5 lg:grid-cols-[340px_1fr]">
          {/* Liste */}
          <div className="space-y-3">
            {RIDES.map((r, i) => (
              <div key={r.id}>
                <button
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
                        {r.km} km · {r.dplus} m D+ · {r.duration}
                      </div>
                      <div className="mt-1 text-sm font-semibold text-michelin-green">{r.tyre}</div>
                    </div>
                  </div>
                </button>
                {i === selected && (
                  <Link
                    href={`/balades/${r.id}`}
                    className="mt-1 flex items-center justify-end gap-1 text-xs font-semibold text-michelin-blue hover:underline"
                  >
                    Voir la balade
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* Carte */}
          <div className="overflow-hidden rounded-2xl border border-michelin-gray-line">
            <div ref={mapEl} className="h-[460px] w-full bg-michelin-gray-light" />
            {!ready && (
              <p className="p-3 text-center text-sm text-michelin-ink">Chargement de la carte…</p>
            )}
          </div>
        </div>
      </section>

      <BottomNav />
    </main>
  );
}
