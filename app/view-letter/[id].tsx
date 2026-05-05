import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
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
import { LETTER_MOODS, useDatabase } from "@/contexts/DatabaseContext";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";

export default function ViewLetterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { letters, deleteLetter } = useDatabase();

  const letter = letters.find((l) => l.id === id);

  if (!letter) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.mutedForeground }}>Letter not found.</Text>
      </View>
    );
  }

  const moodInfo = LETTER_MOODS.find((m) => m.key === letter.mood) ?? LETTER_MOODS[0];
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleDelete = () => {
    Alert.alert(
      "Delete Letter",
      "Are you sure? This letter will be gone forever.",
      [
        { text: "Keep it", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteLetter(letter.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            router.back();
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Immersive header */}
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 10, backgroundColor: moodInfo.color + "18" },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Feather name="arrow-left" size={22} color={colors.navy} />
        </TouchableOpacity>
        <View style={[styles.moodBadge, { backgroundColor: moodInfo.color }]}>
          <Text style={styles.moodEmoji}>{moodInfo.emoji}</Text>
          <Text style={styles.moodLabel}>{moodInfo.label}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => router.push(`/write-letter?editId=${letter.id}`)}
            hitSlop={12}
            style={[styles.actionBtn, { backgroundColor: colors.secondary }]}
          >
            <Feather name="edit-2" size={16} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDelete}
            hitSlop={12}
            style={[styles.actionBtn, { backgroundColor: colors.destructive + "18" }]}
          >
            <Feather name="trash-2" size={16} color={colors.destructive} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Envelope paper */}
        <View style={[styles.paper, { backgroundColor: "#FFFBF5", borderColor: "#E8DCC8" }]}>
          {/* Ruled lines in background */}
          <View style={styles.ruledLines}>
            {[...Array(20)].map((_, i) => (
              <View key={i} style={[styles.ruledLine, { backgroundColor: "#E8DCC820" }]} />
            ))}
          </View>

          {/* Header */}
          <View style={styles.paperHeader}>
            <View>
              <Text style={[styles.toLabel, { color: colors.mutedForeground }]}>To,</Text>
              <Text style={[styles.toName, { color: colors.primary }]}>Ammu 💕</Text>
            </View>
            <Text style={[styles.dateText, { color: colors.mutedForeground }]}>
              {new Date(letter.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: "#E8DCC8" }]} />

          {/* Subject */}
          {letter.title ? (
            <Text style={[styles.subject, { color: colors.navy }]}>
              Re: {letter.title}
            </Text>
          ) : null}

          {/* Body */}
          <Text style={[styles.body, { color: colors.text }]}>{letter.body}</Text>

          <View style={[styles.divider, { backgroundColor: "#E8DCC8" }]} />

          {/* Closing */}
          <View style={styles.closing}>
            <Text style={[styles.closingLine, { color: colors.mutedForeground }]}>
              With all my love,
            </Text>
            <Text style={[styles.closingSignature, { color: colors.navy }]}>
              Always yours 💕
            </Text>
          </View>

          {/* Updated note */}
          {letter.updatedAt !== letter.createdAt && (
            <Text style={[styles.editedNote, { color: colors.mutedForeground }]}>
              (edited {new Date(letter.updatedAt).toLocaleDateString()})
            </Text>
          )}
        </View>

        {/* Stamp decoration */}
        <View style={styles.stampRow}>
          <View style={[styles.stamp, { borderColor: moodInfo.color + "60" }]}>
            <Text style={styles.stampEmoji}>{moodInfo.emoji}</Text>
            <Text style={[styles.stampText, { color: moodInfo.color }]}>
              {moodInfo.label.toUpperCase()}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  moodBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
  },
  moodEmoji: { fontSize: 16 },
  moodLabel: { color: "#FFF", fontSize: 12, fontWeight: "700" },
  headerActions: { flexDirection: "row", gap: 8 },
  actionBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  content: { paddingHorizontal: 20, paddingTop: 20, gap: 16 },
  paper: {
    borderRadius: 20, borderWidth: 1, padding: 24, gap: 16,
    shadowColor: "#8B6914", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 12, elevation: 3,
    overflow: "hidden",
  },
  ruledLines: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    paddingTop: 120, gap: 30, paddingHorizontal: 24,
  },
  ruledLine: { height: 1 },
  paperHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  toLabel: { fontSize: 13, fontStyle: "italic" },
  toName: { fontSize: 22, fontWeight: "800", fontStyle: "italic" },
  dateText: { fontSize: 12, marginTop: 4 },
  divider: { height: 1 },
  subject: { fontSize: 15, fontWeight: "700", fontStyle: "italic" },
  body: { fontSize: 17, lineHeight: 30, fontStyle: "italic", letterSpacing: 0.2 },
  closing: { alignItems: "flex-end", gap: 4 },
  closingLine: { fontSize: 14, fontStyle: "italic" },
  closingSignature: { fontSize: 18, fontWeight: "700", fontStyle: "italic" },
  editedNote: { fontSize: 11, textAlign: "center" },
  stampRow: { alignItems: "flex-end", paddingRight: 8 },
  stamp: {
    borderWidth: 2, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
    alignItems: "center", gap: 2, borderStyle: "dashed",
  },
  stampEmoji: { fontSize: 20 },
  stampText: { fontSize: 9, fontWeight: "800", letterSpacing: 1 },
});
