import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";

const KEY = "@me_ammu/together_since";

export interface AnniversaryInfo {
  togetherSince: Date | null;
  daysTogether: number;
  nextAnniversary: Date | null;
  daysUntilAnniversary: number;
  yearsCompleted: number;
  isAnniversaryToday: boolean;
  setTogetherSince: (date: Date) => Promise<void>;
  clearTogetherSince: () => Promise<void>;
  isLoaded: boolean;
}

export function useAnniversary(): AnniversaryInfo {
  const [togetherSince, setDate] = useState<Date | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((v) => {
      if (v) setDate(new Date(parseInt(v, 10)));
      setIsLoaded(true);
    });
  }, []);

  const setTogetherSince = useCallback(async (date: Date) => {
    await AsyncStorage.setItem(KEY, date.getTime().toString());
    setDate(date);
  }, []);

  const clearTogetherSince = useCallback(async () => {
    await AsyncStorage.removeItem(KEY);
    setDate(null);
  }, []);

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  let daysTogether = 0;
  let nextAnniversary: Date | null = null;
  let daysUntilAnniversary = 0;
  let yearsCompleted = 0;
  let isAnniversaryToday = false;

  if (togetherSince) {
    const since = new Date(togetherSince);
    since.setHours(0, 0, 0, 0);
    daysTogether = Math.floor((now.getTime() - since.getTime()) / (1000 * 60 * 60 * 24));

    const thisYear = now.getFullYear();
    yearsCompleted = thisYear - since.getFullYear();

    // Next anniversary = same month/day this year or next year
    let next = new Date(thisYear, since.getMonth(), since.getDate());
    next.setHours(0, 0, 0, 0);
    if (next.getTime() < now.getTime()) {
      next = new Date(thisYear + 1, since.getMonth(), since.getDate());
      next.setHours(0, 0, 0, 0);
      yearsCompleted = thisYear - since.getFullYear();
    } else if (next.getTime() === now.getTime()) {
      isAnniversaryToday = true;
      yearsCompleted = thisYear - since.getFullYear();
    }

    nextAnniversary = next;
    daysUntilAnniversary = Math.round(
      (next.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  return {
    togetherSince,
    daysTogether,
    nextAnniversary,
    daysUntilAnniversary,
    yearsCompleted,
    isAnniversaryToday,
    setTogetherSince,
    clearTogetherSince,
    isLoaded,
  };
}
