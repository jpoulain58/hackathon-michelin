import { Ionicons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { PrimaryButton, ScreenTitle, SectionTitle } from "../components/ui";
import { clubPlan } from "../data";
import { colors, font, radius, spacing } from "../theme";

export function ClubScreen() {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <ScreenTitle title="Le club" />

      <SectionTitle>Mon abonnement</SectionTitle>
      <View style={styles.planCard}>
        <Text style={styles.planName}>{clubPlan.name}</Text>
        <Text style={styles.planPrice}>{clubPlan.price}</Text>
      </View>

      <View style={styles.advantagesHeader}>
        <SectionTitle>Mes avantages</SectionTitle>
      </View>
      <View style={styles.advantages}>
        {clubPlan.advantages.map((adv) => (
          <View key={adv} style={styles.advantage}>
            <Ionicons name="checkmark-circle" size={20} color={colors.green} />
            <Text style={styles.advantageText}>{adv}</Text>
          </View>
        ))}
      </View>

      <PrimaryButton title="Changer d'abonnement" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  planCard: {
    backgroundColor: colors.navy,
    borderRadius: radius.lg,
    padding: spacing.xl,
  },
  planName: {
    color: colors.yellow,
    fontSize: 26,
    fontWeight: "900",
  },
  planPrice: {
    color: colors.white,
    fontSize: font.h3,
    fontWeight: "600",
    marginTop: 2,
  },
  advantagesHeader: { marginTop: spacing.sm },
  advantages: { gap: spacing.sm },
  advantage: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
  },
  advantageText: { color: colors.text, fontSize: font.body, fontWeight: "500" },
});
