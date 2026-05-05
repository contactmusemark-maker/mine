import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TagChip } from "@/components/TagChip";
import { PhotoGrid } from "@/components/PhotoCarousel";
import { MediaItem, useDatabase } from "@/contexts/DatabaseContext";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";

const MOOD_EMOJIS: Record<number, string> = {
  0: "😢", 1: "😞", 2: "😔", 3: "😕", 4: "😐",
  5: "🙂", 6: "😊", 7: "😄", 8: "😁", 9: "🥰", 10: "🤩",
};

function getMoodColor(m: number) {
  if (m <= 3) return "#FF6B6B";
  if (m <= 6) return "#FFD66B";
  return "#6BCB77";
}

export default function MemoryDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { memories, deleteMemory, toggleFavorite, getMediaForMemory } = useDatabase();
  const router = useRouter();

  const memory = memories.find((m) => m.id === id);
  const [media, setMedia] = useState<MediaItem[]>([]);

  useEffect(() => {
    if (id) {
      getMediaForMemory(id).then(setMedia);
    }
  }, [id, getMediaForMemory]);

  if (!memory) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: colors.text }}>Memory not found</Text>
      </View>
    );
  }

  const handleDelete = () => {
    Alert.alert("Delete Memory", "This will permanently delete this memory and all its media.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteMemory(id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.back();
        },
      },
    ]);
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top + 60;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const moodColor = getMoodColor(memory.mood);

  const photos = media.map((m) => ({ uri: m.filePath, type: m.type }));

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPad, paddingBottom: bottomPad + 40 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.card }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            toggleFavorite(memory.id);
          }}
        >
          <Feather
            name="star"
            size={18}
            color={memory.isFavorite ? "#FFD66B" : colors.mutedForeground}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.destructive + "20" }]}
          onPress={handleDelete}
        >
          <Feather name="trash-2" size={18} color={colors.destructive} />
        </TouchableOpacity>
      </View>

      <View style={styles.header}>
        <View style={[styles.moodBadge, { backgroundColor: moodColor + "20" }]}>
          <Text style={styles.moodEmoji}>{MOOD_EMOJIS[memory.mood]}</Text>
          <Text style={[styles.moodText, { color: moodColor }]}>
            Mood {memory.mood}/10
          </Text>
        </View>

        <Text style={[styles.date, { color: colors.mutedForeground }]}>
          {new Date(memory.date).toLocaleDateString("en-US", {
            weekday: "long", month: "long", day: "numeric", year: "numeric",
          })}
        </Text>

        <Text style={[styles.title, { color: colors.text }]}>{memory.title}</Text>

        {memory.tags.length > 0 && (
          <View style={styles.tags}>
            {memory.tags.map((t) => (
              <TagChip key={t} tag={t} small />
            ))}
          </View>
        )}
      </View>

      {memory.description ? (
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Memory</Text>
          <Text style={[styles.body, { color: colors.text }]}>{memory.description}</Text>
        </View>
      ) : null}

      {memory.learned ? (
        <View style={[styles.section, { backgroundColor: colors.secondary }]}>
          <View style={styles.learnedHeader}>
            <Feather name="zap" size={14} color={colors.primary} />
            <Text style={[styles.sectionLabel, { color: colors.primary }]}>What I Learned</Text>
          </View>
          <Text style={[styles.body, { color: colors.text }]}>{memory.learned}</Text>
        </View>
      ) : null}

      {photos.length > 0 && (
        <View style={styles.mediaSection}>
          <Text style={[styles.mediaSectionTitle, { color: colors.text }]}>
            Photos & Videos ({photos.length})
          </Text>
          <PhotoGrid photos={photos} maxVisible={6} thumbSize={100} />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 16 },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginBottom: 4 },
  actionBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  header: { gap: 12 },
  moodBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  moodEmoji: { fontSize: 18 },
  moodText: { fontSize: 14, fontWeight: "600" },
  date: { fontSize: 13 },
  title: { fontSize: 26, fontWeight: "800", letterSpacing: -0.5, lineHeight: 32 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  section: { borderRadius: 16, padding: 18, gap: 10 },
  sectionLabel: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.8 },
  body: { fontSize: 16, lineHeight: 26 },
  learnedHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  mediaSection: { gap: 12 },
  mediaSectionTitle: { fontSize: 16, fontWeight: "700" },
});
