import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { createClient, type SupabaseClient, type WebSocketLikeConstructor } from "@supabase/supabase-js";
import WebSocket from "ws";
import "../env";

const realtimeTransport = WebSocket as unknown as WebSocketLikeConstructor;

export interface TagDefinition {
  key: string;
  label: string;
  icon: string;
}

type TagRow = {
  key: string;
  label: string;
  icon: string;
  sort_order: number;
};

@Injectable()
export class TagsService {
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

  async listAll(): Promise<TagDefinition[]> {
    if (!this.supabase) {
      throw new InternalServerErrorException(
        "Supabase n'est pas configure cote API. Renseigne SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.",
      );
    }

    const { data, error } = await this.supabase.from("tags").select("*").order("sort_order", { ascending: true });
    if (error) throw new InternalServerErrorException(`Impossible de lire les tags: ${error.message}`);

    return ((data ?? []) as TagRow[]).map((row) => ({ key: row.key, label: row.label, icon: row.icon }));
  }
}
