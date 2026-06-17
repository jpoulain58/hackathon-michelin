import { supabaseAdmin } from "@/lib/supabase/server";
import { FALLBACK_TYRES, type TyreView } from "@/lib/api";
import { ProduitsClient } from "./ProduitsClient";

async function fetchProductsFromDb(): Promise<TyreView[]> {
  const { data, error } = await supabaseAdmin
    .from("products")
    .select("id, range, designation, cycle_type, segment, use, terrain_types, weight_g")
    .order("segment")
    .order("range")
    .limit(1000);

  if (error || !data || data.length === 0) return FALLBACK_TYRES;

  return data.map((p) => ({
    id: p.id,
    range: p.range,
    designation: p.designation,
    cycleType: p.cycle_type,
    segment: p.segment,
    use: p.use ?? [],
    terrainTypes: p.terrain_types ?? [],
    weightG: p.weight_g ?? undefined,
  }));
}

export default async function ProduitsPage() {
  const tyres = await fetchProductsFromDb();
  return <ProduitsClient tyres={tyres} />;
}
