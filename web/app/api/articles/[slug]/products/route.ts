import { NextResponse } from "next/server";
import { supabaseAdmin, supabaseServer } from "@/lib/supabase/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Résoudre l'article via le client public
  if (!supabaseServer || !supabaseAdmin) {
    return NextResponse.json({ products: [] });
  }

  const { data: article } = await supabaseServer
    .from("articles")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!article) {
    return NextResponse.json({ products: [] });
  }

  // Récupérer les pneus liés via service role
  const { data: rows, error } = await supabaseAdmin
    .from("article_products")
    .select("position, products(id, designation, range, cycle_type, segment, use, terrain_types, weight_g, technologies)")
    .eq("article_id", article.id)
    .order("position");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const products = (rows ?? []).map((r: any) => r.products);

  return NextResponse.json({ products });
}
