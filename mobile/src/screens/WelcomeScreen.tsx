import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { PrimaryButton, RemoteImage } from "../components/ui";
import { heroImage } from "../data";
import { colors, font, spacing } from "../theme";
import type { AuthProviderId } from "../lib/auth";

export function WelcomeScreen({
  onProvider,
  onEmail,
  loading,
  message,
}: {
  onProvider: (provider: AuthProviderId) => void;
  onEmail: (email: string) => void;
  loading: AuthProviderId | "email" | null;
  message?: string | null;
}) {
  const [email, setEmail] = useState("");

  return (
    <RemoteImage uri={heroImage} style={styles.bg} fallback={colors.navyDark}>
      <StatusBar style="light" />
      <LinearGradient
        colors={["rgba(11,18,32,0.25)", "rgba(11,18,32,0.55)", "rgba(11,18,32,0.92)"]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safe}>
        <View style={styles.brand}>
          <Text style={styles.michelin}>MICHELIN</Text>
          <View style={styles.underline} />
          <Text style={styles.trust}>TRUST WHEELS</Text>
        </View>

        <View style={styles.actions}>
          <PrimaryButton
            title="Se connecter avec Strava"
            variant="strava"
            onPress={() => onProvider("strava")}
            disabled={loading !== null}
            icon={<Ionicons name="pulse" size={18} color={colors.white} />}
          />
          <PrimaryButton
            title="Se connecter avec Google"
            variant="navy"
            onPress={() => onProvider("google")}
            disabled={loading !== null}
            icon={<Ionicons name="logo-google" size={17} color={colors.white} />}
          />
          <PrimaryButton
            title="Se connecter avec Garmin"
            variant="dark"
            onPress={() => onProvider("garmin")}
            disabled={loading !== null}
            icon={<Ionicons name="triangle" size={16} color={colors.white} />}
          />
          <View style={styles.emailBox}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="email@exemple.fr"
              placeholderTextColor="rgba(22,33,63,0.55)"
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.emailInput}
            />
            <PrimaryButton
              title={loading === "email" ? "Envoi..." : "Recevoir un lien"}
              variant="navy"
              onPress={() => onEmail(email)}
              disabled={loading !== null || email.trim().length === 0}
            />
          </View>
          {message ? <Text style={styles.message}>{message}</Text> : null}
          <Text style={styles.footer}>
            Tes données restent privées. Tu contrôles tout.
          </Text>
        </View>
      </SafeAreaView>
    </RemoteImage>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  brand: { flex: 1, alignItems: "center", justifyContent: "center" },
  michelin: {
    color: colors.white,
    fontSize: 34,
    fontWeight: "900",
    fontStyle: "italic",
    letterSpacing: 2,
  },
  underline: {
    width: 150,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.yellow,
    marginTop: 6,
  },
  trust: {
    color: colors.white,
    fontSize: font.h2,
    fontWeight: "800",
    letterSpacing: 6,
    marginTop: spacing.md,
  },
  actions: { gap: spacing.md },
  emailBox: {
    gap: spacing.sm,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
    padding: spacing.sm,
  },
  emailInput: {
    borderRadius: 999,
    backgroundColor: colors.white,
    color: colors.navyDark,
    fontSize: font.body,
    fontWeight: "700",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  message: {
    color: colors.white,
    fontSize: font.small,
    fontWeight: "700",
    textAlign: "center",
  },
  footer: {
    color: "rgba(255,255,255,0.7)",
    fontSize: font.small,
    textAlign: "center",
  },
});
