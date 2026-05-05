import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActionSheetIOS,
  Alert,
  Dimensions,
  Platform,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnimatedFadeIn } from "@/components/AnimatedFadeIn";
import { MemoryCard } from "@/components/MemoryCard";
import {
  Memory,
  JournalEntry,
  Milestone,
  MILESTONE_TYPES,
  useDatabase,
} from "@/contexts/DatabaseContext";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";

type TimelineItem =
  | { kind: "memory"; data: Memory }
  | { kind: "journal"; data: JournalEntry }
  | { kind: "milestone"; data: Milestone };

type Filter = "all" | "memories" | "journals" | "milestones";

const { width } = Dimensions.get("window");

function getMonthKey(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}
function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function getMilestoneInfo(k: string) {
  return MILESTONE_TYPES.find((t) => t.key === k) ?? { emoji: "💕", label: "Milestone" };
}

const MOOD_EMOJI: Record<number, string> = {
  0:"😢",1:"😞",2:"😔",3:"😕",4:"😐",5:"🙂",6:"😊",7:"😄",8:"😁",9:"🥰",10:"🤩",
};

/* ─── Milestone Card ─── */
function MilestoneItem({ m, onDelete }: { m: Milestone; onDelete: () => void }) {
  const colors = useColors();
  const info = getMilestoneInfo(m.eventType);
  return (
    <View style={[ms.card, { backgroundColor: colors.card }]}>
      <View style={ms.row}>
        <View style={[ms.iconWrap, { backgroundColor: colors.primary + "15" }]}>
          <Text style={ms.icon}>{info.emoji}</Text>
        </View>
        <View style={ms.body}>
          <Text style={[ms.type, { color: colors.primary }]}>{info.label.toUpperCase()}</Text>
          <Text style={[ms.title, { color: colors.navy }]}>{m.title}</Text>
          <Text style={[ms.date, { color: colors.mutedForeground }]}>{formatDate(m.date)}</Text>
          {m.note ? <Text style={[ms.note, { color: colors.text }]} numberOfLines={2}>{m.note}</Text> : null}
        </View>
        <TouchableOpacity onPress={onDelete} hitSlop={10}>
          <Feather name="trash-2" size={14} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>
      {m.imagePath ? (
        <Image source={{ uri: m.imagePath }} style={ms.img} contentFit="cover" transition={300} />
      ) : null}
    </View>
  );
}

const ms = StyleSheet.create({
  card: {
    borderRadius: 18, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  row: { flexDirection: "row", alignItems: "flex-start", padding: 16, gap: 14 },
  iconWrap: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  icon: { fontSize: 26 },
  body: { flex: 1, gap: 2 },
  type: { fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  title: { fontSize: 17, fontWeight: "700", marginTop: 1 },
  date: { fontSize: 12, marginTop: 2 },
  note: { fontSize: 13, lineHeight: 18, marginTop: 4 },
  img: { width: "100%", height: 200 },
});

/* ─── Journal Card ─── */
function JournalItem({ j, onEdit, onDelete }: {
  j: JournalEntry; onEdit: () => void; onDelete: () => void;
}) {
  const colors = useColors();
  const handleLongPress = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ["Cancel", "Edit", "Delete"], destructiveButtonIndex: 2, cancelButtonIndex: 0 },
        (i) => { if (i === 1) onEdit(); if (i === 2) onDelete(); }
      );
    } else {
      Alert.alert("Journal Entry", "", [
        { text: "Edit", onPress: onEdit },
        { text: "Delete", style: "destructive", onPress: onDelete },
        { text: "Cancel", style: "cancel" },
      ]);
    }
  };

  return (
    <TouchableOpacity
      onLongPress={handleLongPress}
      delayLongPress={350}
      activeOpacity={0.88}
      style={[jn.card, { backgroundColor: "#FFFBF5", borderColor: "#E8DCC8" }]}
    >
      <View style={jn.header}>
        <View style={jn.meta}>
          <Text style={jn.pen}>✏️</Text>
          <Text style={[jn.label, { color: "#8B6914" }]}>Journal</Text>
          <Text style={[jn.dot, { color: "#C8B97A" }]}>·</Text>
          <Text style={[jn.date, { color: "#8B6914" }]}>{formatDate(j.date)}</Text>
        </View>
        <View style={jn.actions}>
          <Text style={jn.moodEmoji}>{MOOD_EMOJI[j.mood] ?? "🙂"}</Text>
          <TouchableOpacity onPress={onEdit} hitSlop={8} style={jn.iconBtn}>
            <Feather name="edit-2" size={12} color="#8B6914" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onDelete} hitSlop={8} style={[jn.iconBtn, { backgroundColor: "#FEE2E2" }]}>
            <Feather name="trash-2" size={12} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={[jn.rule, { backgroundColor: "#E8DCC8" }]} />
      <Text style={[jn.body, { color: "#3D2C00" }]} numberOfLines={4}>{j.content}</Text>
      {j.imagePath ? (
        <Image source={{ uri: j.imagePath }} style={jn.img} contentFit="cover" transition={300} />
      ) : null}
    </TouchableOpacity>
  );
}

