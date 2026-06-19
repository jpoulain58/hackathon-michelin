import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { PrimaryButton, ScoreDots, ScreenTitle, Spinner, TyreDonut } from "../components/ui";
import { fetchRecommendations, fetchRetailers, type Retailer } from "../lib/api";
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

export function ComparateurScreen({
  selectedTyres = [],
  onOpenCatalogue,
}: {
  selectedTyres?: Tyre[];
  onOpenCatalogue: () => void;
}) {
  const [tyres, setTyres] = useState<Tyre[]>(selectedTyres.slice(0, MAX_COLUMNS));
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [loadingRetailers, setLoadingRetailers] = useState(true);
  const [retailersOpen, setRetailersOpen] = useState(false);
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

  useEffect(() => {
    let alive = true;
    setLoadingRetailers(true);
    fetchRetailers({ limit: 8 })
      .then((items) => {
        if (alive) setRetailers(items.filter((item) => item.website));
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

  return (
    <>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScreenTitle
          title="Comparateur"
          subtitle={selectedTyres.length >= 2 ? "Ta selection" : "Produits Michelin du catalogue"}
        />

        <Pressable onPress={onOpenCatalogue} style={styles.catalogueLink} hitSlop={6}>
          <Text style={styles.catalogueLinkText}>Voir tout le catalogue</Text>
          <Ionicons name="chevron-forward" size={14} color={colors.navy} />
        </Pressable>

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
              onPress={() => setRetailersOpen(true)}
              iconRight={<Ionicons name="chevron-up-outline" size={18} color={colors.white} />}
            />
          </>
        )}
      </ScrollView>

      <RetailersSheet
        visible={retailersOpen}
        retailers={retailers}
        loading={loadingRetailers}
        tyre={first}
        onClose={() => setRetailersOpen(false)}
      />
    </>
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

function RetailersSheet({
  visible,
  retailers,
  loading,
  tyre,
  onClose,
}: {
  visible: boolean;
  retailers: Retailer[];
  loading: boolean;
  tyre?: Tyre;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.sheetRoot}>
        <Pressable style={styles.sheetScrim} onPress={onClose} />
        <View style={styles.retailersPanel}>
          <View style={styles.sheetHandle} />
          <View style={styles.retailersHeader}>
            <View style={styles.retailersIcon}>
              <Ionicons name="storefront-outline" size={18} color={colors.navy} />
            </View>
            <View style={styles.retailersTitleBlock}>
              <Text style={styles.retailersEyebrow}>Revendeurs officiels</Text>
              <Text style={styles.retailersTitle}>Où acheter</Text>
            </View>
            <Pressable onPress={onClose} style={styles.sheetClose} hitSlop={10}>
              <Ionicons name="close" size={20} color={colors.white} />
            </Pressable>
          </View>

          <Text style={styles.retailersIntro}>
            {tyre
              ? `Revendeurs chargés depuis la base Trust Wheels pour chercher ${tyreShortName(tyre)}.`
              : "Revendeurs chargés depuis la base Trust Wheels."}
          </Text>

          {loading ? (
            <View style={styles.retailersLoading}>
              <Spinner />
            </View>
          ) : retailers.length === 0 ? (
            <View style={styles.retailersEmpty}>
              <Text style={styles.retailersEmptyText}>Aucun revendeur disponible pour le moment.</Text>
            </View>
          ) : (
            <ScrollView style={styles.retailersScroller} showsVerticalScrollIndicator={false}>
              <View style={styles.retailersList}>
                {retailers.map((retailer) => (
                  <RetailerCard key={retailer.id} retailer={retailer} />
                ))}
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

function RetailerCard({ retailer }: { retailer: Retailer }) {
  const domain = formatRetailerDomain(retailer.website);
  const location = [retailer.country, retailer.region].filter(Boolean).join(" · ");

  return (
    <Pressable
      onPress={() => openRetailer(retailer.website)}
      style={({ pressed }) => [styles.retailerCard, pressed && styles.retailerCardPressed]}
    >
      <View style={styles.retailerMark}>
        <Text style={styles.retailerMarkText}>{domain.slice(0, 1).toUpperCase()}</Text>
      </View>
      <View style={styles.retailerBody}>
        <Text style={styles.retailerName} numberOfLines={1}>{domain}</Text>
        <Text style={styles.retailerLocation} numberOfLines={1}>{location || "Revendeur en ligne"}</Text>
      </View>
      <Ionicons name="open-outline" size={18} color={colors.navy} />
    </Pressable>
  );
}

function openRetailer(website: string) {
  const url = normalizeRetailerUrl(website);
  if (!url) return;
  Linking.openURL(url);
}

function normalizeRetailerUrl(website: string): string | null {
  const value = website.trim();
  if (!value) return null;
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function formatRetailerDomain(website: string): string {
  return website
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/.*$/, "");
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
  catalogueLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginBottom: spacing.lg,
  },
  catalogueLinkText: { color: colors.navy, fontSize: font.small, fontWeight: "700" },
  sheetRoot: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(11,18,32,0.52)",
  },
  sheetScrim: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  retailersPanel: {
    maxHeight: "78%",
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: "rgba(255,255,255,0.16)",
    backgroundColor: colors.navyDark,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.32)",
    marginBottom: spacing.sm,
  },
  sheetClose: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  retailersHeader: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  retailersIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.yellow,
    alignItems: "center",
    justifyContent: "center",
  },
  retailersTitleBlock: { flex: 1 },
  retailersEyebrow: {
    color: "rgba(255,255,255,0.58)",
    fontSize: font.tiny,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  retailersTitle: { color: colors.white, fontSize: font.h2, fontWeight: "800", marginTop: 1 },
  retailersCount: {
    minWidth: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
  retailersCountText: { color: colors.yellow, fontSize: font.small, fontWeight: "900" },
  retailersIntro: { color: "rgba(255,255,255,0.72)", fontSize: font.small, lineHeight: 18 },
  retailersLoading: {
    minHeight: 78,
    borderRadius: radius.md,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
  },
  retailersEmpty: {
    borderRadius: radius.md,
    backgroundColor: "rgba(255,255,255,0.08)",
    padding: spacing.md,
  },
  retailersEmptyText: { color: "rgba(255,255,255,0.72)", fontSize: font.small },
  retailersScroller: { maxHeight: 360 },
  retailersList: { gap: spacing.sm },
  retailerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    padding: spacing.md,
  },
  retailerCardPressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  retailerMark: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.chipBg,
    alignItems: "center",
    justifyContent: "center",
  },
  retailerMarkText: { color: colors.navy, fontSize: font.h3, fontWeight: "900" },
  retailerBody: { flex: 1 },
  retailerName: { color: colors.text, fontSize: font.body, fontWeight: "800" },
  retailerLocation: { color: colors.textMuted, fontSize: font.small, marginTop: 2 },
});
