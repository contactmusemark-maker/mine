import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnimatedFadeIn } from "@/components/AnimatedFadeIn";
import { MoodCalendar } from "@/components/MoodCalendar";
import { Memory, JournalEntry, useDatabase } from "@/contexts/DatabaseContext";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";

const TAG_COLORS: Record<string, string> = {
  Love: "#FF6B6B", Sad: "#6BA8FF", Happy: "#FFD66B",
  Fight: "#FF8C42", Missing: "#A78BFA", Sweet: "#EC4899",
  Proud: "#22C55E", Fun: "#F59E0B",
};

function MoodBar({ label, value, max, color }: {
  label: string; value: number; max: number; color: string;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <View style={styles.barRow}>
      <Text style={[styles.barLabel, { color: "#888" }]}>{label}</Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={[styles.barValue, { color }]}>{value}</Text>
    </View>
  );
}

interface DayModalProps {
  visible: boolean;
  date: Date | null;
  entries: { memories: Memory[]; journals: JournalEntry[] };
  onClose: () => void;
  colors: ReturnType<typeof useColors>;
}

function DayModal({ visible, date, entries, onClose, colors }: DayModalProps) {
  const total = entries.memories.length + entries.journals.length;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} onPress={onClose} activeOpacity={1}>
        <TouchableOpacity
          style={[styles.modalSheet, { backgroundColor: colors.card }]}
          activeOpacity={1}
        >
          <View style={styles.modalHandle} />
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            {date?.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </Text>
          {total === 0 ? (
            <Text style={[styles.modalEmpty, { color: colors.mutedForeground }]}>
              No entries on this day
            </Text>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {entries.memories.map((m) => (
                <View key={m.id} style={[styles.modalItem, { borderColor: colors.border }]}>
                  <Text style={styles.modalItemEmoji}>💭</Text>
                  <View style={styles.modalItemText}>
                    <Text style={[styles.modalItemTitle, { color: colors.text }]}>{m.title}</Text>
                    <Text style={[styles.modalItemSub, { color: colors.mutedForeground }]}>
                      Mood {m.mood}/10
                    </Text>
                  </View>
                </View>
              ))}
              {entries.journals.map((j) => (
                <View key={j.id} style={[styles.modalItem, { borderColor: colors.border }]}>
                  <Text style={styles.modalItemEmoji}>📝</Text>
                  <View style={styles.modalItemText}>
                    <Text style={[styles.modalItemTitle, { color: colors.text }]} numberOfLines={2}>
                      {j.content}
                    </Text>
                    <Text style={[styles.modalItemSub, { color: colors.mutedForeground }]}>
                      Mood {j.mood}/10
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
          <TouchableOpacity
            style={[styles.modalClose, { backgroundColor: colors.secondary }]}
            onPress={onClose}
          >
            <Text style={[styles.modalCloseText, { color: colors.text }]}>Close</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

export default function InsightsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { memories, journals, milestones } = useDatabase();
  const router = useRouter();

  const [dayModal, setDayModal] = useState<{
    visible: boolean;
    date: Date | null;
    entries: { memories: Memory[]; journals: JournalEntry[] };
  }>({ visible: false, date: null, entries: { memories: [], journals: [] } });

  const stats = useMemo(() => {
    const visible = memories.filter((m) => !m.isHidden);
    const avgMood =
      visible.length > 0
        ? visible.reduce((s, m) => s + m.mood, 0) / visible.length
        : 0;

    const tagCounts: Record<string, number> = {};
    for (const m of visible) {
      for (const t of m.tags) {
        tagCounts[t] = (tagCounts[t] ?? 0) + 1;
      }
    }

    const now = Date.now();
    const week = 7 * 24 * 60 * 60 * 1000;
    const thisWeek = visible.filter((m) => now - m.date < week);
    const prevWeek = visible.filter((m) => now - m.date >= week && now - m.date < 2 * week);

    const thisWeekMood =
      thisWeek.length > 0
        ? thisWeek.reduce((s, m) => s + m.mood, 0) / thisWeek.length
        : 0;
    const prevWeekMood =
      prevWeek.length > 0
        ? prevWeek.reduce((s, m) => s + m.mood, 0) / prevWeek.length
        : 0;

    const improving = thisWeek.length > 0 && thisWeekMood > prevWeekMood + 0.5;
    const declining = thisWeek.length > 0 && thisWeekMood < prevWeekMood - 0.5;

    const moodDist = {
      low: visible.filter((m) => m.mood <= 3).length,
      mid: visible.filter((m) => m.mood >= 4 && m.mood <= 6).length,
      high: visible.filter((m) => m.mood >= 7).length,
    };

    return {
      total: visible.length,
      avgMood: avgMood.toFixed(1),
      tagCounts,
      maxTag: Math.max(...Object.values(tagCounts), 1),
      favorites: visible.filter((m) => m.isFavorite).length,
      journalCount: journals.length,
      milestoneCount: milestones.length,
      improving,
      declining,
      thisWeekCount: thisWeek.length,
      moodDist,
    };
  }, [memories, journals, milestones]);

  const moodInsight = stats.improving
    ? "You seem better this week — keep going! 🌱"
    : stats.declining
    ? "Rough week? It's okay. Every day is a new start. 💙"
    : "Steady and stable — you're doing great. ✨";

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topPad + 16, paddingBottom: bottomPad + 80 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: colors.navy }]}>Insights</Text>

      <AnimatedFadeIn delay={0}>
        <View style={[styles.insightBanner, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.insightText, { color: colors.navy }]}>{moodInsight}</Text>
        </View>
      </AnimatedFadeIn>

      <AnimatedFadeIn delay={60}>
        <View style={styles.statsRow}>
          {[
            { label: "Memories", value: stats.total, icon: "book", color: colors.primary },
            { label: "Journals", value: stats.journalCount, icon: "edit-3", color: "#6BA8FF" },
            { label: "Milestones", value: stats.milestoneCount, icon: "star", color: "#FFD66B" },
            { label: "Avg Mood", value: stats.avgMood, icon: "heart", color: "#6BCB77" },
          ].map((s) => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: colors.card }]}>
              <Feather name={s.icon as any} size={18} color={s.color} />
              <Text style={[styles.statValue, { color: colors.text }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
            </View>
          ))}
        </View>
      </AnimatedFadeIn>

      <AnimatedFadeIn delay={100}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Mood Calendar</Text>
          <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
            Tap a day to see entries
          </Text>
        </View>
        <MoodCalendar
          memories={memories}
          journals={journals}
          onDayPress={(date, entries) =>
            setDayModal({ visible: true, date, entries })
          }
        />
      </AnimatedFadeIn>

      <AnimatedFadeIn delay={140}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Mood Distribution</Text>
          <View style={styles.moodDistRow}>
            {[
              { label: "😢\nLow", count: stats.moodDist.low, color: "#FF6B6B" },
              { label: "😐\nFair", count: stats.moodDist.mid, color: "#FFD66B" },
              { label: "😊\nGreat", count: stats.moodDist.high, color: "#6BCB77" },
            ].map((item) => {
              const pct = stats.total > 0 ? (item.count / stats.total) * 100 : 0;
              return (
                <View key={item.label} style={styles.moodDistItem}>
                  <View style={[styles.moodDistBar, { backgroundColor: item.color + "25" }]}>
                    <View
                      style={[
                        styles.moodDistFill,
                        { height: `${pct}%` as any, backgroundColor: item.color },
                      ]}
                    />
                  </View>
                  <Text style={[styles.moodDistLabel, { color: colors.mutedForeground }]}>
                    {item.label}
                  </Text>
                  <Text style={[styles.moodDistValue, { color: colors.text }]}>{item.count}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </AnimatedFadeIn>

      {Object.keys(stats.tagCounts).length > 0 && (
        <AnimatedFadeIn delay={180}>
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Tag Breakdown</Text>
            <View style={styles.bars}>
              {Object.entries(stats.tagCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6)
                .map(([tag, count]) => (
                  <MoodBar
                    key={tag}
                    label={tag}
                    value={count}
                    max={stats.maxTag}
                    color={TAG_COLORS[tag] ?? colors.primary}
                  />
                ))}
            </View>
          </View>
        </AnimatedFadeIn>
      )}

      <DayModal
        visible={dayModal.visible}
        date={dayModal.date}
        entries={dayModal.entries}
        onClose={() => setDayModal((s) => ({ ...s, visible: false }))}
        colors={colors}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 16 },
  title: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  insightBanner: { borderRadius: 14, padding: 16 },
  insightText: { fontSize: 15, fontWeight: "600", lineHeight: 22 },
  sectionHeader: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
  sectionTitle: { fontSize: 17, fontWeight: "700" },
  sectionSub: { fontSize: 12 },
  statsRow: { flexDirection: "row", gap: 8 },
  statCard: {
    flex: 1, borderRadius: 14, padding: 12, alignItems: "center", gap: 4,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  statValue: { fontSize: 20, fontWeight: "800" },
  statLabel: { fontSize: 10, fontWeight: "500", textAlign: "center" },
  card: {
    borderRadius: 16, padding: 18, gap: 14,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  cardTitle: { fontSize: 16, fontWeight: "700" },
  moodDistRow: { flexDirection: "row", justifyContent: "space-around", height: 120, alignItems: "flex-end" },
  moodDistItem: { alignItems: "center", gap: 4, flex: 1 },
  moodDistBar: { width: 44, height: 80, borderRadius: 10, justifyContent: "flex-end", overflow: "hidden" },
  moodDistFill: { width: "100%", borderRadius: 10 },
  moodDistLabel: { fontSize: 11, textAlign: "center" },
  moodDistValue: { fontSize: 14, fontWeight: "700" },
  bars: { gap: 10 },
  barRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  barLabel: { width: 60, fontSize: 13 },
  barTrack: { flex: 1, height: 8, backgroundColor: "#F0ECE8", borderRadius: 4, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 4 },
  barValue: { width: 24, fontSize: 13, fontWeight: "700", textAlign: "right" },
  modalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 36, gap: 16, maxHeight: "70%",
  },
  modalHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: "#DDD", alignSelf: "center", marginBottom: 4,
  },
  modalTitle: { fontSize: 16, fontWeight: "700" },
  modalEmpty: { fontSize: 15, textAlign: "center", paddingVertical: 20 },
  modalItem: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    paddingVertical: 12, borderBottomWidth: 1,
  },
  modalItemEmoji: { fontSize: 20 },
  modalItemText: { flex: 1 },
  modalItemTitle: { fontSize: 14, fontWeight: "600" },
  modalItemSub: { fontSize: 12, marginTop: 2 },
  modalClose: {
    paddingVertical: 14, borderRadius: 12, alignItems: "center", marginTop: 4,
  },
  modalCloseText: { fontSize: 15, fontWeight: "600" },
});
