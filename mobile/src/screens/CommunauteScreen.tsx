import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  Dimensions,
  Linking,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BaladeFormModal } from "../components/BaladeFormModal";
import { CommunityReviewForm } from "../components/CommunityReviewForm";
import { ReviewCard, RideCard } from "../components/cards";
import { PrimaryButton, Pips, RemoteImage, ScreenTitle, SectionTitle } from "../components/ui";
import { news } from "../data";
import {
  createRideFromGpx,
  fetchPros,
  fetchRecentReviews,
  fetchRides,
  fetchStats,
  formatKm,
  productWebUrl,
  FALLBACK_STATS,
  type CommunityStats,
  type CreateRideForm,
  type ProRider,
  type ReviewItem,
} from "../lib/api";
import { apiRideToMobileRide } from "../lib/rides";
import { colors, font, radius, spacing } from "../theme";
import type { Review, Ride } from "../types";

const GAP = spacing.md;
const CARD_W = Dimensions.get("window").width - spacing.lg * 2;

export function CommunauteScreen({
  session,
  onOpenRide,
  onOpenPneuTest,
  onOpenPro,
}: {
  session: Session | null;
  onOpenRide: (ride: Ride) => void;
  onOpenPneuTest: () => void;
  onOpenPro: (pro: ProRider) => void;
}) {
  const [newsIndex, setNewsIndex] = useState(0);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewCount, setReviewCount] = useState(0);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [rides, setRides] = useState<Ride[]>([]);
  const [loadingRides, setLoadingRides] = useState(true);
  const [gpxModalOpen, setGpxModalOpen] = useState(false);
  const [pickedGpx, setPickedGpx] = useState<{ name: string; xml: string } | null>(null);
  const [stats, setStats] = useState<CommunityStats>(FALLBACK_STATS);
  const [pros, setPros] = useState<ProRider[]>([]);

  const loadRides = useCallback(() => {
    setLoadingRides(true);
    fetchRides()
      .then((items) => setRides(items.map(apiRideToMobileRide)))
      .catch(() => setRides([]))
      .finally(() => setLoadingRides(false));
  }, []);

  const loadReviews = useCallback(() => {
    setLoadingReviews(true);
    fetchRecentReviews(10)
      .then(({ items, count }) => {
        setReviews(items.map(apiReviewToMobileReview));
        setReviewCount(count);
      })
      .catch(() => {
        setReviews([]);
        setReviewCount(0);
      })
      .finally(() => setLoadingReviews(false));
  }, []);

  useEffect(() => {
    loadReviews();
    loadRides();
    fetchStats().then(setStats).catch(() => {});
    fetchPros().then(setPros).catch(() => {});
  }, [loadReviews, loadRides]);

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
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <ScreenTitle title="Communauté" />

      <SectionTitle>Actualités</SectionTitle>

      <Pressable onPress={onOpenPneuTest} style={{ marginBottom: spacing.md }}>
        <RemoteImage uri="https://picsum.photos/seed/powerpulse/1000/500" style={styles.teaser}>
          <LinearGradient colors={["rgba(11,18,32,0.1)", "rgba(11,18,32,0.9)"]} style={StyleSheet.absoluteFill} />
          <View style={styles.teaserBadge}>
            <Text style={styles.teaserBadgeText}>BIENTÔT · JUILLET 2026</Text>
          </View>
          <Text style={styles.newsTitle}>MICHELIN Power Pulse arrive</Text>
          <Text style={styles.teaserSub}>Membres du Club : réservez votre essai en avant-première →</Text>
        </RemoteImage>
      </Pressable>

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
          <RemoteImage key={item.id} uri={item.image} style={{ ...styles.newsCard, width: CARD_W }}>
            <LinearGradient colors={["rgba(11,18,32,0.05)", "rgba(11,18,32,0.85)"]} style={StyleSheet.absoluteFill} />
            <Text style={styles.newsTitle}>{item.title}</Text>
          </RemoteImage>
        ))}
      </ScrollView>
      <Pips count={news.length} active={newsIndex} />

      <View style={styles.statsRow}>
        <Stat value={formatKm(stats.monthKm)} label="roulés ce mois" />
        <Stat value={stats.ridersCount.toLocaleString("fr-FR")} label="riders" />
        <Stat value={reviewCount.toLocaleString("fr-FR")} label="avis" />
        <Stat value={formatKm(stats.totalKm)} label="cumul communauté" />
      </View>

      <View style={styles.sectionSpacer}>
        <SectionTitle>Les derniers avis</SectionTitle>
      </View>
      <CommunityReviewForm session={session} onSubmitted={loadReviews} />
      {loadingReviews ? (
        <Text style={styles.emptyText}>Chargement des avis…</Text>
      ) : reviews.length === 0 ? (
        <Text style={styles.emptyText}>Aucun avis publié pour le moment.</Text>
      ) : (
        <>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_W + GAP}
            decelerationRate="fast"
            contentContainerStyle={styles.carousel}
            onMomentumScrollEnd={onScroll(setReviewIndex)}
          >
            {reviews.map((review) => (
              <View key={review.id} style={{ width: CARD_W }}>
                <ReviewCard review={review} onPress={() => Linking.openURL(productWebUrl(review.productId))} />
              </View>
            ))}
          </ScrollView>
          <Pips count={reviews.length} active={reviewIndex} />
        </>
      )}

      <View style={styles.sectionSpacer}>
        <SectionTitle>Les pneus des pros</SectionTitle>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md }}>
        {pros.map((p) => (
          <Pressable key={p.slug} onPress={() => onOpenPro(p)} style={styles.proCard}>
            <RemoteImage uri={p.image} style={StyleSheet.absoluteFill} fallback={colors.navyDark} />
            <LinearGradient colors={["rgba(11,18,32,0.1)", "rgba(11,18,32,0.92)"]} style={StyleSheet.absoluteFill} />
            <Text style={styles.proDiscipline}>{p.discipline}</Text>
            <Text style={styles.proName}>{p.name}</Text>
            <Text style={styles.proTyre}>{p.tyre}</Text>
          </Pressable>
        ))}
      </ScrollView>

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

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statTile}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function apiReviewToMobileReview(review: ReviewItem): Review {
  return {
    id: String(review.id),
    productId: review.productId,
    author: initials(review.riderName),
    product: review.tyre ?? "Pneu Michelin",
    rating: review.rating,
    verified: true,
    text: review.text,
  };
}

