import { useRouter, useSegments } from "expo-router";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  authenticateWithBiometric,
  checkBiometricAvailable,
  clearPIN,
  hasPINSet,
  isBiometricEnabled,
  setBiometricEnabled,
  storePIN,
  verifyPIN,
} from "@/services/auth";

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  hasPIN: boolean;
  biometricAvailable: boolean;
  biometricEnabled: boolean;
  setupPIN: (pin: string) => Promise<void>;
  unlockWithPIN: (pin: string) => Promise<boolean>;
  unlockWithBiometric: () => Promise<boolean>;
  toggleBiometric: (enabled: boolean) => Promise<void>;
  lock: () => void;
  removePIN: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPIN, setHasPIN] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabledState] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    (async () => {
      const [pinSet, bioAvail, bioEnabled] = await Promise.all([
        hasPINSet(),
        checkBiometricAvailable(),
        isBiometricEnabled(),
      ]);
      setHasPIN(pinSet);
      setBiometricAvailable(bioAvail);
      setBiometricEnabledState(bioEnabled);
      setIsLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const inPin = segments[0] === "pin";
    if (!isAuthenticated && !inPin) {
      router.replace("/pin");
    } else if (isAuthenticated && inPin) {
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, isLoading, segments]);

  const setupPIN = useCallback(async (pin: string) => {
    await storePIN(pin);
    setHasPIN(true);
    setIsAuthenticated(true);
    router.replace("/(tabs)");
  }, [router]);

  const unlockWithPIN = useCallback(async (pin: string): Promise<boolean> => {
    const ok = await verifyPIN(pin);
    if (ok) {
      setIsAuthenticated(true);
      router.replace("/(tabs)");
    }
    return ok;
  }, [router]);

  const unlockWithBiometric = useCallback(async (): Promise<boolean> => {
    const ok = await authenticateWithBiometric();
    if (ok) {
      setIsAuthenticated(true);
      router.replace("/(tabs)");
    }
    return ok;
  }, [router]);

  const toggleBiometric = useCallback(async (enabled: boolean) => {
    await setBiometricEnabled(enabled);
    setBiometricEnabledState(enabled);
  }, []);

  const lock = useCallback(() => {
    setIsAuthenticated(false);
    router.replace("/pin");
  }, [router]);

  const removePIN = useCallback(async () => {
    await clearPIN();
    setHasPIN(false);
    setIsAuthenticated(true);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        hasPIN,
        biometricAvailable,
        biometricEnabled,
        setupPIN,
        unlockWithPIN,
        unlockWithBiometric,
        toggleBiometric,
        lock,
        removePIN,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
