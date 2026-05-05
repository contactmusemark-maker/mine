import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MoodSlider } from "@/components/MoodSlider";
import { TagChip, ALL_TAGS } from "@/components/TagChip";
import { useDatabase } from "@/contexts/DatabaseContext";
import { useColors } from "@/hooks/useColors";
import { saveMediaFile } from "../../services/storage";
import { Feather } from "@expo/vector-icons";

interface PickedMedia {
  uri: string;
  type: "image" | "video";
}

function suggestTags(text: string): string[] {
  const lower = text.toLowerCase();
  const suggestions: string[] = [];
  if (lower.includes("fight") || lower.includes("argue") || lower.includes("angry")) suggestions.push("Fight");
  if (lower.includes("miss") || lower.includes("apart") || lower.includes("away")) suggestions.push("Missing");
  if (lower.includes("love") || lower.includes("heart") || lower.includes("adore")) suggestions.push("Love");
  if (lower.includes("happy") || lower.includes("joy") || lower.includes("excited")) suggestions.push("Happy");
  if (lower.includes("sad") || lower.includes("cry") || lower.includes("tears")) suggestions.push("Sad");
  if (lower.includes("sweet") || lower.includes("cute") || lower.includes("darling")) suggestions.push("Sweet");
  return [...new Set(suggestions)];
}

