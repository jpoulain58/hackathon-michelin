import { NextResponse } from "next/server";
import { listReviewsForProduct, listRecentReviews, createOrUpdateReview } from "@/lib/reviews";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const productId = searchParams.get("productId");

  if (productId) {
    const items = await listReviewsForProduct(Number(productId));
    return NextResponse.json({ items, count: items.length });
  }

  const limit = Number(searchParams.get("limit") ?? 20);
  const { items, count } = await listRecentReviews(limit);
  return NextResponse.json({ items, count });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { productId?: number; rating?: number; text?: string }
    | null;

  const result = await createOrUpdateReview(req.headers.get("authorization"), {
    productId: Number(body?.productId),
    rating: Number(body?.rating),
    text: String(body?.text ?? ""),
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ ok: true });
}
