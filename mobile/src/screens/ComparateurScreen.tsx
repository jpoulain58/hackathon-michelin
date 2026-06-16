import { Ionicons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { PrimaryButton, ScoreDots, ScreenTitle } from "../components/ui";
import { compareColumns, compareRows } from "../data";
import { colors, font, radius, spacing } from "../theme";

export function ComparateurScreen() {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <ScreenTitle
        title="Comparateur"
        subtitle="En toute transparence, concurrents inclus"
      />

      <View style={styles.table}>
        {/* En-tetes de colonnes */}
        <View style={styles.headerRow}>
          <View style={styles.labelCell} />
          {compareColumns.map((col) => (
            <View
              key={col.id}
              style={[styles.valueCell, col.tag ? styles.matchCell : null]}
            >
              {col.tag ? (
                <Text style={styles.tag}>{col.tag}</Text>
              ) : (
                <View style={styles.tagSpacer} />
              )}
              <View style={[styles.headDot, { backgroundColor: col.accent }]} />
              <Text style={styles.colLabel}>{col.label}</Text>
            </View>
          ))}
        </View>

        {/* Lignes de criteres */}
        {compareRows.map((row) => (
          <View key={row.key} style={styles.dataRow}>
            <View style={styles.labelCell}>
              <Text style={styles.rowLabel}>{row.label}</Text>
            </View>
            {compareColumns.map((col) => (
              <View
                key={col.id}
                style={[styles.valueCell, col.tag ? styles.matchCell : null]}
              >
                {row.kind === "dots" ? (
                  <ScoreDots value={Number(col[row.key])} />
                ) : (
                  <Text style={[styles.value, col.tag && styles.valueStrong]}>
                    {String(col[row.key])}
                  </Text>
                )}
              </View>
            ))}
          </View>
        ))}
      </View>

      <PrimaryButton
        title="Voir ou acheter"
        iconRight={
          <Ionicons name="open-outline" size={18} color={colors.white} />
        }
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.xl },
  table: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  headerRow: { flexDirection: "row", paddingBottom: spacing.sm },
  dataRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    minHeight: 46,
  },
  labelCell: { flex: 1.3, paddingHorizontal: spacing.md, paddingVertical: 8 },
  valueCell: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    gap: 4,
  },
  matchCell: { backgroundColor: "#F0F4FB" },
  tag: {
    color: colors.navy,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginTop: 8,
  },
  tagSpacer: { height: 8, marginTop: 8 },
  headDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  colLabel: { color: colors.text, fontSize: font.small, fontWeight: "700" },
  rowLabel: { color: colors.textBody, fontSize: font.body, fontWeight: "600" },
  value: { color: colors.textBody, fontSize: font.body },
  valueStrong: { color: colors.text, fontWeight: "800" },
});
