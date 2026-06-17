import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isSupabaseConfiguredServer = Boolean(url && publishableKey);
export const isSupabaseConfiguredAdmin = Boolean(url && serviceRoleKey);

// Client anon pour les données publiques (articles)
export const supabaseServer = isSupabaseConfiguredServer
  ? createClient(url!, publishableKey!)
  : null;

// Client service role pour les données restreintes (products)
export const supabaseAdmin = isSupabaseConfiguredAdmin
  ? createClient(url!, serviceRoleKey!, { auth: { autoRefreshToken: false, persistSession: false } })
  : null;
