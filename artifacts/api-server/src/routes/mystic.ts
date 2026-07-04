import { Router } from "express";
import { db } from "@workspace/db";
import {
  fmUsersTable,
  fmShipsTable,
  fmActressesTable,
  fmSeriesTable,
  fmCharactersTable,
  fmTarotReadingsTable,
  fmAstrologyProfilesTable,
} from "@workspace/db";
import { eq, and, count } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = Router();

const JWT_SECRET = process.env.SESSION_SECRET ?? "mystic-dev-secret";
const FREE_LIMIT = 3;
const PREMIUM_LIMIT = 30;

// ─── Auth middleware ────────────────────────────────────────────────────────

interface JwtPayload {
  userId: number;
}

function authenticate(req: any, res: any, next: any) {
  const auth = req.headers.authorization as string | undefined;
  if (!auth?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.fmUserId = payload.userId;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid token" });
  }
}

function formatUser(u: typeof fmUsersTable.$inferSelect) {
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    subscriptionTier: u.subscriptionTier,
    createdAt: u.createdAt,
  };
}

// ─── Auth ───────────────────────────────────────────────────────────────────

router.post("/auth/register", async (req, res) => {
  const { username, email, password } = req.body ?? {};
  if (!username || !email || !password) {
    return res.status(400).json({ error: "username, email, and password are required" });
  }
  const existing = await db
    .select()
    .from(fmUsersTable)
    .where(eq(fmUsersTable.email, email))
    .limit(1);
  if (existing.length > 0) {
    return res.status(409).json({ error: "Email already registered" });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const [user] = await db
    .insert(fmUsersTable)
    .values({ username, email, passwordHash })
    .returning();
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "30d" });
  return res.status(201).json({ token, user: formatUser(user) });
});

router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }
  const [user] = await db
    .select()
    .from(fmUsersTable)
    .where(eq(fmUsersTable.email, email))
    .limit(1);
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "30d" });
  return res.json({ token, user: formatUser(user) });
});

router.get("/auth/me", authenticate, async (req: any, res) => {
  const [user] = await db
    .select()
    .from(fmUsersTable)
    .where(eq(fmUsersTable.id, req.fmUserId))
    .limit(1);
  if (!user) return res.status(404).json({ error: "User not found" });
  return res.json(formatUser(user));
});

// ─── Ships ──────────────────────────────────────────────────────────────────

router.get("/ships", authenticate, async (req: any, res) => {
  const ships = await db
    .select()
    .from(fmShipsTable)
    .where(eq(fmShipsTable.userId, req.fmUserId))
    .orderBy(fmShipsTable.rankPosition);
  return res.json(ships);
});

router.post("/ships", authenticate, async (req: any, res) => {
  const { shipName, rankPosition } = req.body ?? {};
  if (!shipName) return res.status(400).json({ error: "shipName is required" });
  const [user] = await db.select().from(fmUsersTable).where(eq(fmUsersTable.id, req.fmUserId)).limit(1);
  const limit = user?.subscriptionTier === "premium" ? PREMIUM_LIMIT : FREE_LIMIT;
  const [{ value: existingCount }] = await db
    .select({ value: count() })
    .from(fmShipsTable)
    .where(eq(fmShipsTable.userId, req.fmUserId));
  if (Number(existingCount) >= limit) {
    return res.status(403).json({ error: `Limit of ${limit} ships reached. Upgrade to premium for more.` });
  }
  const [ship] = await db
    .insert(fmShipsTable)
    .values({ userId: req.fmUserId, shipName, rankPosition: rankPosition ?? 1 })
    .returning();
  return res.status(201).json(ship);
});

