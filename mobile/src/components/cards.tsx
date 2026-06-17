import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, font, radius, shadow, spacing } from "../theme";
import type { Review, Ride, Tyre } from "../types";
import { Badge, RemoteImage, Stars, TyreDonut } from "./ui";

/* ------------------------------------------------- Carte pneu mise en avant */

export function FeaturedTyreCard({
  tyre,
  selected = false,
  onPress,
}: {
  tyre: Tyre;
  selected?: boolean;
  onPress?: () => void;
}) {
  const content = (
    <>
      <View style={styles.featuredBadges}>
        <Badge label={`${tyre.matchScore}%`} tone="green" />
        {tyre.bestChoice ? <Badge label="Meilleur choix" /> : null}
        {selected ? <Badge label="Sélectionné" /> : null}
      </View>
      <View style={styles.featuredImage}>
        <TyreDonut size={130} />
      </View>
      <Text style={styles.featuredName}>{tyre.name}</Text>
      <Text style={styles.meta}>
        {tyre.weight} - {tyre.dimensions}
      </Text>
    </>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={[styles.featured, selected && styles.featuredSelected]}>
        {content}
      </Pressable>
    );
  }

  return <View style={[styles.featured, selected && styles.featuredSelected]}>{content}</View>;
}

/* --------------------------------------------- Ligne pneu (selectionnable) */

export function TyreRow({
  tyre,
  selected,
  onPress,
}: {
  tyre: Tyre;
  selected?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.row, selected && styles.rowSelected]}
    >
      <TyreDonut size={46} />
      <View style={styles.rowBody}>
        <Text style={styles.rowName} numberOfLines={1}>
          {tyre.name}
        </Text>
        <Text style={styles.meta}>
          {tyre.weight} - {tyre.dimensions}
        </Text>
      </View>
      <View style={[styles.check, selected && styles.checkOn]}>
        {selected ? (
          <Ionicons name="checkmark" size={14} color={colors.white} />
        ) : null}
      </View>
    </Pressable>
  );
}

/* ---------------------------------------------------- Carte pneu compacte */

export function TyreMiniCard({ tyre }: { tyre: Tyre }) {
  return (
    <View style={styles.mini}>
      <TyreDonut size={42} />
      <View style={styles.rowBody}>
        <Text style={styles.rowName} numberOfLines={1}>
          {tyre.name}
        </Text>
        <Text style={styles.meta}>
          {tyre.weight} - {tyre.dimensions}
        </Text>
      </View>
    </View>
  );
}

/* ---------------------------------------------------------- Carte avis */

export function ReviewCard({ review }: { review: Review }) {
  return (
    <View style={styles.review}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{review.author}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.reviewProduct}>{review.product}</Text>
        <View style={styles.reviewMetaRow}>
          {review.verified ? (
            <View style={styles.verifiedRow}>
              <Ionicons
                name="checkmark-circle"
                size={13}
                color={colors.green}
              />
              <Text style={styles.verifiedText}>Avis vérifié</Text>
            </View>
          ) : null}
          <Stars value={review.rating} />
        </View>
        <Text style={styles.reviewText} numberOfLines={2}>
          {"« "}
          {review.text}
          {" »"}
        </Text>
      </View>
    </View>
  );
}

/* --------------------------------------------------------- Carte balade */

export function RideCard({
  ride,
  onPress,
}: {
  ride: Ride;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.ride}>
      <RemoteImage uri={ride.mapUrl} style={styles.rideMap} fallback="#DCE6D8" />
      <View style={styles.rideBody}>
        <Text style={styles.rideTitle}>{ride.title}</Text>
        <View style={styles.statsRow}>
          <Stat icon="navigate-outline" label={ride.distanceKm} />
          <Stat icon="trending-up-outline" label={ride.elevation} />
          <Stat icon="time-outline" label={ride.duration} />
        </View>
      </View>
    </Pressable>
  );
}

export function Stat({
  icon,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  return (
    <View style={styles.stat}>
      <Ionicons name={icon} size={15} color={colors.navy} />
      <Text style={styles.statText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  featured: {
    borderWidth: 1.5,
    borderColor: colors.navy,
    borderRadius: radius.lg,
    padding: spacing.lg,
    backgroundColor: colors.white,
    ...shadow.card,
  },
  featuredSelected: {
    backgroundColor: "#F4F7FC",
  },
  featuredBadges: { flexDirection: "row", gap: spacing.sm },
  featuredImage: { alignItems: "center", paddingVertical: spacing.lg },
  featuredName: {
    color: colors.text,
    fontSize: font.h3,
    fontWeight: "700",
    textAlign: "center",
  },
  meta: { color: colors.textMuted, fontSize: font.small, marginTop: 3 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.white,
  },
  rowSelected: {
    borderColor: colors.navy,
    borderWidth: 1.5,
    backgroundColor: "#F4F7FC",
  },
  rowBody: { flex: 1 },
  rowName: { color: colors.text, fontSize: font.body, fontWeight: "600" },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkOn: { backgroundColor: colors.navy, borderColor: colors.navy },
  mini: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.white,
  },
  review: {
    flexDirection: "row",
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.white,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.navy,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.white, fontSize: font.small, fontWeight: "700" },
  reviewProduct: { color: colors.text, fontSize: font.body, fontWeight: "600" },
  reviewMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: 3,
  },
  verifiedRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  verifiedText: { color: colors.green, fontSize: font.tiny, fontWeight: "700" },
  reviewText: {
    color: colors.textBody,
    fontSize: font.small,
    marginTop: 6,
    lineHeight: 18,
  },
  ride: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: colors.white,
  },
  rideMap: { height: 130, width: "100%" },
  rideBody: { padding: spacing.md },
  rideTitle: { color: colors.text, fontSize: font.h3, fontWeight: "700" },
  statsRow: { flexDirection: "row", gap: spacing.lg, marginTop: spacing.sm },
  stat: { flexDirection: "row", alignItems: "center", gap: 4 },
  statText: { color: colors.textBody, fontSize: font.small, fontWeight: "600" },
});
