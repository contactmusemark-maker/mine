import React, { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AnniversaryInfo } from "@/hooks/useAnniversary";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";

interface Props {
  info: AnniversaryInfo;
  onSetup: () => void;
}

export function AnniversaryBanner({ info, onSetup }: Props) {
  const colors = useColors();
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (info.isAnniversaryToday) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.04, duration: 800, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [info.isAnniversaryToday, pulse]);

  if (!info.isLoaded) return null;

  /* ─── Setup prompt ─── */
  if (!info.togetherSince) {
    return (
      <TouchableOpacity
        style={[styles.setupCard, { backgroundColor: "#2D3561" }]}
        onPress={onSetup}
        activeOpacity={0.85}
      >
        <Text style={styles.setupEmoji}>💕</Text>
        <View style={styles.setupBody}>
          <Text style={styles.setupTitle}>Set your anniversary date</Text>
          <Text style={styles.setupSub}>Track days together & countdown</Text>
        </View>
        <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.5)" />
      </TouchableOpacity>
    );
  }

  /* ─── Anniversary today 🎉 ─── */
  if (info.isAnniversaryToday) {
    return (
      <Animated.View style={[styles.card, { backgroundColor: colors.primary, transform: [{ scale: pulse }] }]}>
        <Text style={styles.celebEmoji}>🎉</Text>
        <View style={styles.celebBody}>
          <Text style={styles.celebTitle}>Happy Anniversary!</Text>
          <Text style={styles.celebSub}>
            {info.yearsCompleted} {info.yearsCompleted === 1 ? "year" : "years"} of love together 💕
          </Text>
        </View>
        <Text style={styles.celebEmoji}>🎉</Text>
      </Animated.View>
    );
  }

  /* ─── Labels / computed ─── */
  const totalDays = info.daysTogether;
  const years = Math.floor(totalDays / 365);
  const months = Math.floor((totalDays % 365) / 30);

  let togetherSub = "";
  if (years >= 1) {
    togetherSub = `${years} yr${years > 1 ? "s" : ""}${months > 0 ? ` ${months} mo` : ""}`;
  } else if (months >= 1) {
    togetherSub = `${months} month${months > 1 ? "s" : ""}`;
  } else {
    togetherSub = `${totalDays} day${totalDays !== 1 ? "s" : ""}`;
  }

  const nextAnnivLabel = info.nextAnniversary
    ? `${info.nextAnniversary.toLocaleDateString("en-US", { month: "short", day: "numeric" })} · ${info.yearsCompleted + 1} yr`
    : "";

  const sinceLabel = info.togetherSince
    ? info.togetherSince.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })
    : "";

  /* ─── Normal countdown card ─── */
  return (
    <View style={styles.card}>
      {/* Days Together */}
      <View style={styles.col}>
        <Text style={styles.bigNum}>{totalDays.toLocaleString()}</Text>
        <Text style={styles.label}>DAYS{"\n"}TOGETHER</Text>
        <Text style={styles.sub}>{togetherSub}</Text>
      </View>

      <View style={styles.divider} />

      {/* Days Until Anniversary */}
      <View style={styles.col}>
        <Text style={styles.bigNum}>{info.daysUntilAnniversary}</Text>
        <Text style={styles.label}>DAYS UNTIL</Text>
        <Text style={styles.sub}>{nextAnnivLabel}</Text>
      </View>

      <View style={styles.divider} />

      {/* Since */}
      <View style={styles.col}>
        <Text style={styles.heartEmoji}>💕</Text>
        <Text style={styles.label}>SINCE</Text>
        <Text style={styles.sinceDate}>{sinceLabel}</Text>
      </View>
    </View>
  );
}

const NAVY = "#2D3561";

const styles = StyleSheet.create({
  /* ── Setup card ── */
  setupCard: {
    borderRadius: 20,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 5,
  },
  setupEmoji: { fontSize: 26 },
  setupBody: { flex: 1 },
  setupTitle: { color: "#FFF", fontSize: 14, fontWeight: "700" },
  setupSub: { color: "rgba(255,255,255,0.55)", fontSize: 12, marginTop: 2 },

  /* ── Anniversary today ── */
  celebEmoji: { fontSize: 28 },
  celebBody: { flex: 1, alignItems: "center" },
  celebTitle: { color: "#FFF", fontSize: 18, fontWeight: "800" },
  celebSub: { color: "rgba(255,255,255,0.85)", fontSize: 13, marginTop: 2 },

  /* ── Main card ── */
  card: {
    backgroundColor: NAVY,
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  col: {
    flex: 1,
    alignItems: "center",
    gap: 3,
  },
  bigNum: {
    color: "#FFF",
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -1,
    lineHeight: 40,
  },
  label: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.6,
    textAlign: "center",
    lineHeight: 14,
    marginTop: 2,
  },
  sub: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 10,
    marginTop: 2,
    textAlign: "center",
  },
  divider: {
    width: 1,
    height: 52,
    backgroundColor: "rgba(255,255,255,0.18)",
    marginHorizontal: 4,
  },
  heartEmoji: {
    fontSize: 26,
    lineHeight: 40,
  },
  sinceDate: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
});
