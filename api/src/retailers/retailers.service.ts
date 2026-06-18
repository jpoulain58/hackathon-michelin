import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { createClient, type SupabaseClient, type WebSocketLikeConstructor } from "@supabase/supabase-js";
import WebSocket from "ws";
import "../env";

const realtimeTransport = WebSocket as unknown as WebSocketLikeConstructor;

export interface RetailerView {
  id: number;
  region: string | null;
  country: string | null;
  website: string;
}

type RetailerRow = {
  id: number;
  region: string | null;
  country: string | null;
  website: string;
};

@Injectable()
export class RetailersService {
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

  async list(opts: { country?: string; limit?: number } = {}): Promise<RetailerView[]> {
    if (!this.supabase) {
      throw new InternalServerErrorException(
        "Supabase n'est pas configure cote API. Renseigne SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.",
      );
    }

    const limit = Math.min(Math.max(1, opts.limit ?? 12), 50);
    let request = this.supabase
      .from("retailers")
      .select("id, region, country, website")
      .order("country", { ascending: true })
      .order("website", { ascending: true })
      .limit(limit);

    const country = opts.country?.trim();
    if (country) request = request.ilike("country", country);

    const { data, error } = await request;
    if (error) throw new InternalServerErrorException(`Impossible de charger les revendeurs: ${error.message}`);

    return ((data ?? []) as RetailerRow[]).map((row) => ({
      id: row.id,
      region: row.region,
      country: row.country,
      website: row.website,
    }));
  }
}
