import { createClient } from "@supabase/supabase-js";

// Fallbacks "build-safe" : `next build` (CI sans secrets) ne doit pas planter a
// l'instanciation. En dev/prod les vraies variables d'environnement sont
// presentes ; ces valeurs ne servent qu'a eviter le throw "supabaseUrl is
// required" lors de la collecte des pages.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://localhost:54321";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "build-placeholder";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "build-placeholder";

// Client anon pour les données publiques (articles)
export const supabaseServer = createClient(url, anonKey);

// Client service role pour les données restreintes (products)
export const supabaseAdmin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