router.patch("/ships/:id", authenticate, async (req: any, res) => {
  const id = parseInt(req.params.id);
  const [existing] = await db.select().from(fmShipsTable).where(and(eq(fmShipsTable.id, id), eq(fmShipsTable.userId, req.fmUserId))).limit(1);
  if (!existing) return res.status(404).json({ error: "Not found" });
  const updates: Partial<typeof fmShipsTable.$inferInsert> = {};
  if (req.body.shipName !== undefined) updates.shipName = req.body.shipName;
  if (req.body.rankPosition !== undefined) updates.rankPosition = req.body.rankPosition;
  const [ship] = await db.update(fmShipsTable).set(updates).where(eq(fmShipsTable.id, id)).returning();
  return res.json(ship);
});

router.delete("/ships/:id", authenticate, async (req: any, res) => {
  const id = parseInt(req.params.id);
  await db.delete(fmShipsTable).where(and(eq(fmShipsTable.id, id), eq(fmShipsTable.userId, req.fmUserId)));
  return res.status(204).end();
});

// ─── Actresses ──────────────────────────────────────────────────────────────

router.get("/actresses", authenticate, async (req: any, res) => {
  const actresses = await db
    .select()
    .from(fmActressesTable)
    .where(eq(fmActressesTable.userId, req.fmUserId))
    .orderBy(fmActressesTable.rankPosition);
  return res.json(actresses);
});

router.post("/actresses", authenticate, async (req: any, res) => {
  const { name, rankPosition } = req.body ?? {};
  if (!name) return res.status(400).json({ error: "name is required" });
  const [user] = await db.select().from(fmUsersTable).where(eq(fmUsersTable.id, req.fmUserId)).limit(1);
  const limit = user?.subscriptionTier === "premium" ? PREMIUM_LIMIT : FREE_LIMIT;
  const [{ value: existingCount }] = await db.select({ value: count() }).from(fmActressesTable).where(eq(fmActressesTable.userId, req.fmUserId));
  if (Number(existingCount) >= limit) {
    return res.status(403).json({ error: `Limit of ${limit} actresses reached. Upgrade to premium for more.` });
  }
  const [actress] = await db.insert(fmActressesTable).values({ userId: req.fmUserId, name, rankPosition: rankPosition ?? 1 }).returning();
  return res.status(201).json(actress);
});

router.patch("/actresses/:id", authenticate, async (req: any, res) => {
  const id = parseInt(req.params.id);
  const [existing] = await db.select().from(fmActressesTable).where(and(eq(fmActressesTable.id, id), eq(fmActressesTable.userId, req.fmUserId))).limit(1);
  if (!existing) return res.status(404).json({ error: "Not found" });
  const updates: Partial<typeof fmActressesTable.$inferInsert> = {};
  if (req.body.name !== undefined) updates.name = req.body.name;
  if (req.body.rankPosition !== undefined) updates.rankPosition = req.body.rankPosition;
  const [actress] = await db.update(fmActressesTable).set(updates).where(eq(fmActressesTable.id, id)).returning();
  return res.json(actress);
});

router.delete("/actresses/:id", authenticate, async (req: any, res) => {
  const id = parseInt(req.params.id);
  await db.delete(fmActressesTable).where(and(eq(fmActressesTable.id, id), eq(fmActressesTable.userId, req.fmUserId)));
  return res.status(204).end();
});

// ─── Series ─────────────────────────────────────────────────────────────────

router.get("/series", authenticate, async (req: any, res) => {
  const series = await db.select().from(fmSeriesTable).where(eq(fmSeriesTable.userId, req.fmUserId)).orderBy(fmSeriesTable.createdAt);
  return res.json(series);
});

router.post("/series", authenticate, async (req: any, res) => {
  const { seriesName, emotionalStatus } = req.body ?? {};
  if (!seriesName || !emotionalStatus) return res.status(400).json({ error: "seriesName and emotionalStatus are required" });
  const [series] = await db.insert(fmSeriesTable).values({ userId: req.fmUserId, seriesName, emotionalStatus }).returning();
  return res.status(201).json(series);
});

