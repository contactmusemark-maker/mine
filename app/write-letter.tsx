import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
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
import { Letter, LETTER_MOODS, useDatabase } from "@/contexts/DatabaseContext";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";

const PROMPTS = [
  "There's something I never told you…",
  "I miss you most when…",
  "What I'm grateful for is…",
  "I'm angry because…",
  "I want you to know that…",
  "If I could have one more moment with you, I'd…",
  "The last thing I want to say is…",
];

export default function WriteLetterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const { letters, addLetter, updateLetter } = useDatabase();

  const editing = editId ? letters.find((l) => l.id === editId) : null;

  const [title, setTitle] = useState(editing?.title ?? "");
  const [body, setBody] = useState(editing?.body ?? "");
  const [mood, setMood] = useState<Letter["mood"]>(editing?.mood ?? "missing");
  const [saving, setSaving] = useState(false);

  const prompt = PROMPTS[new Date().getDay() % PROMPTS.length];
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleSave = async () => {
    if (!body.trim()) {
      Alert.alert("Empty letter", "Write something — even just a few words.");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateLetter(editing.id, { title: title.trim(), body: body.trim(), mood });
      } else {
        await addLetter({ title: title.trim(), body: body.trim(), mood });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      Alert.alert("Error", "Could not save your letter.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 60 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* To / date header */}
        <View style={[styles.envelope, { backgroundColor: "#FFFBF5", borderColor: "#E8DCC8" }]}>
          <View style={styles.envelopeRow}>
            <Text style={[styles.envLabel, { color: colors.mutedForeground }]}>To</Text>
            <Text style={[styles.envTo, { color: colors.primary }]}>Ammu 💕</Text>
          </View>
          <View style={[styles.envDivider, { backgroundColor: "#E8DCC8" }]} />
          <View style={styles.envelopeRow}>
            <Text style={[styles.envLabel, { color: colors.mutedForeground }]}>Date</Text>
            <Text style={[styles.envDate, { color: colors.mutedForeground }]}>
              {new Date().toLocaleDateString("en-US", { weekday: "short", month: "long", day: "numeric", year: "numeric" })}
            </Text>
          </View>
        </View>

        {/* Subject */}
        <View style={[styles.field, { backgroundColor: colors.card }]}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Subject</Text>
          <TextInput
            style={[styles.fieldInput, { color: colors.text }]}
            placeholder="What's this about? (optional)"
            placeholderTextColor={colors.mutedForeground}
            value={title}
            onChangeText={setTitle}
            returnKeyType="next"
          />
        </View>

        {/* Feeling */}
        <View style={[styles.field, { backgroundColor: colors.card }]}>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Feeling</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.moodScroll}>
            {LETTER_MOODS.map((m) => (
              <TouchableOpacity
                key={m.key}
                onPress={() => setMood(m.key)}
                style={[
                  styles.moodPill,
                  mood === m.key
                    ? { backgroundColor: m.color }
                    : { backgroundColor: colors.secondary },
                ]}
              >
                <Text style={styles.moodPillEmoji}>{m.emoji}</Text>
                <Text style={[styles.moodPillLabel, { color: mood === m.key ? "#FFF" : colors.mutedForeground }]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Prompt */}
        {!editing && !body && (
          <TouchableOpacity
            style={[styles.promptRow, { backgroundColor: colors.secondary }]}
            onPress={() => setBody(prompt)}
          >
            <Feather name="zap" size={13} color={colors.primary} />
            <Text style={[styles.promptText, { color: colors.text }]}>
              <Text style={{ color: colors.primary, fontWeight: "700" }}>Prompt: </Text>
              {prompt}
            </Text>
          </TouchableOpacity>
        )}

        {/* Body */}
        <TextInput
          style={[styles.bodyInput, { color: colors.text, backgroundColor: "#FFFBF5", borderColor: "#E8DCC8" }]}
          placeholder={"Write whatever's on your heart…\n\nShe deserves to know, even now."}
          placeholderTextColor={colors.mutedForeground}
          value={body}
          onChangeText={setBody}
          multiline
          textAlignVertical="top"
          autoFocus={!body}
        />

        {/* Closing */}
        <View style={[styles.closing, { backgroundColor: "#FFFBF5", borderColor: "#E8DCC8" }]}>
          <Text style={[styles.closingLine, { color: colors.mutedForeground }]}>With all my love,</Text>
          <Text style={[styles.closingName, { color: colors.navy }]}>Always yours 💕</Text>
        </View>

        {/* Save */}
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: saving ? colors.accent : colors.primary }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          <Feather name={editing ? "check" : "send"} size={16} color="#FFF" />
          <Text style={styles.saveBtnTxt}>{saving ? "Saving…" : editing ? "Save Changes" : "Save Letter"}</Text>
        </TouchableOpacity>

        <Text style={[styles.privacy, { color: colors.mutedForeground }]}>
          🔒 Private — stays only on your device
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16, gap: 14 },
  envelope: {
    borderRadius: 14, borderWidth: 1, padding: 14, gap: 10,
  },
  envelopeRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  envLabel: { fontSize: 12, fontWeight: "600", width: 40 },
  envTo: { fontSize: 18, fontWeight: "800", fontStyle: "italic" },
  envDate: { fontSize: 13 },
  envDivider: { height: 1 },
  field: {
    borderRadius: 14, padding: 14, gap: 8,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  fieldLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  fieldInput: { fontSize: 15, paddingVertical: 2 },
  moodScroll: { marginHorizontal: -2 },
  moodPill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, marginRight: 8,
  },
  moodPillEmoji: { fontSize: 15 },
  moodPillLabel: { fontSize: 12, fontWeight: "600" },
  promptRow: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    padding: 12, borderRadius: 12,
  },
  promptText: { flex: 1, fontSize: 13, lineHeight: 19 },
  bodyInput: {
    borderRadius: 14, borderWidth: 1, padding: 16,
    fontSize: 16, lineHeight: 26, minHeight: 240,
    fontStyle: "italic",
  },
  closing: {
    borderRadius: 14, borderWidth: 1, padding: 14,
    alignItems: "flex-end", gap: 3,
  },
  closingLine: { fontSize: 13, fontStyle: "italic" },
  closingName: { fontSize: 16, fontWeight: "700", fontStyle: "italic" },
  saveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 15, borderRadius: 14,
  },
  saveBtnTxt: { color: "#FFF", fontSize: 15, fontWeight: "700" },
  privacy: { fontSize: 12, textAlign: "center" },
});
