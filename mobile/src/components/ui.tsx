import { Ionicons } from "@expo/vector-icons";
import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Image,
  type ImageSourcePropType,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { colors, font, radius, spacing } from "../theme";

/* ------------------------------------------------------------------ Titles */

export function ScreenTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={styles.screenTitle}>{title}</Text>
      {subtitle ? <Text style={styles.screenSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

/* -------------------------------------------------------------------- Chip */

export function Chip({
  label,
  active = false,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
      hitSlop={6}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

/* ------------------------------------------------------------------- Badge */

export function Badge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "green" | "neutral";
}) {
  const isGreen = tone === "green";
  return (
    <View
      style={[
        styles.badge,
        { borderColor: isGreen ? colors.green : colors.border },
      ]}
    >
      <Text
        style={[
          styles.badgeText,
          { color: isGreen ? colors.green : colors.textMuted },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

/* ------------------------------------------------------------ PrimaryButton */

type ButtonVariant = "navy" | "strava" | "dark" | "ghost";

export function PrimaryButton({
  title,
  onPress,
  variant = "navy",
  icon,
  iconRight,
  disabled = false,
}: {
  title: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  icon?: ReactNode;
  iconRight?: ReactNode;
  disabled?: boolean;
}) {
  const bg =
    variant === "strava"
      ? colors.strava
      : variant === "dark"
        ? colors.navyDark
        : variant === "ghost"
          ? "transparent"
          : colors.navy;

  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg },
        variant === "ghost" && styles.buttonGhost,
        disabled && { opacity: 0.55 },
        pressed && !disabled && { opacity: 0.85 },
      ]}
    >
      {icon}
      <Text
        style={[
          styles.buttonText,
          variant === "ghost" && { color: colors.white, fontWeight: "600" },
        ]}
      >
        {title}
      </Text>
      {iconRight}
    </Pressable>
  );
}

/* --------------------------------------------------------------- ScoreDots */

export function ScoreDots({
  value,
  max = 5,
  color = colors.navy,
}: {
  value: number;
  max?: number;
  color?: string;
}) {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: max }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.scoreDot,
            { backgroundColor: i < value ? color : colors.dotEmpty },
          ]}
        />
      ))}
    </View>
  );
}

/* ------------------------------------------------------------------- Stars */

export function Stars({
  value,
  size = 14,
  color = colors.green,
}: {
  value: number;
  size?: number;
  color?: string;
}) {
  return (
    <View style={{ flexDirection: "row", gap: 2 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Ionicons
          key={i}
          name={i < value ? "star" : "star-outline"}
          size={size}
          color={color}
        />
      ))}
    </View>
  );
}

/* -------------------------------------------------------------------- Pips */

export function Pips({ count, active }: { count: number; active: number }) {
  return (
    <View style={styles.pipsRow}>
      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.pip,
            i === active ? styles.pipActive : styles.pipInactive,
          ]}
        />
      ))}
    </View>
  );
}

/* --------------------------------------------------------------- TyreDonut */

export function TyreDonut({ size = 120 }: { size?: number }) {
  const ring = Math.max(8, size * 0.16);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: ring,
        borderColor: colors.tyre,
        backgroundColor: colors.white,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <View
        style={{
          width: size - ring * 2,
          height: size - ring * 2,
          borderRadius: size,
          borderWidth: Math.max(1, size * 0.02),
          borderColor: "rgba(255,255,255,0.25)",
        }}
      />
    </View>
  );
}

/* -------------------------------------------------------------- RemoteImage */

/** Image distante avec couleur de repli (jamais de bloc vide a la demo). */
export function RemoteImage({
  uri,
  style,
  fallback = colors.navyDark,
  children,
}: {
  uri: string;
  style?: ViewStyle;
  fallback?: string;
  children?: ReactNode;
}) {
  return (
    <View style={[{ backgroundColor: fallback, overflow: "hidden" }, style]}>
      <Image
        source={{ uri } as ImageSourcePropType}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
      {children}
    </View>
  );
}

export function Spinner() {
  return (
    <View style={styles.spinner}>
      <ActivityIndicator color={colors.navy} />
    </View>
  );
}

const styles = StyleSheet.create({
  screenTitle: {
    color: colors.text,
    fontSize: font.title,
    fontWeight: "800",
    letterSpacing: -0.4,
  },
  screenSubtitle: {
    color: colors.textMuted,
    fontSize: font.body,
    marginTop: 4,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: font.h3,
    fontWeight: "700",
    marginBottom: spacing.md,
  },
  chip: {
    backgroundColor: colors.chipBg,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  chipActive: { backgroundColor: colors.navy },
  chipText: { color: colors.navy, fontSize: font.small, fontWeight: "600" },
  chipTextActive: { color: colors.white },
  badge: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
    backgroundColor: colors.white,
  },
  badgeText: { fontSize: font.tiny, fontWeight: "700" },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.md,
    paddingVertical: 15,
    paddingHorizontal: spacing.lg,
  },
  buttonGhost: { paddingVertical: 8 },
  buttonText: { color: colors.white, fontSize: font.h3, fontWeight: "700" },
  dotsRow: { flexDirection: "row", gap: 5 },
  scoreDot: { width: 8, height: 8, borderRadius: 4 },
  pipsRow: {
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    marginTop: spacing.md,
  },
  pip: { height: 6, borderRadius: 3 },
  pipActive: { width: 18, backgroundColor: colors.navy },
  pipInactive: { width: 6, backgroundColor: colors.dotEmpty },
  spinner: { paddingVertical: spacing.xxl, alignItems: "center" },
});
