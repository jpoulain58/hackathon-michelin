import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

// Liste minimale (id + nom) pour alimenter le sélecteur du formulaire
// "laisser un avis" sur /communaute. Le catalogue complet reste confidentiel
// (cf. products.sql) : on ne renvoie ici que de quoi identifier un pneu.
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("products")
    .select("id, range, designation")
    .order("range")
    .limit(1000);

  if (error || !data) return NextResponse.json({ items: [] });

  const items = data.map((p) => ({
    id: p.id,
    name: p.designation || p.range,
  }));

  return NextResponse.json({ items });
}
