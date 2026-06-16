"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Ride } from "@/lib/balades";
import { loadLeaflet } from "@/lib/leaflet";
import { TyreImage, kindFromText } from "@/components/TyreImage";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/Brand";
import { BottomNav } from "@/components/BottomNav";

const DIFFICULTY_STYLE: Record<string, string> = {
  Débutant: "border border-michelin-gray-line bg-white text-michelin-ink",
  Intermédiaire: "bg-michelin-blue/10 text-michelin-blue",
  Expert: "bg-michelin-navy text-michelin-yellow",
};

const LANDSCAPE_ICON: Record<string, React.ReactNode> = {
  Montagne: (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
      <path d="m3 20 7-12 4 6 3-4 4 10H3z" />
    </svg>
  ),
  Forêt: (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
      <path d="M17 14l-5-8-5 8h10zM3 20l4-6H7l4-7 4 7h-1l4 6H3z" />
    </svg>
  ),
  Plateau: (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M2 16h20M6 16l3-6 3 3 3-5 3 8" />
    </svg>
  ),
};

function IconPin() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="10" r="3" />
      <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 14 8 14s8-8.75 8-14a8 8 0 0 0-8-8z" />
    </svg>
  );
}

function IconElevation() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function IconFlame() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

function IconArrowLeft() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M19 12H5M5 12l7 7M5 12l7-7" />
    </svg>
  );
}

