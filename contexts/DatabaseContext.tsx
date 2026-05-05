import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { deleteMediaFile } from "@/services/storage";

export interface Memory {
  id: string;
  title: string;
  description: string;
  date: number;
  tags: string[];
  mood: number;
  learned: string;
  isFavorite: boolean;
  isHidden: boolean;
  createdAt: number;
}

export interface JournalEntry {
  id: string;
  content: string;
  mood: number;
  date: number;
  imagePath?: string;
}

export interface MediaItem {
  id: string;
  memoryId: string;
  filePath: string;
  type: "image" | "video";
}

export interface Milestone {
  id: string;
  title: string;
  eventType: string;
  date: number;
  note: string;
  imagePath?: string;
  createdAt: number;
}

export interface Letter {
  id: string;
  title: string;
  body: string;
  mood: "missing" | "grateful" | "angry" | "hopeful" | "peaceful" | "heartbroken";
  createdAt: number;
  updatedAt: number;
}

export const LETTER_MOODS: { key: Letter["mood"]; label: string; emoji: string; color: string }[] = [
  { key: "missing", label: "Missing you", emoji: "🌙", color: "#6366F1" },
  { key: "grateful", label: "Grateful", emoji: "🌸", color: "#10B981" },
  { key: "angry", label: "Angry", emoji: "🔥", color: "#EF4444" },
  { key: "hopeful", label: "Hopeful", emoji: "🌤", color: "#F59E0B" },
  { key: "peaceful", label: "At peace", emoji: "🕊", color: "#06B6D4" },
  { key: "heartbroken", label: "Heartbroken", emoji: "💔", color: "#C4344A" },
];

export const MILESTONE_TYPES = [
  { key: "first_date", label: "First Date", emoji: "🌹" },
  { key: "first_kiss", label: "First Kiss", emoji: "💋" },
  { key: "first_trip", label: "First Trip", emoji: "✈️" },
  { key: "anniversary", label: "Anniversary", emoji: "🎉" },
  { key: "first_month", label: "First Month", emoji: "📅" },
  { key: "proposal", label: "Proposal", emoji: "💍" },
  { key: "fight_patch", label: "Made Up", emoji: "🤝" },
  { key: "special", label: "Special Moment", emoji: "⭐" },
  { key: "first_photo", label: "First Photo Together", emoji: "📸" },
  { key: "custom", label: "Custom", emoji: "💕" },
];

interface DatabaseContextValue {
  memories: Memory[];
  journals: JournalEntry[];
  milestones: Milestone[];
  letters: Letter[];
  addMemory: (m: Omit<Memory, "id" | "createdAt">) => Promise<string>;
  updateMemory: (id: string, m: Partial<Memory>) => Promise<void>;
  deleteMemory: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  addJournal: (j: Omit<JournalEntry, "id">) => Promise<void>;
  updateJournal: (id: string, j: Partial<JournalEntry>) => Promise<void>;
  deleteJournal: (id: string) => Promise<void>;
  addMilestone: (m: Omit<Milestone, "id" | "createdAt">) => Promise<string>;
  deleteMilestone: (id: string) => Promise<void>;
  addMedia: (item: Omit<MediaItem, "id">) => Promise<string>;
  getMediaForMemory: (memoryId: string) => Promise<MediaItem[]>;
  deleteMedia: (id: string, filePath: string) => Promise<void>;
  addLetter: (l: Omit<Letter, "id" | "createdAt" | "updatedAt">) => Promise<string>;
  updateLetter: (id: string, l: Partial<Omit<Letter, "id" | "createdAt">>) => Promise<void>;
  deleteLetter: (id: string) => Promise<void>;
  refreshMemories: () => Promise<void>;
  isLoading: boolean;
}

const DatabaseContext = createContext<DatabaseContextValue | null>(null);

const KEYS = {
  memories: "me-ammu:memories",
  journals: "me-ammu:journals",
  media: "me-ammu:media",
  milestones: "me-ammu:milestones",
  letters: "me-ammu:letters",
};

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

