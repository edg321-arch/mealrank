import { eq, and, isNull, desc, asc, sql, ne, inArray } from "drizzle-orm";
import { db } from "./db.js";
import {
  meals,
  ingredients,
  images,
  matchups,
  type Meal,
  type NewMeal,
  type NewIngredient,
  type NewImage,
  type NewMatchup,
} from "../shared/schema.js";
import type { CreateMealInput, UpdateMealInput } from "../shared/validation.js";

const K_FACTOR = 32;
const STARTING_RATING = 1000;

type SortBy = "date" | "rating" | "name";
type SortDir = "asc" | "desc";

export async function getMeals(options: {
  sortBy?: SortBy;
  sortDir?: SortDir;
  search?: string;
}) {
  const { sortBy = "date", sortDir = "desc", search } = options;
  const deletedNull = isNull(meals.deletedAt);
  const whereClause = search?.trim()
    ? and(deletedNull, sql`${meals.name} ILIKE ${`%${search.trim()}%`}`)
    : deletedNull;

  const orderColumn =
    sortBy === "date"
      ? meals.date
      : sortBy === "rating"
        ? meals.rating
        : meals.name;
  const order = sortDir === "asc" ? asc(orderColumn) : desc(orderColumn);

  const rows = await db.select().from(meals).where(whereClause).orderBy(order);
  if (rows.length === 0) return rows;

  const ids = rows.map((r) => r.id);
  const allImages = await db
    .select()
    .from(images)
    .where(inArray(images.mealId, ids));

  allImages.sort((a, b) => {
    if (a.mealId !== b.mealId) return a.mealId - b.mealId;
    return a.id - b.id;
  });
  const firstByMeal = new Map<number, (typeof allImages)[0]>();
  for (const im of allImages) {
    if (!firstByMeal.has(im.mealId)) firstByMeal.set(im.mealId, im);
  }

  return rows.map((m) => ({
    ...m,
    images: firstByMeal.has(m.id) ? [firstByMeal.get(m.id)!] : [],
  }));
}

export async function getMealById(id: number) {
  const [meal] = await db
    .select()
    .from(meals)
    .where(and(eq(meals.id, id), isNull(meals.deletedAt)));
  if (!meal) return null;

  const [ings, imgs] = await Promise.all([
    db.select().from(ingredients).where(eq(ingredients.mealId, id)),
    db.select().from(images).where(eq(images.mealId, id)),
  ]);

  return { ...meal, ingredients: ings, images: imgs };
}

function recalcTotals(
  ings: { calories: number; protein: number; carbs: number; fat: number }[]
) {
  return ings.reduce(
    (acc, i) => ({
      totalCalories: acc.totalCalories + (i.calories ?? 0),
      totalProtein: acc.totalProtein + (i.protein ?? 0),
      totalCarbs: acc.totalCarbs + (i.carbs ?? 0),
      totalFat: acc.totalFat + (i.fat ?? 0),
    }),
    { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 }
  );
}

export async function createMeal(input: CreateMealInput) {
  const ings = input.ingredients ?? [];
  const override = input.nutritionOverride;
  const totals =
    override &&
    (override.totalCalories != null ||
      override.totalProtein != null ||
      override.totalCarbs != null ||
      override.totalFat != null)
      ? {
          totalCalories: override.totalCalories ?? 0,
          totalProtein: override.totalProtein ?? 0,
          totalCarbs: override.totalCarbs ?? 0,
          totalFat: override.totalFat ?? 0,
        }
      : recalcTotals(ings);

  const [meal] = await db
    .insert(meals)
    .values({
      name: input.name,
      date: input.date ?? new Date(),
      instructions: input.instructions ?? null,
      notes: input.notes ?? null,
      recipeUrl: input.recipeUrl ?? null,
      servings: input.servings ?? 1,
      ...totals,
    })
    .returning();

  if (!meal) throw new Error("Failed to create meal");

  if (ings.length) {
    const rows: NewIngredient[] = ings.map((i) => ({
      mealId: meal.id,
      name: i.name,
      amount: i.amount,
      unit: i.unit,
      calories: i.calories ?? 0,
      protein: i.protein ?? 0,
      carbs: i.carbs ?? 0,
      fat: i.fat ?? 0,
    }));
    await db.insert(ingredients).values(rows);
  }

  if (input.images?.length) {
    const imgRows: NewImage[] = input.images
      .filter((img) => (img.type === "url" && img.url) || (img.type === "base64" && img.base64))
      .map((img) => ({
        mealId: meal.id,
        imageUrl: img.type === "url" ? img.url! : null,
        imageData: img.type === "base64" ? img.base64! : null,
        imageType: img.type,
        mimeType: img.mimeType ?? null,
      }));
    if (imgRows.length) await db.insert(images).values(imgRows);
  }

  return getMealById(meal.id);
}

