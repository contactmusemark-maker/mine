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
import { MILESTONE_TYPES, useDatabase } from "@/contexts/DatabaseContext";
import { useColors } from "@/hooks/useColors";
import { saveMediaFile } from "@/services/storage";
import { Feather } from "@expo/vector-icons";

export default function AddMilestoneScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addMilestone } = useDatabase();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [selectedType, setSelectedType] = useState(MILESTONE_TYPES[0].key);
  const [note, setNote] = useState("");
  const [imagePath, setImagePath] = useState<string | null>(null);
  const [date, setDate] = useState(new Date());
  const [saving, setSaving] = useState(false);

  const selectedTypeInfo = MILESTONE_TYPES.find((t) => t.key === selectedType)!;

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
      aspect: [4, 3],
    });
    if (!result.canceled) {
      setImagePath(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const res = await ImagePicker.requestCameraPermissionsAsync();
    if (!res.granted) {
      Alert.alert("Permission needed", "Allow camera access to take a photo.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.85,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!result.canceled) {
      setImagePath(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("Missing title", "Give this milestone a name.");
      return;
    }
    setSaving(true);
    try {
      let savedImagePath: string | undefined;
      if (imagePath) {
        savedImagePath = await saveMediaFile(imagePath, "image");
      }
      await addMilestone({
        title: title.trim(),
        eventType: selectedType,
        date: date.getTime(),
        note: note.trim(),
        imagePath: savedImagePath,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      Alert.alert("Error", "Could not save milestone.");
    } finally {
      setSaving(false);
    }
  };

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.heroEmoji}>
          <Text style={styles.bigEmoji}>{selectedTypeInfo.emoji}</Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.label, { color: colors.text }]}>Event Type</Text>
          <View style={styles.typeGrid}>
            {MILESTONE_TYPES.map((t) => (
              <TouchableOpacity
                key={t.key}
                style={[
                  styles.typeChip,
                  {
                    backgroundColor:
                      selectedType === t.key ? colors.primary : colors.secondary,
                  },
                ]}
                onPress={() => {
                  setSelectedType(t.key);
                  if (!title) setTitle(t.label);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.typeEmoji}>{t.emoji}</Text>
                <Text
                  style={[
                    styles.typeLabel,
                    { color: selectedType === t.key ? "#FFF" : colors.text },
                  ]}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <TextInput
            style={[styles.titleInput, { color: colors.text }]}
            placeholder="Give it a name..."
            placeholderTextColor={colors.mutedForeground}
            value={title}
            onChangeText={setTitle}
          />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <TextInput
            style={[styles.noteInput, { color: colors.text }]}
            placeholder="Add a note about this moment..."
            placeholderTextColor={colors.mutedForeground}
            value={note}
            onChangeText={setNote}
            multiline
            textAlignVertical="top"
          />
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.label, { color: colors.text }]}>Date</Text>
          <Text style={[styles.dateDisplay, { color: colors.primary }]}>
            {date.toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </Text>
          <View style={styles.dateButtons}>
            <TouchableOpacity
              style={[styles.dateBtn, { backgroundColor: colors.secondary }]}
              onPress={() => {
                const d = new Date(date);
                d.setDate(d.getDate() - 1);
                setDate(d);
              }}
            >
              <Feather name="chevron-left" size={16} color={colors.primary} />
              <Text style={[styles.dateBtnText, { color: colors.primary }]}>Prev</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dateBtn, { backgroundColor: colors.secondary }]}
              onPress={() => setDate(new Date())}
            >
              <Text style={[styles.dateBtnText, { color: colors.primary }]}>Today</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.dateBtn, { backgroundColor: colors.secondary }]}
              onPress={() => {
                const d = new Date(date);
                d.setDate(d.getDate() + 1);
                setDate(d);
              }}
            >
              <Text style={[styles.dateBtnText, { color: colors.primary }]}>Next</Text>
              <Feather name="chevron-right" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.label, { color: colors.text }]}>Photo</Text>
          {imagePath ? (
            <View>
              <Image
                source={{ uri: imagePath }}
                style={styles.previewImage}
                contentFit="cover"
              />
              <TouchableOpacity
                style={[styles.removePhotoBtn, { backgroundColor: colors.destructive }]}
                onPress={() => setImagePath(null)}
              >
                <Feather name="x" size={14} color="#FFF" />
                <Text style={styles.removePhotoText}>Remove</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.photoButtons}>
              <TouchableOpacity
                style={[styles.photoBtn, { backgroundColor: colors.secondary }]}
                onPress={pickImage}
              >
                <Feather name="image" size={20} color={colors.primary} />
                <Text style={[styles.photoBtnText, { color: colors.primary }]}>
                  Gallery
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.photoBtn, { backgroundColor: colors.secondary }]}
                onPress={takePhoto}
              >
                <Feather name="camera" size={20} color={colors.primary} />
                <Text style={[styles.photoBtnText, { color: colors.primary }]}>
                  Camera
                </Text>
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
          <Text style={styles.saveBtnText}>
            {saving ? "Saving..." : `Save ${selectedTypeInfo.emoji}`}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16, gap: 16 },
  heroEmoji: { alignItems: "center", paddingVertical: 8 },
  bigEmoji: { fontSize: 56 },
  card: {
    borderRadius: 16,
    padding: 16,
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  label: { fontSize: 15, fontWeight: "700" },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  typeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  typeEmoji: { fontSize: 16 },
  typeLabel: { fontSize: 13, fontWeight: "600" },
  titleInput: { fontSize: 20, fontWeight: "700", minHeight: 40 },
  divider: { height: 1 },
  noteInput: { fontSize: 15, lineHeight: 22, minHeight: 80 },
  dateDisplay: { fontSize: 16, fontWeight: "600" },
  dateButtons: { flexDirection: "row", gap: 8 },
  dateBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 10,
    borderRadius: 10,
  },
  dateBtnText: { fontSize: 13, fontWeight: "600" },
  photoButtons: { flexDirection: "row", gap: 12 },
  photoBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  photoBtnText: { fontSize: 15, fontWeight: "600" },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
  },
  removePhotoBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 8,
    paddingVertical: 10,
    borderRadius: 10,
  },
  removePhotoText: { color: "#FFF", fontSize: 13, fontWeight: "600" },
  saveBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  saveBtnText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
});
