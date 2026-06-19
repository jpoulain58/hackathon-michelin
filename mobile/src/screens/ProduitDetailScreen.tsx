import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SectionTitle, Spinner, TyreDonut } from "../components/ui";
import { fetchRetailers, type Retailer } from "../lib/api";
import { formatPressure, formatWeight, shortTechnologyList, tyreFormat, tyreShortName, tyreSize } from "../lib/tyres";
import { colors, font, radius, spacing } from "../theme";
import type { Tyre } from "../types";

const USE_LABELS: Record<string, string> = {
  RACING: "Course", URBAN: "Urbain", ENDURO: "Enduro", DOWNHILL: "Descente",
  CYCLOCROSS: "Cyclocross", TREKKING: "Trekking", TOURING: "Randonnée",
  CARGO: "Cargo", ENDURANCE: "Endurance", VERSATILE: "Polyvalent",
  TRAIL: "Trail", SPEED: "Vitesse", LEISURE: "Loisir",
};

const TERRAIN_LABELS: Record<string, string> = {
  ASPHALT: "Asphalte", "OFFROAD HARD PACKED": "Tout-chemin",
  "OFFROAD MIXED": "Mixte", "OFFROAD SOFT": "Sol meuble", "OFFROAD MUD": "Boue",
};

const CYCLE_LABELS: Record<string, string> = { ROAD: "Route", CITY: "Ville", MTB: "VTT" };

function segmentLabel(segment?: string): string {
  if (!segment) return "";
  if (segment.includes("RACING")) return "Racing Line";
  if (segment.includes("COMPETITION")) return "Competition Line";
  if (segment.includes("PERFORMANCE")) return "Performance Line";
  if (segment.includes("ACCESS")) return "Access Line";
  return segment;
}

export function ProduitDetailScreen({ tyre, onBack }: { tyre: Tyre; onBack: () => void }) {
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [loadingRetailers, setLoadingRetailers] = useState(true);

  useEffect(() => {
    let alive = true;
    fetchRetailers({ limit: 5 })
      .then((items) => {
        if (alive) setRetailers(items.filter((r) => r.website));
      })
      .catch(() => {
        if (alive) setRetailers([]);
      })
      .finally(() => {
        if (alive) setLoadingRetailers(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const techs = Object.entries(tyre.technologies ?? {}).filter(([, v]) => v && v.length > 0);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={onBack} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Catalogue</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.imageBox}>
          <TyreDonut size={140} />
        </View>

        <Text style={styles.name}>{tyreShortName(tyre)}</Text>
        <View style={styles.badgeRow}>
          {tyre.segment ? (
            <View style={styles.segmentBadge}>
              <Text style={styles.segmentBadgeText}>{segmentLabel(tyre.segment)}</Text>
            </View>
          ) : null}
          {tyre.cycleType ? (
            <View style={styles.cycleBadge}>
              <Text style={styles.cycleBadgeText}>{CYCLE_LABELS[tyre.cycleType] ?? tyre.cycleType}</Text>
            </View>
          ) : null}
        </View>

        {tyre.use && tyre.use.length > 0 ? (
          <View style={styles.chipsRow}>
            {tyre.use.map((u) => (
              <View key={u} style={styles.useChip}>
                <Text style={styles.useChipText}>{USE_LABELS[u] ?? u}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {tyre.terrainTypes && tyre.terrainTypes.length > 0 ? (
          <View style={styles.chipsRow}>
            {tyre.terrainTypes.map((t) => (
              <View key={t} style={styles.terrainChip}>
                <Text style={styles.terrainChipText}>{TERRAIN_LABELS[t] ?? t}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.statsGrid}>
          <QuickStat label="Poids" value={formatWeight(tyre)} />
          <QuickStat label="Format" value={tyreFormat(tyre)} />
          <QuickStat label="Dimensions" value={tyreSize(tyre)} />
          <QuickStat label="Pression max" value={formatPressure(tyre)} />
        </View>

        {techs.length > 0 ? (
          <View>
            <SectionTitle>Technologies</SectionTitle>
            <View style={styles.chipsRow}>
              {techs.flatMap(([, values]) => values as string[]).map((v) => (
                <View key={v} style={styles.techChip}>
                  <Text style={styles.techChipText}>{v}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        <View>
          <SectionTitle>Où acheter</SectionTitle>
          {loadingRetailers ? (
            <Spinner />
          ) : retailers.length === 0 ? (
            <Text style={styles.emptyText}>Aucun revendeur disponible pour le moment.</Text>
          ) : (
            <View style={{ gap: spacing.sm }}>
              {retailers.map((r) => (
                <Pressable key={r.id} style={styles.retailerRow} onPress={() => Linking.openURL(r.website)}>
                  <Text style={styles.retailerRegion}>{r.region ?? r.country ?? "Revendeur"}</Text>
                  <Ionicons name="open-outline" size={16} color={colors.navy} />
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function QuickStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statTile}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
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
  imageBox: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bgSoft,
    borderRadius: radius.lg,
    paddingVertical: spacing.xxl,
  },
  name: { color: colors.text, fontSize: font.title, fontWeight: "900" },
  badgeRow: { flexDirection: "row", gap: spacing.sm, marginTop: -spacing.sm },
  segmentBadge: { backgroundColor: colors.navy, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 4 },
  segmentBadgeText: { color: colors.white, fontSize: font.tiny, fontWeight: "800", textTransform: "uppercase" },
  cycleBadge: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 4 },
  cycleBadgeText: { color: colors.textBody, fontSize: font.tiny, fontWeight: "700" },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: -spacing.sm },
  useChip: { backgroundColor: "rgba(255,209,0,0.2)", borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  useChipText: { color: colors.navy, fontSize: font.tiny, fontWeight: "700" },
  terrainChip: { backgroundColor: colors.bgSoft, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  terrainChipText: { color: colors.textBody, fontSize: font.tiny, fontWeight: "600" },
  techChip: { backgroundColor: "rgba(255,209,0,0.15)", borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  techChipText: { color: colors.navy, fontSize: font.tiny, fontWeight: "700" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  statTile: {
    flexBasis: "47%",
    flexGrow: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    padding: spacing.md,
    alignItems: "center",
  },
  statLabel: { color: colors.textFaint, fontSize: font.tiny, fontWeight: "700", textTransform: "uppercase" },
  statValue: { color: colors.navy, fontSize: font.small, fontWeight: "800", marginTop: 2 },
  emptyText: { color: colors.textMuted, fontSize: font.body },
  retailerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  retailerRegion: { color: colors.text, fontSize: font.body, fontWeight: "600" },
});
