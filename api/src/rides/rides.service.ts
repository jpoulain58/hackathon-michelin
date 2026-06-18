import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { createClient, type SupabaseClient, type WebSocketLikeConstructor } from "@supabase/supabase-js";
import WebSocket from "ws";
import "../env";
import { StravaService } from "../auth/strava.service";
import { parseGpx } from "./gpx";
import { decodePolyline, type LatLng } from "./polyline";

const realtimeTransport = WebSocket as unknown as WebSocketLikeConstructor;

export interface TyreDetail {
  name: string;
  designation: string;
  weightG: number;
  dimensions: number;
}

export interface ProTip {
  author: string;
  text: string;
}

export interface UsedTyre {
  productId: number;
  brand: string | null;
  range: string;
  designation: string;
  rating: number | null;
}

export interface RideView {
  id: string;
  name: string;
  km: number;
  dplus: number;
  durationSeconds: number;
  kcal: number | null;
  terrain: string;
  landscape: string | null;
  difficulty: string;
  tags: string[];
  tyre: string | null;
  tyreDetail: TyreDetail | null;
  usedTyre: UsedTyre | null;
  description: string;
  instructions: string;
  proTip: ProTip | null;
  pts: LatLng[];
  source: "strava" | "manual";
  isAmbassador: boolean;
  createdAt: string;
}

export interface CreateRideForm {
  name: string;
  description?: string;
  instructions?: string;
  terrain: string;
  landscape: string;
  difficulty?: string;
  tags?: string[];
  tyre?: string;
  tyreDetail?: TyreDetail;
  proTip?: ProTip;
  usedTyreProductId?: number;
  usedTyreRating?: number;
  kcal?: number;
}

type RideRow = {
  id: string;
  name: string;
  km: number | string;
  dplus: number;
  duration_seconds: number;
  kcal: number | null;
  terrain: string;
  landscape: string | null;
  difficulty: string;
  tags: string[] | null;
  tyre: string | null;
  tyre_detail: TyreDetail | null;
  used_tyre_product_id: number | null;
  used_tyre_rating: number | null;
  used_tyre_product: { id: number; brand: string | null; range: string; designation: string } | null;
  description: string;
  instructions: string;
  pro_tip: ProTip | null;
  pts: LatLng[] | null;
  source: "strava" | "manual";
  is_ambassador: boolean;
  created_at: string;
};

/** Estimation grossiere : ~40 kcal/km a velo, suffisant pour l'affichage demo. */
const KCAL_PER_KM = 40;

const RIDE_SELECT = "*, used_tyre_product:products(id, brand, range, designation)";

@Injectable()
export class RidesService {
  private readonly supabase: SupabaseClient | null;

  constructor(private readonly stravaService: StravaService) {
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

  async listPublic(
    filters: { terrain?: string; difficulty?: string; ambassador?: boolean } = {},
  ): Promise<RideView[]> {
    const client = this.requireClient();
    let query = client
      .from("rides")
      .select(RIDE_SELECT)
      .eq("is_public", true)
      .order("created_at", { ascending: false });
    if (filters.terrain) query = query.eq("terrain", filters.terrain);
    if (filters.difficulty) query = query.eq("difficulty", filters.difficulty);
    if (filters.ambassador) query = query.eq("is_ambassador", true);

    const { data, error } = await query;
    if (error) throw new InternalServerErrorException(`Impossible de lire les balades: ${error.message}`);
    return ((data ?? []) as RideRow[]).map(toView);
  }

  async getById(id: string): Promise<RideView> {
    const client = this.requireClient();
    const { data, error } = await client
      .from("rides")
      .select(RIDE_SELECT)
      .eq("id", id)
      .eq("is_public", true)
      .maybeSingle();
    if (error) throw new InternalServerErrorException(`Impossible de lire la balade: ${error.message}`);
    if (!data) throw new NotFoundException("Balade introuvable.");
    return toView(data as RideRow);
  }

  async createFromStrava(userId: string, activityId: string, form: CreateRideForm): Promise<RideView> {
    this.validateForm(form);

    const strava = await this.stravaService.getProfile(userId);
    const activity = strava?.recentActivities.find((a) => a.id === activityId);
    if (!activity) {
      throw new BadRequestException(
        "Activité Strava introuvable dans les sorties récentes. Actualise ton profil Strava puis réessaie.",
      );
    }
    if (!activity.polyline) {
      throw new BadRequestException("Cette activité Strava n'a pas de tracé GPS exploitable.");
    }

    const pts = decodePolyline(activity.polyline);
    const km = activity.distanceKm;
    const dplus = activity.elevationM;
    const isAmbassador = await this.isRiderAmbassador(userId);

    return this.insertRide({
      riderId: userId,
      isAmbassador,
      source: "strava",
      stravaActivityId: activityId,
      name: form.name,
      description: form.description ?? "",
      instructions: form.instructions ?? "",
      km,
      dplus,
      durationSeconds: activity.movingTimeSeconds,
      kcal: form.kcal ?? Math.round(km * KCAL_PER_KM),
      terrain: form.terrain,
      landscape: form.landscape,
      difficulty: form.difficulty ?? "Intermédiaire",
      tags: form.tags ?? [],
      tyre: form.tyre ?? null,
      tyreDetail: form.tyreDetail ?? null,
      proTip: form.proTip ?? null,
      usedTyreProductId: form.usedTyreProductId ?? null,
      usedTyreRating: form.usedTyreRating ?? null,
      pts,
    });
  }

  async createFromGpx(userId: string, gpxXml: string, form: CreateRideForm): Promise<RideView> {
    this.validateForm(form);
    if (!gpxXml?.trim()) throw new BadRequestException("Fichier GPX vide.");

    let parsed;
    try {
      parsed = parseGpx(gpxXml);
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : "GPX invalide.");
    }

    const isAmbassador = await this.isRiderAmbassador(userId);

    return this.insertRide({
      riderId: userId,
      isAmbassador,
      source: "manual",
      stravaActivityId: null,
      name: form.name,
      description: form.description ?? "",
      instructions: form.instructions ?? "",
      km: parsed.km,
      dplus: parsed.dplus,
      durationSeconds: parsed.durationSeconds,
      kcal: form.kcal ?? Math.round(parsed.km * KCAL_PER_KM),
      terrain: form.terrain,
      landscape: form.landscape,
      difficulty: form.difficulty ?? "Intermédiaire",
      tags: form.tags ?? [],
      tyre: form.tyre ?? null,
      tyreDetail: form.tyreDetail ?? null,
      proTip: form.proTip ?? null,
      usedTyreProductId: form.usedTyreProductId ?? null,
      usedTyreRating: form.usedTyreRating ?? null,
      pts: parsed.pts,
    });
  }