async function readJson<T>(key: string): Promise<T[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

async function writeJson<T>(key: string, data: T[]): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(data));
}

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [letters, setLetters] = useState<Letter[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAll = useCallback(async () => {
    const [mems, jnls, miles, lets] = await Promise.all([
      readJson<Memory>(KEYS.memories),
      readJson<JournalEntry>(KEYS.journals),
      readJson<Milestone>(KEYS.milestones),
      readJson<Letter>(KEYS.letters),
    ]);
    setMemories(mems.sort((a, b) => b.date - a.date));
    setJournals(jnls.sort((a, b) => b.date - a.date));
    setMilestones(miles.sort((a, b) => b.date - a.date));
    setLetters(lets.sort((a, b) => b.createdAt - a.createdAt));
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const refreshMemories = useCallback(async () => {
    const mems = await readJson<Memory>(KEYS.memories);
    setMemories(mems.sort((a, b) => b.date - a.date));
  }, []);

  const addMemory = useCallback(
    async (m: Omit<Memory, "id" | "createdAt">): Promise<string> => {
      const id = generateId();
      const newMemory: Memory = { ...m, id, createdAt: Date.now() };
      const existing = await readJson<Memory>(KEYS.memories);
      await writeJson(KEYS.memories, [newMemory, ...existing]);
      setMemories((prev) => [newMemory, ...prev].sort((a, b) => b.date - a.date));
      return id;
    },
    []
  );

  const updateMemory = useCallback(
    async (id: string, updates: Partial<Memory>): Promise<void> => {
      const existing = await readJson<Memory>(KEYS.memories);
      const updated = existing.map((m) => (m.id === id ? { ...m, ...updates } : m));
      await writeJson(KEYS.memories, updated);
      setMemories(updated.sort((a, b) => b.date - a.date));
    },
    []
  );

  const deleteMemory = useCallback(async (id: string): Promise<void> => {
    const allMedia = await readJson<MediaItem>(KEYS.media);
    for (const item of allMedia.filter((m) => m.memoryId === id)) {
      await deleteMediaFile(item.filePath);
    }
    await writeJson(KEYS.media, allMedia.filter((m) => m.memoryId !== id));
    const existing = await readJson<Memory>(KEYS.memories);
    const updated = existing.filter((m) => m.id !== id);
    await writeJson(KEYS.memories, updated);
    setMemories(updated.sort((a, b) => b.date - a.date));
  }, []);

  const toggleFavorite = useCallback(async (id: string): Promise<void> => {
    const existing = await readJson<Memory>(KEYS.memories);
    const updated = existing.map((m) =>
      m.id === id ? { ...m, isFavorite: !m.isFavorite } : m
    );
    await writeJson(KEYS.memories, updated);
    setMemories(updated.sort((a, b) => b.date - a.date));
  }, []);

  const addJournal = useCallback(
    async (j: Omit<JournalEntry, "id">): Promise<void> => {
      const newEntry: JournalEntry = { ...j, id: generateId() };
      const existing = await readJson<JournalEntry>(KEYS.journals);
      await writeJson(KEYS.journals, [newEntry, ...existing]);
      setJournals((prev) => [newEntry, ...prev].sort((a, b) => b.date - a.date));
    },
    []
  );

  const updateJournal = useCallback(
    async (id: string, updates: Partial<JournalEntry>): Promise<void> => {
      const existing = await readJson<JournalEntry>(KEYS.journals);
      const updated = existing.map((j) => (j.id === id ? { ...j, ...updates } : j));
      await writeJson(KEYS.journals, updated);
      setJournals(updated.sort((a, b) => b.date - a.date));
    },
    []
  );

  const deleteJournal = useCallback(async (id: string): Promise<void> => {
    const existing = await readJson<JournalEntry>(KEYS.journals);
    const updated = existing.filter((j) => j.id !== id);
    await writeJson(KEYS.journals, updated);
    setJournals(updated.sort((a, b) => b.date - a.date));
  }, []);

  const addMilestone = useCallback(
    async (m: Omit<Milestone, "id" | "createdAt">): Promise<string> => {
      const id = generateId();
      const newMilestone: Milestone = { ...m, id, createdAt: Date.now() };
      const existing = await readJson<Milestone>(KEYS.milestones);
      await writeJson(KEYS.milestones, [newMilestone, ...existing]);
      setMilestones((prev) => [newMilestone, ...prev].sort((a, b) => b.date - a.date));
      return id;
    },
    []
  );

  const deleteMilestone = useCallback(async (id: string): Promise<void> => {
    const existing = await readJson<Milestone>(KEYS.milestones);
    const milestone = existing.find((m) => m.id === id);
    if (milestone?.imagePath) await deleteMediaFile(milestone.imagePath);
    const updated = existing.filter((m) => m.id !== id);
    await writeJson(KEYS.milestones, updated);
    setMilestones(updated.sort((a, b) => b.date - a.date));
  }, []);

  const addMedia = useCallback(
    async (item: Omit<MediaItem, "id">): Promise<string> => {
      const newItem: MediaItem = { ...item, id: generateId() };
      const existing = await readJson<MediaItem>(KEYS.media);
      await writeJson(KEYS.media, [...existing, newItem]);
      return newItem.id;
    },
    []
  );

  const getMediaForMemory = useCallback(
    async (memoryId: string): Promise<MediaItem[]> => {
      const all = await readJson<MediaItem>(KEYS.media);
      return all.filter((m) => m.memoryId === memoryId);
    },
    []
  );

  const deleteMedia = useCallback(
    async (id: string, filePath: string): Promise<void> => {
      await deleteMediaFile(filePath);
      const existing = await readJson<MediaItem>(KEYS.media);
      await writeJson(KEYS.media, existing.filter((m) => m.id !== id));
    },
    []
  );

  const addLetter = useCallback(
    async (l: Omit<Letter, "id" | "createdAt" | "updatedAt">): Promise<string> => {
      const id = generateId();
      const now = Date.now();
      const newLetter: Letter = { ...l, id, createdAt: now, updatedAt: now };
      const existing = await readJson<Letter>(KEYS.letters);
      await writeJson(KEYS.letters, [newLetter, ...existing]);
      setLetters((prev) => [newLetter, ...prev].sort((a, b) => b.createdAt - a.createdAt));
      return id;
    },
    []
  );

  const updateLetter = useCallback(
    async (id: string, updates: Partial<Omit<Letter, "id" | "createdAt">>): Promise<void> => {
      const existing = await readJson<Letter>(KEYS.letters);
      const updated = existing.map((l) =>
        l.id === id ? { ...l, ...updates, updatedAt: Date.now() } : l
      );
      await writeJson(KEYS.letters, updated);
      setLetters(updated.sort((a, b) => b.createdAt - a.createdAt));
    },
    []
  );

  const deleteLetter = useCallback(async (id: string): Promise<void> => {
    const existing = await readJson<Letter>(KEYS.letters);
    const updated = existing.filter((l) => l.id !== id);
    await writeJson(KEYS.letters, updated);
    setLetters(updated.sort((a, b) => b.createdAt - a.createdAt));
  }, []);

  return (
    <DatabaseContext.Provider
      value={{
        memories,
        journals,
        milestones,
        letters,
        addMemory,
        updateMemory,
        deleteMemory,
        toggleFavorite,
        addJournal,
        updateJournal,
        deleteJournal,
        addMilestone,
        deleteMilestone,
        addMedia,
        getMediaForMemory,
        deleteMedia,
        addLetter,
        updateLetter,
        deleteLetter,
        refreshMemories,
        isLoading,
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase(): DatabaseContextValue {
  const ctx = useContext(DatabaseContext);
  if (!ctx) throw new Error("useDatabase must be inside DatabaseProvider");
  return ctx;
}
