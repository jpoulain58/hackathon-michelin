import type { RecoView } from "@/lib/api";
import { TyreImage, tyreKind } from "./TyreImage";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { RetailersSheetTrigger } from "@/components/RetailersSheetTrigger";

export function TyreCard({ tyre, rank, best = false }: { tyre: RecoView; rank: number; best?: boolean }) {
  return (
    <Card className="flex h-full flex-col card-interactive">
      <CardHeader className="flex-row items-start gap-3 space-y-0">
        <TyreImage kind={tyreKind(tyre)} className="h-14 w-14 shrink-0" />
        <div className="min-w-0 flex-1">
          {best && (
            <Badge variant="success" className="mb-1 px-2 py-0.5 font-bold">
              Meilleur choix
            </Badge>
          )}
          <div className="text-xs font-semibold uppercase tracking-wide text-michelin-ink">
            #{rank} · {tyre.segment}
          </div>
          <h3 className="mt-1 text-base font-bold leading-tight text-michelin-navy">{tyre.range}</h3>
          <p className="text-sm text-michelin-ink">{tyre.designation}</p>
        </div>
        <Badge className="shrink-0">match {tyre.score}</Badge>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{tyre.cycleType}</Badge>
          {tyre.weightG ? <Badge variant="secondary">{tyre.weightG} g</Badge> : null}
          {tyre.terrainTypes.slice(0, 2).map((t) => (
            <Badge key={t} variant="secondary">
              {t.toLowerCase()}
            </Badge>
          ))}
        </div>

        {tyre.why.length > 0 && (
          <ul className="space-y-1 text-sm text-michelin-green">
            {tyre.why.map((w) => (
              <li key={w}>+ {w}</li>
            ))}
          </ul>
        )}
      </CardContent>

      <CardFooter className="mt-auto">
        <RetailersSheetTrigger productName={tyre.range} className="w-full">
          Voir ou acheter
        </RetailersSheetTrigger>
      </CardFooter>
    </Card>
  );
}
