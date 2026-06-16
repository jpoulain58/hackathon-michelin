"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { Brand } from "@/components/Brand";
import { TyreImage, kindFromText } from "@/components/TyreImage";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/BottomNav";
import { RIDES, CENTER, type Ride } from "@/lib/balades";
import { loadLeaflet } from "@/lib/leaflet";
import { cn } from "@/lib/utils";

function matchesFilters(ride: Ride, active: Set<string>): boolean {
  if (active.size === 0) return true;
  return [...active].every(
    (f) =>
      ride.terrain === f ||
      ride.difficulty === f ||
      ride.landscape === f ||
      ride.tags.includes(f),
  );
}

const FILTER_GROUPS = [
  { label: "Discipline", values: ["Route", "Gravel", "VTT"] },
  { label: "Niveau", values: ["Débutant", "Intermédiaire", "Expert"] },
  { label: "Paysage", values: [...new Set(RIDES.map((r) => r.landscape))].sort() },
  { label: "Tags", values: [...new Set(RIDES.flatMap((r) => r.tags))].sort() },
];

export default function Balades() {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layersRef = useRef<any[]>([]);

  const [selectedId, setSelectedId] = useState<string>(RIDES[0].id);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  const filteredRides = useMemo(
    () => RIDES.filter((r) => matchesFilters(r, activeFilters)),
    [activeFilters],
  );

  // Si la sélection sort des résultats filtrés, passer au premier visible
  useEffect(() => {
    if (filteredRides.length > 0 && !filteredRides.find((r) => r.id === selectedId)) {
      setSelectedId(filteredRides[0].id);
    }
  }, [filteredRides, selectedId]);

  const toggleFilter = useCallback((f: string) => {
    setActiveFilters((prev) => {
      const next = new Set(prev);
      if (next.has(f)) next.delete(f);
      else next.add(f);
      return next;
    });
  }, []);

  // Init carte
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

  // Redessine les tracés selon les rides filtrées et la sélection
  useEffect(() => {
    const L = typeof window !== "undefined" ? (window as any).L : null;
    const map = mapRef.current;
    if (!ready || !L || !map) return;
    layersRef.current.forEach((l) => map.removeLayer(l));
    layersRef.current = [];

    if (filteredRides.length === 0) return;

    filteredRides.forEach((r) => {
      const active = r.id === selectedId;
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
  }, [ready, filteredRides, selectedId]);

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

        {/* Filtres */}
        <div className="mt-6">
          {/* En-tête de section */}
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-4 w-0.5 bg-michelin-yellow" />
              <span className="text-xs font-bold uppercase tracking-widest text-michelin-navy">
                Filtres
              </span>
            </div>
            {activeFilters.size > 0 && (
              <button
                onClick={() => setActiveFilters(new Set())}
                className="flex items-center gap-1.5 rounded-pill border border-michelin-gray-line px-3 py-1 text-xs font-semibold text-michelin-ink transition-colors hover:border-michelin-blue hover:text-michelin-blue"
              >
                <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
                Tout effacer
              </button>
            )}
          </div>

          {/* Groupes de filtres — scroll horizontal sur mobile, wrap sur desktop */}
          <div className="no-scrollbar overflow-x-auto">
            <div className="flex min-w-max items-start gap-4 pb-1 lg:min-w-0 lg:flex-wrap">
              {FILTER_GROUPS.map((group, gi) => (
                <div key={group.label} className="flex items-start gap-4">
                  {gi > 0 && (
                    <div className="mt-5 h-8 w-px shrink-0 bg-michelin-yellow/40" />
                  )}
                  <div>
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-michelin-navy">
                      {group.label}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {group.values.map((f) => {
                        const active = activeFilters.has(f);
                        return (
                          <button
                            key={f}
                            onClick={() => toggleFilter(f)}
                            className={cn(
                              "flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-xs font-semibold transition-all duration-150",
                              active
                                ? "bg-michelin-blue text-white shadow-sm"
                                : "border border-michelin-gray-line bg-white text-michelin-ink hover:border-michelin-blue hover:text-michelin-blue",
                            )}
                          >
                            {f}
                            {active && (
                              <svg
                                viewBox="0 0 24 24"
                                className="h-3 w-3 text-michelin-yellow"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth={3}
                              >
                                <path d="M18 6 6 18M6 6l12 12" />
                              </svg>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Récap filtres actifs + compteur */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-sm text-michelin-ink">
            <span className="font-bold text-michelin-navy">{filteredRides.length}</span>{" "}
            balade{filteredRides.length > 1 ? "s" : ""}
          </span>
          {activeFilters.size > 0 && (
            <>
              <span className="h-3.5 w-px bg-michelin-gray-line" />
              {[...activeFilters].map((f) => (
                <button
                  key={f}
                  onClick={() => toggleFilter(f)}
                  className="flex items-center gap-1 rounded-pill bg-michelin-blue/10 px-2.5 py-0.5 text-xs font-semibold text-michelin-blue transition-colors hover:bg-michelin-blue/20"
                >
                  {f}
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3 w-3 opacity-70"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              ))}
            </>
          )}
        </div>

        <div className="mt-4 grid gap-5 lg:grid-cols-[340px_1fr]">
          {/* Liste */}
          <div className="space-y-3">
            {filteredRides.length === 0 ? (
              <div className="rounded-2xl border border-michelin-gray-line bg-white p-8 text-center">
                <p className="text-michelin-ink">Aucune balade ne correspond à ces filtres.</p>
                <button
                  onClick={() => setActiveFilters(new Set())}
                  className="mt-3 text-sm font-semibold text-michelin-blue hover:underline"
                >
                  Effacer les filtres
                </button>
              </div>
            ) : (
              filteredRides.map((r) => (
                <div key={r.id}>
                  <button
                    onClick={() => setSelectedId(r.id)}
                    className={cn(
                      "w-full rounded-2xl border p-4 text-left transition",
                      r.id === selectedId
                        ? "border-michelin-blue bg-[#EAF0F9]"
                        : "border-michelin-gray-line bg-white hover:border-michelin-blue",
                    )}
                  >
                    <div className="flex gap-3">
                      <TyreImage kind={kindFromText(r.terrain)} className="h-12 w-12 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-michelin-navy">{r.name}</span>
                          <span className="chip shrink-0">{r.terrain}</span>
                        </div>
                        <div className="mt-1 text-sm text-michelin-ink">
                          {r.km} km · {r.dplus} m D+ · {r.duration}
                        </div>
                        <div className="mt-1 text-sm font-semibold text-michelin-green">{r.tyre}</div>
                        {r.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {r.tags.map((tag) => (
                              <span
                                key={tag}
                                className="rounded-pill bg-michelin-gray-light px-2 py-0.5 text-xs text-michelin-ink"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                  {r.id === selectedId && (
                    <Link
                      href={`/balades/${r.id}`}
                      className="mt-1 flex items-center justify-end gap-1 text-xs font-semibold text-michelin-blue hover:underline"
                    >
                      Voir la balade
                      <svg
                        viewBox="0 0 24 24"
                        className="h-3.5 w-3.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </Link>
                  )}
                </div>
              ))
            )}
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
