import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { createClient, type SupabaseClient, type WebSocketLikeConstructor } from "@supabase/supabase-js";
import WebSocket from "ws";
import "../env";
import { COMMUNITY_STATS, PRO_RIDERS, type CommunityStats, type ProRider } from "./community.data";

const realtimeTransport = WebSocket as unknown as WebSocketLikeConstructor;

export interface ReviewView {
  id: number;
  productId: number;
  rating: number;
  text: string;
  createdAt: string;
  riderName: string;
  isAmbassador: boolean;
  tyre: string;
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

@Injectable()
export class CommunityService {
  private readonly supabase: SupabaseClient | null;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    this.supabase =
      supabaseUrl && supabaseKey
        ? createClient(supabaseUrl, supabaseKey, {
            auth: { persistSession: false, autoRefreshToken: false },
            realtime: { transport: realtimeTransport },
          })
        : null;
  }

  /** Compteurs collectifs (preuve sociale "de masse"). */
  stats(): CommunityStats {
    return COMMUNITY_STATS;
  }

  /** Avis riders recents, toujours rattaches a un vrai pneu du catalogue. */
  async reviews(limit = 20): Promise<{ items: ReviewView[]; count: number }> {
    const client = this.requireClient();
    const clampedLimit = Math.min(Math.max(1, Math.trunc(limit)), 50);
    const { data, error, count } = await client
      .from("reviews")
      .select(
        "id, product_id, rating, text, created_at, riders(display_name, is_ambassador), products!inner(brand, range, designation)",
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .limit(clampedLimit);

    if (error) throw new InternalServerErrorException(`Impossible de lire les avis: ${error.message}`);
    const items = ((data ?? []) as unknown as ReviewRow[]).map(toReviewView).filter((review): review is ReviewView => Boolean(review));
    return { items: sortAmbassadorFirst(items), count: count ?? items.length };
  }

  /** Pneus des pros (benchmark communautaire). */
  pros(): ProRider[] {
    return PRO_RIDERS;
  }

  /** Fiche d'un pro (photo, palmares, pneus par competition). */
  proBySlug(slug: string): ProRider | undefined {
    return PRO_RIDERS.find((p) => p.slug === slug);
  }

  private requireClient(): SupabaseClient {
    if (!this.supabase) {
      throw new InternalServerErrorException(
        "Supabase n'est pas configure cote API. Renseigne SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.",
      );
    }
    return this.supabase;
  }
}

function toReviewView(row: ReviewRow): ReviewView | null {
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

function sortAmbassadorFirst(items: ReviewView[]): ReviewView[] {
  return [...items].sort((a, b) => Number(b.isAmbassador) - Number(a.isAmbassador));
}

function productLabel(product: { brand: string | null; range: string; designation: string }): string {
  const range = product.range.trim();
  const brand = product.brand?.trim();
  const name = brand && !range.toLowerCase().includes(brand.toLowerCase()) ? `${brand} ${range}` : range;
  return [name, product.designation].filter(Boolean).join(" ");
}
