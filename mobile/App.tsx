import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  Platform,
  SafeAreaView,
  StatusBar as RNStatusBar,
  StyleSheet,
  View,
} from "react-native";
import { TabBar } from "./src/components/TabBar";
import { rides, tyres } from "./src/data";
import { BaladeDetailScreen } from "./src/screens/BaladeDetailScreen";
import { ClubScreen } from "./src/screens/ClubScreen";
import { ComparateurScreen } from "./src/screens/ComparateurScreen";
import { CommunauteScreen } from "./src/screens/CommunauteScreen";
import { TrouveTonPneuScreen } from "./src/screens/TrouveTonPneuScreen";
import { WelcomeScreen } from "./src/screens/WelcomeScreen";
import { colors } from "./src/theme";
import type { TabKey } from "./src/types";
import {
  signInWithEmail,
  signInWithProvider,
  type AuthProviderId,
} from "./src/lib/auth";
import { syncRider } from "./src/lib/api";
import { isSupabaseConfigured, supabase } from "./src/lib/supabase";

export default function App() {
  const [authed, setAuthed] = useState(false);
  const [authLoading, setAuthLoading] = useState<AuthProviderId | "email" | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(
    isSupabaseConfigured ? null : "Configuration Supabase manquante.",
  );
  const [tab, setTab] = useState<TabKey>("trouver");
  const [rideId, setRideId] = useState<string | null>(null);
  // Selection par defaut (maquette : "Comparer la selection (2)").
  const [selectedIds, setSelectedIds] = useState<string[]>([
    tyres[1].id,
    tyres[2].id,
  ]);

  const toggle = (id: string) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  useEffect(() => {
    if (!supabase) return;

    const handleSession = (session: Session | null) => {
      setAuthed(Boolean(session));
      syncRider(session).catch((error) => {
        setAuthMessage(error instanceof Error ? error.message : "Synchronisation rider impossible.");
      });
    };

    supabase.auth.getSession().then(({ data }) => handleSession(data.session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleProvider(provider: AuthProviderId) {
    setAuthMessage(null);
    setAuthLoading(provider);
    try {
      const session = await signInWithProvider(provider);
      if (session) {
        setAuthed(true);
        await syncRider(session);
      }
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : "Connexion impossible.");
    } finally {
      setAuthLoading(null);
    }
  }

  async function handleEmail(email: string) {
    setAuthMessage(null);
    setAuthLoading("email");
    try {
      await signInWithEmail(email.trim());
      setAuthMessage("Lien de connexion envoye. Verifie ta boite mail.");
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : "Connexion email impossible.");
    } finally {
      setAuthLoading(null);
    }
  }

  if (!authed) {
    return (
      <WelcomeScreen
        onProvider={handleProvider}
        onEmail={handleEmail}
        loading={authLoading}
        message={authMessage}
      />
    );
  }

  const ride = rideId ? rides.find((r) => r.id === rideId) : undefined;

  return (
    <SafeAreaView style={styles.shell}>
      <StatusBar style="dark" />
      <View style={styles.body}>
        {ride ? (
          <BaladeDetailScreen ride={ride} onBack={() => setRideId(null)} />
        ) : tab === "trouver" ? (
          <TrouveTonPneuScreen
            selectedIds={selectedIds}
            onToggle={toggle}
            onCompare={() => setTab("comparer")}
          />
        ) : tab === "comparer" ? (
          <ComparateurScreen />
        ) : tab === "communaute" ? (
          <CommunauteScreen onOpenRide={(id) => setRideId(id)} />
        ) : (
          <ClubScreen />
        )}
      </View>
      {ride ? null : <TabBar active={tab} onChange={setTab} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingTop: Platform.OS === "android" ? RNStatusBar.currentHeight : 0,
  },
  body: { flex: 1 },
});
