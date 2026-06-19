import { supabaseAdmin } from "@/lib/supabase/server";

export interface ProductReview {
  id: number;
  productId: number;
  rating: number;
  text: string;
  createdAt: string;
  riderName: string;
  isAmbassador: boolean;
  tyre?: string;
}

type ReviewRow = {
  id: number;
  product_id: number;
  rating: number;
  text: string;
  created_at: string;
  riders: { display_name: string; is_ambassador: boolean } | null;
  products: { brand: string | null; range: string; designation: string } | null;
};

const REVIEW_SELECT =
  "id, product_id, rating, text, created_at, riders(display_name, is_ambassador), products!inner(brand, range, designation)";

function mapRow(row: ReviewRow): ProductReview | null {
  if (!row.products) return null;
  return {
    id: row.id,
    productId: row.product_id,
    rating: row.rating,
    text: row.text,
    createdAt: row.created_at,
    riderName: row.riders?.display_name ?? "Rider Michelin",
    isAmbassador: row.riders?.is_ambassador ?? false,
    tyre: productLabel(row.products),
  };
}

function sortAmbassadorFirst(items: ProductReview[]): ProductReview[] {
  return [...items].sort((a, b) => Number(b.isAmbassador) - Number(a.isAmbassador));
}

export async function listReviewsForProduct(productId: number): Promise<ProductReview[]> {
  const { data, error } = await supabaseAdmin
    .from("reviews")
    .select(REVIEW_SELECT)
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return sortAmbassadorFirst((data as unknown as ReviewRow[]).map(mapRow).filter((review): review is ProductReview => Boolean(review)));
}

export async function listRecentReviews(limit = 20): Promise<{ items: ProductReview[]; count: number }> {
  const { data, error, count } = await supabaseAdmin
    .from("reviews")
    .select(REVIEW_SELECT, { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 50));

  if (error || !data) return { items: [], count: 0 };
  const items = (data as unknown as ReviewRow[]).map(mapRow).filter((review): review is ProductReview => Boolean(review));
  return { items: sortAmbassadorFirst(items), count: count ?? items.length };
}

export type CreateReviewResult = { ok: true } | { ok: false; status: number; error: string };

export async function createOrUpdateReview(
  authorization: string | null,
  input: { productId: number; rating: number; text: string },
): Promise<CreateReviewResult> {
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return { ok: false, status: 401, error: "Connecte-toi pour laisser un avis." };

  const {
    data: { user },
    error: authError,
  } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return { ok: false, status: 401, error: "Session Supabase invalide." };

  const { productId, rating, text } = input;
  if (
    !Number.isInteger(productId) ||
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5 ||
    text.trim().length < 3
  ) {
    return { ok: false, status: 400, error: "Avis invalide : note (1 à 5) et texte requis." };
  }

  const { data: product, error: productError } = await supabaseAdmin
    .from("products")
    .select("id")
    .eq("id", productId)
    .maybeSingle();
  if (productError || !product) return { ok: false, status: 400, error: "Pneu introuvable dans le catalogue." };

  const { error } = await supabaseAdmin.from("reviews").upsert(
    {
      product_id: productId,
      rider_id: user.id,
      rating,
      text: text.trim(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "product_id,rider_id" },
  );

  if (error) return { ok: false, status: 500, error: error.message };
  return { ok: true };
}

function productLabel(product: { brand: string | null; range: string; designation: string }): string {
  const range = product.range.trim();
  const brand = product.brand?.trim();
  const name = brand && !range.toLowerCase().includes(brand.toLowerCase()) ? `${brand} ${range}` : range;
  return [name, product.designation].filter(Boolean).join(" ");
}
