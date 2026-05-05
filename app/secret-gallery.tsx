import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AnimatedFadeIn } from "@/components/AnimatedFadeIn";
import { PhotoCarousel } from "@/components/PhotoCarousel";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";

const PIN_KEY = "@me_ammu/secret_gallery_pin";
const ITEMS_KEY = "@me_ammu/secret_gallery_items";
const { width } = Dimensions.get("window");
const COLS = 3;
const THUMB = (width - 40 - 8 * (COLS - 1)) / COLS;

async function hashPIN(pin: string): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pin));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
  }
  return pin;
}

type Stage = "enter_pin" | "setup_pin" | "confirm_pin" | "gallery";

export default function SecretGalleryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [stage, setStage] = useState<Stage>("enter_pin");
  const [storedPin, setStoredPin] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [setupPin, setSetupPin] = useState("");
  const [error, setError] = useState("");
  const [items, setItems] = useState<string[]>([]);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const [carouselVisible, setCarouselVisible] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    AsyncStorage.getItem(PIN_KEY).then((p) => {
      setStoredPin(p);
      setStage(p ? "enter_pin" : "setup_pin");
    });
  }, []);

  const loadItems = useCallback(async () => {
    const raw = await AsyncStorage.getItem(ITEMS_KEY);
    setItems(raw ? JSON.parse(raw) : []);
  }, []);

  const saveItems = async (newItems: string[]) => {
    setItems(newItems);
    await AsyncStorage.setItem(ITEMS_KEY, JSON.stringify(newItems));
  };

  const pressDigit = async (d: string) => {
    const next = (stage === "confirm_pin" ? pin : stage === "setup_pin" ? pin : pin) + d;
    setPin(next);
    setError("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (next.length === 4) {
      if (stage === "setup_pin") {
        setSetupPin(next);
        setPin("");
        setStage("confirm_pin");
      } else if (stage === "confirm_pin") {
        if (next === setupPin) {
          const hashed = await hashPIN(next);
          await AsyncStorage.setItem(PIN_KEY, hashed);
          setStoredPin(hashed);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setStage("gallery");
          loadItems();
        } else {
          setError("PINs don't match. Try again.");
          setPin("");
          setSetupPin("");
          setStage("setup_pin");
        }
      } else if (stage === "enter_pin") {
        const hashed = await hashPIN(next);
        if (hashed === storedPin) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setStage("gallery");
          loadItems();
        } else {
          setError("Wrong PIN. Try again.");
          setPin("");
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      }
      if (stage !== "setup_pin") setPin("");
    }
  };

  const backspace = () => {
    setPin((p) => p.slice(0, -1));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const addPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert("Permission needed", "Allow photo access."); return; }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.9, allowsMultipleSelection: true });
    if (!res.canceled) {
      const uris = res.assets.map((a) => a.uri);
      await saveItems([...items, ...uris]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const deletePhoto = (uri: string) => {
    Alert.alert("Remove photo?", "This removes it from the secret gallery only.", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: async () => { await saveItems(items.filter((i) => i !== uri)); } },
    ]);
  };

  const resetGalleryPin = () => {
    Alert.alert("Reset Secret Gallery", "This will delete the PIN and all secret gallery photos permanently.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reset Everything",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.multiRemove([PIN_KEY, ITEMS_KEY]);
          router.back();
        },
      },
    ]);
  };

  /* ── PIN Pad UI ── */
  const pinTitle =
    stage === "setup_pin" ? "Set Secret Gallery PIN" :
    stage === "confirm_pin" ? "Confirm Your PIN" :
    "Enter Secret Gallery PIN";

  const pinSub =
    stage === "setup_pin" ? "Create a 4-digit PIN for your private gallery" :
    stage === "confirm_pin" ? "Enter the same PIN again to confirm" :
    "Your private space is protected";

  if (stage !== "gallery") {
    return (
      <View style={[styles.pinContainer, { backgroundColor: colors.background, paddingTop: topPad }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="x" size={22} color={colors.mutedForeground} />
        </TouchableOpacity>

        <View style={styles.pinLock}>
          <View style={[styles.lockCircle, { backgroundColor: "#2D3561" }]}>
            <Feather name="lock" size={32} color="#FFF" />
          </View>
          <Text style={[styles.pinTitle, { color: colors.navy }]}>{pinTitle}</Text>
          <Text style={[styles.pinSub, { color: colors.mutedForeground }]}>{pinSub}</Text>
        </View>

        <View style={styles.pinDots}>
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={[
                styles.pinDot,
                {
                  backgroundColor: i < pin.length ? colors.navy : "transparent",
                  borderColor: colors.navy,
                },
              ]}
            />
          ))}
        </View>

        {error ? <Text style={[styles.pinError, { color: "#EF4444" }]}>{error}</Text> : <View style={{ height: 20 }} />}

        <View style={styles.numPad}>
          {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((d, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.numKey, { backgroundColor: d ? colors.card : "transparent" }]}
              onPress={() => d === "⌫" ? backspace() : d ? pressDigit(d) : null}
              disabled={!d && d !== "0"}
              activeOpacity={0.7}
            >
              <Text style={[styles.numTxt, { color: d === "⌫" ? colors.mutedForeground : colors.navy }]}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  /* ── Gallery UI ── */
  const carouselPhotos = items.map((uri) => ({ uri, type: "image" as const }));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.galHeader, { paddingTop: topPad + 16 }]}>
        <View style={styles.galHeaderLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backCircle}>
            <Feather name="arrow-left" size={18} color={colors.navy} />
          </TouchableOpacity>
          <View>
            <Text style={[styles.galTitle, { color: colors.navy }]}>🔒 Secret Gallery</Text>
            <Text style={[styles.galSub, { color: colors.mutedForeground }]}>{items.length} private photo{items.length !== 1 ? "s" : ""}</Text>
          </View>
        </View>
        <View style={styles.galActions}>
          <TouchableOpacity style={[styles.galBtn, { backgroundColor: colors.primary }]} onPress={addPhoto}>
            <Feather name="plus" size={16} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.galBtn, { backgroundColor: colors.card }]} onPress={resetGalleryPin}>
            <Feather name="trash-2" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </View>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🔐</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Your private gallery</Text>
          <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
            Add photos only you can see — locked behind your secret PIN
          </Text>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            onPress={addPhoto}
          >
            <Feather name="plus" size={15} color="#FFF" />
            <Text style={styles.addBtnTxt}>Add Photos</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={items}
          numColumns={COLS}
          keyExtractor={(uri, i) => uri + i}
          contentContainerStyle={[styles.grid, { paddingBottom: bottomPad + 80 }]}
          columnWrapperStyle={styles.row}
          renderItem={({ item, index }) => (
            <AnimatedFadeIn delay={index * 20}>
              <TouchableOpacity
                onPress={() => { setCarouselIdx(index); setCarouselVisible(true); }}
                onLongPress={() => deletePhoto(item)}
                style={[styles.thumb, { width: THUMB, height: THUMB }]}
                activeOpacity={0.85}
              >
                <Image source={{ uri: item }} style={{ width: THUMB, height: THUMB, borderRadius: 12 }} contentFit="cover" />
              </TouchableOpacity>
            </AnimatedFadeIn>
          )}
        />
      )}

      <PhotoCarousel
        photos={carouselPhotos}
        initialIndex={carouselIdx}
        visible={carouselVisible}
        onClose={() => setCarouselVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pinContainer: { flex: 1, alignItems: "center" },
  backBtn: { position: "absolute", top: 56, right: 24, padding: 8 },

  pinLock: { alignItems: "center", gap: 10, marginTop: 40 },
  lockCircle: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  pinTitle: { fontSize: 22, fontWeight: "800", letterSpacing: -0.3 },
  pinSub: { fontSize: 13, textAlign: "center", paddingHorizontal: 40 },

  pinDots: { flexDirection: "row", gap: 16, marginTop: 32 },
  pinDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2 },
  pinError: { fontSize: 13, fontWeight: "600", marginTop: 8 },

  numPad: { flexDirection: "row", flexWrap: "wrap", width: 300, gap: 16, marginTop: 20, justifyContent: "center" },
  numKey: { width: 82, height: 82, borderRadius: 41, alignItems: "center", justifyContent: "center" },
  numTxt: { fontSize: 24, fontWeight: "600" },

  galHeader: { paddingHorizontal: 20, paddingBottom: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  galHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  backCircle: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "#F0F0F0" },
  galTitle: { fontSize: 20, fontWeight: "800" },
  galSub: { fontSize: 12, marginTop: 1 },
  galActions: { flexDirection: "row", gap: 8 },
  galBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },

  grid: { paddingHorizontal: 20, paddingTop: 4 },
  row: { gap: 8, marginBottom: 8 },
  thumb: { borderRadius: 12, overflow: "hidden" },

  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: 20, fontWeight: "700" },
  emptySub: { fontSize: 14, textAlign: "center", paddingHorizontal: 40, lineHeight: 20 },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 24, paddingVertical: 13, borderRadius: 14, marginTop: 8 },
  addBtnTxt: { color: "#FFF", fontSize: 14, fontWeight: "700" },
});
