import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import { PrimaryButton, ScoreDots, ScreenTitle, Spinner, TyreDonut } from "../components/ui";
import { fetchRecommendations } from "../lib/api";
import {
  apiToTyre,
  formatPressure,
  metricScore,
  shortTechnologyList,
  tyreFormat,
  tyreShortName,
} from "../lib/tyres";
import { colors, font, radius, spacing } from "../theme";
import type { Tyre } from "../types";

const MAX_COLUMNS = 3;

type Row =
  | { key: "rendement" | "adherence" | "protection"; label: string; kind: "dots" }
  | { key: "poids" | "format" | "dimensions" | "pression" | "tech"; label: string; kind: "text" };

const rows: Row[] = [
  { key: "rendement", label: "Rendement", kind: "dots" },
  { key: "adherence", label: "Adhérence", kind: "dots" },
  { key: "protection", label: "Protection", kind: "dots" },
  { key: "poids", label: "Poids", kind: "text" },
  { key: "format", label: "Format", kind: "text" },
  { key: "dimensions", label: "Dimensions", kind: "text" },
  { key: "pression", label: "Pression max", kind: "text" },
  { key: "tech", label: "Technos", kind: "text" },
];

export function ComparateurScreen({ selectedTyres = [] }: { selectedTyres?: Tyre[] }) {
  const [tyres, setTyres] = useState<Tyre[]>(selectedTyres.slice(0, MAX_COLUMNS));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedTyres.length >= 2) {
      setTyres(selectedTyres.slice(0, MAX_COLUMNS));
      setError(null);
      setLoading(false);
      return;
    }

    let alive = true;
    setLoading(true);
    setError(null);
    fetchRecommendations({ discipline: "road", priority: "speed", ebike: false, limit: MAX_COLUMNS })
      .then((items) => {
        if (alive) setTyres(items.map(apiToTyre).slice(0, MAX_COLUMNS));
      })
      .catch(() => {
        if (alive) setError("Impossible de charger les produits a comparer.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [selectedTyres]);

  const first = tyres[0];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <ScreenTitle
        title="Comparateur"
        subtitle={selectedTyres.length >= 2 ? "Ta selection" : "Produits Michelin du catalogue"}
      />

      {loading ? (
        <Spinner />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <>
          <View style={styles.products}>
            {tyres.map((tyre, index) => (
              <View key={tyre.id} style={[styles.product, index === 0 && styles.productPrimary]}>
                <View style={styles.productBadge}>
                  <Text style={styles.productBadgeText}>{index === 0 ? "Match" : tyre.cycleType ?? "Pneu"}</Text>
                </View>
                <TyreDonut size={64} />
                <Text style={styles.productName} numberOfLines={3}>
                  {tyreShortName(tyre)}
                </Text>
                <Text style={styles.productMeta}>{tyre.dimensions}</Text>
              </View>
            ))}
          </View>

          <View style={styles.table}>
            {rows.map((row, rowIndex) => (
              <View key={row.key} style={[styles.dataRow, rowIndex === 0 && styles.firstRow]}>
                <View style={styles.labelCell}>
                  <Text style={styles.rowLabel}>{row.label}</Text>
                </View>
                {tyres.map((tyre) => (
                  <View key={tyre.id} style={styles.valueCell}>
                    {row.kind === "dots" ? (
                      <ScoreDots value={scoreForRow(tyre, row.key)} />
                    ) : (
                      <Text style={styles.value} numberOfLines={2}>
                        {valueForRow(tyre, row.key)}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            ))}
          </View>

          <PrimaryButton
            title="Voir ou acheter"
            onPress={() => openProduct(first)}
            iconRight={<Ionicons name="open-outline" size={18} color={colors.white} />}
          />
        </>
      )}
    </ScrollView>
  );
}

function scoreForRow(tyre: Tyre, key: "rendement" | "adherence" | "protection"): number {
  if (key === "rendement") return metricScore(tyre, "speed");
  if (key === "adherence") return metricScore(tyre, "grip");
  return metricScore(tyre, "protection");
}

function valueForRow(tyre: Tyre, key: "poids" | "format" | "dimensions" | "pression" | "tech"): string {
  if (key === "poids") return tyre.weight;
  if (key === "format") return tyreFormat(tyre);
  if (key === "dimensions") return tyre.dimensions;
  if (key === "pression") return formatPressure(tyre);
  return shortTechnologyList(tyre);
}

function openProduct(tyre?: Tyre) {
  if (!tyre) return;
  const q = encodeURIComponent(tyre.range ?? tyre.name);
  Linking.openURL(`https://www.michelin.fr/velo?utm_source=trustwheels&utm_medium=app&utm_campaign=comparateur&q=${q}`);
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.xl },
  products: { flexDirection: "row", gap: spacing.sm },
  product: {
    flex: 1,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.white,
    gap: spacing.sm,
  },
  productPrimary: { borderColor: colors.navy, backgroundColor: "#F4F7FC" },
  productBadge: {
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    backgroundColor: colors.chipBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  productBadgeText: { color: colors.navy, fontSize: 9, fontWeight: "800" },
  productName: {
    minHeight: 48,
    color: colors.text,
    fontSize: font.small,
    fontWeight: "800",
    textAlign: "center",
  },
  productMeta: { color: colors.textMuted, fontSize: font.tiny, textAlign: "center" },
  table: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  dataRow: {
    flexDirection: "row",
    alignItems: "stretch",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    minHeight: 54,
  },
  firstRow: { borderTopWidth: 0 },
  labelCell: {
    flex: 1.15,
    justifyContent: "center",
    backgroundColor: colors.bgSoft,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  valueCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
  },
  rowLabel: { color: colors.text, fontSize: font.small, fontWeight: "800" },
  value: {
    color: colors.textBody,
    fontSize: font.small,
    lineHeight: 16,
    textAlign: "center",
    fontWeight: "600",
  },
  errorText: {
    color: "#CC2200",
    fontSize: font.small,
    backgroundColor: "#FFF0EE",
    padding: spacing.md,
    borderRadius: radius.md,
  },
});
