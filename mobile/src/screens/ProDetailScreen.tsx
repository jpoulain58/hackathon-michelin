import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { RemoteImage, SectionTitle } from "../components/ui";
import type { ProRider } from "../lib/api";
import { colors, font, radius, spacing } from "../theme";

export function ProDetailScreen({ pro, onBack }: { pro: ProRider; onBack: () => void }) {
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={onBack} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Communauté</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <RemoteImage uri={pro.image} style={styles.hero} fallback={colors.navyDark} />

        <View>
          <Text style={styles.discipline}>{pro.discipline}</Text>
          <Text style={styles.name}>{pro.name}</Text>
          <Text style={styles.team}>{pro.team}</Text>
        </View>

        <View style={styles.tyreCard}>
          <Text style={styles.tyreLabel}>Pneu actuel</Text>
          <Text style={styles.tyreName}>{pro.tyre}</Text>
        </View>

        {pro.bio ? <Text style={styles.bio}>{pro.bio}</Text> : null}

        <View>
          <SectionTitle>Palmarès</SectionTitle>
          <View style={{ gap: spacing.sm }}>
            {pro.competitions.map((c, i) => (
              <View key={i} style={styles.compRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.compName}>{c.name}</Text>
                  <Text style={styles.compTyre}>{c.tyre}</Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  {c.result ? <Text style={styles.compResult}>{c.result}</Text> : null}
                  {c.date ? <Text style={styles.compDate}>{c.date}</Text> : null}
                </View>
              </View>
            ))}
          </View>
        </View>
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
  hero: { height: 220, width: "100%", borderRadius: radius.lg },
  discipline: { color: colors.textMuted, fontSize: font.tiny, fontWeight: "700", textTransform: "uppercase" },
  name: { color: colors.text, fontSize: font.title, fontWeight: "900", marginTop: 2 },
  team: { color: colors.textMuted, fontSize: font.body, marginTop: 2 },
  tyreCard: {
    backgroundColor: colors.bgSoft,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  tyreLabel: { color: colors.textMuted, fontSize: font.tiny, fontWeight: "700", textTransform: "uppercase" },
  tyreName: { color: colors.navy, fontSize: font.h3, fontWeight: "800", marginTop: 2 },
  bio: { color: colors.textBody, fontSize: font.body, lineHeight: 21 },
  compRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  compName: { color: colors.text, fontSize: font.body, fontWeight: "700" },
  compTyre: { color: colors.navy, fontSize: font.tiny, fontWeight: "600", marginTop: 2 },
  compResult: { color: colors.green, fontSize: font.small, fontWeight: "700" },
  compDate: { color: colors.textFaint, fontSize: font.tiny, marginTop: 2 },
});