router.patch("/series/:id", authenticate, async (req: any, res) => {
  const id = parseInt(req.params.id);
  const [existing] = await db.select().from(fmSeriesTable).where(and(eq(fmSeriesTable.id, id), eq(fmSeriesTable.userId, req.fmUserId))).limit(1);
  if (!existing) return res.status(404).json({ error: "Not found" });
  const updates: Partial<typeof fmSeriesTable.$inferInsert> = {};
  if (req.body.seriesName !== undefined) updates.seriesName = req.body.seriesName;
  if (req.body.emotionalStatus !== undefined) updates.emotionalStatus = req.body.emotionalStatus;
  const [series] = await db.update(fmSeriesTable).set(updates).where(eq(fmSeriesTable.id, id)).returning();
  return res.json(series);
});

router.delete("/series/:id", authenticate, async (req: any, res) => {
  const id = parseInt(req.params.id);
  await db.delete(fmSeriesTable).where(and(eq(fmSeriesTable.id, id), eq(fmSeriesTable.userId, req.fmUserId)));
  return res.status(204).end();
});

// ─── Characters ──────────────────────────────────────────────────────────────

router.get("/characters", authenticate, async (req: any, res) => {
  const seriesId = req.query.seriesId ? parseInt(req.query.seriesId as string) : undefined;
  const conditions = [eq(fmCharactersTable.userId, req.fmUserId)];
  if (seriesId) conditions.push(eq(fmCharactersTable.seriesId, seriesId));
  const characters = await db.select().from(fmCharactersTable).where(and(...conditions)).orderBy(fmCharactersTable.createdAt);
  return res.json(characters);
});

router.post("/characters", authenticate, async (req: any, res) => {
  const { seriesId, characterName, flagType } = req.body ?? {};
  if (!seriesId || !characterName || !flagType) return res.status(400).json({ error: "seriesId, characterName, and flagType are required" });
  const [series] = await db.select().from(fmSeriesTable).where(and(eq(fmSeriesTable.id, seriesId), eq(fmSeriesTable.userId, req.fmUserId))).limit(1);
  if (!series) return res.status(404).json({ error: "Series not found" });
  const [character] = await db.insert(fmCharactersTable).values({ userId: req.fmUserId, seriesId, characterName, flagType }).returning();
  return res.status(201).json(character);
});

router.patch("/characters/:id", authenticate, async (req: any, res) => {
  const id = parseInt(req.params.id);
  const [existing] = await db.select().from(fmCharactersTable).where(and(eq(fmCharactersTable.id, id), eq(fmCharactersTable.userId, req.fmUserId))).limit(1);
  if (!existing) return res.status(404).json({ error: "Not found" });
  const updates: Partial<typeof fmCharactersTable.$inferInsert> = {};
  if (req.body.characterName !== undefined) updates.characterName = req.body.characterName;
  if (req.body.flagType !== undefined) updates.flagType = req.body.flagType;
  const [character] = await db.update(fmCharactersTable).set(updates).where(eq(fmCharactersTable.id, id)).returning();
  return res.json(character);
});

router.delete("/characters/:id", authenticate, async (req: any, res) => {
  const id = parseInt(req.params.id);
  await db.delete(fmCharactersTable).where(and(eq(fmCharactersTable.id, id), eq(fmCharactersTable.userId, req.fmUserId)));
  return res.status(204).end();
});

// ─── Tarot ───────────────────────────────────────────────────────────────────

