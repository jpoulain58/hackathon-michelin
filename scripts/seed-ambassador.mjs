/**
 * Cree un faux rider ambassadeur Michelin + une balade publique a partir d'un
 * vrai fichier GPX, pour demontrer le statut "ambassadeur" sur /balades.
 * Usage : node scripts/seed-ambassador.mjs
 * Requires: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY dans .env (racine)
 * Prerequis DB : avoir execute supabase/riders.sql et supabase/ambassador.sql
 * (et supabase/products.sql + scripts/seed-products.mjs si on veut le lien pneu).
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config } from "dotenv";

const dir = dirname(fileURLToPath(import.meta.url));
config({ path: join(dir, "../.env") });

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("❌  SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant dans .env");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const FAKE_EMAIL = "lea.ambassadrice@trustwheels.demo";
const FAKE_NAME = "Léa Ambassadrice";
const RIDE_NAME = "Boucle du Puy de Dôme";

/** Parseur GPX minimal (regex sur <trkpt>), copie de api/src/rides/gpx.ts pour rester sans dependance XML. */
function parseGpx(xml) {
  const TRKPT_REGEX = /<trkpt\b[^>]*\blat="(-?[\d.]+)"[^>]*\blon="(-?[\d.]+)"[^>]*>([\s\S]*?)<\/trkpt>/g;
  const ELE_REGEX = /<ele>(-?[\d.]+)<\/ele>/;
  const TIME_REGEX = /<time>([^<]+)<\/time>/;

  const pts = [];
  const elevations = [];
  const times = [];

  for (const match of xml.matchAll(TRKPT_REGEX)) {
    const lat = Number.parseFloat(match[1]);
    const lon = Number.parseFloat(match[2]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    pts.push([lat, lon]);
    const body = match[3];
    const ele = ELE_REGEX.exec(body)?.[1];
    elevations.push(ele ? Number.parseFloat(ele) : NaN);
    const time = TIME_REGEX.exec(body)?.[1];
    const parsed = time ? Date.parse(time) : NaN;
    times.push(Number.isFinite(parsed) ? parsed : null);
  }

  if (pts.length === 0) throw new Error("Fichier GPX sans <trkpt> exploitable.");

  const toRad = (deg) => (deg * Math.PI) / 180;
  const haversineKm = (a, b) => {
    const R = 6371;
    const dLat = toRad(b[0] - a[0]);
    const dLng = toRad(b[1] - a[1]);
    const sinLat = Math.sin(dLat / 2);
    const sinLng = Math.sin(dLng / 2);
    const h = sinLat * sinLat + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * sinLng * sinLng;
    return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  };

  let km = 0;
  for (let i = 1; i < pts.length; i++) km += haversineKm(pts[i - 1], pts[i]);

  let dplus = 0;
  for (let i = 1; i < elevations.length; i++) {
    const delta = elevations[i] - elevations[i - 1];
    if (Number.isFinite(delta) && delta > 0) dplus += delta;
  }

  const validTimes = times.filter((t) => t !== null);
  const durationSeconds =
    validTimes.length >= 2 ? Math.round((validTimes[validTimes.length - 1] - validTimes[0]) / 1000) : 0;

  return { pts, km: Math.round(km * 10) / 10, dplus: Math.round(dplus), durationSeconds };
}

async function ensureAmbassadorRider() {
  const { data: existing, error: existingError } = await supabase
    .from("riders")
    .select("id")
    .eq("email", FAKE_EMAIL)
    .maybeSingle();
  if (existingError) throw new Error(`Lecture riders: ${existingError.message}`);
  if (existing) {
    console.log(`👤  Rider ambassadeur déjà présent (${existing.id}).`);
    return existing.id;
  }

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email: FAKE_EMAIL,
    email_confirm: true,
    user_metadata: { full_name: FAKE_NAME },
  });
  let userId;
  if (createError) {
    // Run précédent : l'utilisateur auth a été créé mais le upsert riders avait
    // échoué (colonne is_ambassador pas encore migrée) -> on retrouve son id.
    if (!/already.*registered/i.test(createError.message)) {
      throw new Error(`Création auth.users: ${createError.message}`);
    }
    const { data: list, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw new Error(`Recherche auth.users: ${listError.message}`);
    const match = list.users.find((u) => u.email === FAKE_EMAIL);
    if (!match) throw new Error(`Utilisateur ${FAKE_EMAIL} introuvable via listUsers malgré l'erreur "already registered".`);
    userId = match.id;
  } else {
    userId = created.user.id;
  }

  const { error: upsertError } = await supabase.from("riders").upsert({
    id: userId,
    email: FAKE_EMAIL,
    display_name: FAKE_NAME,
    provider: "manual",
    tier: "AMBASSADEUR",
    is_ambassador: true,
    club_member: true,
  });
  if (upsertError) throw new Error(`Upsert riders: ${upsertError.message}`);

  console.log(`✅  Rider ambassadeur créé (${userId}).`);
  return userId;
}

async function ensureAmbassadorRide(riderId) {
  const { data: existing, error: existingError } = await supabase
    .from("rides")
    .select("id")
    .eq("rider_id", riderId)
    .eq("name", RIDE_NAME)
    .maybeSingle();
  if (existingError) throw new Error(`Lecture rides: ${existingError.message}`);
  if (existing) {
    console.log(`🚴  Balade ambassadeur déjà présente (${existing.id}).`);
    return;
  }

  const gpxPath = join(dir, "seed-data/ambassador-puy-de-dome.gpx");
  const gpxXml = readFileSync(gpxPath, "utf8");
  const parsed = parseGpx(gpxXml);

  const { data: tyre } = await supabase
    .from("products")
    .select("id")
    .ilike("range", "%POWER CUP S%")
    .limit(1)
    .maybeSingle();

  const { error: insertError } = await supabase.from("rides").insert({
    rider_id: riderId,
    source: "manual",
    name: RIDE_NAME,
    description:
      "L'ascension mythique du Puy de Dôme, repaire d'entraînement de notre équipe d'ambassadeurs Michelin. Une grimpée régulière à ~7% sur route fermée, suivie d'une descente technique.",
    instructions: "Départ du parking du col de Ceyssat. Prévoir de l'eau, la montée ne propose aucun ravitaillement.",
    km: parsed.km,
    dplus: parsed.dplus,
    duration_seconds: parsed.durationSeconds,
    kcal: Math.round(parsed.km * 40),
    terrain: "Route",
    landscape: "Montagne",
    difficulty: "Expert",
    tags: ["grimpee", "panorama", "chrono"],
    pro_tip: {
      author: FAKE_NAME,
      text: "Garde un cadence élevée dans les premiers lacets : c'est là que la pente surprend le plus de monde.",
    },
    used_tyre_product_id: tyre?.id ?? null,
    used_tyre_rating: tyre ? 5 : null,
    pts: parsed.pts,
    is_public: true,
    is_ambassador: true,
  });
  if (insertError) throw new Error(`Insertion ride: ${insertError.message}`);

  console.log(`✅  Balade ambassadeur "${RIDE_NAME}" créée (${parsed.km} km, ${parsed.dplus} m D+).`);
}

const riderId = await ensureAmbassadorRider();
await ensureAmbassadorRide(riderId);
