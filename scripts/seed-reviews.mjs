/**
 * Cree de faux riders + de faux avis directement en base, pour peupler la
 * fiche produit (/produits/:id) et la liste des avis (/communaute).
 * Usage : node scripts/seed-reviews.mjs
 * Requires: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY dans .env (racine)
 * Prerequis DB : avoir execute supabase/riders.sql, supabase/products.sql,
 * supabase/ambassador.sql puis supabase/reviews.sql dans Supabase SQL Editor.
 */
import { createClient } from "@supabase/supabase-js";
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

const FAKE_RIDERS = [
  { email: "camille.d@trustwheels.demo", name: "Camille D.", isAmbassador: false },
  { email: "sofiane.b@trustwheels.demo", name: "Sofiane B.", isAmbassador: false },
  { email: "hugo.r@trustwheels.demo", name: "Hugo R.", isAmbassador: false },
  { email: "julie.b@trustwheels.demo", name: "Julie B.", isAmbassador: false },
  { email: "antoine.m@trustwheels.demo", name: "Antoine M.", isAmbassador: false },
  { email: "nadia.h@trustwheels.demo", name: "Nadia H.", isAmbassador: false },
  // Réutilise l'ambassadrice créée par seed-ambassador.mjs si elle existe déjà.
  { email: "lea.ambassadrice@trustwheels.demo", name: "Léa Ambassadrice", isAmbassador: true },
  { email: "karim.ambassadeur@trustwheels.demo", name: "Karim Ambassadeur", isAmbassador: true },
];

// `rangeQuery` filtre la table products par ilike sur `range` : on prend le
// premier match, le catalogue reel pouvant varier selon le seed produits.
const FAKE_REVIEWS = [
  {
    rider: "camille.d@trustwheels.demo",
    rangeQuery: "%POWER CUP%",
    rating: 5,
    text: "Rendement bluffant sur les bosses, je gagne clairement en vitesse moyenne. Le grip en virage est rassurant même à haute vitesse.",
  },
  {
    rider: "sofiane.b@trustwheels.demo",
    rangeQuery: "%POWER GRAVEL%",
    rating: 5,
    text: "Accroche parfaite en gravel sec comme humide, zéro crevaison depuis que je les ai montés. Le meilleur rapport grip/roulement que j'ai testé.",
  },
  {
    rider: "hugo.r@trustwheels.demo",
    rangeQuery: "%WILD ENDURO FRONT%",
    rating: 5,
    text: "En enduro, le grip dans les racines change tout. Confiance totale même sur les sections mouillées et techniques.",
  },
  {
    rider: "julie.b@trustwheels.demo",
    rangeQuery: "%CITY STREET%",
    rating: 4,
    text: "Parfait pour mon quotidien en ville, jamais de crevaison malgré les déchets sur les pistes cyclables. Très silencieux sur l'asphalte.",
  },
  {
    rider: "antoine.m@trustwheels.demo",
    rangeQuery: "%POWER PROTECTION%",
    rating: 5,
    text: "Increvable sur mes trajets quotidiens, je recommande sans hésiter pour qui roule beaucoup en ville et sur route abîmée.",
  },
  {
    rider: "nadia.h@trustwheels.demo",
    rangeQuery: "%STARGRIP%",
    rating: 5,
    text: "Indispensable en hiver. Même sur les pavés mouillés ou les feuilles mortes, ça ne glisse pas. Je recommande pour les trajets hivernaux.",
  },
  {
    rider: "lea.ambassadrice@trustwheels.demo",
    rangeQuery: "%POWER CUP S%",
    rating: 5,
    text: "Mon pneu de référence pour la montée du Puy de Dôme : nerveux, rassurant en descente, et un roulement qui ne faiblit pas sur la durée.",
  },
  {
    rider: "karim.ambassadeur@trustwheels.demo",
    rangeQuery: "%WILD ENDURO%",
    rating: 5,
    text: "Testé sur tous les terrains de la saison avec l'équipe d'ambassadeurs : le compromis grip/roulement est le meilleur de la gamme enduro.",
  },
];

async function ensureRider({ email, name, isAmbassador }) {
  const { data: existing, error: existingError } = await supabase
    .from("riders")
    .select("id")
    .eq("email", email)
    .maybeSingle();
  if (existingError) throw new Error(`Lecture riders (${email}): ${existingError.message}`);
  if (existing) return existing.id;

  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: name },
  });

  let userId;
  if (createError) {
    if (!/already.*registered/i.test(createError.message)) {
      throw new Error(`Création auth.users (${email}): ${createError.message}`);
    }
    const { data: list, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw new Error(`Recherche auth.users (${email}): ${listError.message}`);
    const match = list.users.find((u) => u.email === email);
    if (!match) throw new Error(`Utilisateur ${email} introuvable via listUsers malgré l'erreur "already registered".`);
    userId = match.id;
  } else {
    userId = created.user.id;
  }

  const { error: upsertError } = await supabase.from("riders").upsert({
    id: userId,
    email,
    display_name: name,
    provider: "manual",
    tier: isAmbassador ? "AMBASSADEUR" : "ROOKIE",
    is_ambassador: isAmbassador,
  });
  if (upsertError) throw new Error(`Upsert riders (${email}): ${upsertError.message}`);

  console.log(`👤  Rider créé : ${name} (${email})`);
  return userId;
}

async function findProductId(rangeQuery) {
  const { data, error } = await supabase
    .from("products")
    .select("id, range")
    .ilike("range", rangeQuery)
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Recherche produit "${rangeQuery}": ${error.message}`);
  return data ?? null;
}

const riderIdByEmail = new Map();
for (const rider of FAKE_RIDERS) {
  riderIdByEmail.set(rider.email, await ensureRider(rider));
}

let created = 0;
let skipped = 0;
for (const review of FAKE_REVIEWS) {
  const product = await findProductId(review.rangeQuery);
  if (!product) {
    console.log(`⏭️   Aucun produit ne correspond à "${review.rangeQuery}", avis ignoré.`);
    skipped += 1;
    continue;
  }

  const riderId = riderIdByEmail.get(review.rider);
  const { error } = await supabase.from("reviews").upsert(
    {
      product_id: product.id,
      rider_id: riderId,
      rating: review.rating,
      text: review.text,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "product_id,rider_id" },
  );
  if (error) throw new Error(`Insertion avis (${review.rider} -> ${product.range}): ${error.message}`);
  console.log(`✅  Avis créé : ${review.rider} sur "${product.range}"`);
  created += 1;
}

console.log(`\n${created} avis créés/mis à jour, ${skipped} ignorés (produit introuvable).`);
