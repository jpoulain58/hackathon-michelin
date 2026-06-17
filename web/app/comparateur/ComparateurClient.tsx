"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TyreImage, tyreKind } from "@/components/TyreImage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchTyres, type TyreView } from "@/lib/api";
import {
  formatPressure,
  formatWeight,
  metricScore,
  shortTechnologyList,
  terrainLabel,
  tyreFormat,
  tyreFullName,
  tyreName,
  tyreSize,
  type ComparisonMetric,
} from "@/lib/tyres";
import { cn } from "@/lib/utils";

const MAX_SELECTED = 3;

const SCORE_ROWS: { key: ComparisonMetric; label: string }[] = [
  { key: "speed", label: "Rendement" },
  { key: "grip", label: "Adhérence" },
  { key: "protection", label: "Protection" },
];

export function ComparateurClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idsParam = searchParams.get("ids") ?? "";
  const queryIds = useMemo(() => parseIds(idsParam), [idsParam]);

  const [catalog, setCatalog] = useState<TyreView[]>([]);
  const [selected, setSelected] = useState<TyreView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [catalogItems, selectedItems] = await Promise.all([
          fetchTyres({ limit: 30 }),
          queryIds.length > 0 ? fetchTyres({ ids: queryIds }) : Promise.resolve([]),
        ]);

        if (!alive) return;
        const base = selectedItems.length > 0 ? selectedItems : catalogItems.slice(0, MAX_SELECTED);
        const merged = fillSelection(base, catalogItems).slice(0, MAX_SELECTED);
        setCatalog(catalogItems);
        setSelected(merged);
      } catch {
        if (!alive) return;
        setError("Impossible de charger le catalogue pneus.");
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => {
      alive = false;
    };
  }, [queryIds]);

  const available = catalog.filter((tyre) => !selected.some((item) => item.id === tyre.id));
  const gridStyle = { gridTemplateColumns: `150px repeat(${selected.length}, minmax(190px, 1fr))` };

  function updateSelection(next: TyreView[]) {
    const clean = next.slice(0, MAX_SELECTED);
    setSelected(clean);
    const ids = clean.map((tyre) => tyre.id).join(",");
    router.replace(ids ? `/comparateur?ids=${encodeURIComponent(ids)}` : "/comparateur", {
      scroll: false,
    });
  }

  function addTyre(id: string) {
    const tyre = catalog.find((item) => item.id === id);
    if (!tyre) return;
    updateSelection(fillSelection([...selected, tyre], catalog).slice(0, MAX_SELECTED));
  }

  function removeTyre(id: string) {
    updateSelection(fillSelection(selected.filter((tyre) => tyre.id !== id), catalog));
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6">
      <div className="flex flex-col gap-5 border-b border-michelin-gray-line pb-8 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-michelin-ink">
            Comparateur
          </span>
          <h1 className="mt-2 text-4xl font-black tracking-tight text-michelin-navy sm:text-5xl">
            Compare les pneus Michelin
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-michelin-ink">
            Données issues du catalogue produit : dimensions, poids, pression, carcasse et technologies.
          </p>
        </div>

        <label className="w-full max-w-sm">
          <span className="mb-2 block text-xs font-bold uppercase tracking-wide text-michelin-ink">
            Ajouter un pneu
          </span>
          <select
            value=""
            onChange={(event) => addTyre(event.target.value)}
            disabled={loading || selected.length >= MAX_SELECTED || available.length === 0}
            className="h-12 w-full rounded-lg border border-michelin-gray-line bg-white px-4 text-sm font-semibold text-michelin-navy shadow-sm outline-none transition-colors focus:border-michelin-blue focus:ring-2 focus:ring-michelin-blue/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">
              {selected.length >= MAX_SELECTED ? "Maximum 3 pneus" : "Choisir un produit"}
            </option>
            {available.map((tyre) => (
              <option key={tyre.id} value={tyre.id}>
                {tyreName(tyre)} - {tyreSize(tyre)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {loading && (
        <div className="flex items-center gap-4 py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-michelin-gray-line border-t-michelin-blue" />
          <p className="font-semibold text-michelin-navy">Chargement du catalogue...</p>
        </div>
      )}

      {error && (
        <div className="mt-10 rounded-lg border border-michelin-gray-line bg-michelin-gray-light p-5 text-sm font-semibold text-michelin-ink">
          {error}
        </div>
      )}

      {!loading && !error && selected.length > 0 && (
        <div className="mt-10 overflow-x-auto">
          <div className="min-w-[760px]">
            <div className="grid items-stretch gap-3" style={gridStyle}>
              <div />
              {selected.map((tyre, index) => (
                <ProductColumn
                  key={tyre.id}
                  tyre={tyre}
                  highlighted={index === 0}
                  canRemove={selected.length > 2}
                  onRemove={() => removeTyre(tyre.id)}
                />
              ))}
            </div>

            <div className="mt-6 overflow-hidden rounded-lg border border-michelin-gray-line">
              {SCORE_ROWS.map((row) => (
                <ComparisonRow
                  key={row.key}
                  label={row.label}
                  products={selected}
                  gridStyle={gridStyle}
                  render={(tyre) => <ScoreDots value={metricScore(tyre, row.key)} />}
                />
              ))}
              <ComparisonRow
                label="Poids"
                products={selected}
                gridStyle={gridStyle}
                render={(tyre) => formatWeight(tyre)}
              />
              <ComparisonRow
                label="Format"
                products={selected}
                gridStyle={gridStyle}
                render={(tyre) => tyreFormat(tyre)}
              />
              <ComparisonRow
                label="Dimensions"
                products={selected}
                gridStyle={gridStyle}
                render={(tyre) => tyreSize(tyre)}
              />
              <ComparisonRow
                label="Pression max"
                products={selected}
                gridStyle={gridStyle}
                render={(tyre) => formatPressure(tyre)}
              />
              <ComparisonRow
                label="Terrain"
                products={selected}
                gridStyle={gridStyle}
                render={(tyre) => terrainLabel(tyre)}
              />
              <ComparisonRow
                label="Technologies"
                products={selected}
                gridStyle={gridStyle}
                render={(tyre) => shortTechnologyList(tyre)}
                last
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProductColumn({
  tyre,
  highlighted,
  canRemove,
  onRemove,
}: {
  tyre: TyreView;
  highlighted: boolean;
  canRemove: boolean;
  onRemove: () => void;
}) {
  const retailerUrl = `https://www.michelin.fr/velo?utm_source=trustwheels&utm_medium=app&utm_campaign=comparateur&q=${encodeURIComponent(
    tyre.range,
  )}`;

  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-lg border p-4",
        highlighted
          ? "border-michelin-blue bg-[#F7FAFF]"
          : "border-michelin-gray-line bg-white",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <Badge variant={highlighted ? "default" : "secondary"}>
          {highlighted ? "Sélection" : tyre.cycleType}
        </Badge>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-xs font-semibold text-michelin-ink transition-colors hover:text-michelin-blue"
          >
            Retirer
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col items-center py-5 text-center">
        <TyreImage kind={tyreKind(tyre)} className="h-24 w-24" />
        <h2 className="mt-4 text-base font-black leading-tight text-michelin-navy">
          {tyreName(tyre)}
        </h2>
        <p className="mt-2 min-h-10 text-xs leading-5 text-michelin-ink">{tyre.designation}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-michelin-gray-line pt-3 text-xs">
        <Stat label="Poids" value={formatWeight(tyre)} />
        <Stat label="TPI" value={tyre.tpi ?? "Non précisé"} />
      </div>

      <Button asChild variant="outline" size="sm" className="mt-4 rounded-lg">
        <a href={retailerUrl} target="_blank" rel="noopener noreferrer" aria-label={`Voir ${tyreFullName(tyre)}`}>
          Voir le produit
        </a>
      </Button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wide text-michelin-ink">{label}</div>
      <div className="mt-0.5 font-bold text-michelin-navy">{value}</div>
    </div>
  );
}

function ComparisonRow({
  label,
  products,
  gridStyle,
  render,
  last = false,
}: {
  label: string;
  products: TyreView[];
  gridStyle: CSSProperties;
  render: (tyre: TyreView) => ReactNode;
  last?: boolean;
}) {
  return (
    <div
      className={cn("grid min-h-14 items-center bg-white", !last && "border-b border-michelin-gray-line")}
      style={gridStyle}
    >
      <div className="h-full bg-michelin-gray-light px-4 py-4 text-sm font-bold text-michelin-navy">
        {label}
      </div>
      {products.map((tyre) => (
        <div key={tyre.id} className="px-4 py-4 text-sm font-semibold text-michelin-ink">
          {render(tyre)}
        </div>
      ))}
    </div>
  );
}

function ScoreDots({ value }: { value: number }) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: 5 }).map((_, index) => (
        <span
          key={index}
          className={cn(
            "h-2.5 w-2.5 rounded-full",
            index < value ? "bg-michelin-blue" : "bg-michelin-gray-line",
          )}
        />
      ))}
    </div>
  );
}

function parseIds(value: string): string[] {
  return value
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

function fillSelection(selected: TyreView[], catalog: TyreView[]): TyreView[] {
  const result = [...selected];
  for (const tyre of catalog) {
    if (result.length >= 2) break;
    if (!result.some((item) => item.id === tyre.id)) result.push(tyre);
  }
  return result;
}
