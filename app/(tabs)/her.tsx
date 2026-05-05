import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnimatedFadeIn } from "@/components/AnimatedFadeIn";
import { PhotoCarousel } from "@/components/PhotoCarousel";
import { MediaItem, useDatabase } from "@/contexts/DatabaseContext";
import { useColors } from "@/hooks/useColors";
import { useProfile } from "@/hooks/useProfile";
import { Feather } from "@expo/vector-icons";

const WA_META_KEY = "@me_ammu/whatsapp_meta";
const { width } = Dimensions.get("window");
const PHOTO_SIZE = (width - 40 - 8 * 2) / 3;

interface MediaWithMemory extends MediaItem { memoryTitle: string }

export default function HerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { photo, name, updatePhoto, updateName } = useProfile();
  const { memories, letters, journals, getMediaForMemory } = useDatabase();

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(name);
  const [photos, setPhotos] = useState<MediaWithMemory[]>([]);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [carouselVisible, setCarouselVisible] = useState(false);
  const [waMeta, setWaMeta] = useState<{ herName: string; totalCount: number } | null>(null);

  useEffect(() => { setNameInput(name); }, [name]);

  const loadPhotos = useCallback(async () => {
    const items: MediaWithMemory[] = [];
    for (const m of memories) {
      const media = await getMediaForMemory(m.id);
      for (const item of media.filter((i) => i.type === "image")) {
        items.push({ ...item, memoryTitle: m.title });
      }
    }
    setPhotos(items);
  }, [memories, getMediaForMemory]);

  useEffect(() => {
    loadPhotos();
    AsyncStorage.getItem(WA_META_KEY).then((raw) => {
      if (raw) setWaMeta(JSON.parse(raw));
    });
  }, [loadPhotos]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const pickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert("Permission needed", "Allow photo access to set her picture."); return; }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.9, allowsEditing: true, aspect: [1, 1] });
    if (!res.canceled) {
      await updatePhoto(res.assets[0].uri);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const saveName = async () => {
    if (nameInput.trim()) {
      await updateName(nameInput.trim());
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setEditingName(false);
  };

  const carouselPhotos = photos.map((p) => ({ uri: p.filePath, type: p.type }));

  const QUICK_LINKS = [
    { icon: "mail" as const, label: "Letters", count: letters.length, color: "#C4344A", route: "/letters" },
    { icon: "message-circle" as const, label: "Her Chat", count: waMeta?.totalCount ?? 0, color: "#25D366", route: "/whatsapp-chat" },
    { icon: "book-open" as const, label: "Journals", count: journals.length, color: "#6BA8FF", route: "/(tabs)/timeline" },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: bottomPad + 90 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero profile area */}
      <View style={[styles.hero, { paddingTop: topPad + 16, backgroundColor: colors.primary + "10" }]}>
        {/* Profile picture */}
        <TouchableOpacity onPress={pickPhoto} style={styles.avatarWrap} activeOpacity={0.85}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary + "25" }]}>
              <Text style={styles.avatarInitial}>{name.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View style={[styles.editBadge, { backgroundColor: colors.primary }]}>
            <Feather name="camera" size={12} color="#FFF" />
          </View>
        </TouchableOpacity>

        {/* Name */}
        {editingName ? (
          <View style={styles.nameEditRow}>
            <TextInput
              style={[styles.nameInput, { color: colors.navy, borderColor: colors.primary }]}
              value={nameInput}
              onChangeText={setNameInput}
              autoFocus
              onSubmitEditing={saveName}
              returnKeyType="done"
              selectTextOnFocus
            />
            <TouchableOpacity onPress={saveName} style={[styles.nameSaveBtn, { backgroundColor: colors.primary }]}>
              <Feather name="check" size={14} color="#FFF" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={() => setEditingName(true)} style={styles.nameRow}>
            <Text style={[styles.name, { color: colors.navy }]}>{name}</Text>
            <Feather name="edit-2" size={14} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}

        <Text style={[styles.herLabel, { color: colors.mutedForeground }]}>
          Always in my heart 💕
        </Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: colors.navy }]}>{memories.length}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Memories</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: colors.navy }]}>{letters.length}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Letters</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: colors.navy }]}>{waMeta?.totalCount ?? 0}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Messages</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {/* Quick links */}
        <AnimatedFadeIn delay={50}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Access</Text>
          <View style={styles.quickRow}>
            {QUICK_LINKS.map((q) => (
              <TouchableOpacity
                key={q.label}
                style={[styles.quickCard, { backgroundColor: colors.card }]}
                onPress={() => router.push(q.route as any)}
                activeOpacity={0.85}
              >
                <View style={[styles.quickIcon, { backgroundColor: q.color + "18" }]}>
                  <Feather name={q.icon} size={20} color={q.color} />
                </View>
                <Text style={[styles.quickNum, { color: colors.navy }]}>{q.count}</Text>
                <Text style={[styles.quickLabel, { color: colors.mutedForeground }]}>{q.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </AnimatedFadeIn>

        {/* Write letter CTA */}
        <AnimatedFadeIn delay={100}>
          <TouchableOpacity
            style={[styles.writeCta, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/write-letter")}
            activeOpacity={0.85}
          >
            <View style={styles.writeCtaLeft}>
              <Text style={styles.writeCtaEmoji}>✉️</Text>
              <View>
                <Text style={styles.writeCtaTitle}>Write Her a Letter</Text>
                <Text style={styles.writeCtaSub}>Words you never got to send</Text>
              </View>
            </View>
            <Feather name="arrow-right" size={18} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </AnimatedFadeIn>

        {/* WhatsApp CTA */}
        {waMeta && (
          <AnimatedFadeIn delay={130}>
            <TouchableOpacity
              style={[styles.waCta, { backgroundColor: "#E8F8EF", borderColor: "#B7E4C7" }]}
              onPress={() => router.push("/whatsapp-chat")}
              activeOpacity={0.85}
            >
              <View style={styles.writeCtaLeft}>
                <Text style={styles.writeCtaEmoji}>💬</Text>
                <View>
                  <Text style={[styles.writeCtaTitle, { color: "#166534" }]}>Read Her Messages</Text>
                  <Text style={[styles.writeCtaSub, { color: "#15803d" }]}>
                    {waMeta.totalCount.toLocaleString()} messages imported
                  </Text>
                </View>
              </View>
              <Feather name="arrow-right" size={18} color="#15803d" />
            </TouchableOpacity>
          </AnimatedFadeIn>
        )}

        {/* Photo memories */}
        <AnimatedFadeIn delay={160}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Her Photos</Text>
            {photos.length > 0 && (
              <Text style={[styles.seeAll, { color: colors.mutedForeground }]}>
                {photos.length} photos
              </Text>
            )}
          </View>
          {photos.length === 0 ? (
            <View style={[styles.emptyPhotos, { backgroundColor: colors.card }]}>
              <Text style={styles.emptyPhotosEmoji}>📷</Text>
              <Text style={[styles.emptyPhotosText, { color: colors.mutedForeground }]}>
                Photos from your memories will appear here
              </Text>
            </View>
          ) : (
            <View style={styles.photoGrid}>
              {photos.slice(0, 9).map((p, idx) => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.photoThumb, { width: PHOTO_SIZE, height: PHOTO_SIZE }]}
                  onPress={() => { setCarouselIdx(idx); setCarouselVisible(true); }}
                  activeOpacity={0.85}
                >
                  <Image
                    source={{ uri: p.filePath }}
                    style={{ width: PHOTO_SIZE, height: PHOTO_SIZE, borderRadius: 12 }}
                    contentFit="cover"
                    transition={200}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </AnimatedFadeIn>

        {/* Latest letters */}
        {letters.length > 0 && (
          <AnimatedFadeIn delay={200}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Latest Letters</Text>
              <TouchableOpacity onPress={() => router.push("/letters")}>
                <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
              </TouchableOpacity>
            </View>
            {letters.slice(0, 2).map((l) => (
              <TouchableOpacity
                key={l.id}
                style={[styles.letterCard, { backgroundColor: "#FFFBF5", borderColor: "#E8DCC8" }]}
                onPress={() => router.push(`/view-letter/${l.id}`)}
                activeOpacity={0.85}
              >
                <Text style={[styles.letterTitle, { color: "#3D2C00" }]}>
                  {l.title || "Untitled"}
                </Text>
                <Text style={[styles.letterPreview, { color: "#8B6914" }]} numberOfLines={2}>
                  {l.body}
                </Text>
                <Text style={[styles.letterDate, { color: "#C8B97A" }]}>
                  {new Date(l.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </Text>
              </TouchableOpacity>
            ))}
          </AnimatedFadeIn>
        )}
      </View>

      <PhotoCarousel
        photos={carouselPhotos}
        initialIndex={carouselIdx}
        visible={carouselVisible}
        onClose={() => setCarouselVisible(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: { alignItems: "center", paddingBottom: 24, gap: 8 },
  avatarWrap: { position: "relative", marginBottom: 4 },
  avatar: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: "#FFF" },
  avatarPlaceholder: { width: 110, height: 110, borderRadius: 55, alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: "#FFF" },
  avatarInitial: { fontSize: 44, fontWeight: "800", color: "#C4344A" },
  editBadge: { position: "absolute", bottom: 2, right: 2, width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#FFF" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  name: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5 },
  nameEditRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  nameInput: { fontSize: 22, fontWeight: "700", borderBottomWidth: 2, paddingBottom: 4, minWidth: 120, textAlign: "center" },
  nameSaveBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  herLabel: { fontSize: 13, fontStyle: "italic" },
  statsRow: { flexDirection: "row", alignItems: "center", gap: 0, marginTop: 8, backgroundColor: "rgba(255,255,255,0.6)", borderRadius: 16, paddingVertical: 14, paddingHorizontal: 20 },
  stat: { flex: 1, alignItems: "center" },
  statNum: { fontSize: 22, fontWeight: "800" },
  statLabel: { fontSize: 11, fontWeight: "500", marginTop: 2 },
  statDivider: { width: 1, height: 28 },
  content: { paddingHorizontal: 20, paddingTop: 20, gap: 16 },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { fontSize: 17, fontWeight: "700" },
  seeAll: { fontSize: 13 },
  quickRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  quickCard: { flex: 1, alignItems: "center", paddingVertical: 16, borderRadius: 16, gap: 6, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3, elevation: 1 },
  quickIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  quickNum: { fontSize: 18, fontWeight: "800" },
  quickLabel: { fontSize: 11, fontWeight: "500" },
  writeCta: { borderRadius: 16, padding: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  writeCtaLeft: { flexDirection: "row", alignItems: "center", gap: 14 },
  writeCtaEmoji: { fontSize: 28 },
  writeCtaTitle: { color: "#FFF", fontSize: 15, fontWeight: "700" },
  writeCtaSub: { color: "rgba(255,255,255,0.7)", fontSize: 12, marginTop: 2 },
  waCta: { borderRadius: 16, padding: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1 },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  photoThumb: { borderRadius: 12, overflow: "hidden" },
  emptyPhotos: { borderRadius: 16, padding: 24, alignItems: "center", gap: 8, marginTop: 10 },
  emptyPhotosEmoji: { fontSize: 36 },
  emptyPhotosText: { fontSize: 13, textAlign: "center" },
  letterCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 4, marginTop: 8 },
  letterTitle: { fontSize: 14, fontWeight: "700" },
  letterPreview: { fontSize: 13, lineHeight: 19, fontStyle: "italic" },
  letterDate: { fontSize: 11, marginTop: 4 },
});
