"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircledIcon, CrossCircledIcon, ExternalLinkIcon } from "@radix-ui/react-icons";
import { RetailerMap, type MapStore } from "@/components/RetailerMap";
import {
  distanceKm,
  fakeStock,
  fetchRetailerStores,
  normalizeRetailerUrl,
  type RetailerStore,
} from "@/lib/retailers";

type GeoState = "idle" | "loading" | "ok" | "denied";

export function ProductRetailers({
  productId,
  productName,
}: {
  productId: string | number;
  productName: string;
}) {
  const [stores, setStores] = useState<RetailerStore[]>([]);
  const [loading, setLoading] = useState(true);
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

  const ranked: MapStore[] = useMemo(() => {
    const withMeta = stores.map((s) => ({
      ...s,
      inStock: fakeStock(s.id, productId),
      distanceKm: user ? distanceKm(user.lat, user.lng, s.lat, s.lng) : undefined,
    }));
    if (user) withMeta.sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
    return withMeta;
  }, [stores, user, productId]);

  const inStockCount = ranked.filter((s) => s.inStock).length;
  const list = ranked.slice(0, 8);

  return (
    <div className="overflow-hidden rounded-3xl border border-michelin-gray-line bg-white shadow-soft">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-michelin-gray-line p-6">
        <div className="min-w-0">
          <span className="kicker">Où acheter ce pneu</span>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-michelin-navy">
            Revendeurs proches de toi
          </h2>
          <p className="mt-1 text-sm text-michelin-ink">
            Disponibilité de <span className="font-semibold">{productName}</span> en magasin —{" "}
            {loading ? "chargement…" : `${inStockCount}/${ranked.length} en stock`}.
          </p>
        </div>
        <button
          type="button"
          onClick={locate}
          disabled={geo === "loading"}
          className="inline-flex items-center gap-2 rounded-pill bg-michelin-navy px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-michelin-blue disabled:opacity-60"
        >
          {geo === "loading"
            ? "Localisation…"
            : geo === "ok"
              ? "Position mise à jour"
              : "Voir les revendeurs près de moi"}
        </button>
      </div>

      {geo === "denied" && (
        <p className="bg-michelin-gray-light px-6 py-2 text-xs font-medium text-michelin-ink">
          Localisation indisponible — la carte affiche tous les revendeurs.
        </p>
      )}

      <div className="p-6">
        {loading ? (
          <div className="h-[380px] animate-pulse rounded-3xl bg-michelin-gray-light" />
        ) : ranked.length === 0 ? (
          <div className="rounded-2xl border border-michelin-gray-line bg-michelin-gray-light p-6 text-center text-sm font-semibold text-michelin-ink">
            Aucun revendeur en base pour le moment.
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
            <RetailerMap stores={ranked} user={user} height={420} />
            <ul className="flex max-h-[420px] flex-col gap-2 overflow-y-auto pr-1">
              {list.map((s) => (
                <li key={s.id}>
                  <a
                    href={normalizeRetailerUrl(s.website)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-2xl border border-michelin-gray-line bg-white p-3 transition-[border-color,transform] hover:-translate-y-0.5 hover:border-michelin-blue/45"
                  >
                    <span
                      className={
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full " +
                        (s.inStock ? "bg-michelin-green/15 text-michelin-green" : "bg-[#C0341D]/12 text-[#C0341D]")
                      }
                    >
                      {s.inStock ? (
                        <CheckCircledIcon className="h-5 w-5" />
                      ) : (
                        <CrossCircledIcon className="h-5 w-5" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-black text-michelin-navy">
                        {s.name}
                      </span>
                      <span className="block truncate text-xs font-medium text-michelin-ink/70">
                        {[s.city, s.country].filter(Boolean).join(" · ")}
                        {s.distanceKm !== undefined ? ` · ${Math.round(s.distanceKm)} km` : ""}
                      </span>
                      <span
                        className={
                          "mt-1 inline-block text-[11px] font-bold uppercase tracking-wide " +
                          (s.inStock ? "text-michelin-green" : "text-[#C0341D]")
                        }
                      >
                        {s.inStock ? "En stock" : "Rupture"}
                      </span>
                    </span>
                    <ExternalLinkIcon className="h-4 w-4 shrink-0 text-michelin-ink/50" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
