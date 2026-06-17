"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SignOutButton } from "@/components/SignOutButton";
import { API_BASE } from "@/lib/api";
import {
  fetchAuthProfile,
  type AuthProfile,
  type ProviderId,
  type ProviderSummary,
  type StravaProfile,
} from "@/lib/auth/profile";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

const PREFERENCES = [
  "Recevoir les recommandations pneus après une grosse sortie",
  "Partager mes avis vérifiés avec la communauté",
  "Afficher mon statut Club sur mon profil public",
];

const PROVIDERS: Array<{
  id: ProviderId;
  label: string;
  detail: string;
}> = [
  { id: "strava", label: "Strava", detail: "Sorties, kilomètres et D+ vérifiés" },
  { id: "garmin", label: "Garmin", detail: "Compte sport relié au même profil" },
  { id: "google", label: "Google", detail: "Connexion rapide au compte" },
];

export function ProfileClient() {
  const [session, setSession] = useState<Session | null>(null);
  const [authProfile, setAuthProfile] = useState<AuthProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileRefreshing, setProfileRefreshing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [linkingProvider, setLinkingProvider] = useState<ProviderId | null>(null);
  const [preferences, setPreferences] = useState(() => PREFERENCES.map(() => true));

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session) {
      setAuthProfile(null);
      return;
    }

    let mounted = true;
    setProfileLoading(true);
    fetchAuthProfile(session)
      .then((profile) => {
        if (!mounted) return;
        setAuthProfile(profile);
        if (profile?.strava?.error) setSyncStatus(profile.strava.error);
      })
      .catch((error) => {
        if (!mounted) return;
        setSyncStatus(error instanceof Error ? error.message : "Profil impossible à charger.");
      })
      .finally(() => {
        if (mounted) setProfileLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [session]);

  const profile = useMemo(() => getProfile(session, authProfile), [session, authProfile]);
  const providerStatuses = useMemo(
    () => getProviderStatuses(session, authProfile),
    [session, authProfile],
  );
  const stats = useMemo(() => buildStats(authProfile), [authProfile]);
  const strava = authProfile?.strava ?? null;

  async function refreshProfile(forceStrava = false) {
    if (!session) return;

    setProfileRefreshing(true);
    setSyncStatus(forceStrava ? "Actualisation Strava en cours..." : null);
    try {
      const nextProfile = await fetchAuthProfile(session, { refresh: forceStrava });
      setAuthProfile(nextProfile);
      setSyncStatus(
        forceStrava
          ? nextProfile?.strava?.error ?? "Données Strava actualisées."
          : null,
      );
    } catch (error) {
      setSyncStatus(error instanceof Error ? error.message : "Synchronisation impossible.");
    } finally {
      setProfileRefreshing(false);
    }
  }

  async function linkProvider(providerId: ProviderId) {
    if (!session || !supabase) return;

    setLinkingProvider(providerId);
    setSyncStatus(null);

    try {
      const callbackUrl = new URL("/auth/callback", window.location.origin);
      callbackUrl.searchParams.set("next", `/profil?linked=${providerId}`);

      if (providerId === "strava" || providerId === "garmin") {
        const searchParam = providerId === "strava" ? "redirect_to" : "mobile_redirect_to";
        const startUrl = `${API_BASE}/api/auth/${providerId}/start?${searchParam}=${encodeURIComponent(
          callbackUrl.toString(),
        )}`;
        const response = await fetch(startUrl, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as { message?: string };
          throw new Error(body.message ?? `Liaison ${providerId} impossible (${response.status}).`);
        }

        const { authorizeUrl } = (await response.json()) as { authorizeUrl?: string };
        if (!authorizeUrl) throw new Error(`URL d'autorisation ${providerId} introuvable.`);
        window.location.href = authorizeUrl;
        return;
      }

      const { error } = await supabase.auth.linkIdentity({
        provider: "google",
        options: { redirectTo: callbackUrl.toString() },
      });
      if (error) throw error;
    } catch (error) {
      setSyncStatus(error instanceof Error ? error.message : "Liaison du compte impossible.");
      setLinkingProvider(null);
    }
  }

  if (loading) {
    return (
      <section className="mx-auto flex min-h-[55vh] max-w-6xl items-center px-6 py-16">
        <div className="h-2 w-48 overflow-hidden rounded-pill bg-michelin-gray-light">
          <span className="block h-full w-1/2 animate-shimmer rounded-pill bg-michelin-blue" />
        </div>
      </section>
    );
  }

  if (!isSupabaseConfigured) {
    return (
      <ProfileShell
        title="Profil indisponible"
        subtitle="La configuration Supabase manque dans l'environnement web."
      >
        <Card className="max-w-2xl">
          <CardContent className="p-6">
            <p className="text-sm text-michelin-ink">
              Renseigne `NEXT_PUBLIC_SUPABASE_URL` et
              `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` pour activer le profil et la
              déconnexion.
            </p>
          </CardContent>
        </Card>
      </ProfileShell>
    );
  }

  if (!session) {
    return (
      <ProfileShell
        title="Connecte-toi pour accéder à ton profil"
        subtitle="Retrouve tes sorties synchronisées, tes avis vérifiés et tes avantages Club."
      >
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/">Se connecter</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/accueil">Continuer sans compte</Link>
          </Button>
        </div>
      </ProfileShell>
    );
  }

  return (
    <>
      <section className="mesh-navy text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 py-14 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <span className="kicker">Mon profil</span>
            <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center">
              <Avatar name={profile.name} avatarUrl={profile.avatarUrl} />
              <div className="min-w-0">
                <h1 className="break-words text-4xl font-black tracking-tight sm:text-5xl">
                  {profile.name}
                </h1>
                <p className="mt-2 break-all text-sm font-semibold text-white/75">
                  {profile.email}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge className="bg-michelin-yellow text-michelin-navy">
                    {strava ? "Rider vérifié Strava" : "Profil Trust Wheels"}
                  </Badge>
                  <Badge variant="outline" className="border-white/25 text-white">
                    {formatTier(authProfile?.rider.tier)}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <Card className="border-white/15 bg-white/10 text-white shadow-glow backdrop-blur">
            <CardContent className="p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-white/55">
                Dernière synchro Strava
              </p>
              <p className="mt-1 text-lg font-bold">
                {strava?.lastSyncAt ? formatDateTime(strava.lastSyncAt) : "Aucune synchro"}
              </p>
              <div className="mt-5 flex gap-2">
                {strava ? (
                  <Button
                    onClick={() => refreshProfile(true)}
                    disabled={profileRefreshing}
                    className="flex-1 bg-white text-michelin-navy hover:bg-michelin-yellow"
                  >
                    {profileRefreshing ? "Actualisation..." : "Actualiser"}
                  </Button>
                ) : (
                  <Button
                    onClick={() => linkProvider("strava")}
                    disabled={linkingProvider !== null}
                    className="flex-1 bg-white text-michelin-navy hover:bg-michelin-yellow"
                  >
                    {linkingProvider === "strava" ? "Ouverture..." : "Relier Strava"}
                  </Button>
                )}
                <SignOutButton className="rounded-pill border border-white/25 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10" />
              </div>
              {syncStatus ? (
                <p className="mt-3 text-xs font-semibold text-white/75">{syncStatus}</p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-6 py-12 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {stats.map((stat) => (
              <Card key={stat.label} className="card-interactive">
                <CardContent className="p-5">
                  <p className="text-sm font-semibold text-michelin-ink">{stat.label}</p>
                  <p className="mt-2 text-3xl font-black text-gradient-blue">{stat.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <StravaActivityCard
            strava={strava}
            loading={profileLoading}
            onLink={() => linkProvider("strava")}
            linking={linkingProvider === "strava"}
          />

          <Card>
            <CardHeader>
              <CardTitle>Préférences du compte</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {PREFERENCES.map((preference, index) => (
                <label
                  key={preference}
                  className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-michelin-gray-line px-4 py-3"
                >
                  <span className="text-sm font-semibold text-michelin-navy">{preference}</span>
                  <input
                    type="checkbox"
                    checked={preferences[index]}
                    onChange={() =>
                      setPreferences((current) =>
                        current.map((value, currentIndex) =>
                          currentIndex === index ? !value : value,
                        ),
                      )
                    }
                    className="h-5 w-5 accent-michelin-blue"
                  />
                </label>
              ))}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Comptes connectés</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {PROVIDERS.map((provider) => {
                const status = providerStatuses.get(provider.id);
                const connected = Boolean(status?.connected);
                const canRefresh = connected && (provider.id === "strava" || provider.id === "garmin");
                return (
                  <div key={provider.id} className="rounded-xl border border-michelin-gray-line p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-michelin-navy">{provider.label}</p>
                        <p className="mt-1 text-xs text-michelin-ink">{provider.detail}</p>
                        {status?.lastSyncAt ? (
                          <p className="mt-2 text-[0.7rem] font-semibold uppercase tracking-wide text-michelin-ink/60">
                            Sync {formatDateTime(status.lastSyncAt)}
                          </p>
                        ) : null}
                      </div>
                      <Badge variant={connected ? "success" : "secondary"}>
                        {connected ? "Connecté" : "À relier"}
                      </Badge>
                    </div>
                    {!connected || canRefresh ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-4 w-full"
                        disabled={linkingProvider !== null}
                        onClick={() => linkProvider(provider.id)}
                      >
                        {linkingProvider === provider.id
                          ? "Ouverture..."
                          : connected
                            ? "Reconnecter"
                            : `Relier ${provider.label}`}
                      </Button>
                    ) : null}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Button asChild variant="outline">
                <Link href="/trouve-ton-pneu">Mettre à jour ma recommandation</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/club">Gérer mon abonnement Club</Link>
              </Button>
              <SignOutButton className="inline-flex h-11 items-center justify-center rounded-pill border border-michelin-gray-line bg-white px-6 py-3 text-sm font-semibold text-michelin-navy transition-colors hover:border-michelin-blue hover:text-michelin-blue" />
            </CardContent>
          </Card>
        </aside>
      </section>
    </>
  );
}

function StravaActivityCard({
  strava,
  loading,
  onLink,
  linking,
}: {
  strava: StravaProfile | null;
  loading: boolean;
  onLink: () => void;
  linking: boolean;
}) {
  if (!strava) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activité Strava</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border border-dashed border-michelin-gray-line p-5">
            <p className="font-bold text-michelin-navy">
              {loading ? "Chargement du profil..." : "Aucun compte Strava relié"}
            </p>
            <p className="mt-2 text-sm text-michelin-ink">
              Relie Strava pour afficher les kilomètres, le dénivelé et les dernières sorties vélo.
            </p>
            <Button type="button" className="mt-4" onClick={onLink} disabled={linking}>
              {linking ? "Ouverture..." : "Relier Strava"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle>Activité Strava</CardTitle>
          <p className="mt-1 text-sm text-michelin-ink">
            {strava.athlete.city || strava.athlete.country
              ? [strava.athlete.city, strava.athlete.country].filter(Boolean).join(", ")
              : strava.athlete.username ?? "Athlète Strava"}
          </p>
        </div>
        <Badge variant={strava.error ? "secondary" : "success"}>
          {strava.error ? "Cache local" : "À jour"}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <Metric label="Km vélo" value={formatKm(strava.totals.allRideKm)} />
          <Metric label="Sorties" value={String(strava.totals.allRideCount)} />
          <Metric label="D+" value={`${formatInteger(strava.totals.allRideElevationM)} m`} />
        </div>

        {strava.error ? (
          <p className="rounded-xl bg-michelin-gray-light px-3 py-2 text-sm font-semibold text-michelin-ink">
            {strava.error}
          </p>
        ) : null}

        <div className="space-y-2">
          {strava.recentActivities.length > 0 ? (
            strava.recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="grid gap-2 rounded-xl border border-michelin-gray-line px-4 py-3 sm:grid-cols-[1fr_auto]"
              >
                <div className="min-w-0">
                  <p className="truncate font-bold text-michelin-navy">{activity.name}</p>
                  <p className="mt-1 text-xs font-semibold text-michelin-ink/70">
                    {activity.startDate ? formatDate(activity.startDate) : activity.sportType}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-sm font-bold text-michelin-navy sm:justify-end">
                  <span>{formatKm(activity.distanceKm)}</span>
                  <span className="text-michelin-ink/55">{formatDuration(activity.movingTimeSeconds)}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="rounded-xl bg-michelin-gray-light px-3 py-3 text-sm font-semibold text-michelin-ink">
              Aucune sortie vélo récente renvoyée par Strava.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-michelin-gray-light px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-wide text-michelin-ink/60">{label}</p>
      <p className="mt-1 text-xl font-black text-michelin-navy">{value}</p>
    </div>
  );
}

function ProfileShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <span className="kicker">Mon profil</span>
      <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-tight text-michelin-navy sm:text-5xl">
        {title}
      </h1>
      <p className="mt-3 max-w-2xl text-michelin-ink">{subtitle}</p>
      <div className="mt-8">{children}</div>
    </section>
  );
}

function Avatar({ name, avatarUrl }: { name: string; avatarUrl?: string }) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt=""
        className="h-24 w-24 shrink-0 rounded-full border-4 border-white/25 object-cover shadow-glow"
      />
    );
  }

  return (
    <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4 border-white/25 bg-michelin-yellow text-3xl font-black text-michelin-navy shadow-glow">
      {initials(name)}
    </div>
  );
}

function getProfile(session: Session | null, authProfile: AuthProfile | null) {
  const user = session?.user;
  const metadata = user?.user_metadata ?? {};
  const strava = authProfile?.strava;
  const rawEmail = authProfile?.user.email ?? user?.email ?? null;
  const stravaName = [strava?.athlete.firstname, strava?.athlete.lastname]
    .filter(Boolean)
    .join(" ")
    .trim();
  const rawName =
    authProfile?.rider.display_name ||
    stravaName ||
    stringValue(metadata.full_name) ||
    stringValue(metadata.name) ||
    stringValue(metadata.user_name) ||
    displayEmail(rawEmail) ||
    "Rider Michelin";

  return {
    name: rawName,
    email: profileContact(rawEmail, strava),
    avatarUrl:
      strava?.athlete.profileMedium ??
      strava?.athlete.profile ??
      stringValue(metadata.avatar_url) ??
      stringValue(metadata.picture),
  };
}

function getProviderStatuses(
  session: Session | null,
  authProfile: AuthProfile | null,
): Map<ProviderId, ProviderSummary> {
  const statuses = new Map<ProviderId, ProviderSummary>();

  for (const provider of authProfile?.providers ?? []) {
    statuses.set(provider.id, provider);
  }

  for (const identity of session?.user.identities ?? []) {
    const provider = normalizeProvider(identity.provider);
    if (!provider || statuses.has(provider)) continue;
    statuses.set(provider, {
      id: provider,
      connected: true,
      providerUserId: identity.id,
      scopes: [],
      linkedAt: identity.created_at ?? null,
      lastSyncAt: null,
    });
  }

  return statuses;
}

function buildStats(authProfile: AuthProfile | null) {
  const strava = authProfile?.strava;
  return [
    {
      label: "Kilomètres vérifiés",
      value: strava ? formatKm(strava.totals.allRideKm) : `${formatInteger(authProfile?.rider.total_km ?? 0)} km`,
    },
    {
      label: "Sorties analysées",
      value: String(strava?.totals.allRideCount ?? 0),
    },
    {
      label: "Avis utiles",
      value: String(authProfile?.rider.reviews_count ?? 0),
    },
  ];
}

function normalizeProvider(value: string): ProviderId | null {
  const provider = value.toLowerCase();
  if (provider.includes("strava")) return "strava";
  if (provider.includes("garmin")) return "garmin";
  if (provider.includes("google")) return "google";
  return null;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function displayEmail(value: string | null): string | undefined {
  if (!value || isSyntheticStravaEmail(value)) return undefined;
  return value;
}

function profileContact(email: string | null, strava: StravaProfile | null | undefined): string {
  const realEmail = displayEmail(email);
  if (realEmail) return realEmail;
  if (strava?.athlete.username) return `@${strava.athlete.username} sur Strava`;
  if (strava?.athlete.id) return `ID Strava ${strava.athlete.id}`;
  return "Contact non disponible";
}

function isSyntheticStravaEmail(value: string): boolean {
  return /^strava_[^@]+@users\.trustwheels\.app$/i.test(value);
}

function initials(value: string): string {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "TW";
  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatTier(value?: string): string {
  if (!value) return "Club starter";
  return value.toLowerCase() === "rookie" ? "Club starter" : `Club ${value.toLowerCase()}`;
}

function formatKm(value: number): string {
  if (value >= 1000) return `${formatNumber(value)} km`;
  return `${value.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} km`;
}

function formatNumber(value: number): string {
  return value.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
}

function formatInteger(value: number): string {
  return Math.round(value).toLocaleString("fr-FR");
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(value));
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);
  if (hours <= 0) return `${minutes} min`;
  return `${hours} h ${String(minutes).padStart(2, "0")}`;
}
