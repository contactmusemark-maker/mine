import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnimatedFadeIn } from "@/components/AnimatedFadeIn";
import { AnniversaryBanner } from "@/components/AnniversaryBanner";
import { MemoryCard } from "@/components/MemoryCard";
import { MoodSlider } from "@/components/MoodSlider";
import { MediaItem, useDatabase } from "@/contexts/DatabaseContext";
import { useAnniversary } from "@/hooks/useAnniversary";
import { useColors } from "@/hooks/useColors";
import { useProfile } from "@/hooks/useProfile";
import { Feather } from "@expo/vector-icons";

const { width } = Dimensions.get("window");
const CARD_W = width - 40;

const QUOTES = [
  "Every moment with you is a treasure I keep.",
  "In your smile, I see something more beautiful than the stars.",
  "With you, every ordinary day became a beautiful memory.",
  "You are my today and all of my tomorrows.",
  "Some people leave footprints on your heart forever.",
];

const PLACEHOLDER_SLIDES = [
  {
    id: "ph1",
    gradient: ["#FF6B9D", "#C44569"] as [string, string],
    emoji: "🌸",
    title: "Your Moments",
    sub: "Add photos to memories to see them here",
  },
  {
    id: "ph2",
    gradient: ["#A18CD1", "#FBC2EB"] as [string, string],
    emoji: "💕",
    title: "Your Gallery",
    sub: "Every photo tells a story",
  },
  {
    id: "ph3",
    gradient: ["#2D3561", "#4A5897"] as [string, string],
    emoji: "🌙",
    title: "Safe & Private",
    sub: "Only you can see these memories",
  },
];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const QUICK_ACTIONS = [
  { icon: "edit-3" as const, label: "Journal", route: "/journal", color: "#6BA8FF", bg: "#EEF4FF" },
  { icon: "mail" as const, label: "Letters", route: "/letters", color: "#C4344A", bg: "#FFF0F2" },
  { icon: "message-circle" as const, label: "Her Chat", route: "/whatsapp-chat", color: "#25D366", bg: "#EDFAF3" },
  { icon: "star" as const, label: "Milestone", route: "/add-milestone", color: "#F59E0B", bg: "#FFF9ED" },
];

interface SlideItem {
  id: string;
  type: "photo" | "placeholder";
  uri?: string;
  gradient?: [string, string];
  emoji?: string;
  title?: string;
  sub?: string;
  memoryTitle?: string;
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { memories, journals, letters, toggleFavorite, getMediaForMemory } = useDatabase();
  const anniversary = useAnniversary();
  const router = useRouter();
  const { photo, name, updatePhoto } = useProfile();

  const [moodValue, setMoodValue] = useState(5);
  const [slides, setSlides] = useState<SlideItem[]>(PLACEHOLDER_SLIDES.map((p) => ({ ...p, type: "placeholder" as const })));
  const [slideIdx, setSlideIdx] = useState(0);
  const carouselRef = useRef<FlatList>(null);

