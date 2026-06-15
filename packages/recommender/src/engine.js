"use strict";
/**
 * Moteur de recommandation Michelin Trust Wheels.
 *
 * Transforme un profil de rider (discipline + priorite) en un classement
 * de pneus Michelin, a partir du catalogue produit.
 *
 * En production, `discipline` et `priority` sont deduits des donnees de
 * sortie (Strava / Garmin) plutot que saisis a la main : c'est ce qui rend
 * la recommandation — et plus tard l'avis — credibles.
 */

// --- Profils : discipline -> cycleType + usages valorises -------------------
const DISCIPLINES = {
  road: {
    label: "Route",
    cycleType: "ROAD",
    uses: ["RACING", "ENDURANCE", "ALL ROAD", "E-ROAD"],
    terrain: ["ASPHALT"],
    avoid: ["CYCLOCROSS", "GRAVEL"],
  },
  gravel: {
    label: "Gravel",
    cycleType: "ROAD",
    uses: ["GRAVEL", "ADVENTURE", "CYCLOCROSS", "ALL ROAD"],
    terrain: ["OFFROAD HARD PACKED", "OFFROAD MIXED", "ASPHALT"],
    kw: ["GRAVEL", "ADVENTURE", "CYCLOCROSS"],
  },
  mtb: {
    label: "VTT",
    cycleType: "MTB",
    uses: ["ENDURO", "CROSS COUNTRY", "DOWNHILL", "MTB LEISURE", "E-ENDURO"],
    terrain: ["OFFROAD MIXED", "OFFROAD SOFT", "OFFROAD HARD PACKED"],
  },
  city: {
    label: "Ville",
    cycleType: "CITY",
    uses: ["URBAN", "TOURING", "TREKKING", "LEISURE", "E-CITY"],
    terrain: ["ASPHALT"],
  },
};

// --- Priorite -> ce qu'on valorise dans la fiche produit --------------------
const PRIORITIES = {
  speed: { kw: ["POWER CUP", "TIME TRIAL", "PRO", "RACE"], segment: ["RACING", "COMPETITION"], lightWeight: true, label: "vitesse / rendement" },
  grip: { tech: "rubber", kw: ["MAGI-X", "GUM-X", "GRIP"], label: "adherence" },
  durability: { tech: "casing", kw: ["PROTEK", "PROTECTION", "SHIELD", "FORCE"], label: "durabilite" },
  comfort: { highTpi: true, kw: ["ENDURANCE", "TOURING", "COMFORT"], label: "confort" },
  puncture: { tech: "reinforcement", kw: ["PROTEK", "PROTECTION", "SHIELD", "GUARD", "MAX"], label: "anti-crevaison" },
};

const has = (arr, kw) => (arr || []).some((x) => String(x).toUpperCase().includes(kw.toUpperCase()));
const txt = (p) => `${p.range} ${p.designation} ${(p.use || []).join(" ")}`.toUpperCase();

/**
 * Score un produit pour un couple (discipline, priorite).
 * @returns {{ score: number, why: string[] }}
 */
function scoreProduct(p, disc, prio, ebike) {
  let s = 0;
  const why = [];

  // 1. Discipline / cycle type (filtre fort)
  if (p.cycleType === disc.cycleType) s += 40;
  else s -= 25;

  // 2. Usage
  if (disc.uses.some((u) => has(p.use, u))) { s += 25; why.push("usage adapte a la discipline"); }
  if (disc.kw && disc.kw.some((k) => txt(p).includes(k))) s += 15;
  if (disc.avoid && disc.avoid.some((a) => txt(p).includes(a))) s -= 20;

  // 3. Terrain
  if (disc.terrain.some((t) => has(p.terrainTypes, t))) { s += 12; why.push("terrain compatible"); }

  // 4. Priorite du rider
  if (prio.kw && prio.kw.some((k) => txt(p).includes(k))) { s += 22; why.push(`optimise ${prio.label}`); }
  if (prio.segment && prio.segment.some((seg) => (p.segment || "").includes(seg))) s += 10;
  if (prio.tech && (p.technologies && p.technologies[prio.tech] || []).length) {
    s += 18;
    why.push(`techno ${prio.label} (${p.technologies[prio.tech].join(", ")})`);
  }
  if (prio.lightWeight && p.weightG) {
    s += Math.max(0, 18 - p.weightG / 60);
    if (p.weightG < 300) why.push(`leger (${p.weightG} g)`);
  }
  if (prio.highTpi && Number(String(p.tpi).replace(/[^0-9]/g, "")) >= 60) {
    s += 8;
    why.push(`carcasse souple (${p.tpi} TPI)`);
  }

  // 5. E-bike
  if (ebike && (p.technologies && p.technologies.ebike || []).length) { s += 15; why.push("compatible E-Bike"); }

  // bonus segment premium (cible premium du brief)
  if ((p.segment || "").includes("PREMIUM")) s += 5;

  return { score: Math.round(s), why: [...new Set(why)] };
}

/**
 * Classe les produits pour un profil de rider.
 * @param {object[]} products
 * @param {{ discipline: string, priority: string, ebike?: boolean, limit?: number }} profile
 * @returns {{ product: object, score: number, why: string[] }[]}
 */
function recommend(products, profile) {
  const { discipline, priority, ebike = false, limit = 5 } = profile || {};
  const disc = DISCIPLINES[discipline];
  const prio = PRIORITIES[priority];
  if (!disc) throw new Error(`Discipline inconnue : ${discipline} (attendu : ${Object.keys(DISCIPLINES).join(", ")})`);
  if (!prio) throw new Error(`Priorite inconnue : ${priority} (attendu : ${Object.keys(PRIORITIES).join(", ")})`);

  return (products || [])
    .map((product) => ({ product, ...scoreProduct(product, disc, prio, ebike) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

module.exports = { DISCIPLINES, PRIORITIES, scoreProduct, recommend };
