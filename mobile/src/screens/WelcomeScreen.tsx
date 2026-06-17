import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { RemoteImage } from "../components/ui";
import { heroImage } from "../data";
import { colors, font, radius, shadow, spacing } from "../theme";
import type { AuthProviderId } from "../lib/auth";

const PROVIDERS: AuthProviderId[] = ["strava", "google", "garmin"];

export function WelcomeScreen({
  onProvider,
  onEmail,
  onPasswordReset,
  loading,
  message,
}: {
  onProvider: (provider: AuthProviderId) => void;
  onEmail: (email: string, password: string) => void;
  onPasswordReset: (email: string) => void;
  loading: AuthProviderId | "email" | "reset" | null;
  message?: string | null;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showEmail, setShowEmail] = useState(false);
  const disabled = loading !== null;
  const emailReady = email.trim().length > 0 && password.length > 0;

  return (
    <RemoteImage uri={heroImage} style={styles.bg} fallback={colors.navyDark}>
      <StatusBar style="light" />
      <LinearGradient
        colors={["rgba(11,18,32,0.18)", "rgba(11,18,32,0.62)", "rgba(11,18,32,0.94)"]}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboard}
        >
          <ScrollView
            bounces={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.brand}>
              <Text style={styles.michelin}>MICHELIN</Text>
              <View style={styles.underline} />
              <Text style={styles.trust}>TRUST WHEELS</Text>
            </View>

            <View style={styles.actions}>
              <View style={styles.authCard}>
                <View style={styles.authHeader}>
                  <Text style={styles.authTitle}>Bienvenue</Text>
                  <Text style={styles.authSubtitle}>
                    Connecte-toi en un tap pour rejoindre la communauté.
                  </Text>
                </View>

                <View style={styles.providerStack}>
                  {PROVIDERS.map((method) => (
                    <ProviderButton
                      key={method}
                      method={method}
                      loading={loading === method}
                      disabled={disabled}
                      onPress={() => onProvider(method)}
                    />
                  ))}
                </View>

                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>ou par email</Text>
                  <View style={styles.dividerLine} />
                </View>

                {showEmail ? (
                  <View style={styles.emailPanel}>
                    <Text style={styles.inputLabel}>Email</Text>
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      placeholder="email@exemple.fr"
                      placeholderTextColor="rgba(22,33,63,0.4)"
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="email-address"
                      textContentType="emailAddress"
                      style={styles.emailInput}
                    />

                    <View style={styles.passwordRow}>
                      <Text style={styles.inputLabel}>Mot de passe</Text>
                      <Pressable
                        accessibilityRole="button"
                        onPress={disabled ? undefined : () => onPasswordReset(email)}
                        hitSlop={8}
                      >
                        <Text style={[styles.forgot, disabled && styles.disabledText]}>
                          {loading === "reset" ? "Envoi..." : "Mot de passe oublié ?"}
                        </Text>
                      </Pressable>
                    </View>
                    <TextInput
                      value={password}
                      onChangeText={setPassword}
                      placeholder="••••••••"
                      placeholderTextColor="rgba(22,33,63,0.4)"
                      secureTextEntry
                      textContentType="password"
                      style={styles.emailInput}
                    />

                    <Pressable
                      accessibilityRole="button"
                      onPress={disabled || !emailReady ? undefined : () => onEmail(email, password)}
                      style={({ pressed }) => [
                        styles.emailSubmit,
                        (disabled || !emailReady) && styles.disabled,
                        pressed && !disabled && styles.pressed,
                      ]}
                    >
                      {loading === "email" ? (
                        <ActivityIndicator color={colors.white} />
                      ) : (
                        <Text style={styles.emailSubmitText}>Se connecter</Text>
                      )}
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    accessibilityRole="button"
                    onPress={disabled ? undefined : () => setShowEmail(true)}
                    style={({ pressed }) => [
                      styles.emailToggle,
                      disabled && styles.disabled,
                      pressed && !disabled && styles.pressed,
                    ]}
                  >
                    <Ionicons name="mail-outline" size={20} color={colors.navyDark} />
                    <Text style={styles.emailToggleText}>Continuer avec un email</Text>
                  </Pressable>
                )}
              </View>

              {message ? <Text style={styles.message}>{message}</Text> : null}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </RemoteImage>
  );
}