const TAROT_DECK = [
  { name: "The Fool", suit: "Major Arcana", meaning: "New beginnings, spontaneity, a free spirit" },
  { name: "The Magician", suit: "Major Arcana", meaning: "Manifestation, resourcefulness, power" },
  { name: "The High Priestess", suit: "Major Arcana", meaning: "Intuition, sacred knowledge, divine feminine" },
  { name: "The Empress", suit: "Major Arcana", meaning: "Femininity, beauty, nature, abundance" },
  { name: "The Emperor", suit: "Major Arcana", meaning: "Authority, structure, a father figure" },
  { name: "The Hierophant", suit: "Major Arcana", meaning: "Spiritual wisdom, traditions, conformity" },
  { name: "The Lovers", suit: "Major Arcana", meaning: "Love, harmony, relationships, values" },
  { name: "The Chariot", suit: "Major Arcana", meaning: "Control, willpower, success, determination" },
  { name: "Strength", suit: "Major Arcana", meaning: "Strength, courage, persuasion, influence" },
  { name: "The Hermit", suit: "Major Arcana", meaning: "Soul-searching, introspection, inner guidance" },
  { name: "Wheel of Fortune", suit: "Major Arcana", meaning: "Good luck, karma, life cycles, destiny" },
  { name: "Justice", suit: "Major Arcana", meaning: "Justice, fairness, truth, cause and effect" },
  { name: "The Hanged Man", suit: "Major Arcana", meaning: "Pause, surrender, letting go, new perspectives" },
  { name: "Death", suit: "Major Arcana", meaning: "Endings, change, transformation, transition" },
  { name: "Temperance", suit: "Major Arcana", meaning: "Balance, moderation, patience, purpose" },
  { name: "The Devil", suit: "Major Arcana", meaning: "Shadow self, attachment, addiction, restriction" },
  { name: "The Tower", suit: "Major Arcana", meaning: "Sudden change, upheaval, chaos, revelation" },
  { name: "The Star", suit: "Major Arcana", meaning: "Hope, faith, purpose, renewal, spirituality" },
  { name: "The Moon", suit: "Major Arcana", meaning: "Illusion, fear, the unconscious, intuition" },
  { name: "The Sun", suit: "Major Arcana", meaning: "Positivity, fun, warmth, success, vitality" },
  { name: "Judgement", suit: "Major Arcana", meaning: "Judgement, rebirth, inner calling, absolution" },
  { name: "The World", suit: "Major Arcana", meaning: "Completion, integration, accomplishment, travel" },
  { name: "Ace of Cups", suit: "Cups", meaning: "Love, compassion, creativity, overwhelming emotion" },
  { name: "Two of Cups", suit: "Cups", meaning: "Unified love, partnership, mutual attraction" },
  { name: "Three of Cups", suit: "Cups", meaning: "Celebration, friendship, creativity, community" },
  { name: "Seven of Cups", suit: "Cups", meaning: "Opportunities, choices, wishful thinking, illusion" },
  { name: "Ten of Cups", suit: "Cups", meaning: "Divine love, blissful relationships, harmony" },
  { name: "Ace of Wands", suit: "Wands", meaning: "Inspiration, new opportunities, growth, potential" },
  { name: "Three of Wands", suit: "Wands", meaning: "Progress, expansion, foresight, overseas opportunities" },
  { name: "Ace of Pentacles", suit: "Pentacles", meaning: "A new financial or career opportunity, manifestation" },
  { name: "Six of Pentacles", suit: "Pentacles", meaning: "Generosity, charity, giving, prosperity" },
  { name: "Ace of Swords", suit: "Swords", meaning: "Breakthroughs, new ideas, mental clarity, success" },
  { name: "Six of Swords", suit: "Swords", meaning: "Transition, change, rite of passage, releasing baggage" },
];

router.post("/tarot/draw", authenticate, async (req: any, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const existing = await db
    .select()
    .from(fmTarotReadingsTable)
    .where(eq(fmTarotReadingsTable.userId, req.fmUserId))
    .orderBy(fmTarotReadingsTable.createdAt);
  const todayReading = existing.find((r) => r.createdAt.toISOString().slice(0, 10) === today);
  if (todayReading) {
    return res.json(todayReading);
  }
  const shuffled = [...TAROT_DECK].sort(() => Math.random() - 0.5);
  const numCards = Math.floor(Math.random() * 3) + 1;
  const cards = shuffled.slice(0, numCards).map((c) => ({
    ...c,
    isReversed: Math.random() > 0.7,
  }));
  const [reading] = await db
    .insert(fmTarotReadingsTable)
    .values({ userId: req.fmUserId, cards })
    .returning();
  return res.status(201).json(reading);
});

