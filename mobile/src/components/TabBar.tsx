import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, font } from "../theme";
import type { TabKey } from "../types";

type IconName = keyof typeof Ionicons.glyphMap;

const TABS: {
  key: TabKey;
  label: string;
  icon: IconName;
  iconActive: IconName;
}[] = [
  { key: "trouver", label: "Trouver", icon: "search-outline", iconActive: "search" },
  {
    key: "comparer",
    label: "Comparer",
    icon: "git-compare-outline",
    iconActive: "git-compare",
  },
  {
    key: "communaute",
    label: "Communauté",
    icon: "people-outline",
    iconActive: "people",
  },
  { key: "club", label: "Club", icon: "ribbon-outline", iconActive: "ribbon" },
];

export function TabBar({
  active,
  onChange,
}: {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}) {
  return (
    <View style={styles.bar}>
      {TABS.map((tab) => {
        const on = tab.key === active;
        return (
          <Pressable
            key={tab.key}
            style={styles.item}
            onPress={() => onChange(tab.key)}
            hitSlop={8}
          >
            <Ionicons
              name={on ? tab.iconActive : tab.icon}
              size={22}
              color={on ? colors.navy : colors.textFaint}
            />
            <Text style={[styles.label, on && styles.labelActive]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 6,
  },
  item: { alignItems: "center", gap: 4, flex: 1 },
  label: { color: colors.textFaint, fontSize: font.tiny, fontWeight: "600" },
  labelActive: { color: colors.navy },
});
