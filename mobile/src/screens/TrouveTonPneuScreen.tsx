import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { FeaturedTyreCard, TyreRow } from "../components/cards";
import { Chip, PrimaryButton, ScreenTitle } from "../components/ui";
import { ridesAnalysed, tyres } from "../data";
import { colors, spacing } from "../theme";
import type { TyreCategory } from "../types";

const CATEGORIES: TyreCategory[] = ["Route", "Montagne", "Performance"];

export function TrouveTonPneuScreen({
  selectedIds,
  onToggle,
  onCompare,
}: {
  selectedIds: string[];
  onToggle: (id: string) => void;
  onCompare: () => void;
}) {
  const [filter, setFilter] = useState<TyreCategory | null>(null);

  const list = useMemo(
    () =>
      filter ? tyres.filter((t) => t.categories.includes(filter)) : tyres,
    [filter],
  );

  const featured = list[0] ?? tyres[0];
  const rest = list.slice(1);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <ScreenTitle
        title="Trouve ton pneu"
        subtitle={`D'après tes ${ridesAnalysed} km analysés sur Strava`}
      />

      <View style={styles.chips}>
        {CATEGORIES.map((c) => (
          <Chip
            key={c}
            label={c}
            active={filter === c}
            onPress={() => setFilter((prev) => (prev === c ? null : c))}
          />
        ))}
      </View>

      <FeaturedTyreCard tyre={featured} />

      <View style={styles.list}>
        {rest.map((t) => (
          <TyreRow
            key={t.id}
            tyre={t}
            selected={selectedIds.includes(t.id)}
            onPress={() => onToggle(t.id)}
          />
        ))}
      </View>

      <PrimaryButton
        title={`Comparer la selection (${selectedIds.length})`}
        onPress={onCompare}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  chips: { flexDirection: "row", gap: spacing.sm },
  list: { gap: spacing.sm },
});
