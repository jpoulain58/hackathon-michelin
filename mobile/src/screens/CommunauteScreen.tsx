import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  Dimensions,
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
import { RideCard } from "../components/cards";
import { PrimaryButton, Pips, RemoteImage, ScreenTitle, SectionTitle } from "../components/ui";
import { news } from "../data";
import {
  createRideFromGpx,
  fetchPros,
  fetchRecentReviews,
  fetchRides,
  fetchStats,
  formatKm,
  FALLBACK_STATS,
  type CommunityStats,
  type CreateRideForm,
  type ProRider,
  type ReviewItem,
} from "../lib/api";
import { apiRideToMobileRide } from "../lib/rides";
import { colors, font, radius, spacing } from "../theme";
import type { Ride } from "../types";

const GAP = spacing.md;
const CARD_W = Dimensions.get("window").width - spacing.lg * 2;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

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
  const [rides, setRides] = useState<Ride[]>([]);
  const [loadingRides, setLoadingRides] = useState(true);
  const [gpxModalOpen, setGpxModalOpen] = useState(false);
  const [pickedGpx, setPickedGpx] = useState<{ name: string; xml: string } | null>(null);

  const [stats, setStats] = useState<CommunityStats>(FALLBACK_STATS);
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [reviewCount, setReviewCount] = useState(0);
  const [pros, setPros] = useState<ProRider[]>([]);

  const loadRides = useCallback(() => {
    setLoadingRides(true);
    fetchRides()
      .then((items) => setRides(items.map(apiRideToMobileRide)))
      .catch(() => setRides([]))
      .finally(() => setLoadingRides(false));
  }, []);

  const loadReviews = useCallback(() => {
    fetchRecentReviews(10)
      .then(({ items, count }) => {
        setReviews(items);
        setReviewCount(count);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadRides();
    loadReviews();
    fetchStats().then(setStats).catch(() => {});
    fetchPros().then(setPros).catch(() => {});
  }, [loadRides, loadReviews]);

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

      {/* A la une : teaser nouveau pneu (ouvre l'ecran de reservation) */}
      <Pressable onPress={onOpenPneuTest} style={{ marginBottom: spacing.md }}>
        <RemoteImage uri="https://picsum.photos/seed/powerpulse/1000/500" style={styles.teaser}>
          <LinearGradient
            colors={["rgba(11,18,32,0.1)", "rgba(11,18,32,0.9)"]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.teaserBadge}>
            <Text style={styles.teaserBadgeText}>BIENTÔT · JUILLET 2026</Text>
          </View>
          <Text style={styles.newsTitle}>MICHELIN Power Pulse arrive</Text>
          <Text style={styles.teaserSub}>
            Membres du Club : réservez votre essai en avant-première →
          </Text>
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

      {/* Compteurs collectifs */}
      <View style={styles.statsRow}>
        <Stat value={formatKm(stats.monthKm)} label="roulés ce mois" />
        <Stat value={stats.ridersCount.toLocaleString("fr-FR")} label="riders" />
        <Stat value={reviewCount.toLocaleString("fr-FR")} label="avis" />
        <Stat value={formatKm(stats.totalKm)} label="cumul communauté" />
      </View>

      {/* Derniers avis */}
      <View style={styles.sectionSpacer}>
        <SectionTitle>Les derniers avis</SectionTitle>
      </View>
      <CommunityReviewForm session={session} onSubmitted={loadReviews} />
      <View style={{ gap: spacing.md, marginTop: spacing.md }}>
        {reviews.map((r) => (
          <View key={r.id} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <Text style={styles.reviewAuthor}>{r.riderName}</Text>
              {r.isAmbassador ? (
                <View style={styles.ambassadorBadge}>
                  <Text style={styles.ambassadorBadgeText}>Ambassadeur</Text>
                </View>
              ) : null}
            </View>
            {r.tyre ? <Text style={styles.reviewTyre}>{r.tyre}</Text> : null}
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <View key={n} style={[styles.ratingDot, n <= r.rating && styles.ratingDotActive]} />
              ))}
            </View>
            <Text style={styles.reviewText}>« {r.text} »</Text>
            <Text style={styles.reviewDate}>{formatDate(r.createdAt)}</Text>
          </View>
        ))}
      </View>

      {/* Pneus des pros */}
      <View style={styles.sectionSpacer}>
        <SectionTitle>Les pneus des pros</SectionTitle>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.md }}>
        {pros.map((p) => (
          <Pressable key={p.slug} onPress={() => onOpenPro(p)} style={styles.proCard}>
            <RemoteImage uri={p.image} style={StyleSheet.absoluteFill} fallback={colors.navyDark} />
            <LinearGradient
              colors={["rgba(11,18,32,0.1)", "rgba(11,18,32,0.92)"]}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.proDiscipline}>{p.discipline}</Text>
            <Text style={styles.proName}>{p.name}</Text>
            <Text style={styles.proTyre}>{p.tyre}</Text>
          </Pressable>
        ))}
      </ScrollView>

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

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.statTile}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
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
  reviewCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    padding: spacing.lg,
    gap: 4,
  },
  reviewHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  reviewAuthor: { color: colors.text, fontSize: font.body, fontWeight: "800" },
  ambassadorBadge: {
    backgroundColor: colors.chipBg,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  ambassadorBadgeText: {
    color: colors.navy,
    fontSize: font.tiny,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  reviewTyre: { color: colors.navy, fontSize: font.small, fontWeight: "700" },
  ratingRow: { flexDirection: "row", gap: 4, marginTop: 2 },
  ratingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.dotEmpty },
  ratingDotActive: { backgroundColor: colors.navy },
  reviewText: { color: colors.textBody, fontSize: font.small, marginTop: 4 },
  reviewDate: { color: colors.textFaint, fontSize: font.tiny, marginTop: 4 },
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
