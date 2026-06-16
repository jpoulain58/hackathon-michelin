import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  Dimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ReviewCard, RideCard } from "../components/cards";
import { Pips, RemoteImage, ScreenTitle, SectionTitle } from "../components/ui";
import { news, reviews, rides } from "../data";
import { colors, font, radius, spacing } from "../theme";

const GAP = spacing.md;
const CARD_W = Dimensions.get("window").width - spacing.lg * 2;

export function CommunauteScreen({
  onOpenRide,
}: {
  onOpenRide: (id: string) => void;
}) {
  const [newsIndex, setNewsIndex] = useState(0);
  const [reviewIndex, setReviewIndex] = useState(0);

  const onScroll =
    (setter: (i: number) => void) =>
    (e: NativeSyntheticEvent<NativeScrollEvent>) =>
      setter(Math.round(e.nativeEvent.contentOffset.x / (CARD_W + GAP)));

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

      {/* Balades de la semaine */}
      <View style={styles.sectionSpacer}>
        <SectionTitle>Les balades de la semaine</SectionTitle>
      </View>
      <View style={styles.rides}>
        {rides.map((ride) => (
          <RideCard
            key={ride.id}
            ride={ride}
            onPress={() => onOpenRide(ride.id)}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
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
});
