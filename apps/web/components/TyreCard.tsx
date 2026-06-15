import type { RecoView } from "@/lib/api";
import { TyreImage, tyreKind } from "./TyreImage";

/**
 * Carte pneu recommande.
 * Le bouton "Voir ou acheter" est un RENVOI traçable vers un revendeur
 * (deep-link + UTM) : pas de checkout in-app (cadrage PO "pas d'e-commerce").
 */
export function TyreCard({ tyre, rank, best = false }: { tyre: RecoView; rank: number; best?: boolean }) {
  const retailerUrl = `https://www.michelin.fr/velo?utm_source=trustwheels&utm_medium=app&utm_campaign=reco&q=${encodeURIComponent(
    tyre.range,
  )}`;

  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-michelin-gray-line bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <TyreImage kind={tyreKind(tyre)} className="h-14 w-14 shrink-0" />
        <div className="min-w-0 flex-1">
          {best && (
            <span className="mb-1 inline-flex items-center rounded-pill bg-michelin-green/10 px-2 py-0.5 text-xs font-bold text-michelin-green">
              Meilleur choix
            </span>
          )}
          <div className="text-xs font-semibold uppercase tracking-wide text-michelin-ink">
            #{rank} · {tyre.segment}
          </div>
          <h3 className="mt-1 text-base font-bold leading-tight text-michelin-navy">{tyre.range}</h3>
          <p className="text-sm text-michelin-ink">{tyre.designation}</p>
        </div>
        <span className="shrink-0 rounded-pill bg-michelin-navy px-3 py-1 text-xs font-bold text-michelin-yellow">
          match {tyre.score}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="chip">{tyre.cycleType}</span>
        {tyre.weightG ? <span className="chip">{tyre.weightG} g</span> : null}
        {tyre.terrainTypes.slice(0, 2).map((t) => (
          <span key={t} className="chip">
            {t.toLowerCase()}
          </span>
        ))}
      </div>

      {tyre.why.length > 0 && (
        <ul className="space-y-1 text-sm text-michelin-green">
          {tyre.why.map((w) => (
            <li key={w}>+ {w}</li>
          ))}
        </ul>
      )}

      <a
        href={retailerUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="btn-primary mt-1 w-full"
      >
        Voir ou acheter
      </a>
    </article>
  );
}
