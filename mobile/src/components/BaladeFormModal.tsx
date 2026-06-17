import { useState, type ReactNode } from "react";
import { Modal, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import type { CreateRideForm } from "../lib/api";
import { colors, font, radius, spacing } from "../theme";
import { Chip, PrimaryButton } from "./ui";

const TERRAINS = ["Route", "Gravel", "VTT"];
const DIFFICULTIES = ["Débutant", "Intermédiaire", "Expert"];

type FormState = {
  name: string;
  description: string;
  instructions: string;
  terrain: string;
  landscape: string;
  difficulty: string;
  tags: string;
  tyre: string;
  tyreDesignation: string;
  tyreWeightG: string;
  tyreDimensions: string;
  proTipAuthor: string;
  proTipText: string;
};

function emptyForm(name: string): FormState {
  return {
    name,
    description: "",
    instructions: "",
    terrain: "Route",
    landscape: "",
    difficulty: "Intermédiaire",
    tags: "",
    tyre: "",
    tyreDesignation: "",
    tyreWeightG: "",
    tyreDimensions: "",
    proTipAuthor: "",
    proTipText: "",
  };
}

function toCreateRideForm(form: FormState): CreateRideForm {
  return {
    name: form.name.trim(),
    description: form.description.trim(),
    instructions: form.instructions.trim(),
    terrain: form.terrain,
    landscape: form.landscape.trim(),
    difficulty: form.difficulty,
    tags: form.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    tyre: form.tyre.trim(),
    tyreDetail: {
      name: form.tyre.trim(),
      designation: form.tyreDesignation.trim(),
      weightG: Number.parseInt(form.tyreWeightG, 10) || 0,
      dimensions: Number.parseInt(form.tyreDimensions, 10) || 0,
    },
    proTip: { author: form.proTipAuthor.trim(), text: form.proTipText.trim() },
  };
}

export function BaladeFormModal({
  visible,
  onClose,
  title,
  initialName = "",
  extra,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  initialName?: string;
  extra?: ReactNode;
  onSubmit: (form: CreateRideForm) => Promise<void>;
}) {
  const [form, setForm] = useState<FormState>(() => emptyForm(initialName));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function close() {
    setForm(emptyForm(initialName));
    setError(null);
    onClose();
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(toCreateRideForm(form));
      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Création de la balade impossible.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.close} onPress={close}>
              Fermer
            </Text>
          </View>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            {extra}

            <Text style={styles.label}>Nom de la balade</Text>
            <TextInput style={styles.input} value={form.name} onChangeText={(v) => set("name", v)} />

            <Text style={styles.label}>Terrain</Text>
            <View style={styles.chipsRow}>
              {TERRAINS.map((t) => (
                <Chip key={t} label={t} active={form.terrain === t} onPress={() => set("terrain", t)} />
              ))}
            </View>

            <Text style={styles.label}>Difficulté</Text>
            <View style={styles.chipsRow}>
              {DIFFICULTIES.map((d) => (
                <Chip key={d} label={d} active={form.difficulty === d} onPress={() => set("difficulty", d)} />
              ))}
            </View>

            <Text style={styles.label}>Paysage</Text>
            <TextInput
              style={styles.input}
              value={form.landscape}
              onChangeText={(v) => set("landscape", v)}
              placeholder="Montagne, Forêt, Plateau…"
            />

            <Text style={styles.label}>Tags (séparés par des virgules)</Text>
            <TextInput style={styles.input} value={form.tags} onChangeText={(v) => set("tags", v)} />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              value={form.description}
              onChangeText={(v) => set("description", v)}
              multiline
            />

            <Text style={styles.label}>Instructions au départ</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              value={form.instructions}
              onChangeText={(v) => set("instructions", v)}
              multiline
            />

            <Text style={styles.sectionLabel}>Pneu conseillé</Text>
            <TextInput
              style={styles.input}
              value={form.tyre}
              onChangeText={(v) => set("tyre", v)}
              placeholder="MICHELIN Power Cup"
            />
            <TextInput
              style={styles.input}
              value={form.tyreDesignation}
              onChangeText={(v) => set("tyreDesignation", v)}
              placeholder="Competition Line"
            />
            <View style={styles.row}>
              <TextInput
                style={[styles.input, styles.flex1]}
                value={form.tyreWeightG}
                onChangeText={(v) => set("tyreWeightG", v)}
                placeholder="Poids (g)"
                keyboardType="numeric"
              />
              <TextInput
                style={[styles.input, styles.flex1]}
                value={form.tyreDimensions}
                onChangeText={(v) => set("tyreDimensions", v)}
                placeholder="Dimensions dispo."
                keyboardType="numeric"
              />
            </View>

            <Text style={styles.sectionLabel}>Conseil du pro</Text>
            <TextInput
              style={styles.input}
              value={form.proTipAuthor}
              onChangeText={(v) => set("proTipAuthor", v)}
              placeholder="Auteur"
            />
            <TextInput
              style={[styles.input, styles.multiline]}
              value={form.proTipText}
              onChangeText={(v) => set("proTipText", v)}
              placeholder="Conseil…"
              multiline
            />

            {error && <Text style={styles.error}>{error}</Text>}

            <PrimaryButton
              title={submitting ? "Création..." : "Publier la balade"}
              onPress={submit}
              disabled={submitting || !form.name.trim()}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,12,52,0.6)", justifyContent: "flex-end" },
  sheet: { maxHeight: "90%", backgroundColor: colors.white, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: font.h3, fontWeight: "800", color: colors.text },
  close: { color: colors.navy, fontWeight: "700" },
  content: { padding: spacing.lg, gap: spacing.sm },
  label: { fontSize: font.tiny, fontWeight: "700", color: colors.textMuted, marginTop: spacing.sm },
  sectionLabel: {
    fontSize: font.tiny,
    fontWeight: "800",
    color: colors.textMuted,
    textTransform: "uppercase",
    marginTop: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: font.body,
    color: colors.text,
  },
  multiline: { minHeight: 60, textAlignVertical: "top" },
  chipsRow: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
  row: { flexDirection: "row", gap: spacing.sm },
  flex1: { flex: 1 },
  error: { color: "#CC2200", fontSize: font.small, fontWeight: "600" },
});
