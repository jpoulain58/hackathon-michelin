import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  Dimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BaladeFormModal } from "../components/BaladeFormModal";
import { ReviewCard, RideCard } from "../components/cards";
import { PrimaryButton, Pips, RemoteImage, ScreenTitle, SectionTitle } from "../components/ui";
import { news, reviews } from "../data";
import { createRideFromGpx, fetchRides, type CreateRideForm } from "../lib/api";
import { apiRideToMobileRide } from "../lib/rides";
import { colors, font, radius, spacing } from "../theme";
import type { Ride } from "../types";

const GAP = spacing.md;
const CARD_W = Dimensions.get("window").width - spacing.lg * 2;

export function CommunauteScreen({
  session,
  onOpenRide,
}: {
  session: Session | null;
  onOpenRide: (ride: Ride) => void;
}) {
  const [newsIndex, setNewsIndex] = useState(0);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [rides, setRides] = useState<Ride[]>([]);
  const [loadingRides, setLoadingRides] = useState(true);
  const [gpxModalOpen, setGpxModalOpen] = useState(false);
  const [pickedGpx, setPickedGpx] = useState<{ name: string; xml: string } | null>(null);

  const loadRides = useCallback(() => {
    setLoadingRides(true);
    fetchRides()
      .then((items) => setRides(items.map(apiRideToMobileRide)))
      .catch(() => setRides([]))
      .finally(() => setLoadingRides(false));
  }, []);

  useEffect(() => {
    loadRides();
  }, [loadRides]);

  const onScroll =
    (setter: (i: number) => void) =>
    (e: NativeSyntheticEvent<NativeScrollEvent>) =>
      setter(Math.round(e.nativeEvent.contentOffset.x / (CARD_W + GAP)));

  async function pickGpxFile() {
    const result = await DocumentPicker.getDocumentAsync({ type: "*/*", copyToCacheDirectory: true });
    if (result.canceled || result.assets.length === 0) return;
    const asset = result.assets[0];
    const xml = await FileSystem.readAsStringAsync(asset.uri);
    setPickedGpx({ name: asset.name, xml });
    setGpxModalOpen(true);
  }

  async function submitGpx(form: CreateRideForm) {
    if (!pickedGpx) return;
    await createRideFromGpx(session, pickedGpx.xml, form);
    setPickedGpx(null);
    loadRides();
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <ScreenTitle title="Communauté" />

      {/* Actualités */}
      <SectionTitle>Actualités</SectionTitle>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_W + GAP}
        decelerationRate="fast"
        contentContainerStyle={styles.carousel}
        onMomentumScrollEnd={onScroll(setNewsIndex)}
      >
        {news.map((item) => (
          <RemoteImage
            key={item.id}
            uri={item.image}
            style={{ ...styles.newsCard, width: CARD_W }}
          >
            <LinearGradient
              colors={["rgba(11,18,32,0.05)", "rgba(11,18,32,0.85)"]}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.newsTitle}>{item.title}</Text>
          </RemoteImage>
        ))}
      </ScrollView>
      <Pips count={news.length} active={newsIndex} />

      {/* Derniers avis */}
      <View style={styles.sectionSpacer}>
        <SectionTitle>Les derniers avis</SectionTitle>
      </View>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_W + GAP}
        decelerationRate="fast"
        contentContainerStyle={styles.carousel}
        onMomentumScrollEnd={onScroll(setReviewIndex)}
      >
        {reviews.map((r) => (
          <View key={r.id} style={{ width: CARD_W }}>
            <ReviewCard review={r} />
          </View>
        ))}
      </ScrollView>
      <Pips count={reviews.length} active={reviewIndex} />

      {/* Balades */}
      <View style={styles.sectionSpacer}>
        <SectionTitle>Les balades de la semaine</SectionTitle>
      </View>
      {loadingRides ? (
        <Text style={styles.emptyText}>Chargement des balades…</Text>
      ) : rides.length === 0 ? (
        <Text style={styles.emptyText}>Aucune balade publiée pour le moment.</Text>
      ) : (
        <View style={styles.rides}>
          {rides.map((ride) => (
            <RideCard key={ride.id} ride={ride} onPress={() => onOpenRide(ride)} />
          ))}
        </View>
      )}

      <PrimaryButton title="Ajouter une balade (GPX)" onPress={pickGpxFile} />

      <BaladeFormModal
        visible={gpxModalOpen}
        onClose={() => {
          setGpxModalOpen(false);
          setPickedGpx(null);
        }}
        title="Ajouter une balade depuis un GPX"
        initialName={pickedGpx?.name.replace(/\.gpx$/i, "") ?? ""}
        onSubmit={submitGpx}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.sm },
  carousel: { gap: GAP },
  newsCard: {
    height: 190,
    borderRadius: radius.lg,
    padding: spacing.lg,
    justifyContent: "flex-end",
  },
  newsTitle: {
    color: colors.white,
    fontSize: font.h3,
    fontWeight: "800",
    lineHeight: 22,
  },
  sectionSpacer: { marginTop: spacing.xl },
  rides: { gap: spacing.md },
  emptyText: { color: colors.textMuted, fontSize: font.body },
});
