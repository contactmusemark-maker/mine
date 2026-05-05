import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";

const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  Love: { bg: "#FFEAEA", text: "#FF6B6B" },
  Sad: { bg: "#EAF1FF", text: "#6BA8FF" },
  Happy: { bg: "#FFF9EA", text: "#D4A200" },
  Fight: { bg: "#FFF2EA", text: "#FF8C42" },
  Missing: { bg: "#F3EEFF", text: "#A78BFA" },
  Sweet: { bg: "#FFF0F7", text: "#EC4899" },
  Proud: { bg: "#EAFFED", text: "#22C55E" },
  Fun: { bg: "#FFF9EA", text: "#F59E0B" },
};

function getTagStyle(tag: string) {
  return TAG_COLORS[tag] ?? { bg: "#F0ECE8", text: "#888888" };
}

interface TagChipProps {
  tag: string;
  selected?: boolean;
  onPress?: () => void;
  small?: boolean;
}

export function TagChip({ tag, selected, onPress, small }: TagChipProps) {
  const style = getTagStyle(tag);
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.chip,
        small && styles.chipSmall,
        { backgroundColor: selected ? style.text : style.bg },
      ]}
    >
      <Text
        style={[
          styles.label,
          small && styles.labelSmall,
          { color: selected ? "#FFF" : style.text },
        ]}
      >
        {tag}
      </Text>
    </TouchableOpacity>
  );
}

export const ALL_TAGS = [
  "Love", "Happy", "Sad", "Fight", "Missing", "Sweet", "Proud", "Fun",
];

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  chipSmall: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
  labelSmall: {
    fontSize: 12,
    fontWeight: "500",
  },
});
