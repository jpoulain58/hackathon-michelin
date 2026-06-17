import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState, type ComponentProps } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BaladeFormModal } from "../components/BaladeFormModal";
import { Badge, PrimaryButton, ScreenTitle, SectionTitle } from "../components/ui";
import {
  createRideFromStrava,
  fetchAuthProfile,
  type AuthProfile,
  type CreateRideForm,
  type ProviderId,
  type ProviderSummary,
  type StravaProfile,
} from "../lib/api";
import { colors, font, radius, shadow, spacing } from "../theme";

const PREFERENCES = [
  "Recommandations après mes sorties",
  "Avis visibles dans la communauté",
  "Statut Club affiché sur mon profil",
];

type IconName = ComponentProps<typeof Ionicons>["name"];

const PROVIDERS = [
  { id: "strava", label: "Strava", icon: "pulse" },
  { id: "garmin", label: "Garmin", icon: "triangle" },
  { id: "google", label: "Google", icon: "logo-google" },
] satisfies Array<{ id: ProviderId; label: string; icon: IconName }>;

export function ProfileScreen({
  session,
  onSignOut,
  signOutLoading,
  message,
}: {
  session: Session;
  onSignOut: () => void;
  signOutLoading: boolean;
  message?: string | null;
}) {
  const [authProfile, setAuthProfile] = useState<AuthProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileRefreshing, setProfileRefreshing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [preferences, setPreferences] = useState(() => PREFERENCES.map(() => true));
  const profile = useMemo(() => getProfile(session, authProfile), [session, authProfile]);
  const providerStatuses = useMemo(
    () => getProviderStatuses(session, authProfile),
    [session, authProfile],
  );
  const stats = useMemo(() => buildStats(authProfile), [authProfile]);
  const strava = authProfile?.strava ?? null;
  const visibleMessage = syncMessage ?? message ?? null;

  useEffect(() => {
    let mounted = true;
    setProfileLoading(true);

    fetchAuthProfile(session)
      .then((profile) => {
        if (!mounted) return;
        setAuthProfile(profile);
        if (profile?.strava?.error) setSyncMessage(profile.strava.error);
      })
      .catch((error) => {
        if (!mounted) return;
        setSyncMessage(error instanceof Error ? error.message : "Profil impossible à charger.");
      })
      .finally(() => {
        if (mounted) setProfileLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [session]);

  async function refreshProfile(forceStrava = false) {
    setProfileRefreshing(true);
    setSyncMessage(forceStrava ? "Actualisation Strava en cours..." : null);

    try {
      const nextProfile = await fetchAuthProfile(session, { refresh: forceStrava });
      setAuthProfile(nextProfile);
      setSyncMessage(
        forceStrava
          ? nextProfile?.strava?.error ?? "Données Strava actualisées."
          : null,
      );
    } catch (error) {
      setSyncMessage(error instanceof Error ? error.message : "Synchronisation impossible.");
    } finally {
      setProfileRefreshing(false);
    }
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <ScreenTitle title="Profil" subtitle="Compte, connexions et préférences" />

      <View style={styles.hero}>
        <View style={styles.avatar}>
          {profile.avatarUrl ? (
            <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{initials(profile.name)}</Text>
          )}
        </View>
        <View style={styles.identity}>
          <Text style={styles.name} numberOfLines={2}>
            {profile.name}
          </Text>
          <Text style={styles.email} numberOfLines={1}>
            {profile.email}
          </Text>
          <View style={styles.badges}>
            <Badge label={strava ? "Rider vérifié Strava" : "Profil Trust Wheels"} tone="green" />
            <Badge label={formatTier(authProfile?.rider.tier)} />
          </View>
        </View>
      </View>

      <View style={styles.statsRow}>
        {stats.map((stat) => (
          <View key={stat.label} style={styles.statCard}>
            <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
              {stat.value}
            </Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <StravaActivityCard
        strava={strava}
        loading={profileLoading}
        refreshing={profileRefreshing}
        onRefresh={() => refreshProfile(true)}
        session={session}
      />

      <SectionTitle>Comptes connectés</SectionTitle>
      <View style={styles.list}>
        {PROVIDERS.map((provider) => {
          const status = providerStatuses.get(provider.id);
          const connected = Boolean(status?.connected);
          return (
            <View key={provider.id} style={styles.providerRow}>
              <View style={styles.providerIcon}>
                <Ionicons
                  name={provider.icon}
                  size={18}
                  color={connected ? colors.navy : colors.textFaint}
                />
              </View>
              <View style={styles.providerText}>
                <Text style={styles.providerName}>{provider.label}</Text>
                <Text style={styles.providerStatus}>
                  {connected ? providerStatusLabel(status) : "À relier"}
                </Text>
                {status?.lastSyncAt ? (
                  <Text style={styles.providerSync}>
                    Sync {formatDateTime(status.lastSyncAt)}
                  </Text>
                ) : null}
              </View>
              <Ionicons
                name={connected ? "checkmark-circle" : "add-circle-outline"}
                size={22}
                color={connected ? colors.green : colors.textFaint}
              />
            </View>
          );
        })}
      </View>

      <SectionTitle>Préférences</SectionTitle>
      <View style={styles.list}>
        {PREFERENCES.map((preference, index) => (
          <Pressable
            key={preference}
            style={styles.preferenceRow}
            onPress={() =>
              setPreferences((current) =>
                current.map((value, currentIndex) =>
                  currentIndex === index ? !value : value,
                ),
              )
            }
            hitSlop={6}
          >
            <Text style={styles.preferenceText}>{preference}</Text>
            <View style={[styles.toggle, preferences[index] && styles.toggleOn]}>
              <View style={[styles.toggleKnob, preferences[index] && styles.toggleKnobOn]} />
            </View>
          </Pressable>
        ))}
      </View>

      <View style={styles.accountCard}>
        <Text style={styles.accountLabel}>Compte créé</Text>
        <Text style={styles.accountValue}>{profile.createdAt}</Text>
        <PrimaryButton
          title={signOutLoading ? "Déconnexion..." : "Se déconnecter"}
          variant="dark"
          onPress={onSignOut}
          disabled={signOutLoading}
          icon={<Ionicons name="log-out-outline" size={18} color={colors.white} />}
        />
        {visibleMessage ? <Text style={styles.message}>{visibleMessage}</Text> : null}
      </View>
    </ScrollView>
  );
}

function StravaActivityCard({
  strava,
  loading,
  refreshing,
  onRefresh,
  session,
}: {
  strava: StravaProfile | null;
  loading: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  session: Session;
}) {
  const [selectedActivity, setSelectedActivity] = useState<{ id: string; name: string } | null>(null);

  async function submitBalade(form: CreateRideForm) {
    if (!selectedActivity) return;
    await createRideFromStrava(session, selectedActivity.id, form);
  }

  if (!strava) {
    return (
      <View style={styles.stravaCard}>
        <View style={styles.stravaHeader}>
          <View>
            <Text style={styles.stravaTitle}>Activité Strava</Text>
            <Text style={styles.stravaMeta}>
              {loading ? "Chargement du profil..." : "Aucun compte Strava relié"}
            </Text>
          </View>
          {loading ? <ActivityIndicator color={colors.navy} /> : null}
        </View>
        <Text style={styles.emptyState}>
          Relie Strava pour afficher les kilomètres, le dénivelé et les dernières sorties vélo.
        </Text>
      </View>
    );
  }

  const location = [strava.athlete.city, strava.athlete.country].filter(Boolean).join(", ");

  return (
    <View style={styles.stravaCard}>
      <View style={styles.stravaHeader}>
        <View style={styles.stravaTitleBlock}>
          <View style={styles.stravaTitleRow}>
            <Text style={styles.stravaTitle}>Activité Strava</Text>
            <Badge label={strava.error ? "Cache local" : "À jour"} tone={strava.error ? "neutral" : "green"} />
          </View>
          <Text style={styles.stravaMeta}>
            {location || strava.athlete.username || "Athlète Strava"}
          </Text>
          <Text style={styles.lastSync}>
            Dernière synchro {strava.lastSyncAt ? formatDateTime(strava.lastSyncAt) : "indisponible"}
          </Text>
        </View>
      </View>

      <View style={styles.stravaMetrics}>
        <StravaMetric label="Km vélo" value={formatKm(strava.totals.allRideKm)} />
        <StravaMetric label="Sorties" value={String(strava.totals.allRideCount)} />
        <StravaMetric label="D+" value={`${formatInteger(strava.totals.allRideElevationM)} m`} />
      </View>

      {strava.error ? <Text style={styles.stravaError}>{strava.error}</Text> : null}

      <View style={styles.activityList}>
        {strava.recentActivities.length > 0 ? (
          strava.recentActivities.map((activity) => (
            <View key={activity.id} style={styles.activityRow}>
              <View style={styles.activityText}>
                <Text style={styles.activityName} numberOfLines={1}>
                  {activity.name}
                </Text>
                <Text style={styles.activityMeta}>
                  {activity.startDate ? formatDate(activity.startDate) : activity.sportType}
                </Text>
              </View>
              <View style={styles.activityStats}>
                <Text style={styles.activityStat}>{formatKm(activity.distanceKm)}</Text>
                <Text style={styles.activityDuration}>
                  {formatDuration(activity.movingTimeSeconds)}
                </Text>
              </View>
              {activity.polyline && (
                <Pressable
                  onPress={() => setSelectedActivity({ id: activity.id, name: activity.name })}
                  hitSlop={6}
                >
                  <Text style={styles.addBaladeLink}>Ajouter comme balade</Text>
                </Pressable>
              )}
            </View>
          ))
        ) : (
          <Text style={styles.emptyState}>Aucune sortie vélo récente renvoyée par Strava.</Text>
        )}
      </View>

      <PrimaryButton
        title={refreshing ? "Actualisation..." : "Actualiser Strava"}
        onPress={onRefresh}
        disabled={refreshing}
        icon={<Ionicons name="refresh" size={18} color={colors.white} />}
      />

      <BaladeFormModal
        visible={selectedActivity !== null}
        onClose={() => setSelectedActivity(null)}
        title="Publier cette sortie comme balade"
        initialName={selectedActivity?.name ?? ""}
        onSubmit={submitBalade}
      />
    </View>
  );
}

function StravaMetric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stravaMetric}>
      <Text style={styles.stravaMetricValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.stravaMetricLabel}>{label}</Text>
    </View>
  );
}

function getProfile(session: Session, authProfile: AuthProfile | null) {
  const metadata = session.user.user_metadata ?? {};
  const strava = authProfile?.strava;
  const rawEmail = authProfile?.user.email ?? session.user.email ?? null;
  const stravaName = [strava?.athlete.firstname, strava?.athlete.lastname]
    .filter(Boolean)
    .join(" ")
    .trim();
  const name =
    authProfile?.rider.display_name ||
    stravaName ||
    stringValue(metadata.full_name) ||
    stringValue(metadata.name) ||
    stringValue(metadata.user_name) ||
    displayEmail(rawEmail) ||
    "Rider Michelin";

  return {
    name,
    email: profileContact(rawEmail, strava),
    avatarUrl:
      strava?.athlete.profileMedium ??
      strava?.athlete.profile ??
      stringValue(metadata.avatar_url) ??
      stringValue(metadata.picture),
    createdAt: authProfile?.user.createdAt
      ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(
          new Date(authProfile.user.createdAt),
        )
      : session.user.created_at
      ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "long" }).format(
          new Date(session.user.created_at),
        )
      : "Date indisponible",
  };
}

function getProviderStatuses(
  session: Session,
  authProfile: AuthProfile | null,
): Map<ProviderId, ProviderSummary> {
  const statuses = new Map<ProviderId, ProviderSummary>();

  for (const provider of authProfile?.providers ?? []) {
    statuses.set(provider.id, provider);
  }

  // Identités natives Supabase (email, google).
  for (const identity of session.user.identities ?? []) {
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
      label: "Kilomètres",
      value: authProfile
        ? strava
          ? formatKm(strava.totals.allRideKm)
          : `${formatInteger(authProfile.rider.total_km)} km`
        : "...",
    },
    {
      label: "Sorties",
      value: authProfile ? String(strava?.totals.allRideCount ?? 0) : "...",
    },
    {
      label: "Avis",
      value: authProfile ? String(authProfile.rider.reviews_count) : "...",
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

function providerStatusLabel(status?: ProviderSummary): string {
  if (!status?.connected) return "À relier";
  if (status.providerUserId) return `Connecté au profil ${status.providerUserId}`;
  return "Connecté au profil";
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

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  hero: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
    backgroundColor: colors.navy,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.card,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.yellow,
    overflow: "hidden",
  },
  avatarImage: { width: "100%", height: "100%" },
  avatarText: { color: colors.navyDark, fontSize: 24, fontWeight: "900" },
  identity: { flex: 1, minWidth: 0 },
  name: { color: colors.white, fontSize: 24, fontWeight: "900" },
  email: {
    color: "rgba(255,255,255,0.72)",
    fontSize: font.small,
    fontWeight: "700",
    marginTop: 3,
  },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.md },
  statsRow: { flexDirection: "row", gap: spacing.sm },
  statCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.white,
  },
  statValue: { color: colors.navy, fontSize: 22, fontWeight: "900" },
  statLabel: { color: colors.textMuted, fontSize: font.tiny, fontWeight: "700", marginTop: 2 },
  list: { gap: spacing.sm },
  providerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.white,
  },
  providerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.chipBg,
  },
  providerText: { flex: 1 },
  providerName: { color: colors.text, fontSize: font.body, fontWeight: "800" },
  providerStatus: { color: colors.textMuted, fontSize: font.small, marginTop: 2 },
  providerSync: {
    color: colors.textFaint,
    fontSize: font.tiny,
    fontWeight: "800",
    marginTop: 3,
    textTransform: "uppercase",
  },
  stravaCard: {
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    backgroundColor: colors.white,
    ...shadow.card,
  },
  stravaHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  stravaTitleBlock: { flex: 1, minWidth: 0 },
  stravaTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  stravaTitle: { color: colors.navy, fontSize: font.h3, fontWeight: "900" },
  stravaMeta: {
    color: colors.textMuted,
    fontSize: font.small,
    fontWeight: "700",
    marginTop: 4,
  },
  lastSync: {
    color: colors.textFaint,
    fontSize: font.tiny,
    fontWeight: "800",
    marginTop: 4,
    textTransform: "uppercase",
  },
  stravaMetrics: { flexDirection: "row", gap: spacing.sm },
  stravaMetric: {
    flex: 1,
    borderRadius: radius.md,
    backgroundColor: colors.bgSoft,
    padding: spacing.md,
  },
  stravaMetricValue: { color: colors.navy, fontSize: font.h3, fontWeight: "900" },
  stravaMetricLabel: {
    color: colors.textMuted,
    fontSize: font.tiny,
    fontWeight: "800",
    marginTop: 2,
    textTransform: "uppercase",
  },
  stravaError: {
    color: colors.textMuted,
    fontSize: font.small,
    fontWeight: "700",
    borderRadius: radius.md,
    backgroundColor: colors.bgSoft,
    padding: spacing.md,
  },
  activityList: { gap: spacing.sm },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.bg,
  },
  activityText: { flex: 1, minWidth: 0 },
  activityName: { color: colors.text, fontSize: font.body, fontWeight: "800" },
  activityMeta: { color: colors.textMuted, fontSize: font.tiny, fontWeight: "700", marginTop: 2 },
  activityStats: { alignItems: "flex-end" },
  activityStat: { color: colors.navy, fontSize: font.small, fontWeight: "900" },
  activityDuration: { color: colors.textMuted, fontSize: font.tiny, fontWeight: "700", marginTop: 2 },
  addBaladeLink: {
    width: "100%",
    marginTop: spacing.xs,
    color: colors.navy,
    fontSize: font.tiny,
    fontWeight: "800",
    textAlign: "right",
  },
  emptyState: { color: colors.textMuted, fontSize: font.small, fontWeight: "700" },
  preferenceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.white,
  },
  preferenceText: { flex: 1, color: colors.text, fontSize: font.body, fontWeight: "600" },
  toggle: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.dotEmpty,
    padding: 3,
  },
  toggleOn: { backgroundColor: colors.navy },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.white,
  },
  toggleKnobOn: { transform: [{ translateX: 18 }] },
  accountCard: {
    gap: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.bgSoft,
    padding: spacing.lg,
  },
  accountLabel: {
    color: colors.textMuted,
    fontSize: font.tiny,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  accountValue: { color: colors.text, fontSize: font.h3, fontWeight: "800" },
  message: { color: colors.textMuted, fontSize: font.small, textAlign: "center" },
});