  private validateForm(form: CreateRideForm): void {
    if (!form.name?.trim()) throw new BadRequestException("Nom de balade requis.");
    if (!form.terrain?.trim()) throw new BadRequestException("Terrain requis.");
    if (!form.landscape?.trim()) throw new BadRequestException("Paysage requis.");
    if (form.usedTyreRating != null) {
      if (!form.usedTyreProductId) throw new BadRequestException("Choisis un pneu avant de le noter.");
      if (!Number.isInteger(form.usedTyreRating) || form.usedTyreRating < 1 || form.usedTyreRating > 5) {
        throw new BadRequestException("La note du pneu doit être comprise entre 1 et 5.");
      }
    }
  }

  /** Statut ambassadeur calcule cote serveur depuis `riders` : jamais fourni par le client. */
  private async isRiderAmbassador(riderId: string): Promise<boolean> {
    const client = this.requireClient();
    const { data, error } = await client
      .from("riders")
      .select("is_ambassador")
      .eq("id", riderId)
      .maybeSingle();
    if (error || !data) return false;
    return Boolean((data as { is_ambassador: boolean }).is_ambassador);
  }

  private async insertRide(input: {
    riderId: string;
    isAmbassador: boolean;
    source: "strava" | "manual";
    stravaActivityId: string | null;
    name: string;
    description: string;
    instructions: string;
    km: number;
    dplus: number;
    durationSeconds: number;
    kcal: number;
    terrain: string;
    landscape: string;
    difficulty: string;
    tags: string[];
    tyre: string | null;
    tyreDetail: TyreDetail | null;
    proTip: ProTip | null;
    usedTyreProductId: number | null;
    usedTyreRating: number | null;
    pts: LatLng[];
  }): Promise<RideView> {
    const client = this.requireClient();

    const { data, error } = await client
      .from("rides")
      .insert({
        rider_id: input.riderId,
        source: input.source,
        strava_activity_id: input.stravaActivityId,
        name: input.name,
        description: input.description,
        instructions: input.instructions,
        km: input.km,
        dplus: input.dplus,
        duration_seconds: input.durationSeconds,
        kcal: input.kcal,
        terrain: input.terrain,
        landscape: input.landscape,
        difficulty: input.difficulty,
        tags: input.tags,
        tyre: input.tyre,
        tyre_detail: input.tyreDetail,
        pro_tip: input.proTip,
        used_tyre_product_id: input.usedTyreProductId,
        used_tyre_rating: input.usedTyreRating,
        pts: input.pts,
        is_public: true,
        is_ambassador: input.isAmbassador,
      })
      .select(RIDE_SELECT)
      .single();

    if (error) {
      if (/duplicate key|already exists/i.test(error.message)) {
        throw new BadRequestException("Cette activité a déjà été ajoutée comme balade.");
      }
      if (/foreign key|violates/i.test(error.message)) {
        throw new BadRequestException("Pneu sélectionné introuvable dans le catalogue.");
      }
      throw new InternalServerErrorException(`Impossible de créer la balade: ${error.message}`);
    }

    return toView(data as RideRow);
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

function toView(row: RideRow): RideView {
  return {
    id: row.id,
    name: row.name,
    km: Number(row.km),
    dplus: row.dplus,
    durationSeconds: row.duration_seconds,
    kcal: row.kcal,
    terrain: row.terrain,
    landscape: row.landscape,
    difficulty: row.difficulty,
    tags: row.tags ?? [],
    tyre: row.tyre,
    tyreDetail: row.tyre_detail,
    usedTyre: row.used_tyre_product
      ? {
          productId: row.used_tyre_product.id,
          brand: row.used_tyre_product.brand,
          range: row.used_tyre_product.range,
          designation: row.used_tyre_product.designation,
          rating: row.used_tyre_rating,
        }
      : null,
    description: row.description,
    instructions: row.instructions,
    proTip: row.pro_tip,
    pts: row.pts ?? [],
    source: row.source,
    isAmbassador: row.is_ambassador,
    createdAt: row.created_at,
  };
}