function initials(name: string): string {
  const value = name.trim() || "Rider Michelin";
  return value
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
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
  teaser: {
    height: 180,
    borderRadius: radius.lg,
    padding: spacing.lg,
    justifyContent: "flex-end",
  },
  teaserBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.yellow,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: spacing.sm,
  },
  teaserBadgeText: { color: colors.navyDark, fontSize: font.tiny, fontWeight: "800" },
  teaserSub: { color: "rgba(255,255,255,0.9)", fontSize: font.small, marginTop: 4 },
  sectionSpacer: { marginTop: spacing.xl },
  rides: { gap: spacing.md },
  emptyText: { color: colors.textMuted, fontSize: font.body },
  statsRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginTop: spacing.md },
  statTile: {
    flexBasis: "47%",
    flexGrow: 1,
    backgroundColor: colors.navyDark,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  statValue: { color: colors.yellow, fontSize: font.h2, fontWeight: "900" },
  statLabel: { color: "rgba(255,255,255,0.7)", fontSize: font.tiny, marginTop: 2 },
  proCard: {
    width: 170,
    height: 210,
    borderRadius: radius.lg,
    overflow: "hidden",
    padding: spacing.md,
    justifyContent: "flex-end",
  },
  proDiscipline: {
    color: "rgba(255,255,255,0.8)",
    fontSize: font.tiny,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  proName: { color: colors.white, fontSize: font.body, fontWeight: "800", marginTop: 2 },
  proTyre: { color: colors.yellow, fontSize: font.tiny, fontWeight: "700", marginTop: 2 },
});
