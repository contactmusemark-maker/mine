import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React from "react";
import {
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Letter, LETTER_MOODS, useDatabase } from "@/contexts/DatabaseContext";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
}

function getMood(mood: Letter["mood"]) {
  return LETTER_MOODS.find((m) => m.key === mood) ?? LETTER_MOODS[0];
}

function LetterCard({ letter, onPress, onDelete }: {
  letter: Letter;
  onPress: () => void;
  onDelete: () => void;
}) {
  const colors = useColors();
  const info = getMood(letter.mood);
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[styles.cardStripe, { backgroundColor: info.color }]} />
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <Text style={styles.cardEmoji}>{info.emoji}</Text>
          <View style={styles.cardMid}>
            <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>
              {letter.title || "Untitled"}
            </Text>
            <Text style={[styles.cardPreview, { color: colors.mutedForeground }]} numberOfLines={2}>
              {letter.body}
            </Text>
          </View>
          <TouchableOpacity onPress={onDelete} hitSlop={12}>
            <Feather name="trash-2" size={14} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
        <View style={styles.cardFooter}>
          <View style={[styles.moodTag, { backgroundColor: info.color + "18" }]}>
            <Text style={[styles.moodTagText, { color: info.color }]}>{info.label}</Text>
          </View>
          <Text style={[styles.cardDate, { color: colors.mutedForeground }]}>{formatDate(letter.createdAt)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function LettersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { letters, deleteLetter } = useDatabase();
  const router = useRouter();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const confirmDelete = (letter: Letter) => {
    Alert.alert(
      "Delete Letter",
      `Delete "${letter.title || "this letter"}"?`,
      [
        { text: "Keep it", style: "cancel" },
        {
          text: "Delete", style: "destructive",
          onPress: async () => {
            await deleteLetter(letter.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <View style={styles.titleRow}>
          <View>
            <Text style={[styles.title, { color: colors.navy }]}>Letters to Her</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Words you never got to send
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.writeBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/write-letter")}
          >
            <Feather name="edit-2" size={14} color="#FFF" />
            <Text style={styles.writeBtnTxt}>Write</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={letters}
        keyExtractor={(l) => l.id}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: bottomPad + 80 },
          letters.length === 0 && styles.listEmpty,
        ]}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => (
          <LetterCard
            letter={item}
            onPress={() => router.push(`/view-letter/${item.id}`)}
            onDelete={() => confirmDelete(item)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>✉️</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No letters yet</Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              Sometimes the things we never said{"\n"}need a place to live.
            </Text>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/write-letter")}
            >
              <Feather name="edit-2" size={15} color="#FFF" />
              <Text style={styles.emptyBtnTxt}>Write Your First Letter</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16 },
  titleRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  title: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  subtitle: { fontSize: 13, marginTop: 3 },
  writeBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, marginTop: 4,
  },
  writeBtnTxt: { color: "#FFF", fontSize: 13, fontWeight: "700" },
  list: { paddingHorizontal: 20, paddingTop: 4 },
  listEmpty: { flex: 1 },

  card: {
    borderRadius: 16, flexDirection: "row", overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
  cardStripe: { width: 4 },
  cardBody: { flex: 1, padding: 14, gap: 8 },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  cardEmoji: { fontSize: 20, marginTop: 1 },
  cardMid: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: "700", marginBottom: 3 },
  cardPreview: { fontSize: 13, lineHeight: 18 },
  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  moodTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  moodTagText: { fontSize: 11, fontWeight: "600" },
  cardDate: { fontSize: 11 },

  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingTop: 60 },
  emptyIcon: { fontSize: 52 },
  emptyTitle: { fontSize: 19, fontWeight: "700" },
  emptySub: { fontSize: 14, textAlign: "center", lineHeight: 21 },
  emptyBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 22, paddingVertical: 13, borderRadius: 14, marginTop: 6,
  },
  emptyBtnTxt: { color: "#FFF", fontSize: 14, fontWeight: "700" },
});
