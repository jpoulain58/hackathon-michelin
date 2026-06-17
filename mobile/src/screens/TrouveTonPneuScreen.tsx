import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  ImageBackground,
  ImageSourcePropType,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const PHOTO_MAP: Record<string, ImageSourcePropType> = {
  "bike-road": require("../../assets/photos/bike-road.jpg"),
  "bike-gravel": require("../../assets/photos/bike-gravel.jpg"),
  "city-bike": require("../../assets/photos/city-bike.jpg"),
  "city-rider": require("../../assets/photos/city-rider.jpg"),
  "community-duo": require("../../assets/photos/community-duo.jpg"),
  "hero-road": require("../../assets/photos/hero-road.jpg"),
  "peloton": require("../../assets/photos/peloton.jpg"),
  "rain-cycling": require("../../assets/photos/rain-cycling.jpg"),
  "road-forest": require("../../assets/photos/road-forest.jpg"),
  "road-sunny": require("../../assets/photos/road-sunny.jpg"),
  "trail": require("../../assets/photos/trail.jpg"),
};
import { FeaturedTyreCard, TyreRow } from "../components/cards";
import { PrimaryButton, ScreenTitle, Spinner } from "../components/ui";
import { fetchRecommendations, fetchStravaTyreProfile } from "../lib/api";
import { apiToTyre } from "../lib/tyres";
import { answersToApiParams, getOptions, inferredToAnswers, QUESTIONS, type Answers } from "../lib/questions";
import { colors, font, radius, spacing } from "../theme";
import type { Tyre } from "../types";

type Phase = "quiz" | "loading" | "results";

