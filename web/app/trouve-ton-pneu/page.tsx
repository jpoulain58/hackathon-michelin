import { FALLBACK_TYRES, type TyreView } from "@/lib/api";
import { supabaseAdmin } from "@/lib/supabase/server";
import { TrouveTonPneuClient } from "./TrouveTonPneuClient";

async function fetchCatalogFromDb(): Promise<TyreView[]> {
  const { data, error } = await supabaseAdmin
    .from("products")
    .select(
      "id, global_id, range, designation, product_type, cycle_type, segment, fitting, use, terrain_types, tpi, weight_g, width_etrto, diameter_etrto, min_bar, max_bar, min_psi, max_psi, technologies",
    )
    .order("segment")
    .order("range")
    .limit(1000);

  if (error || !data || data.length === 0) return FALLBACK_TYRES;

  return data
    .filter((p) => String(p.product_type ?? "").toUpperCase() !== "TUBE")
    .map((p) => ({
      id: p.id,
      globalId: p.global_id ?? undefined,
      range: p.range ?? "",
      designation: p.designation ?? "",
      productType: p.product_type ?? undefined,
      cycleType: p.cycle_type ?? "",
      segment: p.segment ?? "",
      fitting: p.fitting ?? undefined,
      use: p.use ?? [],
      terrainTypes: p.terrain_types ?? [],
      tpi: p.tpi ?? undefined,
      weightG: p.weight_g ?? undefined,
      widthEtrto: p.width_etrto ?? undefined,
      diameterEtrto: p.diameter_etrto ?? undefined,
      pressure: {
        minBar: p.min_bar ?? null,
        maxBar: p.max_bar ?? null,
        minPsi: p.min_psi ?? null,
        maxPsi: p.max_psi ?? null,
      },
      technologies: p.technologies ?? {},
    }));
}

export default async function TrouveTonPneuPage() {
  const catalog = await fetchCatalogFromDb();
  return <TrouveTonPneuClient catalog={catalog} />;
}
