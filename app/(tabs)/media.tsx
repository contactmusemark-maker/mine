import { Image } from "expo-image";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnimatedFadeIn } from "@/components/AnimatedFadeIn";
import { PhotoCarousel } from "@/components/PhotoCarousel";
import { MediaItem, useDatabase } from "@/contexts/DatabaseContext";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";

type Filter = "all" | "image" | "video";

const { width } = Dimensions.get("window");
const COLS = 3;
const THUMB = (width - 20 * 2 - 4 * (COLS - 1)) / COLS;

interface MediaWithMemory extends MediaItem {
  memoryTitle: string;
}

export default function MediaVaultScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { memories, getMediaForMemory, deleteMedia } = useDatabase();
  const [allMedia, setAllMedia] = useState<MediaWithMemory[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [carouselVisible, setCarouselVisible] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const items: MediaWithMemory[] = [];
    for (const m of memories) {
      const media = await getMediaForMemory(m.id);
      for (const item of media) {
        items.push({ ...item, memoryTitle: m.title });
      }
    }
    setAllMedia(items);
    setLoading(false);
  }, [memories, getMediaForMemory]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const filtered = allMedia.filter(
    (m) => filter === "all" || m.type === filter
  );

  const openCarousel = (idx: number) => {
    setCarouselIdx(idx);
    setCarouselVisible(true);
  };

  const handleDelete = (item: MediaWithMemory) => {
    Alert.alert("Delete Media", "Remove this from the vault?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteMedia(item.id, item.filePath);
          await loadAll();
        },
      },
    ]);
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const carouselPhotos = filtered.map((m) => ({ uri: m.filePath, type: m.type }));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.navy }]}>Media Vault</Text>

        <View style={[styles.filterRow, { backgroundColor: colors.secondary }]}>
          {(["all", "image", "video"] as Filter[]).map((f) => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterTab,
                filter === f && { backgroundColor: colors.card },
              ]}
              onPress={() => setFilter(f)}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: filter === f ? colors.primary : colors.mutedForeground },
                ]}
              >
                {f === "all" ? "All" : f === "image" ? "Photos" : "Videos"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {filtered.length > 0 && (
          <Text style={[styles.countLabel, { color: colors.mutedForeground }]}>
            {filtered.length} {filtered.length === 1 ? "item" : "items"} · tap to view, hold to delete
          </Text>
        )}
      </View>

      {loading ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Loading...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Feather name="image" size={48} color={colors.accent} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No media yet</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Add photos & videos when creating memories
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          numColumns={COLS}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.grid, { paddingBottom: bottomPad + 80 }]}
          columnWrapperStyle={styles.row}
          renderItem={({ item, index }) => (
            <AnimatedFadeIn delay={index * 20} style={styles.thumbWrap}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => openCarousel(index)}
                onLongPress={() => handleDelete(item)}
              >
                <Image
                  source={{ uri: item.filePath }}
                  style={[styles.thumb, { width: THUMB, height: THUMB }]}
                  contentFit="cover"
                  transition={200}
                />
                {item.type === "video" && (
                  <View style={styles.videoBadge}>
                    <Feather name="play" size={11} color="#FFF" />
                  </View>
                )}
                <View style={styles.thumbOverlay}>
                  <Text style={styles.thumbTitle} numberOfLines={1}>
                    {item.memoryTitle}
                  </Text>
                </View>
              </TouchableOpacity>
            </AnimatedFadeIn>
          )}
        />
      )}

      <PhotoCarousel
        photos={carouselPhotos}
        initialIndex={carouselIdx}
        visible={carouselVisible}
        onClose={() => setCarouselVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 12, gap: 12 },
  title: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  filterRow: { flexDirection: "row", borderRadius: 12, padding: 4, gap: 4 },
  filterTab: { flex: 1, paddingVertical: 8, borderRadius: 9, alignItems: "center" },
  filterText: { fontSize: 14, fontWeight: "600" },
  countLabel: { fontSize: 12 },
  grid: { paddingHorizontal: 20, paddingTop: 4 },
  row: { gap: 4, marginBottom: 4 },
  thumbWrap: { position: "relative", borderRadius: 10, overflow: "hidden" },
  thumb: { borderRadius: 10 },
  videoBadge: {
    position: "absolute", top: 6, left: 6,
    backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 6, padding: 5,
  },
  thumbOverlay: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "rgba(0,0,0,0.35)", paddingHorizontal: 6, paddingVertical: 4,
  },
  thumbTitle: { color: "#FFF", fontSize: 10, fontWeight: "500" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptyText: { fontSize: 14, textAlign: "center", paddingHorizontal: 40 },
});
