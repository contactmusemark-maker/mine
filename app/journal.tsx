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
import { useDatabase } from "@/contexts/DatabaseContext";
import { useColors } from "@/hooks/useColors";
import { saveMediaFile } from "@/services/storage";
import { Feather } from "@expo/vector-icons";

export default function JournalScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addJournal } = useDatabase();
  const router = useRouter();

  const [content, setContent] = useState("");
  const [mood, setMood] = useState(5);
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [date] = useState(new Date());

  const pickImage = async () => {
    const res = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!res.granted) {
      Alert.alert("Permission needed", "Allow photo access to add a photo.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
      allowsEditing: true,
    });
    if (!result.canceled) {
      setImagePath(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const res = await ImagePicker.requestCameraPermissionsAsync();
    if (!res.granted) {
      Alert.alert("Permission needed", "Allow camera access.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.85,
      allowsEditing: true,
    });
    if (!result.canceled) {
      setImagePath(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!content.trim()) {
      Alert.alert("Empty", "Write something first.");
      return;
    }
    setSaving(true);
    try {
      let savedImagePath: string | undefined;
      if (imagePath) {
        savedImagePath = await saveMediaFile(imagePath, "image");
      }
      await addJournal({
        content: content.trim(),
        mood,
        date: date.getTime(),
        imagePath: savedImagePath,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      Alert.alert("Error", "Could not save your journal entry.");
    } finally {
      setSaving(false);
    }
  };

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.dateLabel, { color: colors.mutedForeground }]}>
          {date.toLocaleDateString("en-US", {
            weekday: "long", month: "long", day: "numeric", year: "numeric",
          })}
        </Text>

        <View style={[styles.moodCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.moodLabel, { color: colors.text }]}>How are you feeling?</Text>
          <MoodSlider value={mood} onValueChange={setMood} />
        </View>

        <TextInput
          style={[styles.editor, { color: colors.text, backgroundColor: colors.card }]}
          placeholder="Write freely... this is your space. No judgment, just honesty."
          placeholderTextColor={colors.mutedForeground}
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
          autoFocus
        />

        <View style={[styles.photoSection, { backgroundColor: colors.card }]}>
          <Text style={[styles.photoLabel, { color: colors.text }]}>Add a photo to this entry</Text>
          {imagePath ? (
            <View>
              <Image source={{ uri: imagePath }} style={styles.previewImg} contentFit="cover" />
              <TouchableOpacity
                style={[styles.removeBtn, { backgroundColor: colors.destructive }]}
                onPress={() => setImagePath(null)}
              >
                <Feather name="x" size={14} color="#FFF" />
                <Text style={styles.removeTxt}>Remove photo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.photoButtons}>
              <TouchableOpacity
                style={[styles.photoBtn, { backgroundColor: colors.secondary }]}
                onPress={pickImage}
              >
                <Feather name="image" size={18} color={colors.primary} />
                <Text style={[styles.photoBtnTxt, { color: colors.primary }]}>Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.photoBtn, { backgroundColor: colors.secondary }]}
                onPress={takePhoto}
              >
                <Feather name="camera" size={18} color={colors.primary} />
                <Text style={[styles.photoBtnTxt, { color: colors.primary }]}>Camera</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: saving ? colors.accent : colors.primary }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          <Feather name="check" size={18} color="#FFF" />
          <Text style={styles.saveBtnText}>{saving ? "Saving..." : "Save Entry"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16, gap: 16 },
  dateLabel: { fontSize: 14 },
  moodCard: { borderRadius: 16, padding: 18, gap: 14, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  moodLabel: { fontSize: 16, fontWeight: "700" },
  editor: { borderRadius: 16, padding: 18, fontSize: 17, lineHeight: 28, minHeight: 220, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  photoSection: { borderRadius: 16, padding: 16, gap: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  photoLabel: { fontSize: 14, fontWeight: "600" },
  photoButtons: { flexDirection: "row", gap: 12 },
  photoBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 12 },
  photoBtnTxt: { fontSize: 14, fontWeight: "600" },
  previewImg: { width: "100%", height: 180, borderRadius: 12 },
  removeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 8, paddingVertical: 10, borderRadius: 10 },
  removeTxt: { color: "#FFF", fontSize: 13, fontWeight: "600" },
  saveBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16, borderRadius: 14 },
  saveBtnText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
});
