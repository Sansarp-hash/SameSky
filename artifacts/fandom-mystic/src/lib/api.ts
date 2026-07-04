const BASE = `/api/mystic`;

// ─── Auth ──────────────────────────────────────────────────────────────────

export function getToken(): string | null {
  return localStorage.getItem("fm_token");
}

export function setToken(token: string) {
  localStorage.setItem("fm_token", token);
}

export function clearToken() {
  localStorage.removeItem("fm_token");
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: authHeaders(),
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

export type SubscriptionTier = "free" | "premium";

export interface FMUser {
  id: number;
  username: string;
  email: string;
  subscriptionTier: SubscriptionTier;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: FMUser;
}

export type EmotionalStatus = "loved" | "liked" | "somehow" | "really";

export type FlagType =
  | "red_flag"
  | "yellow_flag"
  | "green_flag"
  | "green_forest"
  | "red_magma";

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
  seriesName: string;
  emotionalStatus: EmotionalStatus;
  createdAt: string;
}

export interface Character {
  id: number;
  userId: number;
  seriesId: number;
  characterName: string;
  flagType: FlagType;
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
  createdAt: string;
}

export interface AstrologyProfile {
  id: number;
  userId: number;
  birthDate: string;
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
  limits: {
    ships: number;
    actresses: number;
  };
  todayTarotDone: boolean;
  hasAstrology: boolean;
}

// ─── Auth API ──────────────────────────────────────────────────────────────

export const authApi = {
  register: (data: { username: string; email: string; password: string }) =>
    req<AuthResponse>("POST", "/auth/register", data),
  login: (data: { email: string; password: string }) =>
    req<AuthResponse>("POST", "/auth/login", data),
  me: () => req<FMUser>("GET", "/auth/me"),
};

// ─── Ships API ─────────────────────────────────────────────────────────────

export const shipsApi = {
  list: () => req<Ship[]>("GET", "/ships"),
  create: (data: { shipName: string; rankPosition: number }) =>
    req<Ship>("POST", "/ships", data),
  update: (id: number, data: Partial<{ shipName: string; rankPosition: number }>) =>
    req<Ship>("PATCH", `/ships/${id}`, data),
  remove: (id: number) => req<void>("DELETE", `/ships/${id}`),
};

// ─── Actresses API ──────────────────────────────────────────────────────────

export const actressesApi = {
  list: () => req<Actress[]>("GET", "/actresses"),
  create: (data: { name: string; rankPosition: number }) =>
    req<Actress>("POST", "/actresses", data),
  update: (id: number, data: Partial<{ name: string; rankPosition: number }>) =>
    req<Actress>("PATCH", `/actresses/${id}`, data),
  remove: (id: number) => req<void>("DELETE", `/actresses/${id}`),
};

// ─── Series API ─────────────────────────────────────────────────────────────

export const seriesApi = {
  list: () => req<Series[]>("GET", "/series"),
  create: (data: { seriesName: string; emotionalStatus: EmotionalStatus }) =>
    req<Series>("POST", "/series", data),
  update: (id: number, data: Partial<{ seriesName: string; emotionalStatus: EmotionalStatus }>) =>
    req<Series>("PATCH", `/series/${id}`, data),
  remove: (id: number) => req<void>("DELETE", `/series/${id}`),
};

// ─── Characters API ──────────────────────────────────────────────────────────

export const charactersApi = {
  list: (seriesId?: number) =>
    req<Character[]>("GET", seriesId ? `/characters?seriesId=${seriesId}` : "/characters"),
  create: (data: { seriesId: number; characterName: string; flagType: FlagType }) =>
    req<Character>("POST", "/characters", data),
  update: (id: number, data: Partial<{ characterName: string; flagType: FlagType }>) =>
    req<Character>("PATCH", `/characters/${id}`, data),
  remove: (id: number) => req<void>("DELETE", `/characters/${id}`),
};

// ─── Tarot API ───────────────────────────────────────────────────────────────

export const tarotApi = {
  draw: () => req<TarotReading>("POST", "/tarot/draw"),
  history: () => req<TarotReading[]>("GET", "/tarot/history"),
};

// ─── Astrology API ───────────────────────────────────────────────────────────

export const astrologyApi = {
  profile: () => req<AstrologyProfile | null>("GET", "/astrology/profile"),
  generate: (data: { birthDate: string }) =>
    req<AstrologyProfile>("POST", "/astrology/generate", data),
};

// ─── Dashboard API ────────────────────────────────────────────────────────────

export const dashboardApi = {
  summary: () => req<DashboardSummary>("GET", "/dashboard/summary"),
};

// ─── Profile API ──────────────────────────────────────────────────────────────

export const profileApi = {
  upgrade: () => req<FMUser>("POST", "/profile/upgrade"),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    req<void>("POST", "/profile/change-password", data),
};

// ─── Emoji helpers ────────────────────────────────────────────────────────────

export const EMOTIONAL_STATUS_EMOJI: Record<EmotionalStatus, string> = {
  loved: "❤️",
  liked: "👍",
  somehow: "😐",
  really: "🔥",
};

export const EMOTIONAL_STATUS_LABEL: Record<EmotionalStatus, string> = {
  loved: "Loved",
  liked: "Liked",
  somehow: "Somehow",
  really: "Really",
};

export const FLAG_EMOJI: Record<FlagType, string> = {
  red_flag: "🔴",
  yellow_flag: "🟡",
  green_flag: "🟢",
  green_forest: "🌳",
  red_magma: "🔥",
};

export const FLAG_LABEL: Record<FlagType, string> = {
  red_flag: "Red Flag",
  yellow_flag: "Yellow Flag",
  green_flag: "Green Flag",
  green_forest: "Green Forest",
  red_magma: "Red Magma",
};

export const FREE_LIMIT = 3;
export const PREMIUM_LIMIT = 30;
