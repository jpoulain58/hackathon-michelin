import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { formatProductLabel, searchProducts, type ProductOption } from "../lib/api";
import { colors, font, radius, spacing } from "../theme";

export function TyreAutocomplete({
  value,
  onSelect,
  placeholder = "Rechercher un pneu MICHELIN…",
}: {
  value: ProductOption | null;
  onSelect: (product: ProductOption | null) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState(value ? formatProductLabel(value) : "");
  const [results, setResults] = useState<ProductOption[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setQuery(value ? formatProductLabel(value) : "");
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const handle = setTimeout(() => {
      searchProducts(query)
        .then(setResults)
        .catch(() => setResults([]));
    }, 200);
    return () => clearTimeout(handle);
  }, [query, open]);

  return (
    <View>
      <TextInput
        value={query}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        style={styles.input}
        onFocus={() => setOpen(true)}
        onChangeText={(text) => {
          setQuery(text);
          setOpen(true);
          if (value) onSelect(null);
        }}
      />
      {open && results.length > 0 ? (
        <View style={styles.list}>
          {results.map((product) => (
            <Pressable
              key={product.id}
              style={styles.option}
              onPress={() => {
                onSelect(product);
                setQuery(formatProductLabel(product));
                setOpen(false);
              }}
            >
              <Text style={styles.optionText}>{formatProductLabel(product)}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    color: colors.text,
    fontSize: font.body,
    fontWeight: "500",
  },
  list: {
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.white,
    overflow: "hidden",
  },
  option: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  optionText: { color: colors.text, fontSize: font.body },
});
