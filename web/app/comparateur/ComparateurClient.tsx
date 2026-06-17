"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { TyreImage, tyreKind } from "@/components/TyreImage";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type TyreView } from "@/lib/api";
import { getTyreImage } from "@/lib/tyre-images";
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
  tyreSlug,
  type ComparisonMetric,
} from "@/lib/tyres";
import { cn } from "@/lib/utils";

const MAX_SELECTED = 3;

const SCORE_ROWS: { key: ComparisonMetric; label: string }[] = [
  { key: "speed", label: "Rendement" },
  { key: "grip", label: "Adhérence" },
  { key: "protection", label: "Protection" },
];

export function ComparateurClient({ catalog }: { catalog: TyreView[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const idsParam = searchParams.get("ids") ?? "";
  const queryIds = useMemo(() => parseIds(idsParam), [idsParam]);

  const [selected, setSelected] = useState<TyreView[]>(() =>
    resolveSelection(queryIds, catalog),
  );

  // Resynchronise la selection quand l'URL change (navigation arriere/avant).
  useEffect(() => {
    setSelected(resolveSelection(queryIds, catalog));
  }, [queryIds, catalog]);

  const available = useMemo(
    () => catalog.filter((tyre) => !selected.some((item) => item.id === tyre.id)),
    [catalog, selected],
  );

  const showAddSlot = selected.length < MAX_SELECTED && available.length > 0;
  const columnCount = selected.length + (showAddSlot ? 1 : 0);
  const gridStyle: CSSProperties = {
    gridTemplateColumns: `150px repeat(${columnCount}, minmax(190px, 1fr))`,
  };

  function updateSelection(next: TyreView[]) {
    const clean = next.slice(0, MAX_SELECTED);
    setSelected(clean);
    const ids = clean.map((tyre) => tyre.id).join(",");
    router.replace(ids ? `/comparateur?ids=${encodeURIComponent(ids)}` : "/comparateur", {
      scroll: false,
    });
  }

  function addTyre(id: string) {
    if (!id) return;
    const tyre = catalog.find((item) => String(item.id) === id);
    if (!tyre || selected.some((item) => item.id === tyre.id)) return;
    updateSelection([...selected, tyre]);
  }

  function removeTyre(id: string) {
    updateSelection(selected.filter((tyre) => String(tyre.id) !== id));
  }

  function clearAll() {
    updateSelection([]);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-28 sm:px-6">
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
            Jusqu&apos;à {MAX_SELECTED} pneus côte à côte.
          </p>
        </div>

        {selected.length > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="self-start rounded-lg border border-michelin-gray-line px-4 py-2 text-sm font-semibold text-michelin-ink transition-colors hover:border-michelin-blue hover:text-michelin-blue md:self-auto"
          >
            Vider le comparateur
          </button>
        )}
      </div>

      {selected.length === 0 ? (
        <EmptyState available={available} onAdd={addTyre} />
      ) : (
        <div className="mt-10 overflow-x-auto">
          <div className="min-w-[760px]">
            <div className="grid items-stretch gap-3" style={gridStyle}>
              <div />
              {selected.map((tyre, index) => (
                <ProductColumn
                  key={tyre.id}
                  tyre={tyre}
                  highlighted={index === 0}
                  onRemove={() => removeTyre(String(tyre.id))}
                />
              ))}
              {showAddSlot && <AddSlot available={available} onAdd={addTyre} />}
            </div>

            <div className="mt-6 overflow-hidden rounded-lg border border-michelin-gray-line">
              {SCORE_ROWS.map((row) => (
                <ComparisonRow
                  key={row.key}
                  label={row.label}
                  products={selected}
                  gridStyle={gridStyle}
                  hasAddSlot={showAddSlot}
                  render={(tyre) => <ScoreDots value={metricScore(tyre, row.key)} />}
                />
              ))}
              <ComparisonRow
                label="Poids"
                products={selected}
                gridStyle={gridStyle}
                hasAddSlot={showAddSlot}
                render={(tyre) => formatWeight(tyre)}
              />
              <ComparisonRow
                label="Format"
                products={selected}
                gridStyle={gridStyle}
                hasAddSlot={showAddSlot}
                render={(tyre) => tyreFormat(tyre)}
              />
              <ComparisonRow
                label="Dimensions"
                products={selected}
                gridStyle={gridStyle}
                hasAddSlot={showAddSlot}
                render={(tyre) => tyreSize(tyre)}
              />
              <ComparisonRow
                label="Pression max"
                products={selected}
                gridStyle={gridStyle}
                hasAddSlot={showAddSlot}
                render={(tyre) => formatPressure(tyre)}
              />
              <ComparisonRow
                label="Terrain"
                products={selected}
                gridStyle={gridStyle}
                hasAddSlot={showAddSlot}
                render={(tyre) => terrainLabel(tyre)}
              />
              <ComparisonRow
                label="Technologies"
                products={selected}
                gridStyle={gridStyle}
                hasAddSlot={showAddSlot}
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

function ProductImage({ tyre, className }: { tyre: TyreView; className?: string }) {
  const src = getTyreImage(tyre.globalId, tyre.cycleType, tyre.range);
  if (src) {
    return <img src={src} alt={tyreName(tyre)} className={cn("object-contain", className)} />;
  }
  return <TyreImage kind={tyreKind(tyre)} className={className} />;
}

function ProductColumn({
  tyre,
  highlighted,
  onRemove,
}: {
  tyre: TyreView;
  highlighted: boolean;
  onRemove: () => void;
}) {
  const productUrl = tyre.id != null ? `/produits/${tyre.id}` : null;

  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-lg border p-4",
        highlighted ? "border-michelin-blue bg-[#F7FAFF]" : "border-michelin-gray-line bg-white",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <Badge variant={highlighted ? "default" : "secondary"}>
          {highlighted ? "Sélection" : tyre.cycleType}
        </Badge>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Retirer ${tyreName(tyre)}`}
          className="text-xs font-semibold text-michelin-ink transition-colors hover:text-michelin-blue"
        >
          Retirer
        </button>
      </div>

      <div className="flex flex-1 flex-col items-center py-5 text-center">
        <ProductImage tyre={tyre} className="h-24 w-24" />
        <h2 className="mt-4 text-base font-black leading-tight text-michelin-navy">
          {tyreName(tyre)}
        </h2>
        <p className="mt-2 min-h-10 text-xs leading-5 text-michelin-ink">{tyre.designation}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 border-t border-michelin-gray-line pt-3 text-xs">
        <Stat label="Poids" value={formatWeight(tyre)} />
        <Stat label="TPI" value={tyre.tpi ?? "Non précisé"} />
      </div>

      {productUrl && (
        <Button asChild variant="outline" size="sm" className="mt-4 rounded-lg">
          <Link href={productUrl} aria-label={`Voir ${tyreFullName(tyre)}`}>
            Voir le produit
          </Link>
        </Button>
      )}
    </div>
  );
}

/** Colonne "+" pour ajouter un pneu via une liste deroulante (1 a 3 pneus). */
function AddSlot({ available, onAdd }: { available: TyreView[]; onAdd: (id: string) => void }) {
  return (
    <label className="flex h-full cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-michelin-gray-line bg-michelin-gray-light/40 p-4 text-center transition-colors hover:border-michelin-blue hover:bg-[#F7FAFF]">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-michelin-blue/10 text-3xl font-black leading-none text-michelin-blue">
        +
      </span>
      <span className="text-sm font-bold text-michelin-navy">Ajouter un pneu</span>
      <TyreSelect available={available} onAdd={onAdd} />
    </label>
  );
}

/** Etat vide : un gros "+" centre invitant a choisir un premier pneu. */
function EmptyState({ available, onAdd }: { available: TyreView[]; onAdd: (id: string) => void }) {
  return (
    <div className="mt-10 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-michelin-gray-line bg-michelin-gray-light/40 px-6 py-20 text-center">
      <span className="flex h-24 w-24 items-center justify-center rounded-full bg-michelin-blue/10 text-6xl font-black leading-none text-michelin-blue">
        +
      </span>
      <h2 className="mt-6 text-xl font-black text-michelin-navy">Ton comparateur est vide</h2>
      <p className="mt-2 max-w-sm text-sm text-michelin-ink">
        Choisis un premier pneu pour démarrer, puis ajoute-en jusqu&apos;à {MAX_SELECTED}.
      </p>
      <div className="mt-6 w-full max-w-xs">
        <TyreSelect available={available} onAdd={onAdd} />
      </div>
    </div>
  );
}

function TyreSelect({ available, onAdd }: { available: TyreView[]; onAdd: (id: string) => void }) {
  return (
    <select
      value=""
      onChange={(event) => onAdd(event.target.value)}
      disabled={available.length === 0}
      className="h-11 w-full rounded-lg border border-michelin-gray-line bg-white px-3 text-sm font-semibold text-michelin-navy shadow-sm outline-none transition-colors focus:border-michelin-blue focus:ring-2 focus:ring-michelin-blue/20 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <option value="">Choisir un produit</option>
      {available.map((tyre) => (
        <option key={tyre.id} value={String(tyre.id)}>
          {tyreName(tyre)} — {tyreSize(tyre)}
        </option>
      ))}
    </select>
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
  hasAddSlot = false,
  last = false,
}: {
  label: string;
  products: TyreView[];
  gridStyle: CSSProperties;
  render: (tyre: TyreView) => ReactNode;
  hasAddSlot?: boolean;
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
      {hasAddSlot && <div aria-hidden />}
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

/**
 * Resout les ids de l'URL en produits du catalogue. Accepte l'id numerique
 * Supabase OU le slug range+designation (utilise par les recommandations).
 * Ne complete pas : on affiche exactement ce qui est demande (0 a 3 pneus).
 */
function resolveSelection(queryIds: string[], catalog: TyreView[]): TyreView[] {
  return queryIds
    .map((id) => catalog.find((tyre) => String(tyre.id) === id || tyreSlug(tyre) === id))
    .filter((tyre): tyre is TyreView => Boolean(tyre))
    .slice(0, MAX_SELECTED);
}
