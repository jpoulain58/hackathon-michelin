import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Stat, TyreMiniCard } from "../components/cards";
import { Pips, RemoteImage, SectionTitle } from "../components/ui";
import { colors, font, radius, spacing } from "../theme";
import type { Ride } from "../types";

export function BaladeDetailScreen({
  ride,
  onBack,
}: {
  ride: Ride;
  onBack: () => void;
}) {
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={onBack} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Balades</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <RemoteImage uri={ride.mapUrl} style={styles.map} fallback="#DCE6D8" />

        <View style={styles.tags}>
          {ride.tags.map((t) => (
            <View key={t} style={styles.tag}>
              <Text style={styles.tagText}>{t}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.title}>{ride.title}</Text>
        <View style={styles.statsRow}>
          <Stat icon="navigate-outline" label={ride.distanceKm} />
          <Stat icon="trending-up-outline" label={ride.elevation} />
          <Stat icon="time-outline" label={ride.duration} />
        </View>

        <View style={styles.block}>
          <SectionTitle>Résumé</SectionTitle>
          <Text style={styles.body}>{ride.summary}</Text>
        </View>

        <View style={styles.block}>
          <SectionTitle>Instructions au départ</SectionTitle>
          <Text style={styles.body}>{ride.startInstructions}</Text>
        </View>

        <View style={styles.block}>
          <SectionTitle>Le coin des pros</SectionTitle>
          <View style={styles.proCard}>
            <Text style={styles.proTitle}>
              Le conseil de {ride.proTip.author}
            </Text>
            <Text style={styles.proText}>{ride.proTip.text}</Text>
          </View>
          <View style={styles.tyres}>
            {ride.recommendedTyres.map((t) => (
              <TyreMiniCard key={t.id} tyre={t} />
            ))}
          </View>
        </View>

        <Pips count={2} active={0} />
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
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  map: { height: 180, width: "100%", borderRadius: radius.lg },
  tags: { flexDirection: "row", gap: spacing.sm },
  tag: {
    backgroundColor: colors.chipBg,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  tagText: { color: colors.navy, fontSize: font.tiny, fontWeight: "700" },
  title: { color: colors.text, fontSize: font.title, fontWeight: "800" },
  statsRow: { flexDirection: "row", gap: spacing.xl, marginTop: -spacing.sm },
  block: { gap: spacing.sm },
  body: { color: colors.textBody, fontSize: font.body, lineHeight: 21 },
  proCard: {
    backgroundColor: colors.navyDark,
    borderRadius: radius.md,
    padding: spacing.lg,
    gap: 6,
  },
  proTitle: { color: colors.yellow, fontSize: font.body, fontWeight: "800" },
  proText: { color: "rgba(255,255,255,0.9)", fontSize: font.small, lineHeight: 19 },
  tyres: { gap: spacing.sm, marginTop: spacing.sm },
});