export async function updateMeal(id: number, input: UpdateMealInput) {
  const existing = await getMealById(id);
  if (!existing) return null;

  const ings = input.ingredients ?? existing.ingredients;
  const override = input.nutritionOverride;
  const totals =
    override &&
    (override.totalCalories != null ||
      override.totalProtein != null ||
      override.totalCarbs != null ||
      override.totalFat != null)
      ? {
          totalCalories: override.totalCalories ?? 0,
          totalProtein: override.totalProtein ?? 0,
          totalCarbs: override.totalCarbs ?? 0,
          totalFat: override.totalFat ?? 0,
        }
      : recalcTotals(ings);

  await db
    .update(meals)
    .set({
      ...(input.name != null && { name: input.name }),
      ...(input.date != null && { date: input.date }),
      ...(input.instructions != null && { instructions: input.instructions }),
      ...(input.notes != null && { notes: input.notes }),
      ...(input.recipeUrl !== undefined && { recipeUrl: input.recipeUrl ?? null }),
      ...(input.servings != null && { servings: input.servings }),
      ...totals,
    })
    .where(eq(meals.id, id));

  if (input.ingredients) {
    await db.delete(ingredients).where(eq(ingredients.mealId, id));
    if (input.ingredients.length) {
      await db.insert(ingredients).values(
        input.ingredients.map((i) => ({
          mealId: id,
          name: i.name,
          amount: i.amount,
          unit: i.unit,
          calories: i.calories ?? 0,
          protein: i.protein ?? 0,
          carbs: i.carbs ?? 0,
          fat: i.fat ?? 0,
        }))
      );
    }
  }

  if (input.images) {
    await db.delete(images).where(eq(images.mealId, id));
    const valid = input.images.filter(
      (img) => (img.type === "url" && img.url) || (img.type === "base64" && img.base64)
    );
    if (valid.length) {
      await db.insert(images).values(
        valid.map((img) => ({
          mealId: id,
          imageUrl: img.type === "url" ? img.url! : null,
          imageData: img.type === "base64" ? img.base64! : null,
          imageType: img.type,
          mimeType: img.mimeType ?? null,
        }))
      );
    }
  }

  return getMealById(id);
}

export async function softDeleteMeal(id: number) {
  const [m] = await db
    .update(meals)
    .set({ deletedAt: new Date() })
    .where(and(eq(meals.id, id), isNull(meals.deletedAt)))
    .returning();
  return m ?? null;
}

export async function getMealHistory(id: number) {
  const wins = await db
    .select({
      id: matchups.id,
      createdAt: matchups.createdAt,
      type: sql<string>`'win'`.as("type"),
      opponentId: matchups.loserId,
      opponentName: meals.name,
    })
    .from(matchups)
    .innerJoin(meals, eq(meals.id, matchups.loserId))
    .where(eq(matchups.winnerId, id))
    .orderBy(desc(matchups.createdAt));

  const losses = await db
    .select({
      id: matchups.id,
      createdAt: matchups.createdAt,
      type: sql<string>`'loss'`.as("type"),
      opponentId: matchups.winnerId,
      opponentName: meals.name,
    })
    .from(matchups)
    .innerJoin(meals, eq(meals.id, matchups.winnerId))
    .where(eq(matchups.loserId, id))
    .orderBy(desc(matchups.createdAt));

  const combined = [
    ...wins.map((w) => ({ ...w, type: "win" as const })),
    ...losses.map((l) => ({ ...l, type: "loss" as const })),
  ].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return combined;
}

let lastPair: [number, number] | null = null;

