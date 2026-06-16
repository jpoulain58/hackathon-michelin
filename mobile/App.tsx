import { StatusBar } from "expo-status-bar";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";

export default function App() {
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="auto" />
      <View style={styles.container}>
        <Text style={styles.kicker}>Michelin Trust Wheels</Text>
        <Text style={styles.title}>La preuve par la route</Text>
        <Text style={styles.body}>
          Application mobile Expo Go prete pour les parcours, avis verifies et
          recommandations pneus.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fff7d1",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 28,
    gap: 14,
  },
  kicker: {
    alignSelf: "flex-start",
    backgroundColor: "#ffd100",
    borderRadius: 6,
    color: "#163a70",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0,
    paddingHorizontal: 12,
    paddingVertical: 8,
    textTransform: "uppercase",
  },
  title: {
    color: "#163a70",
    fontSize: 38,
    fontWeight: "900",
    letterSpacing: 0,
    lineHeight: 44,
  },
  body: {
    color: "#2f3a4a",
    fontSize: 17,
    lineHeight: 25,
  },
});
