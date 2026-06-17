import type { RecoView, TyreView } from "@/lib/api";

type Discipline = {
  cycleType: string;
  uses: string[];
  terrain: string[];
  avoid?: string[];
  kw?: string[];
};

type Priority = {
  label: string;
  kw?: string[];
  segment?: string[];
  tech?: string;
  lightWeight?: boolean;
  highTpi?: boolean;
};

const DISCIPLINES: Record<string, Discipline> = {
  road: {
    cycleType: "ROAD",
    uses: ["RACING", "ENDURANCE", "ALL ROAD", "E-ROAD"],
    terrain: ["ASPHALT"],
    avoid: ["CYCLOCROSS", "GRAVEL"],
  },
  gravel: {
    cycleType: "ROAD",
    uses: ["GRAVEL", "ADVENTURE", "CYCLOCROSS", "ALL ROAD"],
    terrain: ["OFFROAD HARD PACKED", "OFFROAD MIXED", "ASPHALT"],
    kw: ["GRAVEL", "ADVENTURE", "CYCLOCROSS"],
  },
  mtb: {
    cycleType: "MTB",
    uses: ["ENDURO", "CROSS COUNTRY", "DOWNHILL", "MTB LEISURE", "E-ENDURO"],
    terrain: ["OFFROAD MIXED", "OFFROAD SOFT", "OFFROAD HARD PACKED"],
  },
  city: {
    cycleType: "CITY",
    uses: ["URBAN", "TOURING", "TREKKING", "LEISURE", "E-CITY"],
    terrain: ["ASPHALT"],
  },
};

const PRIORITIES: Record<string, Priority> = {
  speed: {
    kw: ["POWER CUP", "TIME TRIAL", "PRO", "RACE"],
    segment: ["RACING", "COMPETITION"],
    lightWeight: true,
    label: "vitesse / rendement",
  },
  grip: { tech: "rubber", kw: ["MAGI-X", "GUM-X", "GRIP"], label: "adhérence" },
  durability: {
    tech: "casing",
    kw: ["PROTEK", "PROTECTION", "SHIELD", "FORCE"],
    label: "durabilité",
  },
  comfort: { highTpi: true, kw: ["ENDURANCE", "TOURING", "COMFORT"], label: "confort" },
  puncture: {
    tech: "reinforcement",
    kw: ["PROTEK", "PROTECTION", "SHIELD", "GUARD", "MAX"],
    label: "anti-crevaison",
  },
};

export function recommendTyresFromCatalog(
  catalog: TyreView[],
  profile: { discipline: string; priority: string; ebike: boolean; limit?: number },
): RecoView[] {
  const discipline = DISCIPLINES[profile.discipline];
  const priority = PRIORITIES[profile.priority];
  if (!discipline || !priority) return [];

  return catalog
    .filter((tyre) => String(tyre.productType ?? "").toUpperCase() !== "TUBE")
    .map((tyre) => ({
      ...tyre,
      ...scoreTyre(tyre, discipline, priority, profile.ebike),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, profile.limit ?? 5);
}

function scoreTyre(tyre: TyreView, discipline: Discipline, priority: Priority, ebike: boolean) {
  let score = 0;
  const why: string[] = [];

  if (tyre.cycleType === discipline.cycleType) score += 40;
  else score -= 25;

  if (discipline.uses.some((use) => has(tyre.use, use))) {
    score += 25;
    why.push("usage adapté à la discipline");
  }
  if (discipline.kw?.some((kw) => text(tyre).includes(kw))) score += 15;
  if (discipline.avoid?.some((kw) => text(tyre).includes(kw))) score -= 20;

  if (discipline.terrain.some((terrain) => has(tyre.terrainTypes, terrain))) {
    score += 12;
    why.push("terrain compatible");
  }

  if (priority.kw?.some((kw) => text(tyre).includes(kw))) {
    score += 22;
    why.push(`optimisé ${priority.label}`);
  }
  if (priority.segment?.some((segment) => tyre.segment.includes(segment))) score += 10;
  if (priority.tech && (tyre.technologies?.[priority.tech] ?? []).length > 0) {
    score += 18;
    why.push(`techno ${priority.label} (${tyre.technologies?.[priority.tech].join(", ")})`);
  }
  if (priority.lightWeight && tyre.weightG) {
    score += Math.max(0, 18 - tyre.weightG / 60);
    if (tyre.weightG < 300) why.push(`léger (${tyre.weightG} g)`);
  }
  if (priority.highTpi && Number(String(tyre.tpi).replace(/[^0-9]/g, "")) >= 60) {
    score += 8;
    why.push(`carcasse souple (${tyre.tpi} TPI)`);
  }
  if (ebike && (tyre.technologies?.ebike ?? []).length > 0) {
    score += 15;
    why.push("compatible E-Bike");
  }
  if (tyre.segment.includes("PREMIUM")) score += 5;

  return { score: Math.round(score), why: [...new Set(why)] };
}

function has(values: string[] | undefined, keyword: string) {
  return (values ?? []).some((value) => value.toUpperCase().includes(keyword.toUpperCase()));
}

function text(tyre: TyreView) {
  return `${tyre.range} ${tyre.designation} ${(tyre.use ?? []).join(" ")}`.toUpperCase();
}
