const BASE = `/api/mystic`;

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((err as { error?: string }).error ?? res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ─── Types ─────────────────────────────────────────────────────────────────

export type EmotionalStatus = "loved" | "liked" | "somehow" | "really";
export type FlagType = "red" | "yellow" | "green" | "forest" | "magma";
export type ReadingType = "daily" | "love" | "career";

export interface MysticProfile {
  id: number;
  subscriptionTier: "free" | "premium";
  createdAt: string;
}

export interface Ship {
  id: number;
  userId: number;
  shipName: string;
  rankPosition: number;
  createdAt: string;
}

export interface Actress {
  id: number;
  userId: number;
  name: string;
  rankPosition: number;
  createdAt: string;
}

export interface Series {
  id: number;
  userId: number;
  title: string;
  status: EmotionalStatus;
  createdAt: string;
}

export interface Character {
  id: number;
  seriesId: number;
  name: string;
  flagType: FlagType;
  notes: string | null;
  createdAt: string;
}

export interface TarotCard {
  name: string;
  suit: string;
  meaning: string;
  isReversed: boolean;
}

export interface TarotReading {
  id: number;
  userId: number;
  cards: TarotCard[];
  readingType: ReadingType;
  createdAt: string;
}

export interface AstrologyProfile {
  id: number;
  userId: number;
  birthDate: string;
  birthTime: string | null;
  birthLocation: string | null;
  zodiacSign: string;
  element: string;
  rulingPlanet: string;
  profileData: Record<string, unknown>;
  createdAt: string;
}

export interface DashboardSummary {
  totalShips: number;
  totalActresses: number;
  totalSeries: number;
  totalCharacters: number;
  isPremium: boolean;
  limits: { ships: number; actresses: number };
  todayTarotDone: boolean;
  hasAstrology: boolean;
}

// ─── API functions ──────────────────────────────────────────────────────────

export const mysticProfileApi = {
  me: () => req<MysticProfile>("GET", "/me"),
  upgrade: () => req<MysticProfile>("POST", "/profile/upgrade"),
};

export const shipsApi = {
  list: () => req<Ship[]>("GET", "/ships"),
  create: (data: { shipName: string; rankPosition: number }) =>
    req<Ship>("POST", "/ships", data),
  remove: (id: number) => req<void>("DELETE", `/ships/${id}`),
};

export const actressesApi = {
  list: () => req<Actress[]>("GET", "/actresses"),
  create: (data: { name: string; rankPosition: number }) =>
    req<Actress>("POST", "/actresses", data),
  remove: (id: number) => req<void>("DELETE", `/actresses/${id}`),
};

export const seriesApi = {
  list: () => req<Series[]>("GET", "/series"),
  create: (data: { title: string; status: EmotionalStatus }) =>
    req<Series>("POST", "/series", data),
  update: (id: number, data: Partial<{ title: string; status: EmotionalStatus }>) =>
    req<Series>("PUT", `/series/${id}`, data),
  remove: (id: number) => req<void>("DELETE", `/series/${id}`),
};

export const charactersApi = {
  list: (seriesId: number) => req<Character[]>("GET", `/characters/${seriesId}`),
  create: (data: { seriesId: number; name: string; flagType: FlagType; notes?: string }) =>
    req<Character>("POST", "/characters", data),
  update: (id: number, data: Partial<{ name: string; flagType: FlagType; notes: string }>) =>
    req<Character>("PUT", `/characters/${id}`, data),
  remove: (id: number) => req<void>("DELETE", `/characters/${id}`),
};

export const tarotApi = {
  draw: (readingType?: ReadingType) =>
    req<TarotReading>("GET", `/tarot/draw${readingType ? `?type=${readingType}` : ""}`),
  history: () => req<TarotReading[]>("GET", "/tarot/history"),
};

export const astrologyApi = {
  profile: () => req<AstrologyProfile | null>("GET", "/astrology/profile"),
  generate: (data: { birthDate: string; birthTime?: string; birthLocation?: string }) =>
    req<AstrologyProfile>("POST", "/astrology/generate", data),
};

export const dashboardApi = {
  summary: () => req<DashboardSummary>("GET", "/dashboard/summary"),
};

// ─── Emoji / label helpers ──────────────────────────────────────────────────

export const EMOTIONAL_STATUS_EMOJI: Record<EmotionalStatus, string> = {
  loved: "❤️", liked: "👍", somehow: "😐", really: "🔥",
};
export const EMOTIONAL_STATUS_LABEL: Record<EmotionalStatus, string> = {
  loved: "Loved", liked: "Liked", somehow: "Somehow", really: "Really",
};
export const FLAG_EMOJI: Record<FlagType, string> = {
  red: "🔴", yellow: "🟡", green: "🟢", forest: "🌳", magma: "🔥",
};
export const FLAG_LABEL: Record<FlagType, string> = {
  red: "Red Flag", yellow: "Yellow Flag", green: "Green Flag", forest: "Green Forest", magma: "Red Magma",
};
export const READING_TYPE_EMOJI: Record<ReadingType, string> = {
  daily: "🌙", love: "💕", career: "⭐",
};
export const READING_TYPE_LABEL: Record<ReadingType, string> = {
  daily: "Daily Guidance", love: "Love Reading", career: "Career Path",
};
export const FREE_LIMIT = 3;
export const PREMIUM_LIMIT = 30;
