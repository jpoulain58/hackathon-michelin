import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { Session } from "@supabase/supabase-js";
import { Badge, PrimaryButton, SectionTitle, Spinner } from "../components/ui";
import type { Evenement } from "../data/evenements";
import { supabase } from "../lib/supabase";
import { colors, font, radius, spacing } from "../theme";

// loading : etat initial / anonymous : non connecte
// locked : connecte mais pas membre / ready : membre du Club
type Gate = "loading" | "anonymous" | "locked" | "ready";

export function EvenementDetailScreen({
  event,
  session,
  onBack,
}: {
  event: Evenement;
  session: Session | null;
  onBack: () => void;
}) {
  const [gate, setGate] = useState<Gate>("loading");

  useEffect(() => {
    if (!supabase) {
      setGate("anonymous");
      return;
    }
    const uid = session?.user.id;
    if (!uid) {
      setGate("anonymous");
      return;
    }
    let active = true;
    supabase
      .from("riders")
      .select("club_member")
      .eq("id", uid)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        setGate(data?.club_member ? "ready" : "locked");
      });
    return () => {
      active = false;
    };
  }, [session]);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={onBack} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Évènement</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Badge label={event.badge} />
        <Text style={styles.title}>{event.title}</Text>
        <Text style={styles.reward}>🏆 {event.reward}</Text>
        <Text style={styles.dateRange}>{event.dateRange}</Text>
        <Text style={styles.body}>{event.description}</Text>

        <View style={styles.card}>
          <SectionTitle>Règlement</SectionTitle>
          <View style={{ gap: spacing.sm }}>
            {event.rules.map((rule, i) => (
              <View key={i} style={styles.ruleRow}>
                <Text style={styles.ruleBullet}>•</Text>
                <Text style={styles.ruleText}>{rule}</Text>
              </View>
            ))}
          </View>
        </View>

        {gate === "loading" ? (
          <Spinner />
        ) : gate !== "ready" ? (
          <View style={styles.lockedCard}>
            <View style={styles.lockBadge}>
              <Ionicons name="lock-closed" size={20} color={colors.white} />
            </View>
            <Text style={styles.lockedTitle}>
              {event.member.type === "leaderboard"
                ? "Classement réservé aux membres"
                : "Tickets réservés aux membres"}
            </Text>
            <Text style={styles.lockedText}>
              Rejoins le Club Trust Wheels pour voir le classement en direct et participer aux
              récompenses.
            </Text>
            <PrimaryButton title="Voir le Club" onPress={onBack} />
          </View>
        ) : event.member.type === "leaderboard" ? (
          <View style={styles.card}>
            <SectionTitle>Classement</SectionTitle>
            <View style={{ gap: spacing.sm }}>
              {event.member.entries.map((entry) => (
                <View key={entry.rank} style={styles.entryRow}>
                  <View style={styles.entryLeft}>
                    <View style={styles.rankBadge}>
                      <Text style={styles.rankBadgeText}>
                        {entry.rank <= 3 ? ["🥇", "🥈", "🥉"][entry.rank - 1] : entry.rank}
                      </Text>
                    </View>
                    <Text style={styles.entryName}>{entry.name}</Text>
                  </View>
                  <Text style={styles.entryKm}>{entry.km} km</Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.card}>
            <SectionTitle>Tes tickets de participation</SectionTitle>
            <Text style={styles.ticketsValue}>
              {event.member.ticketsIssued.toLocaleString("fr-FR")}
            </Text>
            <Text style={styles.ticketsLabel}>tickets émis au total</Text>
            <Text style={styles.body}>{event.member.note}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { color: colors.text, fontSize: font.h3, fontWeight: "700" },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  title: { color: colors.text, fontSize: font.title, fontWeight: "800" },
  reward: { color: colors.navy, fontSize: font.h3, fontWeight: "800" },
  dateRange: { color: colors.textMuted, fontSize: font.small, fontWeight: "600" },
  body: { color: colors.textBody, fontSize: font.body, lineHeight: 21 },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    backgroundColor: colors.white,
    gap: spacing.sm,
  },
  ruleRow: { flexDirection: "row", gap: spacing.sm },
  ruleBullet: { color: colors.navy, fontSize: font.body },
  ruleText: { color: colors.textBody, fontSize: font.small, flex: 1, lineHeight: 19 },
  lockedCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: "center",
    backgroundColor: colors.bgSoft,
    gap: spacing.sm,
  },
  lockBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.navy,
    alignItems: "center",
    justifyContent: "center",
  },
  lockedTitle: { color: colors.text, fontSize: font.h3, fontWeight: "800", textAlign: "center" },
  lockedText: { color: colors.textMuted, fontSize: font.body, textAlign: "center" },
  entryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  entryLeft: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.navy,
    alignItems: "center",
    justifyContent: "center",
  },
  rankBadgeText: { color: colors.white, fontSize: font.tiny, fontWeight: "800" },
  entryName: { color: colors.text, fontSize: font.body, fontWeight: "600" },
  entryKm: { color: colors.textBody, fontSize: font.small, fontWeight: "700" },
  ticketsValue: { color: colors.navy, fontSize: font.title + 6, fontWeight: "900" },
  ticketsLabel: { color: colors.textMuted, fontSize: font.tiny, fontWeight: "600" },
});