  const quote = useMemo(() => QUOTES[new Date().getDay() % QUOTES.length], []);
  const favorites = useMemo(() => memories.filter((m) => m.isFavorite && !m.isHidden), [memories]);
  const recent = useMemo(() => memories.filter((m) => !m.isHidden).slice(0, 3), [memories]);
  const totalEntries = memories.length + journals.length + letters.length;

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    (async () => {
      const photoSlides: SlideItem[] = [];
      for (const m of memories.slice(0, 8)) {
        const media = await getMediaForMemory(m.id);
        const imgs = media.filter((i: MediaItem) => i.type === "image");
        if (imgs.length > 0) {
          photoSlides.push({ id: imgs[0].id, type: "photo", uri: imgs[0].filePath, memoryTitle: m.title });
        }
      }
      if (photoSlides.length > 0) {
        setSlides(photoSlides);
      } else {
        setSlides(PLACEHOLDER_SLIDES.map((p) => ({ ...p, type: "placeholder" })));
      }
    })();
  }, [memories, getMediaForMemory]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    setSlideIdx(Math.round(x / CARD_W));
  };

  const handleAvatarPress = () => {
    Alert.alert(name, "What would you like to do?", [
      { text: "View Her Profile", onPress: () => router.push("/(tabs)/her") },
      { text: "Change Photo", onPress: pickPhoto },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert("Permission needed"); return; }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.9, allowsEditing: true, aspect: [1, 1] });
    if (!res.canceled) await updatePhoto(res.assets[0].uri);
  };

  const renderSlide = ({ item }: { item: SlideItem }) => (
    <TouchableOpacity
      activeOpacity={0.93}
      style={[sl.card, { width: CARD_W }]}
      onPress={() => router.push("/(tabs)/her")}
    >
      {item.type === "photo" && item.uri ? (
        <>
          <Image source={{ uri: item.uri }} style={sl.img} contentFit="cover" transition={300} />
          <LinearGradient colors={["transparent", "rgba(0,0,0,0.55)"]} style={sl.overlay}>
            <Text style={sl.photoTitle} numberOfLines={1}>{item.memoryTitle}</Text>
            <View style={sl.viewRow}>
              <Text style={sl.viewTxt}>View gallery</Text>
              <Feather name="arrow-right" size={13} color="#FFF" />
            </View>
          </LinearGradient>
        </>
      ) : (
        <LinearGradient colors={item.gradient ?? ["#C4344A", "#8B2233"]} style={sl.gradient}>
          <Text style={sl.phEmoji}>{item.emoji}</Text>
          <Text style={sl.phTitle}>{item.title}</Text>
          <Text style={sl.phSub}>{item.sub}</Text>
          <View style={sl.viewRow}>
            <Text style={sl.viewTxt}>Open gallery</Text>
            <Feather name="arrow-right" size={13} color="#FFF" />
          </View>
        </LinearGradient>
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 20, paddingBottom: bottomPad + 90 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <AnimatedFadeIn delay={0}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>{getGreeting()} 👋</Text>
            <Text style={[styles.appTitle, { color: colors.navy }]}>Me & Ammu</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={[styles.iconBtn, { backgroundColor: colors.card }]}
              onPress={() => router.push("/settings")}
            >
              <Feather name="settings" size={17} color={colors.mutedForeground} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleAvatarPress} activeOpacity={0.85} style={styles.avatarWrap}>
              {photo ? (
                <Image source={{ uri: photo }} style={styles.avatar} contentFit="cover" />
              ) : (
                <View style={[styles.avatarFallback, { backgroundColor: colors.primary + "20" }]}>
                  <Text style={[styles.avatarInitial, { color: colors.primary }]}>{name.charAt(0).toUpperCase()}</Text>
                </View>
              )}
              <View style={[styles.avatarRing, { borderColor: colors.primary }]} />
            </TouchableOpacity>
          </View>
        </View>
      </AnimatedFadeIn>

      {/* ── Gallery Carousel ── */}
      <AnimatedFadeIn delay={40}>
        <View>
          <View style={styles.carouselHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>📸 Our Gallery</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/her")}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See all →</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            ref={carouselRef}
            data={slides}
            keyExtractor={(s) => s.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_W}
            decelerationRate="fast"
            onScroll={onScroll}
            scrollEventThrottle={16}
            renderItem={renderSlide}
            style={sl.list}
            contentContainerStyle={{ gap: 0 }}
          />
          {/* Dots */}
          <View style={sl.dots}>
            {slides.map((_, i) => (
              <View
                key={i}
                style={[sl.dot, {
                  backgroundColor: i === slideIdx ? colors.primary : colors.border,
                  width: i === slideIdx ? 18 : 6,
                }]}
              />
            ))}
          </View>
        </View>
      </AnimatedFadeIn>

      {/* ── Anniversary ── */}
      <AnimatedFadeIn delay={80}>
        <AnniversaryBanner info={anniversary} onSetup={() => router.push("/set-anniversary")} />
      </AnimatedFadeIn>

      {/* ── Quote ── */}
      <AnimatedFadeIn delay={100}>
        <View style={[styles.quoteCard, { backgroundColor: colors.primary + "0D", borderLeftColor: colors.primary }]}>
          <Feather name="heart" size={12} color={colors.primary} />
          <Text style={[styles.quoteText, { color: colors.navy }]}>"{quote}"</Text>
        </View>
      </AnimatedFadeIn>

      {/* ── Quick actions ── */}
      <AnimatedFadeIn delay={120}>
        <View style={styles.quickGrid}>
          {QUICK_ACTIONS.map((a) => (
            <TouchableOpacity
              key={a.label}
              style={[styles.quickBtn, { backgroundColor: colors.card }]}
              onPress={() => router.push(a.route as any)}
              activeOpacity={0.8}
            >
              <View style={[styles.quickIconWrap, { backgroundColor: a.bg }]}>
                <Feather name={a.icon} size={18} color={a.color} />
              </View>
              <Text style={[styles.quickLabel, { color: colors.text }]}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </AnimatedFadeIn>

      {/* ── Mood ── */}
      <AnimatedFadeIn delay={150}>
        <View style={[styles.moodCard, { backgroundColor: colors.card }]}>
          <View style={styles.moodRow}>
            <Text style={[styles.moodTitle, { color: colors.text }]}>How are you feeling?</Text>
            <Text style={styles.moodEmoji}>{["😢","😞","😔","😕","😐","🙂","😊","😄","😁","🥰","🤩"][moodValue]}</Text>
          </View>
          <MoodSlider value={moodValue} onValueChange={setMoodValue} />
          <TouchableOpacity
            style={[styles.journalBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/journal")}
          >
            <Feather name="edit-3" size={15} color="#FFF" />
            <Text style={styles.journalBtnTxt}>Write in Journal</Text>
          </TouchableOpacity>
        </View>
      </AnimatedFadeIn>

      {/* ── Stats ── */}
      {totalEntries > 0 && (
        <AnimatedFadeIn delay={180}>
          <View style={styles.statsRow}>
            {[
              { num: memories.length, label: "Memories", color: colors.primary, route: "/(tabs)/timeline" },
              { num: journals.length, label: "Journals", color: "#6BA8FF", route: "/(tabs)/timeline" },
              { num: letters.length, label: "Letters", color: "#C4344A", route: "/letters" },
            ].map((s) => (
              <TouchableOpacity
                key={s.label}
                style={[styles.statCard, { backgroundColor: colors.card }]}
                onPress={() => router.push(s.route as any)}
                activeOpacity={0.8}
              >
                <Text style={[styles.statNum, { color: s.color }]}>{s.num}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </AnimatedFadeIn>
      )}

      {/* ── Favourites ── */}
      {favorites.length > 0 && (
        <AnimatedFadeIn delay={210}>
          <View style={styles.section}>
            <View style={styles.rowBetween}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Favourites ⭐</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/timeline")}>
                <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
              </TouchableOpacity>
            </View>
            {favorites.slice(0, 2).map((m) => (
              <MemoryCard key={m.id} memory={m} onFavoritePress={() => toggleFavorite(m.id)} compact />
            ))}
          </View>
        </AnimatedFadeIn>
      )}

      {/* ── Recent ── */}
      <AnimatedFadeIn delay={240}>
        <View style={styles.section}>
          <View style={styles.rowBetween}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Memories</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/timeline")}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
            </TouchableOpacity>
          </View>
          {recent.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
              <Text style={styles.emptyEmoji}>🌸</Text>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No memories yet</Text>
              <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>Tap + below to add your first</Text>
              <TouchableOpacity
                style={[styles.addMemBtn, { backgroundColor: colors.primary }]}
                onPress={() => router.push("/(tabs)/add")}
              >
                <Feather name="plus" size={14} color="#FFF" />
                <Text style={styles.addMemBtnTxt}>Add Memory</Text>
              </TouchableOpacity>
            </View>
          ) : (
            recent.map((m) => (
              <MemoryCard key={m.id} memory={m} onFavoritePress={() => toggleFavorite(m.id)} />
            ))
          )}
        </View>
      </AnimatedFadeIn>
    </ScrollView>
  );
}

const sl = StyleSheet.create({
  list: { marginHorizontal: -0 },
  card: { height: 210, borderRadius: 20, overflow: "hidden", marginHorizontal: 0 },
  img: { ...StyleSheet.absoluteFillObject },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: "flex-end", padding: 18 },
  gradient: { flex: 1, alignItems: "flex-start", justifyContent: "flex-end", padding: 22, gap: 4 },
  phEmoji: { fontSize: 38, marginBottom: 4 },
  phTitle: { color: "#FFF", fontSize: 20, fontWeight: "800" },
  phSub: { color: "rgba(255,255,255,0.75)", fontSize: 13, marginBottom: 8 },
  photoTitle: { color: "#FFF", fontSize: 17, fontWeight: "700" },
  viewRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 },
  viewTxt: { color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: "600" },
  dots: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 5, marginTop: 10 },
  dot: { height: 6, borderRadius: 3 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 18 },

  headerRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  greeting: { fontSize: 13, fontWeight: "500" },
  appTitle: { fontSize: 30, fontWeight: "800", letterSpacing: -0.5 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3, elevation: 1,
  },
  avatarWrap: { position: "relative", width: 46, height: 46 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  avatarFallback: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  avatarInitial: { fontSize: 18, fontWeight: "800" },
  avatarRing: { position: "absolute", top: -1, left: -1, width: 46, height: 46, borderRadius: 23, borderWidth: 2 },

  carouselHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },

  quoteCard: {
    borderLeftWidth: 3, paddingLeft: 14, paddingVertical: 10,
    paddingRight: 14, borderRadius: 10, flexDirection: "row", alignItems: "flex-start", gap: 10,
  },
  quoteText: { flex: 1, fontSize: 13, lineHeight: 20, fontStyle: "italic" },

  quickGrid: { flexDirection: "row", gap: 10 },
  quickBtn: {
    flex: 1, alignItems: "center", paddingVertical: 15, borderRadius: 18, gap: 8,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  quickIconWrap: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  quickLabel: { fontSize: 10, fontWeight: "700" },

  moodCard: {
    borderRadius: 20, padding: 18, gap: 14,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  moodRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  moodTitle: { fontSize: 15, fontWeight: "700" },
  moodEmoji: { fontSize: 26 },
  journalBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 13, borderRadius: 13,
  },
  journalBtnTxt: { color: "#FFF", fontSize: 14, fontWeight: "700" },

  statsRow: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1, alignItems: "center", paddingVertical: 14, borderRadius: 16,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  statNum: { fontSize: 22, fontWeight: "800" },
  statLabel: { fontSize: 11, fontWeight: "500", marginTop: 2 },

  section: { gap: 12 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { fontSize: 17, fontWeight: "700" },
  seeAll: { fontSize: 13, fontWeight: "600" },

  emptyCard: { borderRadius: 20, padding: 32, alignItems: "center", gap: 10 },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { fontSize: 16, fontWeight: "700" },
  emptySub: { fontSize: 13 },
  addMemBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 20, paddingVertical: 11, borderRadius: 12, marginTop: 4 },
  addMemBtnTxt: { color: "#FFF", fontSize: 13, fontWeight: "700" },
});
