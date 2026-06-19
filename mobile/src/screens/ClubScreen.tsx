import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import type { Session, User } from "@supabase/supabase-js";
import { Badge, PrimaryButton, ScreenTitle, SectionTitle } from "../components/ui";
import { ClubChallenges } from "../components/ClubChallenges";
import { DEFAULT_LOCATIONS, LocationAutocomplete } from "../components/LocationAutocomplete";
import { TyreAutocomplete } from "../components/TyreAutocomplete";
import { clubPlan } from "../data";
import { EVENEMENTS, type Evenement } from "../data/evenements";
import { fetchStravaStats, formatProductLabel, type ProductOption } from "../lib/api";
import { supabase } from "../lib/supabase";
import { colors, font, radius, spacing } from "../theme";

type Tyre = {
  id: string;
  label: string;
  model: string | null;
  km: number;
  lifespan_km: number;
};

// loading : etat initial / anonymous : non connecte
// locked : connecte mais pas membre / ready : membre du Club
type Gate = "loading" | "anonymous" | "locked" | "ready";

function lifeRemaining(km: number, lifespan: number): number {
  return Math.max(0, Math.min(100, Math.round(100 - (km / Math.max(1, lifespan)) * 100)));
}

function lifeColor(pct: number): string {
  if (pct > 50) return colors.green;
  if (pct > 20) return colors.yellow;
  return "#D64545";
}

function isStravaConnected(user: User | null): boolean {
  if (!user) return false;
  const providers = user.app_metadata?.providers;
  return (
    user.app_metadata?.provider === "strava" ||
    (Array.isArray(providers) && providers.includes("strava")) ||
    Boolean((user.user_metadata as Record<string, unknown> | undefined)?.strava_id)
  );
}

function toNumber(text: string): number {
  return Number(text.replace(/[^0-9]/g, "")) || 0;
}

