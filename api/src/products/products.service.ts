import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { createClient, type SupabaseClient, type WebSocketLikeConstructor } from "@supabase/supabase-js";
import WebSocket from "ws";
import "../env";

const realtimeTransport = WebSocket as unknown as WebSocketLikeConstructor;

export interface ProductOption {
  id: number;
  brand: string | null;
  range: string;
  designation: string;
  segment: string | null;
  cycleType: string | null;
}

type ProductRow = {
  id: number;
  brand: string | null;
  range: string;
  designation: string;
  segment: string | null;
  cycle_type: string | null;
};

@Injectable()
export class ProductsService {
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

  async search(query: string, limit = 10): Promise<ProductOption[]> {
    if (!this.supabase) {
      throw new InternalServerErrorException(
        "Supabase n'est pas configure cote API. Renseigne SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.",
      );
    }

    const clampedLimit = Math.min(Math.max(1, limit), 25);
    let request = this.supabase
      .from("products")
      .select("id, brand, range, designation, segment, cycle_type")
      .order("range", { ascending: true })
      .limit(clampedLimit);

    const q = query.trim().replace(/[,%]/g, " ").trim();
    if (q) {
      request = request.or(`range.ilike.%${q}%,designation.ilike.%${q}%,brand.ilike.%${q}%`);
    }

    const { data, error } = await request;
    if (error) throw new InternalServerErrorException(`Impossible de rechercher les pneus: ${error.message}`);

    return ((data ?? []) as ProductRow[]).map((row) => ({
      id: row.id,
      brand: row.brand,
      range: row.range,
      designation: row.designation,
      segment: row.segment,
      cycleType: row.cycle_type,
    }));
  }
}
