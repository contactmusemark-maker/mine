import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAnniversary } from "@/hooks/useAnniversary";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function daysInMonth(month: number, year: number) {
  return new Date(year, month + 1, 0).getDate();
}

export default function SetAnniversaryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { togetherSince, setTogetherSince, clearTogetherSince } = useAnniversary();
  const router = useRouter();

  const initial = togetherSince ?? new Date();
  const [day, setDay]     = useState(initial.getDate());
  const [month, setMonth] = useState(initial.getMonth());
  const [year, setYear]   = useState(initial.getFullYear());

  const currentYear = new Date().getFullYear();

  const clampDay = (d: number, m: number, y: number) =>
    Math.min(d, daysInMonth(m, y));

  const changeMonth = (delta: number) => {
    const newMonth = (month + delta + 12) % 12;
    const newYear  = month + delta < 0 ? year - 1 : month + delta > 11 ? year + 1 : year;
    setMonth(newMonth);
    setYear(newYear);
    setDay((d) => clampDay(d, newMonth, newYear));
  };

  const changeDay = (delta: number) => {
    const max = daysInMonth(month, year);
    setDay((d) => Math.max(1, Math.min(max, d + delta)));
  };

  const changeYear = (delta: number) => {
    const newYear = Math.max(1990, Math.min(currentYear, year + delta));
    setYear(newYear);
    setDay((d) => clampDay(d, month, newYear));
  };

  const handleSave = async () => {
    const selected = new Date(year, month, day);
    if (selected > new Date()) {
      Alert.alert("Invalid date", "Your anniversary can't be in the future.");
      return;
    }
    await setTogetherSince(selected);
    router.back();
  };

  const handleClear = () => {
    Alert.alert("Remove Anniversary", "Clear the anniversary date?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          await clearTogetherSince();
          router.back();
        },
      },
    ]);
  };

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const previewDate = new Date(year, month, day);
  const today = new Date(); today.setHours(0,0,0,0);
  const daysTogether = Math.floor((today.getTime() - previewDate.getTime()) / 86400000);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.heroSection}>
        <Text style={styles.heroEmoji}>💕</Text>
        <Text style={[styles.heroTitle, { color: colors.navy }]}>Together Since</Text>
        <Text style={[styles.heroSub, { color: colors.mutedForeground }]}>
          Pick the day your story began
        </Text>
      </View>

      <View style={[styles.pickerCard, { backgroundColor: colors.card }]}>
        {/* Month */}
        <View style={styles.pickerRow}>
          <TouchableOpacity onPress={() => changeMonth(-1)} style={[styles.arrowBtn, { backgroundColor: colors.secondary }]}>
            <Feather name="chevron-left" size={20} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.pickerValue, { color: colors.text }]}>{MONTHS[month]}</Text>
          <TouchableOpacity onPress={() => changeMonth(1)} style={[styles.arrowBtn, { backgroundColor: colors.secondary }]}>
            <Feather name="chevron-right" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Day */}
        <View style={styles.pickerRow}>
          <TouchableOpacity onPress={() => changeDay(-1)} style={[styles.arrowBtn, { backgroundColor: colors.secondary }]}>
            <Feather name="chevron-left" size={20} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.pickerValue, styles.pickerValueLarge, { color: colors.primary }]}>{day}</Text>
          <TouchableOpacity onPress={() => changeDay(1)} style={[styles.arrowBtn, { backgroundColor: colors.secondary }]}>
            <Feather name="chevron-right" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Year */}
        <View style={styles.pickerRow}>
          <TouchableOpacity onPress={() => changeYear(-1)} style={[styles.arrowBtn, { backgroundColor: colors.secondary }]}>
            <Feather name="chevron-left" size={20} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.pickerValue, { color: colors.text }]}>{year}</Text>
          <TouchableOpacity onPress={() => changeYear(1)} style={[styles.arrowBtn, { backgroundColor: colors.secondary }]}>
            <Feather name="chevron-right" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {daysTogether >= 0 && (
        <View style={[styles.previewCard, { backgroundColor: colors.navy }]}>
          <Text style={styles.previewDays}>{daysTogether.toLocaleString()}</Text>
          <Text style={styles.previewLabel}>days together</Text>
          <Text style={styles.previewDate}>
            {previewDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          </Text>
        </View>
      )}

      <View style={[styles.actions, { paddingBottom: bottomPad + 20 }]}>
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          activeOpacity={0.85}
        >
          <Feather name="check" size={18} color="#FFF" />
          <Text style={styles.saveBtnText}>Save Date</Text>
        </TouchableOpacity>

        {togetherSince && (
          <TouchableOpacity
            style={[styles.clearBtn, { borderColor: colors.destructive }]}
            onPress={handleClear}
          >
            <Text style={[styles.clearBtnText, { color: colors.destructive }]}>Remove</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 24, gap: 20 },
  heroSection: { alignItems: "center", gap: 6 },
  heroEmoji: { fontSize: 48 },
  heroTitle: { fontSize: 24, fontWeight: "800" },
  heroSub: { fontSize: 14 },
  pickerCard: {
    borderRadius: 20,
    padding: 20,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  arrowBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  pickerValue: { fontSize: 22, fontWeight: "700", minWidth: 120, textAlign: "center" },
  pickerValueLarge: { fontSize: 40, fontWeight: "800" },
  previewCard: {
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    gap: 4,
  },
  previewDays: { fontSize: 40, fontWeight: "800", color: "#FFF", letterSpacing: -1 },
  previewLabel: { fontSize: 14, color: "rgba(255,255,255,0.7)", fontWeight: "600" },
  previewDate: { fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 4 },
  actions: { gap: 12, marginTop: "auto" },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
  },
  saveBtnText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  clearBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  clearBtnText: { fontSize: 15, fontWeight: "600" },
});
