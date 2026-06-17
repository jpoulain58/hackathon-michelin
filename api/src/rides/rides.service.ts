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
  description: string;
  instructions: string;
  proTip: ProTip | null;
  pts: LatLng[];
  source: "strava" | "manual";
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
  tyre: string;
  tyreDetail: TyreDetail;
  proTip: ProTip;
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
  description: string;
  instructions: string;
  pro_tip: ProTip | null;
  pts: LatLng[] | null;
  source: "strava" | "manual";
  created_at: string;
};

/** Estimation grossiere : ~40 kcal/km a velo, suffisant pour l'affichage demo. */
const KCAL_PER_KM = 40;

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

  async listPublic(filters: { terrain?: string; difficulty?: string } = {}): Promise<RideView[]> {
    const client = this.requireClient();
    let query = client.from("rides").select("*").eq("is_public", true).order("created_at", { ascending: false });
    if (filters.terrain) query = query.eq("terrain", filters.terrain);
    if (filters.difficulty) query = query.eq("difficulty", filters.difficulty);

    const { data, error } = await query;
    if (error) throw new InternalServerErrorException(`Impossible de lire les balades: ${error.message}`);
    return ((data ?? []) as RideRow[]).map(toView);
  }

  async getById(id: string): Promise<RideView> {
    const client = this.requireClient();
    const { data, error } = await client.from("rides").select("*").eq("id", id).eq("is_public", true).maybeSingle();
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

    return this.insertRide({
      riderId: userId,
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
      tyre: form.tyre,
      tyreDetail: form.tyreDetail,
      proTip: form.proTip,
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

    return this.insertRide({
      riderId: userId,
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
      tyre: form.tyre,
      tyreDetail: form.tyreDetail,
      proTip: form.proTip,
      pts: parsed.pts,
    });
  }

  private validateForm(form: CreateRideForm): void {
    if (!form.name?.trim()) throw new BadRequestException("Nom de balade requis.");
    if (!form.terrain?.trim()) throw new BadRequestException("Terrain requis.");
    if (!form.landscape?.trim()) throw new BadRequestException("Paysage requis.");
    if (!form.tyre?.trim() || !form.tyreDetail?.name) throw new BadRequestException("Pneu conseillé requis.");
    if (!form.proTip?.author || !form.proTip?.text) throw new BadRequestException("Conseil du pro requis.");
  }

  private async insertRide(input: {
    riderId: string;
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
    tyre: string;
    tyreDetail: TyreDetail;
    proTip: ProTip;
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
        pts: input.pts,
        is_public: true,
      })
      .select("*")
      .single();

    if (error) {
      if (/duplicate key|already exists/i.test(error.message)) {
        throw new BadRequestException("Cette activité a déjà été ajoutée comme balade.");
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
    description: row.description,
    instructions: row.instructions,
    proTip: row.pro_tip,
    pts: row.pts ?? [],
    source: row.source,
    createdAt: row.created_at,
  };
}
