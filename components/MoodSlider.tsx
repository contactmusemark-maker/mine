import React, { useRef } from "react";
import { PanResponder, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

const MOOD_EMOJIS: Record<number, string> = {
  0: "😢", 1: "😞", 2: "😔", 3: "😕", 4: "😐",
  5: "🙂", 6: "😊", 7: "😄", 8: "😁", 9: "🥰", 10: "🤩",
};

function getMoodColor(value: number): string {
  if (value <= 3) return "#FF6B6B";
  if (value <= 6) return "#FFD66B";
  return "#6BCB77";
}

interface MoodSliderProps {
  value: number;
  onValueChange: (v: number) => void;
}

export function MoodSlider({ value, onValueChange }: MoodSliderProps) {
  const colors = useColors();
  const sliderWidth = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const x = e.nativeEvent.locationX;
        const newVal = Math.round(
          Math.max(0, Math.min(10, (x / sliderWidth.current) * 10))
        );
        onValueChange(newVal);
      },
      onPanResponderMove: (e) => {
        const x = e.nativeEvent.locationX;
        const newVal = Math.round(
          Math.max(0, Math.min(10, (x / sliderWidth.current) * 10))
        );
        onValueChange(newVal);
      },
    })
  ).current;

  const moodColor = getMoodColor(value);
  const percent = (value / 10) * 100;

  return (
    <View style={styles.wrapper}>
      <View style={styles.labelRow}>
        <Text style={[styles.emoji, { fontSize: 28 }]}>{MOOD_EMOJIS[value]}</Text>
        <Text style={[styles.moodValue, { color: moodColor }]}>{value}/10</Text>
      </View>

      <View
        style={styles.track}
        onLayout={(e) => { sliderWidth.current = e.nativeEvent.layout.width; }}
        {...panResponder.panHandlers}
      >
        <View style={[styles.fill, { width: `${percent}%` as any, backgroundColor: moodColor }]} />
        <View
          style={[
            styles.thumb,
            {
              left: `${percent}%` as any,
              backgroundColor: moodColor,
              borderColor: "#FFF",
            },
          ]}
        />
      </View>

      <View style={styles.markers}>
        {[0, 2, 4, 6, 8, 10].map((n) => (
          <Text key={n} style={[styles.markerText, { color: colors.mutedForeground }]}>
            {n}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  emoji: {
    fontSize: 28,
  },
  moodValue: {
    fontSize: 18,
    fontWeight: "700",
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E8E0DC",
    justifyContent: "center",
    position: "relative",
  },
  fill: {
    height: "100%",
    borderRadius: 4,
    position: "absolute",
    left: 0,
    top: 0,
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    position: "absolute",
    marginLeft: -12,
    top: -8,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  markers: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  markerText: {
    fontSize: 11,
  },
});
