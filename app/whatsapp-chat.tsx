import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WhatsAppMessage } from "@/services/whatsappParser";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const WA_KEY = "@me_ammu/whatsapp_messages";
const WA_META_KEY = "@me_ammu/whatsapp_meta";

interface WaMeta {
  herName: string;
  myName: string;
  importedAt: number;
  totalCount: number;
}

function formatTime(ts: number) {
  return new Date(ts).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatDay(ts: number) {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();

  if (sameDay(d, today)) return "Today";
  if (sameDay(d, yesterday)) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

type ListItem =
  | { type: "day_header"; label: string; key: string }
  | { type: "message"; data: WhatsAppMessage };

export default function WhatsAppChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [meta, setMeta] = useState<WaMeta | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    (async () => {
      const [rawMsgs, rawMeta] = await Promise.all([
        AsyncStorage.getItem(WA_KEY),
        AsyncStorage.getItem(WA_META_KEY),
      ]);
      if (rawMsgs) setMessages(JSON.parse(rawMsgs));
      if (rawMeta) setMeta(JSON.parse(rawMeta));
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return messages;
    const q = search.toLowerCase();
    return messages.filter((m) => m.text.toLowerCase().includes(q));
  }, [messages, search]);

  const listData = useMemo((): ListItem[] => {
    const result: ListItem[] = [];
    let lastDay = "";
    for (const msg of filtered) {
      const day = formatDay(msg.timestamp);
      if (day !== lastDay) {
        result.push({ type: "day_header", label: day, key: `day_${msg.id}` });
        lastDay = day;
      }
      result.push({ type: "message", data: msg });
    }
    return result;
  }, [filtered]);

  const handleClearImport = () => {
    Alert.alert(
      "Remove Chat",
      "This will remove the imported WhatsApp chat. You can re-import it anytime.",
      [
        { text: "Keep", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            await Promise.all([
              AsyncStorage.removeItem(WA_KEY),
              AsyncStorage.removeItem(WA_META_KEY),
            ]);
            router.back();
          },
        },
      ]
    );
  };

  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const herColor = "#C4344A";
  const meColor = colors.navy;

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.mutedForeground }}>Loading messages…</Text>
      </View>
    );
  }

  if (messages.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={styles.emptyEmoji}>💬</Text>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>No messages imported yet</Text>
        <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
          Go to Settings → Import WhatsApp Chat
        </Text>
        <TouchableOpacity
          style={[styles.goImportBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/whatsapp-import")}
        >
          <Text style={styles.goImportTxt}>Import Chat</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 10, backgroundColor: "#075E54" }]}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{(meta?.herName ?? "A").charAt(0).toUpperCase()}</Text>
          </View>
          <View>
            <Text style={styles.headerName}>{meta?.herName ?? "Her"}</Text>
            <Text style={styles.headerSub}>
              {filtered.length.toLocaleString()} messages
              {meta ? ` · imported ${new Date(meta.importedAt).toLocaleDateString()}` : ""}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleClearImport} hitSlop={12}>
          <Feather name="trash-2" size={18} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={[styles.searchRow, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Feather name="search" size={15} color={colors.mutedForeground} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search messages…"
          placeholderTextColor={colors.mutedForeground}
          value={search}
          onChangeText={setSearch}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Feather name="x" size={15} color={colors.mutedForeground} />
          </TouchableOpacity>
        ) : null}
      </View>

      <FlatList
        ref={listRef}
        data={listData}
        keyExtractor={(item) =>
          item.type === "day_header" ? item.key : item.data.id
        }
        contentContainerStyle={[styles.list, { paddingBottom: bottomPad + 20 }]}
        showsVerticalScrollIndicator={false}
        onLayout={() => {
          if (!search) listRef.current?.scrollToEnd({ animated: false });
        }}
        renderItem={({ item }) => {
          if (item.type === "day_header") {
            return (
              <View style={styles.dayHeader}>
                <View style={[styles.dayPill, { backgroundColor: colors.secondary }]}>
                  <Text style={[styles.dayText, { color: colors.mutedForeground }]}>{item.label}</Text>
                </View>
              </View>
            );
          }

          const msg = item.data;
          const isHer = !msg.isMe;

          return (
            <View style={[styles.bubbleRow, isHer ? styles.bubbleRowLeft : styles.bubbleRowRight]}>
              <View
                style={[
                  styles.bubble,
                  isHer
                    ? [styles.bubbleLeft, { backgroundColor: colors.card }]
                    : [styles.bubbleRight, { backgroundColor: "#DCF8C6" }],
                ]}
              >
                {isHer && (
                  <Text style={[styles.senderName, { color: herColor }]}>{msg.sender}</Text>
                )}
                <Text
                  style={[
                    styles.bubbleText,
                    { color: isHer ? colors.text : "#1a1a1a" },
                  ]}
                >
                  {msg.text}
                </Text>
                <Text style={[styles.bubbleTime, { color: isHer ? colors.mutedForeground : "#6b8f6b" }]}>
                  {formatTime(msg.timestamp)}
                  {!isHer && (
                    <Text> ✓✓</Text>
                  )}
                </Text>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyEmoji: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: "700" },
  emptySub: { fontSize: 14, textAlign: "center", paddingHorizontal: 40 },
  goImportBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
  goImportTxt: { color: "#FFF", fontSize: 15, fontWeight: "700" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 12,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  avatarCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: "#FFF", fontSize: 18, fontWeight: "700" },
  headerName: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  headerSub: { color: "rgba(255,255,255,0.65)", fontSize: 11, marginTop: 1 },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 4 },
  list: { paddingHorizontal: 12, paddingTop: 8, gap: 2 },
  dayHeader: { alignItems: "center", marginVertical: 10 },
  dayPill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  dayText: { fontSize: 12, fontWeight: "600" },
  bubbleRow: { flexDirection: "row", marginVertical: 2 },
  bubbleRowLeft: { justifyContent: "flex-start" },
  bubbleRowRight: { justifyContent: "flex-end" },
  bubble: {
    maxWidth: "78%",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  bubbleLeft: { borderTopLeftRadius: 2 },
  bubbleRight: { borderTopRightRadius: 2 },
  senderName: { fontSize: 12, fontWeight: "700", marginBottom: 1 },
  bubbleText: { fontSize: 15, lineHeight: 21 },
  bubbleTime: { fontSize: 11, alignSelf: "flex-end", marginTop: 2 },
});
