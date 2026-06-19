import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { supabase } from "../lib/supabase";
import { colors, font, radius, spacing } from "../theme";
import { SectionTitle } from "./ui";

type Progress = {
  totalKm: number;
  reviewsCount: number;
  garageCount: number;
};

const CHALLENGES = [
  {
    id: "km",
    label: "Kilomètreur",
    desc: "Roule 200 km au total",
    target: 200,
    unit: "km",
    badgeLabel: "Kilomètreur",
    badgeDesc: "200 km parcourus",
    barColor: colors.yellow,
    getValue: (p: Progress) => p.totalKm,
  },
  {
    id: "reviews",
    label: "Voix de la communauté",
    desc: "Laisse 3 avis vérifiés",
    target: 3,
    unit: "avis",
    badgeLabel: "Testeur Vocal",
    badgeDesc: "3 avis publiés",
    barColor: colors.navy,
    getValue: (p: Progress) => p.reviewsCount,
  },
  {
    id: "garage",
    label: "Garage configuré",
    desc: "Ajoute 2 pneus à ton Garage",
    target: 2,
    unit: "pneus",
    badgeLabel: "Mécanicien",
    badgeDesc: "Garage opérationnel",
    barColor: colors.green,
    getValue: (p: Progress) => p.garageCount,
  },
] as const;

export function ClubChallenges({ userId }: { userId?: string }) {
  const [progress, setProgress] = useState<Progress>({ totalKm: 0, reviewsCount: 0, garageCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase || !userId) {
      setLoading(false);
      return;
    }

    let active = true;
    async function load() {
      try {
        const [riderRes, garageRes] = await Promise.all([
          supabase!.from("riders").select("total_km, reviews_count").eq("id", userId!).maybeSingle(),
          supabase!.from("garage_tyres").select("id", { count: "exact", head: true }).eq("rider_id", userId!),
        ]);
        if (!active) return;
        setProgress({
          totalKm: riderRes.data?.total_km ?? 0,
          reviewsCount: riderRes.data?.reviews_count ?? 0,
          garageCount: garageRes.count ?? 0,
        });
      } catch {
        // silencieux — on garde les valeurs a 0
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [userId]);

  const earnedBadges = CHALLENGES.filter((c) => !loading && c.getValue(progress) >= c.target);

  return (
    <View style={{ gap: spacing.lg }}>
      <View>
        <SectionTitle>Tes défis &amp; badges</SectionTitle>
        <Text style={styles.intro}>
          Accomplis ces défis pour débloquer des badges affichés sur ton profil.
        </Text>
      </View>

      <View style={{ gap: spacing.md }}>
        {CHALLENGES.map((c) => {
          const value = c.getValue(progress);
          const pct = loading ? 0 : Math.min(100, Math.round((value / c.target) * 100));
          const done = pct === 100;

          return (
            <View
              key={c.id}
              style={[styles.card, done && { borderColor: colors.green }]}
            >
              <View style={[styles.cardHeader, { backgroundColor: done ? colors.green : colors.navy }]}>
                <Text style={styles.cardHeaderStatus}>{done ? "Complété ✓" : "En cours"}</Text>
                <Text style={styles.cardHeaderTitle}>{c.label}</Text>
              </View>

              <View style={styles.cardBody}>
                <Text style={styles.cardDesc}>{c.desc}</Text>

                <View style={styles.progressRow}>
                  <Text style={styles.progressLabel}>Progression</Text>
                  <Text style={styles.progressValue}>
                    {loading ? "—" : value}
                    <Text style={styles.progressTarget}> /{c.target} {c.unit}</Text>
                  </Text>
                </View>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      { width: `${pct}%`, backgroundColor: done ? colors.green : c.barColor },
                    ]}
                  />
                </View>
                <Text style={styles.pctLabel}>{pct} %</Text>

                <View style={[styles.badgeRow, !done && { opacity: 0.4 }]}>
                  <Text style={styles.badgeLabel}>{c.badgeLabel}</Text>
                  {!done ? <Text style={styles.badgeLocked}>verrouillé</Text> : null}
                </View>
              </View>
            </View>
          );
        })}
      </View>

      {earnedBadges.length > 0 ? (
        <View style={styles.earnedCard}>
          <Text style={styles.earnedTitle}>Badges débloqués</Text>
          <View style={styles.earnedRow}>
            {earnedBadges.map((b) => (
              <View key={b.id} style={styles.earnedBadge}>
                <Text style={styles.earnedBadgeLabel}>{b.badgeLabel}</Text>
                <Text style={styles.earnedBadgeDesc}>{b.badgeDesc}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  intro: { color: colors.textMuted, fontSize: font.body, marginTop: spacing.xs },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    overflow: "hidden",
  },
  cardHeader: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  cardHeaderStatus: {
    color: "rgba(255,255,255,0.8)",
    fontSize: font.tiny,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  cardHeaderTitle: { color: colors.white, fontSize: font.body, fontWeight: "900", marginTop: 2 },
  cardBody: { padding: spacing.lg, gap: spacing.xs },
  cardDesc: { color: colors.textBody, fontSize: font.small },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.sm,
  },
  progressLabel: { color: colors.textMuted, fontSize: font.tiny, fontWeight: "600" },
  progressValue: { color: colors.navy, fontSize: font.body, fontWeight: "900" },
  progressTarget: { color: colors.textFaint, fontSize: font.tiny, fontWeight: "600" },
  barTrack: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.dotEmpty,
    overflow: "hidden",
    marginTop: spacing.xs,
  },
  barFill: { height: "100%", borderRadius: radius.pill },
  pctLabel: {
    color: colors.textFaint,
    fontSize: font.tiny,
    fontWeight: "700",
    textAlign: "right",
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.chipBg,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  badgeLabel: { color: colors.navy, fontSize: font.small, fontWeight: "800" },
  badgeLocked: { color: colors.textFaint, fontSize: font.tiny, marginLeft: "auto" },
  earnedCard: {
    borderWidth: 1,
    borderColor: colors.green,
    borderRadius: radius.lg,
    backgroundColor: colors.greenSoft,
    padding: spacing.lg,
  },
  earnedTitle: {
    color: colors.green,
    fontSize: font.small,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  earnedRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.md },
  earnedBadge: {
    alignItems: "center",
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
  },
  earnedBadgeLabel: { color: colors.green, fontSize: font.body, fontWeight: "900" },
  earnedBadgeDesc: { color: colors.textMuted, fontSize: font.tiny, marginTop: 2 },
});
