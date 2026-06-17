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
import { rides } from "./src/data";
import { BaladeDetailScreen } from "./src/screens/BaladeDetailScreen";
import { ClubScreen } from "./src/screens/ClubScreen";
import { ComparateurScreen } from "./src/screens/ComparateurScreen";
import { CommunauteScreen } from "./src/screens/CommunauteScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { TrouveTonPneuScreen } from "./src/screens/TrouveTonPneuScreen";
import { WelcomeScreen } from "./src/screens/WelcomeScreen";
import { colors } from "./src/theme";
import type { TabKey, Tyre } from "./src/types";
import {
  sendPasswordResetEmail,
  signInWithEmailPassword,
  signInWithProvider,
  type AuthProviderId,
} from "./src/lib/auth";
import { syncRider } from "./src/lib/api";
import { isSupabaseConfigured, supabase } from "./src/lib/supabase";

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState<AuthProviderId | "email" | "reset" | null>(null);
  const [signOutLoading, setSignOutLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState<string | null>(
    isSupabaseConfigured ? null : "Configuration Supabase manquante.",
  );
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("trouver");
  const [rideId, setRideId] = useState<string | null>(null);
  const [compareTyres, setCompareTyres] = useState<Tyre[]>([]);

  useEffect(() => {
    if (!supabase) return;

    const handleSession = (session: Session | null) => {
      setSession(session);
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
        setSession(session);
        await syncRider(session);
      }
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : "Connexion impossible.");
    } finally {
      setAuthLoading(null);
    }
  }

  async function handleEmail(email: string, password: string) {
    setAuthMessage(null);
    setAuthLoading("email");
    try {
      const session = await signInWithEmailPassword(email.trim(), password);
      if (session) {
        setSession(session);
        await syncRider(session);
      }
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : "Connexion email impossible.");
    } finally {
      setAuthLoading(null);
    }
  }

  async function handlePasswordReset(email: string) {
    if (!email.trim()) {
      setAuthMessage("Saisis ton email pour recevoir le lien de reinitialisation.");
      return;
    }

    setAuthMessage(null);
    setAuthLoading("reset");
    try {
      await sendPasswordResetEmail(email.trim());
      setAuthMessage("Email de reinitialisation envoye.");
    } catch (error) {
      setAuthMessage(error instanceof Error ? error.message : "Reset impossible.");
    } finally {
      setAuthLoading(null);
    }
  }

  async function handleSignOut() {
    setProfileMessage(null);
    setSignOutLoading(true);
    try {
      await supabase?.auth.signOut();
      setSession(null);
      setTab("trouver");
      setRideId(null);
    } catch (error) {
      setProfileMessage(error instanceof Error ? error.message : "Deconnexion impossible.");
    } finally {
      setSignOutLoading(false);
    }
  }

  if (!session) {
    return (
      <WelcomeScreen
        onProvider={handleProvider}
        onEmail={handleEmail}
        onPasswordReset={handlePasswordReset}
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
            onCompare={(tyres) => {
              setCompareTyres(tyres);
              setTab("comparer");
            }}
          />
        ) : tab === "comparer" ? (
          <ComparateurScreen selectedTyres={compareTyres} />
        ) : tab === "communaute" ? (
          <CommunauteScreen onOpenRide={(id) => setRideId(id)} />
        ) : tab === "profil" ? (
          <ProfileScreen
            session={session}
            onSignOut={handleSignOut}
            signOutLoading={signOutLoading}
            message={profileMessage}
          />
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