function ProviderButton({
  method,
  loading,
  disabled,
  onPress,
}: {
  method: AuthProviderId;
  loading: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const isGoogle = method === "google";
  const isGarmin = method === "garmin";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={getLabel(method)}
      onPress={disabled ? undefined : onPress}
      style={({ pressed }) => [
        styles.providerButton,
        method === "strava" && styles.providerStrava,
        isGoogle && styles.providerGoogle,
        isGarmin && styles.providerGarmin,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      {isGarmin ? (
        // Garmin = logotype (wordmark) ; aucun set vectoriel ne le fournit -> asset PNG blanc.
        <Image
          source={require("../../assets/garmin-logo.png")}
          style={styles.garminLogo}
          resizeMode="contain"
        />
      ) : (
        <View style={styles.providerContent}>
          <ProviderGlyph method={method} />
          <Text style={[styles.providerText, isGoogle && styles.providerGoogleText]}>
            {getLabel(method)}
          </Text>
        </View>
      )}
      {loading ? (
        <ActivityIndicator
          size="small"
          color={isGoogle ? colors.navyDark : colors.white}
          style={styles.providerSpinner}
        />
      ) : null}
    </Pressable>
  );
}

function ProviderGlyph({ method }: { method: AuthProviderId }) {
  // Vrais logos de marque via FontAwesome5 (vectoriel, rendu garanti).
  if (method === "strava") {
    return <FontAwesome5 name="strava" size={20} color={colors.white} />;
  }
  // Google : "G" de marque, en bleu Google sur bouton blanc.
  return <FontAwesome5 name="google" size={19} color="#4285F4" />;
}

function getLabel(method: AuthProviderId) {
  if (method === "google") return "Continuer avec Google";
  if (method === "garmin") return "Continuer avec Garmin";
  return "Continuer avec Strava";
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },
  keyboard: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    gap: spacing.xxl,
  },
  brand: {
    minHeight: 200,
    alignItems: "center",
    justifyContent: "center",
  },
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
  actions: {
    gap: spacing.md,
  },
  authCard: {
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.97)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.55)",
    padding: spacing.xl,
    shadowColor: "#000C34",
    shadowOpacity: 0.18,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 18 },
    elevation: 8,
  },
  authHeader: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  authTitle: {
    color: colors.navyDark,
    fontSize: font.h2,
    fontWeight: "900",
  },
  authSubtitle: {
    color: colors.textMuted,
    fontSize: font.body,
    fontWeight: "600",
    marginTop: 4,
    textAlign: "center",
  },
  providerStack: {
    gap: spacing.sm,
  },
  providerButton: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "transparent",
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
  },
  providerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  providerStrava: {
    backgroundColor: colors.strava,
    shadowColor: colors.strava,
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  providerGoogle: {
    backgroundColor: colors.white,
    borderColor: colors.border,
    ...shadow.card,
  },
  providerGarmin: {
    backgroundColor: colors.navyDark,
    ...shadow.card,
  },
  garminLogo: {
    height: 20,
    width: 62,
  },
  providerText: {
    color: colors.white,
    fontSize: font.h3,
    fontWeight: "800",
  },
  providerGoogleText: {
    color: colors.navyDark,
  },
  providerSpinner: {
    position: "absolute",
    right: spacing.lg,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.textFaint,
    fontSize: font.tiny,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  emailToggle: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  emailToggleText: {
    color: colors.navyDark,
    fontSize: font.h3,
    fontWeight: "800",
  },
  emailPanel: {
    gap: spacing.sm,
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.xs,
  },
  inputLabel: {
    color: colors.textBody,
    fontSize: font.small,
    fontWeight: "800",
    marginTop: spacing.xs,
  },
  forgot: {
    color: colors.navy,
    fontSize: font.small,
    fontWeight: "800",
  },
  disabledText: {
    opacity: 0.55,
  },
  emailInput: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    color: colors.navyDark,
    fontSize: font.body,
    fontWeight: "700",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  emailSubmit: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    backgroundColor: colors.navyDark,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  emailSubmitText: {
    color: colors.white,
    fontSize: font.h3,
    fontWeight: "900",
  },
  message: {
    color: colors.white,
    fontSize: font.small,
    fontWeight: "800",
    textAlign: "center",
  },
  disabled: {
    opacity: 0.55,
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
});
