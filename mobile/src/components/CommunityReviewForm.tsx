import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { Session } from "@supabase/supabase-js";
import { fetchReviewProducts, submitReview, type ReviewProductOption } from "../lib/api";
import { colors, font, radius, spacing } from "../theme";
import { PrimaryButton } from "./ui";

export function CommunityReviewForm({
  session,
  onSubmitted,
}: {
  session: Session | null;
  onSubmitted: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [products, setProducts] = useState<ReviewProductOption[]>([]);
  const [productId, setProductId] = useState<number | null>(null);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && products.length === 0) {
      fetchReviewProducts()
        .then((items) => {
          setProducts(items);
          setProductId(items[0]?.id ?? null);
        })
        .catch(() => {});
    }
  }, [open, products.length]);

  async function submit() {
    if (!productId || text.trim().length < 3) return;
    const token = session?.access_token;
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      await submitReview(token, { productId, rating, text });
      setText("");
      setOpen(false);
      onSubmitted();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossible d'enregistrer ton avis.");
    } finally {
      setBusy(false);
    }
  }

  if (!session) {
    return (
      <View style={styles.anonCard}>
        <Text style={styles.anonText}>Connecte-toi pour laisser un avis sur un pneu.</Text>
      </View>
    );
  }

  if (!open) {
    return <PrimaryButton title="Laisser un avis" onPress={() => setOpen(true)} />;
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Laisser un avis</Text>

      <Text style={styles.fieldLabel}>Pneu</Text>
      <View style={styles.productList}>
        {products.map((p) => (
          <Pressable
            key={p.id}
            onPress={() => setProductId(p.id)}
            style={[styles.productChip, productId === p.id && styles.productChipActive]}
          >
            <Text style={[styles.productChipText, productId === p.id && styles.productChipTextActive]}>
              {p.name}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.fieldLabel}>Note</Text>
      <View style={styles.ratingRow}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable
            key={n}
            onPress={() => setRating(n)}
            style={[styles.ratingDot, n <= rating && styles.ratingDotActive]}
          >
            <Text style={[styles.ratingDotText, n <= rating && styles.ratingDotTextActive]}>{n}</Text>
          </Pressable>
        ))}
      </View>

      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Ton expérience avec ce pneu..."
        placeholderTextColor={colors.textFaint}
        multiline
        numberOfLines={3}
        style={styles.textarea}
      />

      <View style={styles.actions}>
        <Pressable
          onPress={submit}
          disabled={busy || !productId || text.trim().length < 3}
          style={[styles.submitBtn, (busy || !productId || text.trim().length < 3) && { opacity: 0.5 }]}
        >
          <Text style={styles.submitBtnText}>{busy ? "..." : "Publier mon avis"}</Text>
        </Pressable>
        <Pressable onPress={() => setOpen(false)} disabled={busy} style={styles.cancelBtn}>
          <Text style={styles.cancelBtnText}>Annuler</Text>
        </Pressable>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  anonCard: {
    backgroundColor: colors.bgSoft,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  anonText: { color: colors.textBody, fontSize: font.body },
  card: {
    backgroundColor: colors.bgSoft,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  title: { color: colors.text, fontSize: font.body, fontWeight: "800" },
  fieldLabel: { color: colors.textBody, fontSize: font.small, fontWeight: "700", marginTop: spacing.sm },
  productList: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs, marginTop: spacing.xs },
  productChip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  productChipActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  productChipText: { color: colors.textBody, fontSize: font.tiny, fontWeight: "600" },
  productChipTextActive: { color: colors.white },
  ratingRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs },
  ratingDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  ratingDotActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  ratingDotText: { color: colors.textFaint, fontSize: font.tiny, fontWeight: "700" },
  ratingDotTextActive: { color: colors.white },
  textarea: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: font.body,
    minHeight: 70,
    textAlignVertical: "top",
  },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  submitBtn: { backgroundColor: colors.navy, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  submitBtnText: { color: colors.white, fontSize: font.small, fontWeight: "700" },
  cancelBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  cancelBtnText: { color: colors.textMuted, fontSize: font.small, fontWeight: "700" },
  error: { color: "#D64545", fontSize: font.small, fontWeight: "600", marginTop: spacing.xs },
});
