import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { colors, font, radius, spacing } from "../theme";

export const DEFAULT_LOCATIONS = ["Pneu avant", "Pneu arriere"];

export function LocationAutocomplete({
  value,
  onChange,
  suggestions = DEFAULT_LOCATIONS,
  placeholder = "ex. Pneu avant",
}: {
  value: string;
  onChange: (value: string) => void;
  suggestions?: string[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  // Tant que l'utilisateur n'a pas retape, on affiche toute la liste plutot
  // que de la filtrer sur la valeur deja pre-remplie (ex. "Pneu avant").
  const [typing, setTyping] = useState(false);

  const uniqueSuggestions = [...new Set(suggestions)];
  const options = typing
    ? uniqueSuggestions.filter((s) => s.toLowerCase().includes(value.toLowerCase()))
    : uniqueSuggestions;

  return (
    <View>
      <TextInput
        value={value}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        style={styles.input}
        onFocus={() => {
          setTyping(false);
          setOpen(true);
        }}
        onChangeText={(text) => {
          onChange(text);
          setTyping(true);
          setOpen(true);
        }}
      />
      {open && options.length > 0 ? (
        <View style={styles.list}>
          {options.map((option) => (
            <Pressable
              key={option}
              style={styles.option}
              onPress={() => {
                onChange(option);
                setTyping(false);
                setOpen(false);
              }}
            >
              <Text style={styles.optionText}>{option}</Text>
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
