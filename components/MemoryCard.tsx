import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Memory } from "@/contexts/DatabaseContext";
import { useColors } from "@/hooks/useColors";
import { TagChip } from "./TagChip";
import { Feather } from "@expo/vector-icons";

function formatDate(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getMoodEmoji(mood: number): string {
  const emojis: Record<number, string> = {
    0: "😢", 1: "😞", 2: "😔", 3: "😕", 4: "😐",
    5: "🙂", 6: "😊", 7: "😄", 8: "😁", 9: "🥰", 10: "🤩",
  };
  return emojis[mood] ?? "🙂";
}

interface MemoryCardProps {
  memory: Memory;
  onFavoritePress?: () => void;
  compact?: boolean;
}

export function MemoryCard({ memory, onFavoritePress, compact }: MemoryCardProps) {
  const colors = useColors();
  const router = useRouter();

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card }]}
      activeOpacity={0.85}
      onPress={() => router.push({ pathname: "/memory/[id]", params: { id: memory.id } })}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={[styles.emoji]}>{getMoodEmoji(memory.mood)}</Text>
          <View style={styles.titleBlock}>
            <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
              {memory.title}
            </Text>
            <Text style={[styles.date, { color: colors.mutedForeground }]}>
              {formatDate(memory.date)}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={onFavoritePress} hitSlop={8} style={styles.starBtn}>
          <Feather
            name={memory.isFavorite ? "star" : "star"}
            size={18}
            color={memory.isFavorite ? "#FFD66B" : colors.border}
          />
        </TouchableOpacity>
      </View>

      {!compact && memory.description ? (
        <Text style={[styles.description, { color: colors.mutedForeground }]} numberOfLines={2}>
          {memory.description}
        </Text>
      ) : null}

      {memory.tags.length > 0 && (
        <View style={styles.tags}>
          {memory.tags.slice(0, 3).map((t) => (
            <TagChip key={t} tag={t} small />
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    gap: 10,
    shadowColor: "#2D2926",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 10,
  },
  emoji: {
    fontSize: 24,
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
  },
  date: {
    fontSize: 12,
    marginTop: 2,
  },
  starBtn: {
    padding: 4,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
});