export default function AddMemoryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addMemory, addMedia } = useDatabase();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mood, setMood] = useState(7);
  const [tags, setTags] = useState<string[]>([]);
  const [learned, setLearned] = useState("");
  const [media, setMedia] = useState<PickedMedia[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [date] = useState(new Date());

  const suggestedTags = suggestTags(description + " " + title);

  const openMediaPicker = async (source: "library" | "camera", type: "image" | "video") => {
    if (source === "camera") {
      const res = await ImagePicker.requestCameraPermissionsAsync();
      if (!res.granted) {
        Alert.alert("Permission needed", "Allow camera access to take photos.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: type === "video" ? ["videos"] : ["images"],
        quality: 0.8,
      });
      if (!result.canceled) {
        setMedia((prev) => [...prev, { uri: result.assets[0].uri, type }].slice(0, 6));
      }
    } else {
      const res = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!res.granted) {
        Alert.alert("Permission needed", "Allow photo access to add media.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images", "videos"],
        allowsMultipleSelection: true,
        quality: 0.8,
      });
      if (!result.canceled) {
        const items: PickedMedia[] = result.assets.map((a) => ({
          uri: a.uri,
          type: a.type === "video" ? "video" : "image",
        }));
        setMedia((prev) => [...prev, ...items].slice(0, 6));
      }
    }
  };

  const showMediaOptions = () => {
    Alert.alert("Add Media", "Choose a source", [
      { text: "Camera (Photo)", onPress: () => openMediaPicker("camera", "image") },
      { text: "Camera (Video)", onPress: () => openMediaPicker("camera", "video") },
      { text: "Photo Library", onPress: () => openMediaPicker("library", "image") },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const removeMedia = (idx: number) => setMedia((prev) => prev.filter((_, i) => i !== idx));

  const toggleTag = (t: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTags((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("Missing title", "Please add a title for this memory.");
      return;
    }
    setIsSaving(true);
    try {
      const memoryId = await addMemory({
        title: title.trim(),
        description: description.trim(),
        date: date.getTime(),
        tags,
        mood,
        learned: learned.trim(),
        isFavorite: false,
        isHidden: false,
      });
      for (const item of media) {
        const filePath = await saveMediaFile(item.uri, item.type);
        await addMedia({ memoryId, filePath, type: item.type });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTitle(""); setDescription(""); setTags([]); setMood(7); setLearned(""); setMedia([]);
      router.push("/(tabs)/timeline");
    } catch {
      Alert.alert("Error", "Could not save memory. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: bottomPad + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.titleRow}>
          <View>
            <Text style={[styles.screenTitle, { color: colors.navy }]}>New Memory</Text>
            <Text style={[styles.dateLabel, { color: colors.mutedForeground }]}>
              {date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.milestoneShortcut, { backgroundColor: colors.secondary }]}
            onPress={() => router.push("/add-milestone")}
          >
            <Text style={styles.milestoneEmoji}>💕</Text>
            <Text style={[styles.milestoneShortcutTxt, { color: colors.primary }]}>Milestone</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <TextInput
            style={[styles.titleInput, { color: colors.text }]}
            placeholder="Memory title..."
            placeholderTextColor={colors.mutedForeground}
            value={title}
            onChangeText={setTitle}
            returnKeyType="next"
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <TextInput
            style={[styles.descInput, { color: colors.text }]}
            placeholder="Describe this memory... what happened, how did it feel?"
            placeholderTextColor={colors.mutedForeground}
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
          />
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardLabel, { color: colors.text }]}>Mood</Text>
          <MoodSlider value={mood} onValueChange={setMood} />
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardLabel, { color: colors.text }]}>Tags</Text>
          {suggestedTags.length > 0 && (
            <View style={styles.suggestionRow}>
              <Feather name="zap" size={12} color={colors.primary} />
              <Text style={[styles.suggestionLabel, { color: colors.primary }]}>Suggested:</Text>
              {suggestedTags.map((t) => (
                <TagChip key={t} tag={t} small selected={tags.includes(t)} onPress={() => toggleTag(t)} />
              ))}
            </View>
          )}
          <View style={styles.tagGrid}>
            {ALL_TAGS.map((t) => (
              <TagChip key={t} tag={t} selected={tags.includes(t)} onPress={() => toggleTag(t)} />
            ))}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardLabel, { color: colors.text }]}>What did I learn?</Text>
          <TextInput
            style={[styles.learnedInput, { color: colors.text }]}
            placeholder="A lesson, realization, or something to remember..."
            placeholderTextColor={colors.mutedForeground}
            value={learned}
            onChangeText={setLearned}
            multiline
            textAlignVertical="top"
          />
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.mediaHeader}>
            <Text style={[styles.cardLabel, { color: colors.text }]}>Photos & Videos</Text>
            <View style={styles.mediaActions}>
              <TouchableOpacity
                style={[styles.mediaActionBtn, { backgroundColor: colors.secondary }]}
                onPress={() => openMediaPicker("library", "image")}
              >
                <Feather name="image" size={16} color={colors.primary} />
                <Text style={[styles.mediaActionTxt, { color: colors.primary }]}>Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.mediaActionBtn, { backgroundColor: colors.secondary }]}
                onPress={() => openMediaPicker("camera", "image")}
              >
                <Feather name="camera" size={16} color={colors.primary} />
                <Text style={[styles.mediaActionTxt, { color: colors.primary }]}>Camera</Text>
              </TouchableOpacity>
            </View>
          </View>

          {media.length > 0 ? (
            <View style={styles.mediaGrid}>
              {media.map((item, idx) => (
                <View key={idx} style={styles.mediaThumb}>
                  <Image source={{ uri: item.uri }} style={styles.thumbImg} contentFit="cover" />
                  <TouchableOpacity style={styles.removeBtn} onPress={() => removeMedia(idx)}>
                    <Feather name="x" size={12} color="#FFF" />
                  </TouchableOpacity>
                  {item.type === "video" && (
                    <View style={styles.videoBadge}>
                      <Feather name="video" size={10} color="#FFF" />
                    </View>
                  )}
                </View>
              ))}
              {media.length < 6 && (
                <TouchableOpacity
                  style={[styles.addMoreThumb, { borderColor: colors.border }]}
                  onPress={showMediaOptions}
                >
                  <Feather name="plus" size={24} color={colors.mutedForeground} />
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.mediaPlaceholder, { borderColor: colors.border }]}
              onPress={showMediaOptions}
            >
              <Feather name="camera" size={28} color={colors.mutedForeground} />
              <Text style={[styles.mediaPlaceholderText, { color: colors.mutedForeground }]}>
                Add photos or videos
              </Text>
              <Text style={[styles.mediaPlaceholderSub, { color: colors.mutedForeground }]}>
                Camera or gallery
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: isSaving ? colors.accent : colors.primary }]}
          onPress={handleSave}
          activeOpacity={0.85}
          disabled={isSaving}
        >
          <Feather name={isSaving ? "loader" : "check"} size={18} color="#FFF" />
          <Text style={styles.saveBtnText}>{isSaving ? "Saving..." : "Save Memory"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 16 },
  titleRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  screenTitle: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  dateLabel: { fontSize: 13, marginTop: 2 },
  milestoneShortcut: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, marginTop: 4 },
  milestoneEmoji: { fontSize: 14 },
  milestoneShortcutTxt: { fontSize: 13, fontWeight: "600" },
  card: { borderRadius: 16, padding: 16, gap: 14, shadowColor: "#2D2926", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardLabel: { fontSize: 15, fontWeight: "700" },
  titleInput: { fontSize: 20, fontWeight: "700", minHeight: 40 },
  divider: { height: 1 },
  descInput: { fontSize: 15, lineHeight: 22, minHeight: 100 },
  learnedInput: { fontSize: 15, lineHeight: 22, minHeight: 80 },
  suggestionRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  suggestionLabel: { fontSize: 12, fontWeight: "600" },
  tagGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  mediaHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  mediaActions: { flexDirection: "row", gap: 8 },
  mediaActionBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  mediaActionTxt: { fontSize: 12, fontWeight: "600" },
  mediaGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  mediaThumb: { width: 90, height: 90, borderRadius: 10, overflow: "hidden", position: "relative" },
  thumbImg: { width: "100%", height: "100%" },
  removeBtn: { position: "absolute", top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center" },
  videoBadge: { position: "absolute", bottom: 4, left: 4, backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 6, padding: 4 },
  addMoreThumb: { width: 90, height: 90, borderRadius: 10, borderWidth: 1.5, borderStyle: "dashed", alignItems: "center", justifyContent: "center" },
  mediaPlaceholder: { height: 110, borderRadius: 12, borderWidth: 1.5, borderStyle: "dashed", alignItems: "center", justifyContent: "center", gap: 6 },
  mediaPlaceholderText: { fontSize: 14, fontWeight: "500" },
  mediaPlaceholderSub: { fontSize: 12 },
  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16, borderRadius: 14, marginTop: 4 },
  saveBtnText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
});
