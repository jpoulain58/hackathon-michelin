import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { TyreDetail } from "@/lib/api";
import { listReviewsForProduct } from "@/lib/reviews";
import { ProduitDetail } from "./ProduitDetail";

async function fetchProduct(id: number): Promise<TyreDetail | null> {
  const { data, error } = await supabaseAdmin
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    globalId: data.global_id ?? undefined,
    brand: data.brand ?? undefined,
    productType: data.product_type ?? undefined,
    range: data.range ?? "",
    designation: data.designation ?? "",
    cycleType: data.cycle_type ?? "",
    segment: data.segment ?? "",
    fitting: data.fitting ?? undefined,
    use: data.use ?? [],
    terrainTypes: data.terrain_types ?? [],
    tpi: data.tpi ?? undefined,
    weightG: data.weight_g ?? undefined,
    widthEtrto: data.width_etrto ?? undefined,
    diameterEtrto: data.diameter_etrto ?? undefined,
    eanCode: data.ean_code ?? undefined,
    caiCode: data.cai_code ?? undefined,
    minBar: data.min_bar ?? undefined,
    maxBar: data.max_bar ?? undefined,
    minPsi: data.min_psi ?? undefined,
    maxPsi: data.max_psi ?? undefined,
    technologies: data.technologies ?? {},
    discontinuedDate: data.discontinued_date ?? undefined,
  };
}

export default async function ProduitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await fetchProduct(Number(id));
  if (!product) notFound();
  const reviews = await listReviewsForProduct(product.id);
  return <ProduitDetail product={product} reviews={reviews} />;
}