export async function getRankPair() {
  const all = await db
    .select({ id: meals.id })
    .from(meals)
    .where(isNull(meals.deletedAt));

  if (all.length < 2) return null;

  let a: number;
  let b: number;
  let attempts = 0;
  do {
    const i = Math.floor(Math.random() * all.length);
    let j = Math.floor(Math.random() * all.length);
    while (j === i) j = Math.floor(Math.random() * all.length);
    a = all[i]!.id;
    b = all[j]!.id;
    const key: [number, number] = [Math.min(a, b), Math.max(a, b)];
    if (!lastPair || (key[0] !== lastPair[0] || key[1] !== lastPair[1])) {
      lastPair = key;
      break;
    }
    attempts++;
  } while (attempts < 50);

  const [mealA, mealB] = await Promise.all([
    getMealById(a!),
    getMealById(b!),
  ]);
  if (!mealA || !mealB) return null;
  return { mealA, mealB };
}

export async function submitVote(winnerId: number, loserId: number) {
  const [winner, loser] = await Promise.all([
    getMealById(winnerId),
    getMealById(loserId),
  ]);
  if (!winner || !loser) return null;

  const winnerRating = winner.rating;
  const loserRating = loser.rating;

  const expectedWinner =
    1 / (1 + Math.pow(10, (loserRating - winnerRating) / 400));
  const expectedLoser =
    1 / (1 + Math.pow(10, (winnerRating - loserRating) / 400));
  const newWinnerRating = Math.round(
    winnerRating + K_FACTOR * (1 - expectedWinner)
  );
  const newLoserRating = Math.round(
    loserRating + K_FACTOR * (0 - expectedLoser)
  );
  const deltaWinner = newWinnerRating - winnerRating;
  const deltaLoser = newLoserRating - loserRating;

  await db.transaction(async (tx) => {
    await tx.insert(matchups).values({
      winnerId,
      loserId,
    });
    await tx
      .update(meals)
      .set({
        rating: newWinnerRating,
        wins: winner.wins + 1,
        matches: winner.matches + 1,
      })
      .where(eq(meals.id, winnerId));
    await tx
      .update(meals)
      .set({
        rating: newLoserRating,
        losses: loser.losses + 1,
        matches: loser.matches + 1,
      })
      .where(eq(meals.id, loserId));
  });

  const [updatedWinner, updatedLoser] = await Promise.all([
    getMealById(winnerId),
    getMealById(loserId),
  ]);

  return {
    winner: updatedWinner!,
    loser: updatedLoser!,
    deltaWinner,
    deltaLoser,
  };
}

export function skipPair() {
  lastPair = null;
}

export async function getLeaderboard() {
  const rows = await db
    .select()
    .from(meals)
    .where(isNull(meals.deletedAt))
    .orderBy(desc(meals.rating));
  if (rows.length === 0) return rows;
  const ids = rows.map((r) => r.id);
  const allImages = await db
    .select()
    .from(images)
    .where(inArray(images.mealId, ids));
  allImages.sort((a, b) => {
    if (a.mealId !== b.mealId) return a.mealId - b.mealId;
    return a.id - b.id;
  });
  const firstByMeal = new Map<number, (typeof allImages)[0]>();
  for (const im of allImages) {
    if (!firstByMeal.has(im.mealId)) firstByMeal.set(im.mealId, im);
  }
  return rows.map((m) => ({
    ...m,
    images: firstByMeal.has(m.id) ? [firstByMeal.get(m.id)!] : [],
  }));
}

export async function getStats() {
  const [count] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(meals)
    .where(isNull(meals.deletedAt));

  const [comparisons] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(matchups);

  const [avgCals] = await db
    .select({
      avg: sql<number>`coalesce(round(avg(${meals.totalCalories}))::int, 0)`,
    })
    .from(meals)
    .where(and(isNull(meals.deletedAt), ne(meals.totalCalories, 0)));

  return {
    totalMeals: count?.count ?? 0,
    totalComparisons: comparisons?.count ?? 0,
    avgCalories: avgCals?.avg ?? 0,
  };
}

export async function getImageById(imageId: number) {
  const [row] = await db
    .select()
    .from(images)
    .where(eq(images.id, imageId));
  return row ?? null;
}