export function BaladeDetail({ ride }: { ride: Ride }) {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadLeaflet()
      .then((L) => {
        if (cancelled || !mapEl.current || mapRef.current) return;
        const map = L.map(mapEl.current, {
          zoomControl: false,
          scrollWheelZoom: false,
          dragging: true,
        }).setView(ride.pts[0], 13);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 18,
          attribution: "© OpenStreetMap",
        }).addTo(map);

        const line = L.polyline(ride.pts, {
          color: "#FCE500",
          weight: 5,
          opacity: 1,
        }).addTo(map);

        L.circleMarker(ride.pts[0], {
          radius: 8,
          color: "#27509B",
          fillColor: "#27509B",
          fillOpacity: 1,
          weight: 2,
        }).addTo(map);

        L.circleMarker(ride.pts[ride.pts.length - 1], {
          radius: 6,
          color: "#27509B",
          fillColor: "#ffffff",
          fillOpacity: 1,
          weight: 2,
        }).addTo(map);

        map.fitBounds(line.getBounds(), { padding: [32, 32] });
        mapRef.current = map;
        setReady(true);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [ride.pts]);

  const retailerUrl = `https://www.michelin.fr/velo?utm_source=trustwheels&utm_medium=app&utm_campaign=balades&q=${encodeURIComponent(ride.tyreDetail.name)}`;

  return (
    <main className="min-h-screen pb-20 lg:pb-0">
      {/* Header mobile */}
      <div className="flex items-center gap-3 px-4 py-3 lg:hidden">
        <Link href="/balades" className="text-michelin-ink" aria-label="Retour aux balades">
          <IconArrowLeft />
        </Link>
        <span className="text-sm font-semibold text-michelin-navy">Balades</span>
      </div>

      {/* Header desktop */}
      <header className="mx-auto hidden max-w-6xl items-center justify-between px-6 py-5 lg:flex">
        <Link href="/accueil">
          <Brand />
        </Link>
        <nav className="flex items-center gap-4 text-sm font-semibold">
          <Link href="/balades" className="flex items-center gap-1 text-michelin-blue hover:underline">
            <IconArrowLeft />
            Balades
          </Link>
          <Link href="/communaute" className="text-michelin-blue hover:underline">Communauté</Link>
          <Link href="/club" className="text-michelin-blue hover:underline">Club</Link>
          <Button asChild size="sm">
            <Link href="/trouve-ton-pneu">Trouve ton pneu</Link>
          </Button>
        </nav>
      </header>

      {/* Carte */}
      <div className="relative">
        <div ref={mapEl} className="h-56 w-full bg-michelin-gray-light md:h-72 lg:h-80" />
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-michelin-gray-light">
            <span className="text-sm text-michelin-ink">Chargement de la carte…</span>
          </div>
        )}
      </div>

      {/* Contenu */}
      <div className="mx-auto max-w-2xl px-4 py-5">
        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {ride.best && (
            <span className="inline-flex items-center rounded-pill bg-[#FC5200] px-3 py-1 text-xs font-semibold text-white">
              Meilleur
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-pill bg-michelin-blue/10 px-3 py-1 text-xs font-semibold text-michelin-blue">
            {LANDSCAPE_ICON[ride.landscape] ?? null}
            {ride.landscape}
          </span>
          <span
            className={`inline-flex items-center rounded-pill px-3 py-1 text-xs font-semibold ${
              DIFFICULTY_STYLE[ride.difficulty] ?? DIFFICULTY_STYLE["Débutant"]
            }`}
          >
            {ride.difficulty}
          </span>
        </div>

        {/* Titre */}
        <h1 className="mt-3 text-2xl font-bold text-michelin-navy">{ride.name}</h1>

        {/* Stats */}
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-michelin-ink">
          <span className="flex items-center gap-1.5 text-michelin-blue">
            <IconPin />
            <strong className="text-michelin-navy">{ride.km} km</strong>
          </span>
          <span className="flex items-center gap-1.5 text-michelin-blue">
            <IconElevation />
            <strong className="text-michelin-navy">{ride.dplus} m D+</strong>
          </span>
          <span className="flex items-center gap-1.5 text-michelin-blue">
            <IconClock />
            <strong className="text-michelin-navy">{ride.duration}</strong>
          </span>
          <span className="flex items-center gap-1.5 text-michelin-blue">
            <IconFlame />
            <strong className="text-michelin-navy">~{ride.kcal} kcal</strong>
          </span>
        </div>

        {/* Résumé */}
        <section className="mt-6">
          <h2 className="text-base font-bold text-michelin-navy">Résumé</h2>
          <p className="mt-2 text-sm leading-relaxed text-michelin-ink">{ride.description}</p>
        </section>

        {/* Instructions */}
        <section className="mt-5">
          <h2 className="text-base font-bold text-michelin-navy">Instructions au départ</h2>
          <p className="mt-2 text-sm leading-relaxed text-michelin-ink">{ride.instructions}</p>
        </section>

        {/* Conseil du pro */}
        <section className="mt-5">
          <div className="rounded-2xl bg-gradient-to-br from-michelin-navy via-slate-700 to-slate-800 p-5 text-white">
            <p className="text-xs font-bold uppercase tracking-wider text-michelin-yellow">
              Le conseil de {ride.proTip.author}
            </p>
            <p className="mt-3 text-sm leading-relaxed opacity-90">{ride.proTip.text}</p>
          </div>
        </section>

        {/* Pneu recommandé */}
        <section className="mt-6">
          <h2 className="text-base font-bold text-michelin-navy">Nos conseils de pneus</h2>
          <div className="mt-3 flex items-center gap-4 rounded-2xl border border-michelin-gray-line bg-white p-4 shadow-sm">
            <TyreImage kind={kindFromText(ride.terrain)} className="h-14 w-14 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="font-bold leading-tight text-michelin-navy">{ride.tyreDetail.name}</p>
              <p className="text-sm text-michelin-ink">{ride.tyreDetail.designation}</p>
              <p className="mt-0.5 text-xs text-michelin-ink">
                {ride.tyreDetail.weightG} g · {ride.tyreDetail.dimensions} dimensions disponibles
              </p>
            </div>
          </div>
          <Button asChild className="mt-3 w-full">
            <a href={retailerUrl} target="_blank" rel="noopener noreferrer">
              Voir où acheter
            </a>
          </Button>
        </section>
      </div>

      <BottomNav />
    </main>
  );
}
