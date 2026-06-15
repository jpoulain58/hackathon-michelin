export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export interface TyreView {
  range: string;
  designation: string;
  segment: string;
  cycleType: string;
  use: string[];
  terrainTypes: string[];
  weightG?: number;
  technologies?: Record<string, string[]>;
}

export interface RecoView extends TyreView {
  score: number;
  why: string[];
}

export interface Option {
  key: string;
  label: string;
}

export interface Options {
  disciplines: Option[];
  priorities: Option[];
}

/** Repli si l'API n'est pas joignable (demo offline). */
export const FALLBACK_OPTIONS: Options = {
  disciplines: [
    { key: "road", label: "Route" },
    { key: "gravel", label: "Gravel" },
    { key: "mtb", label: "VTT" },
    { key: "city", label: "Ville" },
  ],
  priorities: [
    { key: "speed", label: "vitesse / rendement" },
    { key: "grip", label: "adherence" },
    { key: "durability", label: "durabilite" },
    { key: "comfort", label: "confort" },
    { key: "puncture", label: "anti-crevaison" },
  ],
};

export async function fetchOptions(): Promise<Options> {
  const res = await fetch(`${API_BASE}/api/tyres/options`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return (await res.json()) as Options;
}

export async function fetchRecommendations(params: {
  discipline: string;
  priority: string;
  ebike: boolean;
  limit?: number;
}): Promise<RecoView[]> {
  const q = new URLSearchParams({
    discipline: params.discipline,
    priority: params.priority,
    ebike: String(params.ebike),
    limit: String(params.limit ?? 5),
  });
  const res = await fetch(`${API_BASE}/api/tyres/recommend?${q.toString()}`, { cache: "no-store" });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? `API ${res.status}`);
  }
  const data = (await res.json()) as { items: RecoView[] };
  return data.items;
}
