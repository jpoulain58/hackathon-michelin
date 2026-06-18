"use client";

/* eslint-disable @typescript-eslint/no-explicit-any, @next/next/no-img-element */
import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Reveal } from "@/components/Reveal";
import { TyreImage, kindFromText } from "@/components/TyreImage";
import { CENTER, fetchRides, formatDuration, type Ride } from "@/lib/balades";
import { loadLeaflet } from "@/lib/leaflet";
import { cn } from "@/lib/utils";
import { useTagDefinitions } from "@/lib/tags";
import { getTagIcon } from "@/lib/tag-icons";
import { AddBaladeGpxButton } from "./AddBaladeGpxButton";

declare global {
  interface Window { L?: any; }
}

function matchesFilters(ride: Ride, active: Set<string>): boolean {
  if (active.size === 0) return true;
  const tags = Array.isArray(ride.tags) ? ride.tags : [];
  return [...active].every(
    (f) =>
      ride.terrain === f ||
      ride.difficulty === f ||
      ride.landscape === f ||
      tags.includes(f),
  );
}

function rideTags(ride: Ride): string[] {
  return Array.isArray(ride.tags) ? ride.tags : [];
}

function ridePoints(ride: Ride) {
  return Array.isArray(ride.pts) ? ride.pts.filter((pt) => Array.isArray(pt) && pt.length === 2) : [];
}

