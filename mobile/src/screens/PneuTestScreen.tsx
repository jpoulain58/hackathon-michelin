import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { Session } from "@supabase/supabase-js";
import { PrimaryButton, RemoteImage } from "../components/ui";
import { supabase } from "../lib/supabase";
import { colors, font, radius, spacing } from "../theme";

const TYRE_SLUG = "power-pulse";
const TYRE_NAME = "MICHELIN Power Pulse";
const HERO = "https://picsum.photos/seed/powerpulse/1000/700";
// Jours d'essai disponibles : juillet 2026.
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

const HIGHLIGHTS = [
  "Gomme Pulse Compound : plus de rendement, sans céder sur le grip.",
  "Protection Race Shield X : la légèreté d'un pneu de course, en sécurité.",
  "Profil aéro pensé pour les jantes larges d'aujourd'hui.",
];

// loading : initial / locked : non membre / ready : membre du Club
type Gate = "loading" | "locked" | "ready";

function iso(day: number): string {
  return `2026-07-${String(day).padStart(2, "0")}`;
}

function formatDate(isoStr: string): string {
  return new Date(`${isoStr}T00:00:00`).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function PneuTestScreen({
  session,
  onBack,
}: {
  session: Session | null;
  onBack: () => void;
}) {
  const [gate, setGate] = useState<Gate>("loading");
  const [selected, setSelected] = useState<string | null>(null);
  const [booked, setBooked] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const uid = session?.user.id;
      if (!supabase || !uid) {
        setGate("locked");
        return;
      }
      const { data: rider } = await supabase
        .from("riders")
        .select("club_member")
        .eq("id", uid)
        .maybeSingle();
      if (!active) return;
      if (!rider?.club_member) {
        setGate("locked");
        return;
      }
      setGate("ready");
      const { data: resa } = await supabase
        .from("tyre_test_reservations")
        .select("test_date")
        .eq("rider_id", uid)
        .eq("tyre_slug", TYRE_SLUG)
        .maybeSingle();
      if (!active) return;
      if (resa?.test_date) {
        setBooked(resa.test_date);
        setSelected(resa.test_date);
      }
    })();
    return () => {
      active = false;
    };
  }, [session]);

  async function reserve() {
    const uid = session?.user.id;
    if (!supabase || !uid || !selected) return;
    setBusy(true);
    setError(null);
    const { error } = await supabase.from("tyre_test_reservations").upsert(
      {
        rider_id: uid,
        tyre_slug: TYRE_SLUG,
        test_date: selected,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "rider_id,tyre_slug" },
    );
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setBooked(selected);
  }

  async function cancel() {
    const uid = session?.user.id;
    if (!supabase || !uid) return;
    setBusy(true);
    setError(null);
    const { error } = await supabase
      .from("tyre_test_reservations")
      .delete()
      .eq("rider_id", uid)
      .eq("tyre_slug", TYRE_SLUG);
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setBooked(null);
    setSelected(null);
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Pressable onPress={onBack} style={styles.back} hitSlop={8}>
        <Ionicons name="chevron-back" size={20} color={colors.navy} />
        <Text style={styles.backText}>Actualités</Text>
      </Pressable>

      {/* Hero */}
      <RemoteImage uri={HERO} style={styles.hero}>
        <LinearGradient
          colors={["rgba(11,18,32,0.15)", "rgba(11,18,32,0.9)"]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.heroText}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>BIENTÔT · JUILLET 2026</Text>
          </View>
          <Text style={styles.heroTitle}>{TYRE_NAME}</Text>
          <Text style={styles.heroSub}>
            Le pneu route le plus rapide jamais conçu par Michelin.
          </Text>
        </View>
      </RemoteImage>

      {/* Teaser */}
      <View style={styles.section}>
        {HIGHLIGHTS.map((h) => (
          <View key={h} style={styles.highlight}>
            <Ionicons name="flash" size={16} color={colors.navy} />
            <Text style={styles.highlightText}>{h}</Text>
          </View>
        ))}
      </View>

      {/* Réservation Programme Testeur */}
      <View style={styles.card}>
        <Text style={styles.kicker}>PROGRAMME TESTEUR</Text>
        <Text style={styles.cardTitle}>Réserve ton essai en avant-première</Text>

        {gate === "loading" ? (
          <ActivityIndicator color={colors.navy} style={{ marginTop: spacing.md }} />
        ) : gate === "locked" ? (
          <Text style={styles.lockedText}>
            L&apos;essai en avant-première est réservé aux membres du Club. Rejoins le Club depuis
            l&apos;onglet « Club » pour débloquer ta réservation.
          </Text>
        ) : (
          <View>
            {booked ? (
              <View style={styles.bookedBox}>
                <Ionicons name="checkmark-circle" size={20} color={colors.green} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.bookedTitle}>Essai réservé</Text>
                  <Text style={styles.bookedDate}>{formatDate(booked)}</Text>
                </View>
              </View>
            ) : null}

            <Text style={styles.pickLabel}>
              {booked ? "Changer la date" : "Choisis ta date d'essai"} · Juillet 2026
            </Text>
            <View style={styles.daysGrid}>
              {DAYS.map((d) => {
                const value = iso(d);
                const active = selected === value;
                return (
                  <Pressable
                    key={d}
                    onPress={() => setSelected(value)}
                    style={[styles.day, active && styles.dayActive]}
                  >
                    <Text style={[styles.dayText, active && styles.dayTextActive]}>{d}</Text>
                  </Pressable>
                );
              })}
            </View>

            <PrimaryButton
              title={busy ? "..." : booked ? "Modifier ma réservation" : "Réserver mon essai"}
              onPress={reserve}
              disabled={busy || !selected || selected === booked}
            />
            {booked ? (
              <Pressable onPress={cancel} disabled={busy} style={styles.cancelBtn} hitSlop={6}>
                <Text style={styles.cancelText}>Annuler ma réservation</Text>
              </Pressable>
            ) : null}

            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl * 2, gap: spacing.lg },
  back: { flexDirection: "row", alignItems: "center", gap: 2 },
  backText: { color: colors.navy, fontSize: font.body, fontWeight: "700" },
  hero: { height: 220, borderRadius: radius.lg, padding: spacing.lg, justifyContent: "flex-end" },
  heroText: { gap: 6 },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: colors.yellow,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { color: colors.navyDark, fontSize: font.tiny, fontWeight: "800" },
  heroTitle: { color: colors.white, fontSize: 26, fontWeight: "900" },
  heroSub: { color: "rgba(255,255,255,0.9)", fontSize: font.body },
  section: { gap: spacing.sm },
  highlight: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  highlightText: { color: colors.textBody, fontSize: font.body, flex: 1 },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    backgroundColor: colors.white,
  },
  kicker: { color: colors.navy, fontSize: font.tiny, fontWeight: "800", letterSpacing: 0.5 },
  cardTitle: { color: colors.text, fontSize: font.h2, fontWeight: "900", marginTop: 4, marginBottom: spacing.md },
  lockedText: { color: colors.textMuted, fontSize: font.body, lineHeight: 20 },
  bookedBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.greenSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  bookedTitle: { color: colors.text, fontSize: font.body, fontWeight: "800" },
  bookedDate: { color: colors.textMuted, fontSize: font.small, textTransform: "capitalize" },
  pickLabel: { color: colors.textMuted, fontSize: font.small, fontWeight: "700", marginBottom: spacing.sm },
  daysGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.lg },
  day: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  dayActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  dayText: { color: colors.text, fontSize: font.body, fontWeight: "600" },
  dayTextActive: { color: colors.white, fontWeight: "800" },
  error: { color: "#D64545", fontSize: font.small, fontWeight: "600", marginTop: spacing.sm },
  cancelBtn: { marginTop: spacing.md, alignItems: "center", paddingVertical: spacing.sm },
  cancelText: { color: "#D64545", fontSize: font.body, fontWeight: "700" },
});

