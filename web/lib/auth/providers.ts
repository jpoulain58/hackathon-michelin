import type { Provider } from "@supabase/supabase-js";

export type AuthProviderId = "strava" | "google" | "garmin";

export type AuthProviderConfig = {
  id: AuthProviderId;
  label: string;
  supabaseProvider: Provider;
  className: string;
};

export const authProviders: AuthProviderConfig[] = [
  {
    id: "strava",
    label: "Continuer avec Strava",
    supabaseProvider: "custom:strava" as Provider,
    className: "bg-[#FC5200] text-white hover:brightness-95",
  },
  {
    id: "google",
    label: "Continuer avec Google",
    supabaseProvider: "google",
    className: "bg-white text-michelin-navy hover:bg-michelin-gray-light",
  },
  {
    id: "garmin",
    label: "Continuer avec Garmin",
    supabaseProvider: "custom:garmin" as Provider,
    className: "bg-michelin-navy text-white hover:brightness-110",
  },
];