router.get("/tarot/history", authenticate, async (req: any, res) => {
  const history = await db
    .select()
    .from(fmTarotReadingsTable)
    .where(eq(fmTarotReadingsTable.userId, req.fmUserId))
    .orderBy(fmTarotReadingsTable.createdAt);
  return res.json(history.reverse());
});

// ─── Astrology ────────────────────────────────────────────────────────────────

const ZODIAC = [
  { sign: "Capricorn", element: "Earth", rulingPlanet: "Saturn", start: [12, 22], end: [1, 19] },
  { sign: "Aquarius", element: "Air", rulingPlanet: "Uranus", start: [1, 20], end: [2, 18] },
  { sign: "Pisces", element: "Water", rulingPlanet: "Neptune", start: [2, 19], end: [3, 20] },
  { sign: "Aries", element: "Fire", rulingPlanet: "Mars", start: [3, 21], end: [4, 19] },
  { sign: "Taurus", element: "Earth", rulingPlanet: "Venus", start: [4, 20], end: [5, 20] },
  { sign: "Gemini", element: "Air", rulingPlanet: "Mercury", start: [5, 21], end: [6, 20] },
  { sign: "Cancer", element: "Water", rulingPlanet: "Moon", start: [6, 21], end: [7, 22] },
  { sign: "Leo", element: "Fire", rulingPlanet: "Sun", start: [7, 23], end: [8, 22] },
  { sign: "Virgo", element: "Earth", rulingPlanet: "Mercury", start: [8, 23], end: [9, 22] },
  { sign: "Libra", element: "Air", rulingPlanet: "Venus", start: [9, 23], end: [10, 22] },
  { sign: "Scorpio", element: "Water", rulingPlanet: "Pluto", start: [10, 23], end: [11, 21] },
  { sign: "Sagittarius", element: "Fire", rulingPlanet: "Jupiter", start: [11, 22], end: [12, 21] },
];

const ELEMENT_TRAITS: Record<string, string[]> = {
  Fire: ["passionate", "creative", "adventurous", "courageous", "enthusiastic"],
  Earth: ["practical", "reliable", "grounded", "patient", "loyal"],
  Air: ["intellectual", "communicative", "social", "independent", "curious"],
  Water: ["intuitive", "emotional", "empathetic", "nurturing", "mystical"],
};

function getZodiac(birthDate: string) {
  const d = new Date(birthDate);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  for (const z of ZODIAC) {
    if (z.sign === "Capricorn") {
      if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return z;
    } else if (month === z.start[0] && day >= z.start[1]) return z;
    else if (month === z.end[0] && day <= z.end[1]) return z;
  }
  return ZODIAC[0];
}

router.get("/astrology/profile", authenticate, async (req: any, res) => {
  const [profile] = await db.select().from(fmAstrologyProfilesTable).where(eq(fmAstrologyProfilesTable.userId, req.fmUserId)).limit(1);
  return res.json(profile ?? null);
});

