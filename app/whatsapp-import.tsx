import AsyncStorage from "@react-native-async-storage/async-storage";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { parseWhatsAppChat } from "@/services/whatsappParser";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";

const WA_KEY = "@me_ammu/whatsapp_messages";
const WA_META_KEY = "@me_ammu/whatsapp_meta";

const STEPS = [
  { emoji: "1️⃣", text: 'Open WhatsApp and go to her chat' },
  { emoji: "2️⃣", text: 'Tap her name at top → More → Export Chat' },
  { emoji: "3️⃣", text: 'Choose "Without Media" and save the .txt file' },
  { emoji: "4️⃣", text: 'Come back here and tap "Choose File" below' },
];

export default function WhatsAppImportScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [myName, setMyName] = useState("Me");
  const [status, setStatus] = useState<"idle" | "parsing" | "done" | "error">("idle");
  const [result, setResult] = useState<{ count: number; herName: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const pickAndImport = async () => {
    try {
      setStatus("parsing");
      setErrorMsg("");

      // On web, show instructions since DocumentPicker works differently
      if (Platform.OS === "web") {
        // Use a file input element on web
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".txt";
        input.onchange = async (e: any) => {
          const file = e.target.files?.[0];
          if (!file) { setStatus("idle"); return; }
          const text = await file.text();
          await processText(text);
        };
        input.click();
        return;
      }

      const result = await DocumentPicker.getDocumentAsync({
        type: ["text/plain", "text/*", "*/*"],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        setStatus("idle");
        return;
      }

      const file = result.assets[0];
      const text = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      await processText(text);
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err?.message ?? "Could not read file. Make sure it's a WhatsApp .txt export.");
    }
  };

  const processText = async (text: string) => {
    try {
      const parsed = parseWhatsAppChat(text, myName.trim() || "Me");

      if (parsed.messages.length === 0) {
        setStatus("error");
        setErrorMsg("No messages found. Make sure this is a WhatsApp chat export (.txt file).");
        return;
      }

      // Store messages in chunks to avoid AsyncStorage size limits
      await Promise.all([
        AsyncStorage.setItem(WA_KEY, JSON.stringify(parsed.messages)),
        AsyncStorage.setItem(WA_META_KEY, JSON.stringify({
          herName: parsed.herName,
          myName: parsed.myName,
          importedAt: Date.now(),
          totalCount: parsed.messages.length,
        })),
      ]);

      setResult({ count: parsed.messages.length, herName: parsed.herName });
      setStatus("done");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err?.message ?? "Failed to parse the chat file.");
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 40 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <Text style={styles.heroEmoji}>💬</Text>
        <Text style={[styles.heroTitle, { color: colors.navy }]}>Import Her Messages</Text>
        <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>
          Read your WhatsApp conversation with her anytime, privately.
        </Text>
      </View>

      {status === "done" && result ? (
        <View style={[styles.successCard, { backgroundColor: "#e8f8ef" }]}>
          <Text style={styles.successEmoji}>✅</Text>
          <Text style={[styles.successTitle, { color: "#166534" }]}>
            {result.count.toLocaleString()} messages imported
          </Text>
          <Text style={[styles.successSub, { color: "#15803d" }]}>
            From your chat with {result.herName}
          </Text>
          <TouchableOpacity
            style={[styles.viewBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/whatsapp-chat")}
          >
            <Feather name="message-circle" size={16} color="#FFF" />
            <Text style={styles.viewBtnTxt}>Read Her Messages</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.reimportBtn, { borderColor: colors.border }]}
            onPress={() => { setStatus("idle"); setResult(null); }}
          >
            <Text style={[styles.reimportTxt, { color: colors.mutedForeground }]}>Import a different file</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>How to export from WhatsApp</Text>
            <View style={styles.steps}>
              {STEPS.map((step, i) => (
                <View key={i} style={styles.step}>
                  <Text style={styles.stepEmoji}>{step.emoji}</Text>
                  <Text style={[styles.stepText, { color: colors.text }]}>{step.text}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Your name in the chat</Text>
            <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
              Enter exactly how your name appears in the chat (so messages are assigned correctly)
            </Text>
            <TextInput
              style={[styles.nameInput, { color: colors.text, backgroundColor: colors.secondary, borderColor: colors.border }]}
              value={myName}
              onChangeText={setMyName}
              placeholder="Your name in WhatsApp…"
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize="words"
            />
          </View>

          {status === "error" && (
            <View style={[styles.errorCard, { backgroundColor: "#FEF2F2" }]}>
              <Feather name="alert-circle" size={16} color="#DC2626" />
              <Text style={[styles.errorText, { color: "#DC2626" }]}>{errorMsg}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.importBtn,
              { backgroundColor: status === "parsing" ? colors.accent : colors.primary },
            ]}
            onPress={pickAndImport}
            disabled={status === "parsing"}
            activeOpacity={0.85}
          >
            <Feather name={status === "parsing" ? "loader" : "upload"} size={18} color="#FFF" />
            <Text style={styles.importBtnTxt}>
              {status === "parsing" ? "Reading file…" : "Choose WhatsApp .txt File"}
            </Text>
          </TouchableOpacity>

          <Text style={[styles.privacy, { color: colors.mutedForeground }]}>
            🔒 Everything stays on your device. Nothing is uploaded anywhere.
          </Text>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 16, gap: 20 },
  hero: { alignItems: "center", gap: 8, paddingVertical: 8 },
  heroEmoji: { fontSize: 52 },
  heroTitle: { fontSize: 24, fontWeight: "800" },
  heroSub: { fontSize: 14, textAlign: "center", lineHeight: 20, paddingHorizontal: 20 },
  card: {
    borderRadius: 16, padding: 18, gap: 14,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },
  cardTitle: { fontSize: 15, fontWeight: "700" },
  cardSub: { fontSize: 13, lineHeight: 19 },
  steps: { gap: 12 },
  step: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  stepEmoji: { fontSize: 18, width: 26 },
  stepText: { flex: 1, fontSize: 14, lineHeight: 20 },
  nameInput: {
    borderRadius: 10, borderWidth: 1, paddingHorizontal: 14,
    paddingVertical: 12, fontSize: 15,
  },
  errorCard: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    borderRadius: 12, padding: 14,
  },
  errorText: { flex: 1, fontSize: 14, lineHeight: 20 },
  importBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, paddingVertical: 16, borderRadius: 14,
  },
  importBtnTxt: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  privacy: { fontSize: 12, textAlign: "center" },
  successCard: {
    borderRadius: 20, padding: 24, alignItems: "center", gap: 10,
  },
  successEmoji: { fontSize: 40 },
  successTitle: { fontSize: 18, fontWeight: "800" },
  successSub: { fontSize: 14 },
  viewBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14, marginTop: 8,
  },
  viewBtnTxt: { color: "#FFF", fontSize: 15, fontWeight: "700" },
  reimportBtn: {
    paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10, borderWidth: 1,
  },
  reimportTxt: { fontSize: 13 },
});
