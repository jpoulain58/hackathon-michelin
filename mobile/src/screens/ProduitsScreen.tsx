import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Chip, ScreenTitle, Spinner, TyreDonut } from "../components/ui";
import { fetchTyres } from "../lib/api";
import { apiToTyre, formatWeight, tyreShortName, tyreSize } from "../lib/tyres";
import { colors, font, radius, spacing } from "../theme";
import type { Tyre } from "../types";

const FILTERS = [
  { label: "Route", cycleType: "ROAD" },
  { label: "VTT", cycleType: "MTB" },
  { label: "Ville", cycleType: "CITY" },
] as const;

export function ProduitsScreen({
  onBack,
  onOpenProduit,
}: {
  onBack: () => void;
  onOpenProduit: (tyre: Tyre) => void;
}) {
  const [tyres, setTyres] = useState<Tyre[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchTyres({ limit: 50 })
      .then((items) => {
        if (alive) setTyres(items.map((t, i) => apiToTyre(t, i)));
      })
      .catch(() => {
        if (alive) setError("Impossible de charger le catalogue.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(
    () => (filter ? tyres.filter((t) => t.cycleType === filter) : tyres),
    [tyres, filter],
  );

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
        <ScreenTitle title="Tous nos pneus vélo" subtitle={`${filtered.length} référence${filtered.length > 1 ? "s" : ""}`} />

        <View style={styles.filters}>
          {FILTERS.map((f) => (
            <Chip
              key={f.cycleType}
              label={f.label}
              active={filter === f.cycleType}
              onPress={() => setFilter(filter === f.cycleType ? null : f.cycleType)}
            />
          ))}
        </View>

        {loading ? (
          <Spinner />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : (
          <View style={styles.grid}>
            {filtered.map((tyre) => (
              <Pressable key={tyre.id} style={styles.card} onPress={() => onOpenProduit(tyre)}>
                <TyreDonut size={56} />
                <Text style={styles.cardName} numberOfLines={2}>
                  {tyreShortName(tyre)}
                </Text>
                <Text style={styles.cardMeta}>{formatWeight(tyre)}</Text>
                <Text style={styles.cardMeta}>{tyreSize(tyre)}</Text>
              </Pressable>
            ))}
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
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  filters: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md, marginBottom: spacing.lg },
  errorText: { color: "#D64545", fontSize: font.body, fontWeight: "600" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  card: {
    flexBasis: "47%",
    flexGrow: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    padding: spacing.md,
    alignItems: "center",
    gap: 4,
  },
  cardName: { color: colors.navy, fontSize: font.small, fontWeight: "800", textAlign: "center", marginTop: spacing.xs },
  cardMeta: { color: colors.textMuted, fontSize: font.tiny, fontWeight: "600" },
});
