import React, { useMemo, useState } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Memory, JournalEntry } from "@/contexts/DatabaseContext";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";

const { width } = Dimensions.get("window");
const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

function getMoodColor(mood: number | null): string {
  if (mood === null) return "transparent";
  if (mood <= 3) return "#FF6B6B";
  if (mood <= 5) return "#FFB347";
  if (mood <= 7) return "#FFD66B";
  return "#6BCB77";
}

function getMoodEmoji(mood: number): string {
  if (mood <= 2) return "😢";
  if (mood <= 4) return "😔";
  if (mood <= 6) return "😐";
  if (mood <= 8) return "😊";
  return "🥰";
}

interface CalendarEntry {
  mood: number;
  count: number;
}

interface MoodCalendarProps {
  memories: Memory[];
  journals: JournalEntry[];
  onDayPress?: (date: Date, entries: { memories: Memory[]; journals: JournalEntry[] }) => void;
}

export function MoodCalendar({ memories, journals, onDayPress }: MoodCalendarProps) {
  const colors = useColors();
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthName = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const moodMap = useMemo(() => {
    const map = new Map<string, CalendarEntry>();

    for (const m of memories) {
      const d = new Date(m.date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const key = d.getDate().toString();
        const existing = map.get(key);
        if (existing) {
          map.set(key, {
            mood: (existing.mood * existing.count + m.mood) / (existing.count + 1),
            count: existing.count + 1,
          });
        } else {
          map.set(key, { mood: m.mood, count: 1 });
        }
      }
    }

    for (const j of journals) {
      const d = new Date(j.date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const key = d.getDate().toString();
        const existing = map.get(key);
        if (existing) {
          map.set(key, {
            mood: (existing.mood * existing.count + j.mood) / (existing.count + 1),
            count: existing.count + 1,
          });
        } else {
          map.set(key, { mood: j.mood, count: 1 });
        }
      }
    }

    return map;
  }, [memories, journals, year, month]);

  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() === month;

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleDayPress = (day: number) => {
    const date = new Date(year, month, day);
    const key = day.toString();
    const dayMemories = memories.filter((m) => {
      const d = new Date(m.date);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
    const dayJournals = journals.filter((j) => {
      const d = new Date(j.date);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });
    onDayPress?.(date, { memories: dayMemories, journals: dayJournals });
  };

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  while (cells.length % 7 !== 0) cells.push(null);

  const cellSize = Math.floor((width - 40 - 16 - 6 * 4) / 7);

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={prevMonth} style={styles.navBtn} hitSlop={8}>
          <Feather name="chevron-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.monthLabel, { color: colors.text }]}>{monthName}</Text>
        <TouchableOpacity onPress={nextMonth} style={styles.navBtn} hitSlop={8}>
          <Feather name="chevron-right" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.dayHeaders}>
        {DAYS.map((d, i) => (
          <View key={i} style={[styles.dayHeaderCell, { width: cellSize }]}>
            <Text style={[styles.dayHeaderText, { color: colors.mutedForeground }]}>{d}</Text>
          </View>
        ))}
      </View>

      <View style={styles.grid}>
        {Array.from({ length: cells.length / 7 }, (_, row) => (
          <View key={row} style={styles.row}>
            {cells.slice(row * 7, row * 7 + 7).map((day, col) => {
              const entry = day ? moodMap.get(day.toString()) : null;
              const isToday = isCurrentMonth && day === today.getDate();
              const moodColor = entry ? getMoodColor(entry.mood) : null;

              return (
                <TouchableOpacity
                  key={col}
                  style={[
                    styles.dayCell,
                    { width: cellSize, height: cellSize },
                    isToday && { borderColor: colors.primary, borderWidth: 2, borderRadius: cellSize / 2 },
                  ]}
                  onPress={() => day && handleDayPress(day)}
                  disabled={!day}
                  activeOpacity={0.7}
                >
                  {day ? (
                    <>
                      {moodColor && (
                        <View
                          style={[
                            styles.moodDot,
                            {
                              width: cellSize - 4,
                              height: cellSize - 4,
                              borderRadius: (cellSize - 4) / 2,
                              backgroundColor: moodColor + "55",
                            },
                          ]}
                        />
                      )}
                      <Text
                        style={[
                          styles.dayText,
                          { color: isToday ? colors.primary : colors.text },
                          isToday && { fontWeight: "700" },
                        ]}
                      >
                        {day}
                      </Text>
                      {entry && (
                        <Text style={styles.emojiDot}>{getMoodEmoji(Math.round(entry.mood))}</Text>
                      )}
                    </>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      <View style={styles.legend}>
        {[
          { label: "Low", color: "#FF6B6B" },
          { label: "Fair", color: "#FFB347" },
          { label: "Good", color: "#FFD66B" },
          { label: "Great", color: "#6BCB77" },
        ].map((l) => (
          <View key={l.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: l.color + "88" }]} />
            <Text style={[styles.legendText, { color: colors.mutedForeground }]}>{l.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  navBtn: { padding: 4 },
  monthLabel: { fontSize: 16, fontWeight: "700" },
  dayHeaders: { flexDirection: "row" },
  dayHeaderCell: { alignItems: "center" },
  dayHeaderText: { fontSize: 11, fontWeight: "600" },
  grid: { gap: 2 },
  row: { flexDirection: "row" },
  dayCell: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  moodDot: {
    position: "absolute",
  },
  dayText: { fontSize: 13, zIndex: 1 },
  emojiDot: { fontSize: 8, position: "absolute", bottom: 1 },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    paddingTop: 4,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { fontSize: 11 },
});