const jn = StyleSheet.create({
  card: {
    borderRadius: 18, borderWidth: 1, overflow: "hidden",
    shadowColor: "#8B6914", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 6, elevation: 2,
  },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 },
  meta: { flexDirection: "row", alignItems: "center", gap: 6 },
  pen: { fontSize: 14 },
  label: { fontSize: 12, fontWeight: "700" },
  dot: { fontSize: 12 },
  date: { fontSize: 12 },
  actions: { flexDirection: "row", alignItems: "center", gap: 6 },
  moodEmoji: { fontSize: 18 },
  iconBtn: { width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#FEF9EC" },
  rule: { height: 1, marginHorizontal: 16 },
  body: { fontSize: 15, lineHeight: 24, fontStyle: "italic", paddingHorizontal: 16, paddingVertical: 12 },
  img: { width: "100%", height: 180 },
});

/* ─── Filter tabs ─── */
const FILTERS: { key: Filter; label: string; emoji: string }[] = [
  { key: "all", label: "All", emoji: "✨" },
  { key: "memories", label: "Memories", emoji: "💭" },
  { key: "journals", label: "Journals", emoji: "✏️" },
  { key: "milestones", label: "Milestones", emoji: "💕" },
];

/* ─── Main ─── */
export default function TimelineScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { memories, journals, milestones, toggleFavorite, deleteMilestone, deleteJournal } = useDatabase();
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const sections = useMemo(() => {
    const items: TimelineItem[] = [];
    if (filter === "all" || filter === "memories") {
      memories.filter((m) => !m.isHidden).forEach((m) => items.push({ kind: "memory", data: m }));
    }
    if (filter === "all" || filter === "journals") {
      journals.forEach((j) => items.push({ kind: "journal", data: j }));
    }
    if (filter === "all" || filter === "milestones") {
      milestones.forEach((m) => items.push({ kind: "milestone", data: m }));
    }
    items.sort((a, b) => b.data.date - a.data.date);

    const map = new Map<string, TimelineItem[]>();
    for (const item of items) {
      const key = getMonthKey(item.data.date);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return Array.from(map.entries()).map(([title, data]) => ({ title, data }));
  }, [memories, journals, milestones, filter]);

  const totalItems = sections.reduce((s, sec) => s + sec.data.length, 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 16 }]}>
        <View style={styles.titleRow}>
          <View>
            <Text style={[styles.title, { color: colors.navy }]}>Our Story</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {totalItems} {totalItems === 1 ? "memory" : "memories"} together
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/add-milestone")}
          >
            <Feather name="plus" size={16} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Filter pills */}
        <View style={styles.filterRow}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[
                styles.filterPill,
                filter === f.key
                  ? { backgroundColor: colors.navy }
                  : { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
              ]}
            >
              <Text style={styles.filterEmoji}>{f.emoji}</Text>
              <Text style={[styles.filterLabel, { color: filter === f.key ? "#FFF" : colors.mutedForeground }]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item, i) => item.data.id + i}
        contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 90 }]}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <View style={styles.monthRow}>
            <View style={[styles.monthDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.monthText, { color: colors.mutedForeground }]}>
              {section.title.toUpperCase()}
            </Text>
            <View style={[styles.monthLine, { backgroundColor: colors.border }]} />
          </View>
        )}
        renderItem={({ item, index }) => (
          <AnimatedFadeIn delay={index * 30} style={styles.itemWrap}>
            {item.kind === "memory" ? (
              <MemoryCard
                memory={item.data}
                onFavoritePress={() => toggleFavorite(item.data.id)}
              />
            ) : item.kind === "milestone" ? (
              <MilestoneItem
                m={item.data}
                onDelete={() =>
                  Alert.alert("Delete milestone?", "", [
                    { text: "Cancel", style: "cancel" },
                    { text: "Delete", style: "destructive", onPress: () => deleteMilestone(item.data.id) },
                  ])
                }
              />
            ) : (
              <JournalItem
                j={item.data}
                onEdit={() => router.push(`/edit-journal/${item.data.id}`)}
                onDelete={() =>
                  Alert.alert("Delete entry?", "", [
                    { text: "Keep it", style: "cancel" },
                    { text: "Delete", style: "destructive", onPress: () => deleteJournal(item.data.id) },
                  ])
                }
              />
            )}
          </AnimatedFadeIn>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🌸</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Nothing here yet</Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              Your memories will appear here
            </Text>
            <TouchableOpacity
              style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/(tabs)/add")}
            >
              <Feather name="plus" size={15} color="#FFF" />
              <Text style={styles.emptyBtnTxt}>Add First Memory</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 12, gap: 14 },
  titleRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  title: { fontSize: 32, fontWeight: "800", letterSpacing: -0.5 },
  subtitle: { fontSize: 13, marginTop: 3 },
  addBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", marginTop: 4 },
  filterRow: { flexDirection: "row", gap: 8 },
  filterPill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
  },
  filterEmoji: { fontSize: 13 },
  filterLabel: { fontSize: 12, fontWeight: "600" },
  list: { paddingHorizontal: 20, paddingTop: 4 },
  itemWrap: { marginBottom: 12 },
  monthRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 14 },
  monthDot: { width: 6, height: 6, borderRadius: 3 },
  monthText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.8 },
  monthLine: { flex: 1, height: 1 },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyIcon: { fontSize: 52 },
  emptyTitle: { fontSize: 19, fontWeight: "700" },
  emptySub: { fontSize: 14 },
  emptyBtn: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 22, paddingVertical: 13, borderRadius: 14, marginTop: 4,
  },
  emptyBtnTxt: { color: "#FFF", fontSize: 14, fontWeight: "700" },
});
