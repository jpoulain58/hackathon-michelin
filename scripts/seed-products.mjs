/**
 * Peuple la table Supabase `products` depuis products.sample.json.
 * Usage : node scripts/seed-products.mjs
 * Requires: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY dans .env (racine)
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config } from "dotenv";

config({ path: join(dirname(fileURLToPath(import.meta.url)), "../.env") });

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("❌  SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquant dans .env");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const raw = JSON.parse(
  readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), "../packages/recommender/data/products.sample.json"),
    "utf8",
  ),
);

const rows = raw.map((p) => ({
  brand: p.brand ?? "MICHELIN",
  product_type: p.productType ?? null,
  cycle_type: p.cycleType,
  segment: p.segment,
  range: p.range,
  designation: p.designation,
  fitting: p.fitting ?? null,
  use: p.use ?? [],
  terrain_types: p.terrainTypes ?? [],
  tpi: p.tpi ?? null,
  weight_g: p.weightG ?? null,
  width_etrto: p.widthEtrto ?? null,
  diameter_etrto: p.diameterEtrto ?? null,
  min_bar: p.pressure?.minBar ?? null,
  max_bar: p.pressure?.maxBar ?? null,
  min_psi: p.pressure?.minPsi ?? null,
  max_psi: p.pressure?.maxPsi ?? null,
  technologies: p.technologies ?? {},
}));

console.log(`📦  Insertion de ${rows.length} produits…`);

// Vider la table avant de réinsérer (seed idempotent)
const { error: delError } = await supabase.from("products").delete().neq("id", 0);
if (delError) {
  console.error("❌  Erreur suppression :", delError.message);
}

const { error, data } = await supabase.from("products").insert(rows).select("id");

if (error) {
  console.error("❌  Erreur Supabase :", error.message);
} else {
  console.log(`✅  ${data?.length ?? rows.length} produits insérés.`);
}
