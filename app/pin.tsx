import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { useColors } from "@/hooks/useColors";
import { Feather } from "@expo/vector-icons";

const KEYS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["", "0", "del"],
];

export default function PINScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { hasPIN, setupPIN, unlockWithPIN, unlockWithBiometric, biometricEnabled, biometricAvailable, isLoading } = useAuth();
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [step, setStep] = useState<"enter" | "setup" | "confirm">("enter");
  const [error, setError] = useState("");
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isLoading) {
      setStep(hasPIN ? "enter" : "setup");
    }
  }, [hasPIN, isLoading]);

  useEffect(() => {
    if (step === "enter" && biometricEnabled && biometricAvailable) {
      unlockWithBiometric();
    }
  }, [step]);

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  };

  const handleKey = async (key: string) => {
    if (key === "") return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (key === "del") {
      setPin((p) => p.slice(0, -1));
      setError("");
      return;
    }

    const newPin = pin + key;
    setPin(newPin);

    if (newPin.length < 4) return;

    if (step === "setup") {
      setConfirmPin(newPin);
      setPin("");
      setStep("confirm");
    } else if (step === "confirm") {
      if (newPin === confirmPin) {
        await setupPIN(newPin);
      } else {
        setError("PINs don't match. Try again.");
        shake();
        setPin("");
        setStep("setup");
        setConfirmPin("");
      }
    } else {
      const ok = await unlockWithPIN(newPin);
      if (!ok) {
        setError("Incorrect PIN");
        shake();
        setPin("");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  };

  const topPadding = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: topPadding }]}>
      <View style={styles.top}>
        <Image
          source={require("../assets/images/icon.png")}
          style={styles.logo}
          contentFit="contain"
        />
        <Text style={[styles.appName, { color: colors.navy }]}>Me & Ammu</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Memories. Moments. Forever.
        </Text>
      </View>

      <View style={styles.middle}>
        <Text style={[styles.prompt, { color: colors.text }]}>
          {step === "setup"
            ? "Create a 4-digit PIN"
            : step === "confirm"
            ? "Confirm your PIN"
            : "Enter your PIN"}
        </Text>

        <Animated.View
          style={[styles.dots, { transform: [{ translateX: shakeAnim }] }]}
        >
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    i < pin.length ? colors.primary : colors.border,
                },
              ]}
            />
          ))}
        </Animated.View>

        {error ? (
          <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>
        ) : null}
      </View>

      <View style={[styles.keypad, { paddingBottom: Math.max(insets.bottom + 24, 48) }]}>
        {KEYS.map((row, ri) => (
          <View key={ri} style={styles.keyRow}>
            {row.map((key, ki) => (
              <TouchableOpacity
                key={ki}
                style={[
                  styles.key,
                  {
                    backgroundColor: key === "del" || key === "" ? "transparent" : colors.card,
                  },
                ]}
                onPress={() => handleKey(key)}
                activeOpacity={0.7}
                disabled={key === ""}
              >
                {key === "del" ? (
                  <Feather name="delete" size={22} color={colors.text} />
                ) : (
                  <Text style={[styles.keyText, { color: colors.text }]}>{key}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {step === "enter" && biometricEnabled && biometricAvailable && (
          <TouchableOpacity
            style={styles.bioBtn}
            onPress={unlockWithBiometric}
            activeOpacity={0.7}
          >
            <Feather name="activity" size={20} color={colors.primary} />
            <Text style={[styles.bioText, { color: colors.primary }]}>Use Biometric</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
  },
  top: {
    alignItems: "center",
    paddingTop: 32,
    gap: 8,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 20,
  },
  appName: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    letterSpacing: 1,
  },
  middle: {
    alignItems: "center",
    gap: 24,
  },
  prompt: {
    fontSize: 16,
    fontWeight: "500",
  },
  dots: {
    flexDirection: "row",
    gap: 16,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  error: {
    fontSize: 14,
    fontWeight: "500",
  },
  keypad: {
    width: "100%",
    alignItems: "center",
    gap: 12,
  },
  keyRow: {
    flexDirection: "row",
    gap: 16,
  },
  key: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2D2926",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  keyText: {
    fontSize: 26,
    fontWeight: "400",
  },
  bioBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    padding: 12,
  },
  bioText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