export default function Balades() {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layersRef = useRef<any[]>([]);

  const [rides, setRides] = useState<Ride[]>([]);
  const [loadingRides, setLoadingRides] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set());
  const [ambassadorOnly, setAmbassadorOnly] = useState(false);
  const [ready, setReady] = useState(false);
  const tagDefinitions = useTagDefinitions();

  const loadRides = useCallback(() => {
    setLoadingRides(true);
    fetchRides()
      .then((items) => setRides(items))
      .catch(() => setRides([]))
      .finally(() => setLoadingRides(false));
  }, []);

  useEffect(() => {
    loadRides();
  }, [loadRides]);

  const filterGroups = useMemo(
    () => [
      { label: "Discipline", values: ["Route", "Gravel", "VTT"] },
      { label: "Niveau", values: ["Débutant", "Intermédiaire", "Expert"] },
      { label: "Paysage", values: [...new Set(rides.map((r) => r.landscape).filter(Boolean))].sort() as string[] },
      { label: "Tags", values: [...new Set(rides.flatMap(rideTags))].sort() },
    ],
    [rides],
  );

  const filteredRides = useMemo(
    () =>
      rides
        .filter((r) => matchesFilters(r, activeFilters))
        .filter((r) => !ambassadorOnly || r.isAmbassador)
        .sort((a, b) => Number(b.isAmbassador) - Number(a.isAmbassador)),
    [rides, activeFilters, ambassadorOnly],
  );

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
        requestAnimationFrame(() => { if (!cancelled) map.invalidateSize(); });
        setReady(true);
      })
      .catch(() => setReady(false));
    return () => {
      cancelled = true;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, []);

  useEffect(() => {
    const L = typeof window !== "undefined" ? (window as any).L : null;
    const map = mapRef.current;
    if (!ready || !L || !map) return;
    layersRef.current.forEach((l) => map.removeLayer(l));
    layersRef.current = [];
    if (filteredRides.length === 0) return;
    filteredRides.forEach((r) => {
      const points = ridePoints(r);
      if (points.length < 2) return;
      const active = r.id === selectedId;
      const line = L.polyline(points, {
        color: active ? "#FCE500" : "#27509B",
        weight: active ? 6 : 3,
        opacity: active ? 1 : 0.5,
      }).addTo(map);
      layersRef.current.push(line);
      if (active) {
        const start = points[0];
        const mid = points[Math.floor(points.length / 2)];
        layersRef.current.push(
          L.circleMarker(start, { radius: 7, color: "#27509B", fillColor: "#27509B", fillOpacity: 1 }).addTo(map),
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
    <main className="min-h-screen">
      <SiteHeader />

      {/* Bannière hero */}
      <section className="relative overflow-hidden text-white">
        <div className="absolute inset-0 -z-10">
          <img src="/photos/road-forest.jpg" alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 hero-veil" />
        </div>
        <div className="pointer-events-none absolute right-0 top-0 -z-10 h-64 w-64 rounded-full bg-michelin-blue/40 blur-3xl" />
        <div className="mx-auto max-w-6xl px-6 pb-20 pt-32">
          <Reveal as="span" className="inline-block">
            <span className="kicker">Balades de la semaine</span>
          </Reveal>
          <Reveal as="h1" delay={60} className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
            5 itinéraires, 1 pneu par terrain
          </Reveal>
          <Reveal as="p" delay={120} className="mt-3 flex flex-wrap items-center gap-3 text-lg text-white/85">
            Le pneu Michelin qu&apos;il te faut, pour chaque sortie.
            <span className="rounded-pill bg-[#FC5200] px-3 py-1 text-xs font-semibold text-white">Powered by Strava</span>
          </Reveal>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        {/* Filtres */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-4 w-0.5 bg-michelin-yellow" />
              <span className="text-xs font-bold uppercase tracking-widest text-michelin-navy">Filtres</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAmbassadorOnly((v) => !v)}
                className={cn(
                  "flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-xs font-semibold transition-all duration-150",
                  ambassadorOnly
                    ? "bg-michelin-yellow text-michelin-navy shadow-sm"
                    : "border border-michelin-gray-line bg-white text-michelin-ink hover:border-michelin-yellow hover:text-michelin-navy",
                )}
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
                  <path d="M12 2.5l2.9 6.16 6.6.74-4.92 4.6 1.31 6.6L12 17.6l-5.89 3 1.31-6.6-4.92-4.6 6.6-.74L12 2.5z" />
                </svg>
                Balades ambassadeur
              </button>
              <AddBaladeGpxButton onCreated={loadRides} />
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
          </div>

          <div className="no-scrollbar overflow-x-auto">
            <div className="flex min-w-max items-start gap-4 pb-1 lg:min-w-0 lg:flex-wrap">
              {filterGroups.map((group, gi) => (
                <div key={group.label} className="flex items-start gap-4">
                  {gi > 0 && <div className="mt-5 h-8 w-px shrink-0 bg-michelin-yellow/40" />}
                  <div>
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-michelin-navy">
                      {group.label}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {group.values.map((f) => {
                        const active = activeFilters.has(f);
                        const tagDef = group.label === "Tags" ? tagDefinitions.get(f) : undefined;
                        const TagIcon = tagDef ? getTagIcon(tagDef.icon) : null;
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
                            {TagIcon && <TagIcon className="h-3 w-3" />}
                            {tagDef?.label ?? f}
                            {active && (
                              <svg viewBox="0 0 24 24" className="h-3 w-3 text-michelin-yellow" fill="none" stroke="currentColor" strokeWidth={3}>
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
                  <svg viewBox="0 0 24 24" className="h-3 w-3 opacity-70" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              ))}
            </>
          )}
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[340px_1fr]">
          {/* Liste */}
          <div className="order-2 space-y-3 lg:order-1">
            {loadingRides ? (
              <div className="rounded-2xl border border-michelin-gray-line bg-white p-8 text-center">
                <p className="text-michelin-ink">Chargement des balades…</p>
              </div>
            ) : filteredRides.length === 0 ? (
              <div className="rounded-2xl border border-michelin-gray-line bg-white p-8 text-center">
                <p className="text-michelin-ink">
                  {rides.length === 0
                    ? "Aucune balade publiée pour le moment."
                    : "Aucune balade ne correspond à ces filtres."}
                </p>
                {(activeFilters.size > 0 || ambassadorOnly) && (
                  <button
                    onClick={() => {
                      setActiveFilters(new Set());
                      setAmbassadorOnly(false);
                    }}
                    className="mt-3 text-sm font-semibold text-michelin-blue hover:underline"
                  >
                    Effacer les filtres
                  </button>
                )}
              </div>
            ) : (
              filteredRides.map((r) => (
                <div key={r.id}>
                  <button
                    onClick={() => setSelectedId(r.id)}
                    className={cn(
                      "group relative w-full overflow-hidden rounded-2xl border p-4 text-left transition-[transform,box-shadow,background-color,border-color] duration-300 ease-out-strong",
                      r.id === selectedId
                        ? "border-michelin-blue bg-[#EAF0F9] shadow-soft"
                        : "border-michelin-gray-line bg-white hover:-translate-y-0.5 hover:border-michelin-blue hover:shadow-soft",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute inset-y-3 left-0 w-1 rounded-pill bg-michelin-yellow transition-opacity duration-300",
                        r.id === selectedId ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <div className="flex gap-3">
                      <TyreImage kind={kindFromText(r.terrain)} className="h-12 w-12 shrink-0 transition-transform duration-300 ease-out-strong group-hover:rotate-[8deg]" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <span className="flex items-center gap-1.5 font-bold text-michelin-navy">
                            {r.isAmbassador && (
                              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-michelin-yellow" fill="currentColor">
                                <path d="M12 2.5l2.9 6.16 6.6.74-4.92 4.6 1.31 6.6L12 17.6l-5.89 3 1.31-6.6-4.92-4.6 6.6-.74L12 2.5z" />
                              </svg>
                            )}
                            {r.name}
                          </span>
                          <span className="chip shrink-0">{r.terrain}</span>
                        </div>
                        {r.isAmbassador && (
                          <span className="mt-1 inline-flex items-center rounded-pill bg-michelin-navy px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-michelin-yellow">
                            Balade d&apos;ambassadeur
                          </span>
                        )}
                        <div className="mt-1 text-sm text-michelin-ink">
                          {r.km} km · {r.dplus} m D+ · {formatDuration(r.durationSeconds)}
                        </div>
                        {r.tyre ? (
                          <div className="mt-1 text-sm font-semibold text-michelin-green">{r.tyre}</div>
                        ) : (
                          r.usedTyre && (
                            <div className="mt-1 text-sm font-semibold text-michelin-green">
                              {[r.usedTyre.brand, r.usedTyre.range].filter(Boolean).join(" ")}
                            </div>
                          )
                        )}
                        {rideTags(r).length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {rideTags(r).map((tag) => {
                              const def = tagDefinitions.get(tag);
                              const Icon = getTagIcon(def?.icon ?? "");
                              return (
                                <span
                                  key={tag}
                                  className="inline-flex items-center gap-1 rounded-pill bg-michelin-gray-light px-2 py-0.5 text-xs text-michelin-ink"
                                >
                                  <Icon className="h-3 w-3" />
                                  {def?.label ?? tag}
                                </span>
                              );
                            })}
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
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.5}>
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </Link>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Carte */}
          <div className="isolate order-1 -mx-6 lg:order-2 lg:mx-0 lg:self-start lg:sticky lg:top-20 lg:overflow-hidden lg:rounded-2xl lg:border lg:border-michelin-gray-line lg:shadow-soft">
            <div ref={mapEl} className="h-52 w-full bg-michelin-gray-light lg:h-[460px]" />
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