router.post("/astrology/generate", authenticate, async (req: any, res) => {
  const { birthDate } = req.body ?? {};
  if (!birthDate) return res.status(400).json({ error: "birthDate is required (YYYY-MM-DD)" });
  const z = getZodiac(birthDate);
  const traits = ELEMENT_TRAITS[z.element] ?? [];
  const profileData = {
    traits,
    compatibility: ["Libra", "Aquarius", "Gemini"].filter((s) => s !== z.sign).slice(0, 2),
    strengths: traits.slice(0, 3),
    description: `As a ${z.sign}, you are ruled by ${z.rulingPlanet} and belong to the ${z.element} element. You embody ${traits.slice(0, 3).join(", ")} qualities that make you unique in your fandom journey.`,
    glCompatibility: z.element === "Water" ? "Very high — your emotional depth mirrors the heart of GL storytelling." :
      z.element === "Fire" ? "High — your passion fuels deep connections with GL narratives." :
      z.element === "Air" ? "Moderate — your analytical mind appreciates GL character development." :
      "High — your loyalty makes you a dedicated GL fan.",
  };
  const existing = await db.select().from(fmAstrologyProfilesTable).where(eq(fmAstrologyProfilesTable.userId, req.fmUserId)).limit(1);
  let profile;
  if (existing.length > 0) {
    [profile] = await db.update(fmAstrologyProfilesTable).set({ birthDate, zodiacSign: z.sign, element: z.element, rulingPlanet: z.rulingPlanet, profileData }).where(eq(fmAstrologyProfilesTable.userId, req.fmUserId)).returning();
  } else {
    [profile] = await db.insert(fmAstrologyProfilesTable).values({ userId: req.fmUserId, birthDate, zodiacSign: z.sign, element: z.element, rulingPlanet: z.rulingPlanet, profileData }).returning();
  }
  return res.status(201).json(profile);
});

// ─── Dashboard ────────────────────────────────────────────────────────────────

router.get("/dashboard/summary", authenticate, async (req: any, res) => {
  const [user] = await db.select().from(fmUsersTable).where(eq(fmUsersTable.id, req.fmUserId)).limit(1);
  const isPremium = user?.subscriptionTier === "premium";
  const limit = isPremium ? PREMIUM_LIMIT : FREE_LIMIT;
  const [shipsCount] = await db.select({ value: count() }).from(fmShipsTable).where(eq(fmShipsTable.userId, req.fmUserId));
  const [actressesCount] = await db.select({ value: count() }).from(fmActressesTable).where(eq(fmActressesTable.userId, req.fmUserId));
  const [seriesCount] = await db.select({ value: count() }).from(fmSeriesTable).where(eq(fmSeriesTable.userId, req.fmUserId));
  const [charactersCount] = await db.select({ value: count() }).from(fmCharactersTable).where(eq(fmCharactersTable.userId, req.fmUserId));
  const today = new Date().toISOString().slice(0, 10);
  const readings = await db.select().from(fmTarotReadingsTable).where(eq(fmTarotReadingsTable.userId, req.fmUserId));
  const todayTarotDone = readings.some((r) => r.createdAt.toISOString().slice(0, 10) === today);
  const [astro] = await db.select({ id: fmAstrologyProfilesTable.id }).from(fmAstrologyProfilesTable).where(eq(fmAstrologyProfilesTable.userId, req.fmUserId)).limit(1);
  return res.json({
    totalShips: Number(shipsCount.value),
    totalActresses: Number(actressesCount.value),
    totalSeries: Number(seriesCount.value),
    totalCharacters: Number(charactersCount.value),
    isPremium,
    limits: { ships: limit, actresses: limit },
    todayTarotDone,
    hasAstrology: !!astro,
  });
});

// ─── Profile ─────────────────────────────────────────────────────────────────

router.post("/profile/upgrade", authenticate, async (req: any, res) => {
  const [user] = await db.update(fmUsersTable).set({ subscriptionTier: "premium" }).where(eq(fmUsersTable.id, req.fmUserId)).returning();
  return res.json(formatUser(user));
});

router.post("/profile/change-password", authenticate, async (req: any, res) => {
  const { currentPassword, newPassword } = req.body ?? {};
  if (!currentPassword || !newPassword) return res.status(400).json({ error: "currentPassword and newPassword are required" });
  const [user] = await db.select().from(fmUsersTable).where(eq(fmUsersTable.id, req.fmUserId)).limit(1);
  if (!user) return res.status(404).json({ error: "User not found" });
  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) return res.status(401).json({ error: "Current password is incorrect" });
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await db.update(fmUsersTable).set({ passwordHash }).where(eq(fmUsersTable.id, req.fmUserId));
  return res.status(204).end();
});

export default router;