export function TrouveTonPneuScreen({
  session,
  onCompare,
}: {
  session: Session | null;
  onCompare: (tyres: Tyre[]) => void;
}) {
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState<Answers>({});
  const [phase, setPhase] = useState<Phase>("quiz");
  const [results, setResults] = useState<Tyre[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [stravaPrefill, setStravaPrefill] = useState<{ basedOnRides: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchStravaTyreProfile(session)
      .then((result) => {
        if (cancelled || !result) return;
        setAnswers((prev) => ({ ...inferredToAnswers(result.profile), ...prev }));
        setStravaPrefill({ basedOnRides: result.profile.basedOnRides });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [session]);

  const currentQ = QUESTIONS[step - 1];
  const options = getOptions(currentQ, answers);
  const currentAnswer = answers[currentQ.id];
  const isLast = step === QUESTIONS.length;

  function handleSelect(questionId: number, optionId: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  }

  function clearStravaPrefill() {
    setStravaPrefill(null);
    setAnswers({});
    setStep(1);
  }

  async function handleNext() {
    if (!currentAnswer) return;
    if (!isLast) {
      setStep((s) => s + 1);
      return;
    }
    setPhase("loading");
    setError(null);
    try {
      const items = await fetchRecommendations(answersToApiParams(answers));
      const tyres = items.map((t, i) => apiToTyre(t, i));
      setResults(tyres);
      setSelectedIds(tyres.length > 0 ? [tyres[0].id] : []);
      setPhase("results");
    } catch {
      setError(
        "Impossible de récupérer les recommandations. Réessaie dans un instant.",
      );
      setPhase("quiz");
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function restart() {
    setStep(1);
    setAnswers({});
    setPhase("quiz");
    setResults([]);
    setSelectedIds([]);
    setError(null);
  }

  if (phase === "loading") {
    return (
      <View style={styles.centered}>
        <Spinner />
        <Text style={styles.loadingText}>Recherche en cours…</Text>
      </View>
    );
  }

  if (phase === "results") {
    const featured = results[0];
    const rest = results.slice(1);
    const selectedTyres = results.filter((tyre) => selectedIds.includes(tyre.id));
    return (
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScreenTitle title="Trouve ton pneu" subtitle="D'après tes réponses" />
        {featured && (
          <FeaturedTyreCard
            tyre={featured}
            selected={selectedIds.includes(featured.id)}
            onPress={() => toggleSelect(featured.id)}
          />
        )}
        <View style={styles.list}>
          {rest.map((t) => (
            <TyreRow
              key={t.id}
              tyre={t}
              selected={selectedIds.includes(t.id)}
              onPress={() => toggleSelect(t.id)}
            />
          ))}
        </View>
        <PrimaryButton
          title={`Comparer la sélection (${selectedIds.length})`}
          onPress={() => onCompare(selectedTyres)}
          disabled={selectedIds.length < 2}
        />
        <TouchableOpacity onPress={restart} style={styles.secondaryBtn}>
          <Text style={styles.secondaryText}>Recommencer le questionnaire</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // Quiz phase
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {stravaPrefill && step === 1 && (
        <View style={styles.stravaBanner}>
          <Text style={styles.stravaBannerText}>
            <Text style={{ fontWeight: "800" }}>Pré-rempli depuis Strava</Text> — déduit de tes{" "}
            {stravaPrefill.basedOnRides} dernières sorties vélo.
          </Text>
          <TouchableOpacity onPress={clearStravaPrefill}>
            <Text style={styles.stravaBannerClear}>Effacer</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Progress bar */}
      <View style={styles.progress}>
        {QUESTIONS.map((_, i) => (
          <View
            key={i}
            style={[
              styles.progressSegment,
              i + 1 < step
                ? styles.progressDone
                : i + 1 === step
                  ? styles.progressActive
                  : styles.progressFuture,
            ]}
          />
        ))}
      </View>

      <Text style={styles.stepLabel}>
        Question {step}/{QUESTIONS.length}
      </Text>
      <Text style={styles.question}>{currentQ.question}</Text>
      <Text style={styles.description}>{currentQ.description}</Text>

      {error != null && <Text style={styles.errorText}>{error}</Text>}

      {/* Options */}
      <View style={styles.options}>
        {options.map((opt) => {
          const active = currentAnswer === opt.id;
          const source = opt.photo ? PHOTO_MAP[opt.photo] : null;
          if (source) {
            return (
              <TouchableOpacity
                key={opt.id}
                onPress={() => handleSelect(currentQ.id, opt.id)}
                activeOpacity={0.85}
                style={[styles.imgOption, active && styles.imgOptionActive]}
              >
                <ImageBackground
                  source={source}
                  style={styles.imgBg}
                  imageStyle={styles.imgBgImage}
                >
                  <View style={[styles.imgOverlay, active && styles.imgOverlayActive]} />
                  {active && (
                    <View style={styles.imgCheck}>
                      <Text style={styles.imgCheckmark}>✓</Text>
                    </View>
                  )}
                  <Text style={styles.imgLabel}>{opt.label}</Text>
                </ImageBackground>
              </TouchableOpacity>
            );
          }
          return (
            <TouchableOpacity
              key={opt.id}
              onPress={() => handleSelect(currentQ.id, opt.id)}
              style={[styles.option, active && styles.optionActive]}
              activeOpacity={0.7}
            >
              <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>
                {opt.label}
              </Text>
              <View style={[styles.check, active && styles.checkActive]}>
                {active && <Text style={styles.checkmark}>✓</Text>}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Navigation */}
      <View style={styles.nav}>
        <PrimaryButton
          title={isLast ? "Voir mes pneus" : "Prochaine question"}
          onPress={handleNext}
          disabled={!currentAnswer}
        />
        {step > 1 && (
          <TouchableOpacity
            onPress={() => setStep((s) => s - 1)}
            style={styles.secondaryBtn}
          >
            <Text style={styles.secondaryText}>← Retour</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl * 2,
    gap: spacing.lg,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xl,
  },
  loadingText: {
    color: colors.text,
    fontSize: font.h3,
    fontWeight: "700",
  },

  // Bandeau Strava
  stravaBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    backgroundColor: "#FC520022",
    borderRadius: radius.md,
    padding: spacing.md,
  },
  stravaBannerText: { flex: 1, color: colors.text, fontSize: font.small, lineHeight: 18 },
  stravaBannerClear: { color: colors.navy, fontWeight: "700", fontSize: font.small },

  // Progress
  progress: { flexDirection: "row", gap: 4 },
  progressSegment: { flex: 1, height: 5, borderRadius: 4 },
  progressDone: { backgroundColor: `${colors.navy}55` },
  progressActive: { backgroundColor: colors.navy },
  progressFuture: { backgroundColor: colors.border },

  // Text
  stepLabel: {
    color: colors.textMuted,
    fontSize: font.tiny,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: -spacing.sm,
  },
  question: {
    color: colors.text,
    fontSize: font.h2,
    fontWeight: "800",
    lineHeight: 28,
    marginTop: -spacing.sm,
  },
  description: {
    color: colors.textMuted,
    fontSize: font.body,
    lineHeight: 20,
    marginTop: -spacing.sm,
  },
  errorText: {
    color: "#CC2200",
    fontSize: font.small,
    backgroundColor: "#FFF0EE",
    padding: spacing.md,
    borderRadius: radius.md,
  },

  // Options
  options: { gap: spacing.sm },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    backgroundColor: colors.white,
  },
  optionActive: { borderColor: colors.navy, backgroundColor: "#F0F4FC" },
  optionLabel: {
    color: colors.text,
    fontSize: font.body,
    fontWeight: "600",
    flex: 1,
  },
  optionLabelActive: { color: colors.navy },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  checkmark: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 14,
  },

  // Image option cards
  imgOption: {
    borderRadius: radius.md,
    overflow: "hidden",
    borderWidth: 0,
  },
  imgOptionActive: {
    borderWidth: 3,
    borderColor: colors.navy,
  },
  imgBg: { height: 80, justifyContent: "flex-end" },
  imgBgImage: { borderRadius: radius.md },
  imgOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(10,20,50,0.55)",
  },
  imgOverlayActive: { backgroundColor: "rgba(10,20,50,0.35)" },
  imgCheck: {
    position: "absolute",
    top: 8,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.navy,
    alignItems: "center",
    justifyContent: "center",
  },
  imgCheckmark: { color: colors.white, fontSize: 11, fontWeight: "700" },
  imgLabel: {
    color: colors.white,
    fontSize: font.body,
    fontWeight: "700",
    padding: spacing.md,
  },

  // Results
  list: { gap: spacing.sm },

  // Navigation
  nav: { gap: spacing.sm },
  secondaryBtn: { paddingVertical: spacing.sm, alignItems: "center" },
  secondaryText: {
    color: colors.textMuted,
    fontSize: font.body,
    fontWeight: "600",
  },
});
