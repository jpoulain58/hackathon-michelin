"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLinkIcon, MagnifyingGlassIcon } from "@radix-ui/react-icons";
import { RetailerMap, type MapStore } from "@/components/RetailerMap";
import {
  distanceKm,
  fetchRetailerStores,
  formatRetailerDomain,
  normalizeRetailerUrl,
  type RetailerStore,
} from "@/lib/retailers";

type GeoState = "idle" | "loading" | "ok" | "denied";

export function RevendeursExplorer() {
  const [stores, setStores] = useState<RetailerStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState<string | null>(null);
  const [user, setUser] = useState<{ lat: number; lng: number } | null>(null);
  const [geo, setGeo] = useState<GeoState>("idle");

  useEffect(() => {
    let alive = true;
    fetchRetailerStores()
      .then((items) => alive && setStores(items))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  function locate() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeo("denied");
      return;
    }
    setGeo("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUser({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeo("ok");
      },
      () => setGeo("denied"),
      { enableHighAccuracy: false, timeout: 8000 },
    );
  }

  const countries = useMemo(
    () => Array.from(new Set(stores.map((s) => s.country).filter(Boolean))).sort() as string[],
    [stores],
  );

  const filtered: MapStore[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = stores
      .filter((s) => {
        if (country && s.country !== country) return false;
        if (!q) return true;
        return [s.name, s.city, s.country, s.region, s.website].some((v) =>
          v?.toLowerCase().includes(q),
        );
      })
      .map((s) => ({
        ...s,
        distanceKm: user ? distanceKm(user.lat, user.lng, s.lat, s.lng) : undefined,
      }));
    if (user) list.sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
    return list;
  }, [stores, query, country, user]);

  return (
    <div>
      {/* Barre de recherche + geoloc */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-michelin-ink/50" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher par ville, pays, enseigne…"
            className="w-full rounded-pill border border-michelin-gray-line bg-white py-3 pl-12 pr-4 text-michelin-navy outline-none focus:border-michelin-blue"
          />
        </div>
        <button
          type="button"
          onClick={locate}
          disabled={geo === "loading"}
          className="shrink-0 rounded-pill bg-michelin-navy px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-michelin-blue disabled:opacity-60"
        >
          {geo === "loading" ? "Localisation…" : "Autour de moi"}
        </button>
      </div>

      {/* Filtres pays */}
      {countries.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          <FilterPill active={country === null} onClick={() => setCountry(null)}>
            Tous
          </FilterPill>
          {countries.map((c) => (
            <FilterPill key={c} active={country === c} onClick={() => setCountry(c)}>
              {c}
            </FilterPill>
          ))}
        </div>
      )}

      {geo === "denied" && (
        <p className="mt-3 text-xs font-medium text-michelin-ink">
          Localisation indisponible — la carte reste centrée sur l&apos;ensemble des revendeurs.
        </p>
      )}

      <p className="mt-4 text-sm font-semibold text-michelin-ink">
        {loading ? "Chargement…" : `${filtered.length} revendeur${filtered.length > 1 ? "s" : ""}`}
      </p>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {loading ? (
          <div className="h-[520px] animate-pulse rounded-3xl bg-michelin-gray-light" />
        ) : (
          <RetailerMap stores={filtered} user={user} height={520} />
        )}

        <ul className="flex max-h-[520px] flex-col gap-2 overflow-y-auto pr-1">
          {filtered.length === 0 && !loading ? (
            <li className="rounded-2xl border border-michelin-gray-line bg-michelin-gray-light p-6 text-center text-sm font-semibold text-michelin-ink">
              Aucun revendeur ne correspond à ta recherche.
            </li>
          ) : (
            filtered.map((s) => (
              <li key={s.id}>
                <a
                  href={normalizeRetailerUrl(s.website)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-2xl border border-michelin-gray-line bg-white p-3 transition-[border-color,transform] hover:-translate-y-0.5 hover:border-michelin-blue/45"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-michelin-blue/10 text-base font-black text-michelin-blue">
                    {formatRetailerDomain(s.website).slice(0, 1).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-black text-michelin-navy">
                      {s.name}
                    </span>
                    <span className="block truncate text-xs font-medium text-michelin-ink/70">
                      {[s.city, s.country].filter(Boolean).join(" · ")}
                      {s.distanceKm !== undefined ? ` · ${Math.round(s.distanceKm)} km` : ""}
                    </span>
                  </span>
                  <ExternalLinkIcon className="h-4 w-4 shrink-0 text-michelin-ink/50" />
                </a>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-pill px-3.5 py-1.5 text-xs font-bold transition-colors " +
        (active
          ? "bg-michelin-blue text-white"
          : "border border-michelin-gray-line bg-white text-michelin-ink hover:border-michelin-blue/40")
      }
    >
      {children}
    </button>
  );
}