export function ClubScreen({ onOpenEvenement }: { onOpenEvenement: (event: Evenement) => void }) {
  const [gate, setGate] = useState<Gate>("loading");
  const [session, setSession] = useState<Session | null>(null);
  const [tyres, setTyres] = useState<Tyre[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [draft, setDraft] = useState<{
    label: string;
    model: ProductOption | null;
    km: number;
    lifespan_km: number;
  }>({ label: "Pneu avant", model: null, km: 0, lifespan_km: 4000 });
  const [adding, setAdding] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const [stravaKm, setStravaKm] = useState<number | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [stravaError, setStravaError] = useState<string | null>(null);

  const loadTyres = useCallback(async (uid: string) => {
    if (!supabase) return;
    const { data, error } = await supabase
      .from("garage_tyres")
      .select("id, label, model, km, lifespan_km")
      .eq("rider_id", uid)
      .order("created_at", { ascending: true });
    if (error) {
      setError(error.message);
      return;
    }
    setTyres((data as Tyre[]) ?? []);
  }, []);

  const resolve = useCallback(
    async (next: Session | null) => {
      setSession(next);
      const uid = next?.user.id;
      if (!uid) {
        setGate("anonymous");
        return;
      }
      if (!supabase) return;
      const { data, error } = await supabase
        .from("riders")
        .select("club_member")
        .eq("id", uid)
        .maybeSingle();
      if (error) {
        setError(error.message);
        setGate("locked");
        return;
      }
      if (data?.club_member) {
        setGate("ready");
        loadTyres(uid);
      } else {
        setGate("locked");
      }
    },
    [loadTyres],
  );

  useEffect(() => {
    if (!supabase) {
      setGate("anonymous");
      return;
    }
    supabase.auth.getSession().then(({ data }) => resolve(data.session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => resolve(next));
    return () => subscription.unsubscribe();
  }, [resolve]);

  async function setMembership(next: boolean) {
    if (!supabase || !session) return;
    const user = session.user;
    setBusy(true);
    setError(null);

    // 1. Tente de mettre a jour la ligne existante du rider.
    const { data: updated, error: updateError } = await supabase
      .from("riders")
      .update({ club_member: next, updated_at: new Date().toISOString() })
      .eq("id", user.id)
      .select("club_member");

    if (updateError) {
      setBusy(false);
      setError(updateError.message);
      return;
    }

    // 2. Aucune ligne touchee -> rider pas encore synchronise : on cree sa ligne.
    //    Garantit que l'adhesion est persistee (survit au refresh / relance).
    if (!updated || updated.length === 0) {
      const meta = user.user_metadata as Record<string, unknown> | undefined;
      const displayName =
        (typeof meta?.full_name === "string" && meta.full_name) ||
        (typeof meta?.name === "string" && meta.name) ||
        user.email ||
        "Rider Michelin";
      const { error: insertError } = await supabase.from("riders").insert({
        id: user.id,
        email: user.email ?? null,
        display_name: displayName,
        club_member: next,
      });
      if (insertError) {
        setBusy(false);
        setError(insertError.message);
        return;
      }
    }

    setBusy(false);
    if (next) {
      setGate("ready");
      loadTyres(user.id);
    } else {
      setGate("locked");
    }
  }

  function patchLocal(id: string, patch: Partial<Tyre>) {
    setTyres((list) => list.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }

  async function saveTyre(t: Tyre) {
    if (!supabase) return;
    setError(null);
    setSavingId(t.id);
    const { error } = await supabase
      .from("garage_tyres")
      .update({
        label: t.label,
        model: t.model,
        km: t.km,
        lifespan_km: t.lifespan_km,
        updated_at: new Date().toISOString(),
      })
      .eq("id", t.id);
    setSavingId(null);
    if (error) {
      setError(error.message);
      return;
    }
    setSavedId(t.id);
    setTimeout(() => setSavedId((id) => (id === t.id ? null : id)), 2000);
  }

  async function deleteTyre(id: string) {
    if (!supabase) return;
    setError(null);
    const { error } = await supabase.from("garage_tyres").delete().eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    setTyres((list) => list.filter((t) => t.id !== id));
  }

  async function addTyre() {
    if (!supabase || !session) return;
    setAdding(true);
    setError(null);
    const { data, error } = await supabase
      .from("garage_tyres")
      .insert({
        rider_id: session.user.id,
        label: draft.label || "Pneu",
        model: draft.model ? formatProductLabel(draft.model) : null,
        km: draft.km,
        lifespan_km: draft.lifespan_km || 4000,
      })
      .select("id, label, model, km, lifespan_km")
      .single();
    setAdding(false);
    if (error) {
      setError(error.message);
      return;
    }
    setTyres((list) => [...list, data as Tyre]);
    setDraft({ label: "Pneu arriere", model: null, km: 0, lifespan_km: 4000 });
  }

  async function syncStrava() {
    if (!session?.access_token) return;
    setSyncing(true);
    setStravaError(null);
    try {
      const stats = await fetchStravaStats(session.access_token);
      if (!stats.connected) {
        setStravaError("Aucun compte Strava lie. Connecte-toi via Strava pour synchroniser.");
        return;
      }
      setStravaKm(stats.totalKm);
    } catch (e) {
      setStravaError(e instanceof Error ? e.message : "Synchronisation Strava impossible.");
    } finally {
      setSyncing(false);
    }
  }

  const isMember = gate === "ready";
  const stravaConnected = isStravaConnected(session?.user ?? null);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <ScreenTitle title="Le club" />

      <SectionTitle>Mon abonnement</SectionTitle>
      <View style={styles.planCard}>
        <View style={styles.planRow}>
          <Text style={styles.planName}>{clubPlan.name}</Text>
          {isMember ? <Badge label="Membre actif" tone="green" /> : null}
        </View>
        <Text style={styles.planPrice}>{clubPlan.price}</Text>
      </View>

      <View style={styles.advantagesHeader}>
        <SectionTitle>Mes avantages</SectionTitle>
      </View>
      <View style={styles.advantages}>
        {clubPlan.advantages.map((adv) => (
          <View key={adv} style={styles.advantage}>
            <Ionicons name="checkmark-circle" size={20} color={colors.green} />
            <Text style={styles.advantageText}>{adv}</Text>
          </View>
        ))}
      </View>

      {gate === "loading" ? (
        <ActivityIndicator color={colors.navy} style={{ marginTop: spacing.md }} />
      ) : isMember ? (
        <PrimaryButton
          title={busy ? "..." : "Quitter le club"}
          variant="dark"
          onPress={() => setMembership(false)}
          disabled={busy}
        />
      ) : (
        <PrimaryButton
          title={busy ? "..." : "Rejoindre le club"}
          onPress={() => setMembership(true)}
          disabled={busy}
        />
      )}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {/* Évènements en cours */}
      <View style={styles.eventsHeader}>
        <SectionTitle>Évènements en cours</SectionTitle>
      </View>
      <View style={{ gap: spacing.md }}>
        {EVENEMENTS.map((event) => (
          <Pressable key={event.id} style={styles.eventCard} onPress={() => onOpenEvenement(event)}>
            <Badge label={event.badge} />
            <Text style={styles.eventTitle}>{event.title}</Text>
            <Text style={styles.eventSummary}>{event.summary}</Text>
            <Text style={styles.eventReward}>🏆 {event.reward}</Text>
            <Text style={styles.eventDate}>{event.dateRange}</Text>
          </Pressable>
        ))}
      </View>

      {/* Mon Garage connecte */}
      <View style={styles.garageHeader}>
        <SectionTitle>Mon Garage connecté</SectionTitle>
      </View>

      {!isMember ? (
        <View style={styles.lockedCard}>
          <View style={styles.lockBadge}>
            <Ionicons name="lock-closed" size={20} color={colors.white} />
          </View>
          <Text style={styles.lockedTitle}>Réservé aux membres</Text>
          <Text style={styles.lockedText}>
            Suis l&apos;usure de tes pneus, saisis tes km à la main ou synchronise-les depuis Strava.
            Rejoins le Club ci-dessus pour débloquer.
          </Text>
        </View>
      ) : (
        <View style={{ gap: spacing.lg }}>
          {/* Synchro Strava */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Mes kilomètres</Text>
            <Text style={styles.cardHint}>
              {stravaConnected
                ? "Récupère ton cumul réel depuis Strava."
                : "Connecte-toi via Strava pour importer tes km automatiquement."}
            </Text>
            {stravaKm !== null ? (
              <View style={styles.kmRow}>
                <Text style={styles.kmValue}>{stravaKm.toLocaleString("fr-FR")} km</Text>
                <Text style={styles.kmLabel}>cumul Strava</Text>
              </View>
            ) : (
              <PrimaryButton
                title={syncing ? "Synchronisation..." : "Synchroniser Strava"}
                variant="strava"
                onPress={syncStrava}
                disabled={syncing || !stravaConnected}
                icon={<Ionicons name="sync" size={16} color={colors.white} />}
              />
            )}
            {stravaError ? <Text style={styles.error}>{stravaError}</Text> : null}
          </View>

          {/* Pneus suivis */}
          <View style={styles.card}>
            <View style={styles.planRow}>
              <Text style={styles.cardTitle}>Mes pneus</Text>
              <Badge label={`${tyres.length} pneu${tyres.length > 1 ? "x" : ""}`} />
            </View>

            {tyres.length === 0 ? (
              <Text style={styles.cardHint}>
                Aucun pneu pour le moment. Ajoute ton premier pneu ci-dessous.
              </Text>
            ) : (
              <View style={{ gap: spacing.lg, marginTop: spacing.sm }}>
                {tyres.map((t) => {
                  const pct = lifeRemaining(t.km, t.lifespan_km);
                  return (
                    <View key={t.id} style={styles.tyre}>
                      <Field
                        label="Emplacement"
                        value={t.label}
                        onChangeText={(v) => patchLocal(t.id, { label: v })}
                      />
                      <Field
                        label="Modèle"
                        value={t.model ?? ""}
                        placeholder="MICHELIN Power Cup"
                        onChangeText={(v) => patchLocal(t.id, { model: v })}
                      />
                      <View style={styles.fieldRow}>
                        <Field
                          label="Km parcourus"
                          value={String(t.km)}
                          numeric
                          onChangeText={(v) => patchLocal(t.id, { km: toNumber(v) })}
                          style={{ flex: 1 }}
                        />
                        <Field
                          label="Durée de vie (km)"
                          value={String(t.lifespan_km)}
                          numeric
                          onChangeText={(v) => patchLocal(t.id, { lifespan_km: toNumber(v) })}
                          style={{ flex: 1 }}
                        />
                      </View>

                      <View style={styles.barTrack}>
                        <View style={{ flex: pct, backgroundColor: lifeColor(pct) }} />
                        <View style={{ flex: 100 - pct }} />
                      </View>
                      <Text style={styles.barLabel}>{pct}% de vie restante</Text>

                      <View style={styles.tyreActions}>
                        <SmallButton
                          title={
                            savingId === t.id
                              ? "Enregistrement..."
                              : savedId === t.id
                                ? "Enregistré ✓"
                                : "Enregistrer"
                          }
                          variant="filled"
                          onPress={() => saveTyre(t)}
                          disabled={savingId === t.id}
                        />
                        {stravaKm !== null ? (
                          <SmallButton
                            title="Km Strava"
                            onPress={() => patchLocal(t.id, { km: stravaKm })}
                          />
                        ) : null}
                        <SmallButton title="Supprimer" variant="danger" onPress={() => deleteTyre(t.id)} />
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Ajout d'un pneu */}
            <View style={styles.addBox}>
              <Text style={styles.addTitle}>Ajouter un pneu</Text>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Emplacement</Text>
                <LocationAutocomplete
                  value={draft.label}
                  onChange={(label) => setDraft({ ...draft, label })}
                  suggestions={[...DEFAULT_LOCATIONS, ...tyres.map((t) => t.label)]}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Modèle</Text>
                <TyreAutocomplete
                  value={draft.model}
                  onSelect={(model) => setDraft({ ...draft, model })}
                  placeholder="MICHELIN Power Cup"
                />
              </View>
              <View style={styles.fieldRow}>
                <Field
                  label="Km parcourus"
                  value={String(draft.km)}
                  numeric
                  onChangeText={(v) => setDraft({ ...draft, km: toNumber(v) })}
                  style={{ flex: 1 }}
                />
                <Field
                  label="Durée de vie (km)"
                  value={String(draft.lifespan_km)}
                  numeric
                  onChangeText={(v) => setDraft({ ...draft, lifespan_km: toNumber(v) })}
                  style={{ flex: 1 }}
                />
              </View>
              <PrimaryButton
                title={adding ? "Ajout..." : "Ajouter le pneu"}
                onPress={addTyre}
                disabled={adding}
              />
            </View>
          </View>

          {/* Défis & badges */}
          <ClubChallenges userId={session?.user.id} />
        </View>
      )}
    </ScrollView>
  );
}

function SmallButton({
  title,
  onPress,
  variant = "outline",
  disabled = false,
}: {
  title: string;
  onPress: () => void;
  variant?: "filled" | "outline" | "danger";
  disabled?: boolean;
}) {
  const filled = variant === "filled";
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.smallBtn,
        filled && { backgroundColor: colors.navy, borderColor: colors.navy },
        disabled && { opacity: 0.55 },
        pressed && !disabled && { opacity: 0.7 },
      ]}
    >
      <Text
        style={[
          styles.smallBtnText,
          filled && { color: colors.white },
          variant === "danger" && { color: "#D64545" },
        ]}
      >
        {title}
      </Text>
    </Pressable>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  numeric = false,
  style,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  numeric?: boolean;
  style?: object;
}) {
  return (
    <View style={[styles.field, style]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        keyboardType={numeric ? "numeric" : "default"}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2, gap: spacing.lg },
  planCard: { backgroundColor: colors.navy, borderRadius: radius.lg, padding: spacing.xl },
  planRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: spacing.sm },
  planName: { color: colors.yellow, fontSize: 26, fontWeight: "900" },
  planPrice: { color: colors.white, fontSize: font.h3, fontWeight: "600", marginTop: 2 },
  advantagesHeader: { marginTop: spacing.sm },
  advantages: { gap: spacing.sm },
  advantage: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
  },
  advantageText: { color: colors.text, fontSize: font.body, fontWeight: "500", flex: 1 },
  error: { color: "#D64545", fontSize: font.small, fontWeight: "600", marginTop: spacing.xs },
  eventsHeader: { marginTop: spacing.md },
  eventCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    backgroundColor: colors.white,
    gap: spacing.xs,
  },
  eventTitle: { color: colors.text, fontSize: font.h3, fontWeight: "800", marginTop: spacing.xs },
  eventSummary: { color: colors.textMuted, fontSize: font.small, lineHeight: 18 },
  eventReward: { color: colors.navy, fontSize: font.small, fontWeight: "800" },
  eventDate: { color: colors.textFaint, fontSize: font.tiny, fontWeight: "600" },
  garageHeader: { marginTop: spacing.md },
  lockedCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: "center",
    backgroundColor: colors.bgSoft,
  },
  lockBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.navy,
    alignItems: "center",
    justifyContent: "center",
  },
  lockedTitle: { color: colors.text, fontSize: font.h3, fontWeight: "800", marginTop: spacing.md },
  lockedText: { color: colors.textMuted, fontSize: font.body, textAlign: "center", marginTop: spacing.xs },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    backgroundColor: colors.white,
    gap: spacing.sm,
  },
  cardTitle: { color: colors.text, fontSize: font.h3, fontWeight: "700" },
  cardHint: { color: colors.textMuted, fontSize: font.small },
  kmRow: { flexDirection: "row", alignItems: "baseline", gap: spacing.sm, marginTop: spacing.xs },
  kmValue: { color: colors.navy, fontSize: font.title, fontWeight: "900" },
  kmLabel: { color: colors.textMuted, fontSize: font.small },
  tyre: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, gap: spacing.sm },
  field: { gap: 4 },
  fieldRow: { flexDirection: "row", gap: spacing.sm },
  fieldLabel: { color: colors.textMuted, fontSize: font.tiny, fontWeight: "700" },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    color: colors.text,
    fontSize: font.body,
    fontWeight: "500",
  },
  barTrack: {
    flexDirection: "row",
    height: 10,
    borderRadius: radius.pill,
    overflow: "hidden",
    backgroundColor: colors.dotEmpty,
    marginTop: spacing.xs,
  },
  barLabel: { color: colors.textMuted, fontSize: font.tiny, fontWeight: "600" },
  tyreActions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.xs },
  smallBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: 9,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.white,
  },
  smallBtnText: { color: colors.navy, fontSize: font.small, fontWeight: "700" },
  addBox: {
    backgroundColor: colors.bgSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  addTitle: { color: colors.text, fontSize: font.body, fontWeight: "800" },
});
