import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { useDatabase } from "@/contexts/DatabaseContext";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";

function SettingRow({
  icon,
  iconColor,
  iconBg,
  label,
  subtitle,
  onPress,
  right,
  danger,
  colors,
  badge,
}: {
  icon: string;
  iconColor?: string;
  iconBg?: string;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  danger?: boolean;
  colors: ReturnType<typeof useColors>;
  badge?: string;
}) {
  const ic = iconColor ?? (danger ? colors.destructive : colors.primary);
  const bg = iconBg ?? (danger ? colors.destructive + "15" : colors.secondary);
  return (
    <TouchableOpacity
      style={[styles.row, { backgroundColor: colors.card }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress && !right}
    >
      <View style={[styles.iconWrap, { backgroundColor: bg }]}>
        <Feather name={icon as any} size={18} color={ic} />
      </View>
      <View style={styles.rowText}>
        <View style={styles.rowLabelRow}>
          <Text style={[styles.rowLabel, { color: danger ? colors.destructive : colors.text }]}>{label}</Text>
          {badge ? (
            <View style={[styles.badge, { backgroundColor: "#C4344A" }]}>
              <Text style={styles.badgeTxt}>{badge}</Text>
            </View>
          ) : null}
        </View>
        {subtitle ? <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>{subtitle}</Text> : null}
      </View>
      {right ?? (onPress ? <Feather name="chevron-right" size={16} color={colors.mutedForeground} /> : null)}
    </TouchableOpacity>
  );
}

function SectionTitle({ title, colors }: { title: string; colors: ReturnType<typeof useColors> }) {
  return <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>{title}</Text>;
}

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { hasPIN, biometricAvailable, biometricEnabled, toggleBiometric, lock, removePIN } = useAuth();
  const { memories, journals, letters, milestones } = useDatabase();
  const router = useRouter();

  const [bioToggle, setBioToggle] = useState(biometricEnabled);
  const [hideContent, setHideContent] = useState(false);
  const [reminderOn, setReminderOn] = useState(false);
  const [autoLockIdx, setAutoLockIdx] = useState(0);

  const AUTO_LOCK_OPTIONS = ["Immediately", "1 minute", "5 minutes", "30 minutes"];

  const handleBioToggle = async (val: boolean) => {
    setBioToggle(val);
    await toggleBiometric(val);
  };

  const handleRemovePIN = () => {
    Alert.alert("Remove PIN", "Anyone will be able to open the app. Continue?", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: async () => { await removePIN(); } },
    ]);
  };

  const handleExport = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      memories: memories.map((m) => ({ title: m.title, date: new Date(m.date).toISOString(), tags: m.tags, mood: m.mood })),
      journals: journals.map((j) => ({ content: j.content, mood: j.mood, date: new Date(j.date).toISOString() })),
      letters: letters.map((l) => ({ title: l.title, body: l.body, createdAt: new Date(l.createdAt).toISOString() })),
      milestones: milestones.map((m) => ({ title: m.title, date: new Date(m.date).toISOString(), type: m.eventType })),
    };
    const summary = `• ${memories.length} memories\n• ${journals.length} journals\n• ${letters.length} letters\n• ${milestones.length} milestones`;
    Alert.alert("Export Data", `Your data summary:\n\n${summary}\n\nIn the full native build, this saves as a JSON file.`, [{ text: "OK" }]);
  };

  const handleResetData = () => {
    Alert.alert(
      "⚠️ Reset All Data",
      "This will permanently delete ALL your memories, journals, letters, milestones, WhatsApp chat, and profile data.\n\nThis cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset Everything",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Are you absolutely sure?",
              "Type 'DELETE' to confirm — all your data will be lost forever.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Yes, Delete All",
                  style: "destructive",
                  onPress: async () => {
                    await AsyncStorage.clear();
                    Alert.alert("Done", "All data has been cleared. The app will restart.", [
                      { text: "OK", onPress: () => router.replace("/pin") },
                    ]);
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const cycleAutoLock = () => {
    const next = (autoLockIdx + 1) % AUTO_LOCK_OPTIONS.length;
    setAutoLockIdx(next);
    AsyncStorage.setItem("@me_ammu/auto_lock", AUTO_LOCK_OPTIONS[next]);
  };

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingBottom: bottomPad + 40 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Security ── */}
      <View style={styles.section}>
        <SectionTitle title="SECURITY" colors={colors} />
        <View style={styles.group}>
          <SettingRow
            icon={hasPIN ? "lock" : "unlock"}
            label={hasPIN ? "Change PIN" : "Set Up PIN"}
            subtitle={hasPIN ? "Your app is protected" : "Tap to protect your memories"}
            onPress={() =>
              Alert.alert("Change PIN", "To change your PIN, lock the app and set it again.", [
                { text: "Lock App", onPress: lock },
                { text: "Cancel", style: "cancel" },
              ])
            }
            colors={colors}
          />
          {biometricAvailable && hasPIN && (
            <SettingRow
              icon="activity"
              label="Face ID / Fingerprint"
              subtitle="Unlock with biometrics"
              right={
                <Switch
                  value={bioToggle}
                  onValueChange={handleBioToggle}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#FFF"
                />
              }
              colors={colors}
            />
          )}
          <SettingRow
            icon="clock"
            iconColor="#6BA8FF"
            iconBg="#EEF4FF"
            label="Auto-Lock Timer"
            subtitle={`Locks after: ${AUTO_LOCK_OPTIONS[autoLockIdx]}`}
            onPress={cycleAutoLock}
            right={
              <View style={[styles.pill, { backgroundColor: "#EEF4FF" }]}>
                <Text style={[styles.pillTxt, { color: "#6BA8FF" }]}>{AUTO_LOCK_OPTIONS[autoLockIdx]}</Text>
              </View>
            }
            colors={colors}
          />
          <SettingRow
            icon="eye-off"
            iconColor="#8B5CF6"
            iconBg="#F5F3FF"
            label="Hide Sensitive Content"
            subtitle="Blur memories on timeline preview"
            right={
              <Switch
                value={hideContent}
                onValueChange={setHideContent}
                trackColor={{ false: colors.border, true: "#8B5CF6" }}
                thumbColor="#FFF"
              />
            }
            colors={colors}
          />
          {hasPIN && (
            <SettingRow icon="trash" label="Remove PIN" danger onPress={handleRemovePIN} colors={colors} />
          )}
        </View>
      </View>

      {/* ── Private ── */}
      <View style={styles.section}>
        <SectionTitle title="PRIVATE" colors={colors} />
        <View style={styles.group}>
          <SettingRow
            icon="lock"
            iconColor="#2D3561"
            iconBg="#E8EAF6"
            label="Secret Gallery"
            subtitle="PIN-protected private photos"
            badge="NEW"
            onPress={() => router.push("/secret-gallery")}
            colors={colors}
          />
          <SettingRow
            icon="lock"
            label="Lock App Now"
            subtitle="Return to PIN screen"
            onPress={lock}
            colors={colors}
          />
        </View>
      </View>

      {/* ── Relationship ── */}
      <View style={styles.section}>
        <SectionTitle title="RELATIONSHIP" colors={colors} />
        <View style={styles.group}>
          <SettingRow
            icon="calendar"
            label="Anniversary Date"
            subtitle="Set your 'together since' date"
            onPress={() => router.push("/set-anniversary")}
            colors={colors}
          />
          <SettingRow
            icon="message-circle"
            iconColor="#25D366"
            iconBg="#EDFAF3"
            label="Import Her WhatsApp Chat"
            subtitle="Re-read all her messages"
            onPress={() => router.push("/whatsapp-import")}
            colors={colors}
          />
          <SettingRow
            icon="heart"
            iconColor="#C4344A"
            iconBg="#FFF0F2"
            label="Read Her Messages"
            subtitle="Open imported chat"
            onPress={() => router.push("/whatsapp-chat")}
            colors={colors}
          />
          <SettingRow
            icon="mail"
            label="Letters to Her"
            subtitle="Unsent letters, private thoughts"
            onPress={() => router.push("/letters")}
            colors={colors}
          />
        </View>
      </View>

      {/* ── Reminders ── */}
      <View style={styles.section}>
        <SectionTitle title="REMINDERS" colors={colors} />
        <View style={styles.group}>
          <SettingRow
            icon="bell"
            iconColor="#F59E0B"
            iconBg="#FFF9ED"
            label="Daily Journal Reminder"
            subtitle="Get a daily nudge to write"
            right={
              <Switch
                value={reminderOn}
                onValueChange={setReminderOn}
                trackColor={{ false: colors.border, true: "#F59E0B" }}
                thumbColor="#FFF"
              />
            }
            colors={colors}
          />
        </View>
      </View>

      {/* ── Data ── */}
      <View style={styles.section}>
        <SectionTitle title="DATA" colors={colors} />
        <View style={styles.group}>
          <SettingRow
            icon="download"
            iconColor="#10B981"
            iconBg="#ECFDF5"
            label="Export Data"
            subtitle={`${memories.length} memories · ${journals.length} journals · ${letters.length} letters`}
            onPress={handleExport}
            colors={colors}
          />
          <SettingRow
            icon="trash-2"
            label="Reset All Data"
            subtitle="Permanently delete everything"
            danger
            onPress={handleResetData}
            colors={colors}
          />
        </View>
      </View>

      {/* ── App ── */}
      <View style={styles.section}>
        <SectionTitle title="APP" colors={colors} />
        <View style={styles.group}>
          <SettingRow
            icon="info"
            label="About Me & Ammu"
            subtitle="Version 1.0 · Made with love 💕"
            colors={colors}
          />
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerHeart, { color: colors.primary }]}>💕</Text>
        <Text style={[styles.footerText, { color: colors.mutedForeground }]}>Me & Ammu</Text>
        <Text style={[styles.footerSub, { color: colors.mutedForeground }]}>All data stored privately on your device</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 20, gap: 24 },
  section: { gap: 8 },
  sectionTitle: { fontSize: 11, fontWeight: "700", letterSpacing: 0.8, marginLeft: 4 },
  group: { borderRadius: 16, overflow: "hidden", gap: 1 },
  row: { flexDirection: "row", alignItems: "center", padding: 16, gap: 14 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  rowText: { flex: 1 },
  rowLabelRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowLabel: { fontSize: 15, fontWeight: "600" },
  rowSub: { fontSize: 12, marginTop: 2 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  badgeTxt: { color: "#FFF", fontSize: 9, fontWeight: "800", letterSpacing: 0.5 },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  pillTxt: { fontSize: 12, fontWeight: "600" },
  footer: { alignItems: "center", paddingTop: 8, gap: 4 },
  footerHeart: { fontSize: 28 },
  footerText: { fontSize: 14, fontWeight: "700" },
  footerSub: { fontSize: 12 },
});
