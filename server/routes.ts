import { Router, Request, Response } from "express";
import {
  createMealSchema,
  updateMealSchema,
  voteSchema,
  parseRecipeSchema,
  type CreateMealInput,
  type UpdateMealInput,
} from "../shared/validation.js";
import * as storage from "./storage.js";
import { parseRecipeFromUrl } from "./recipeParser.js";

export const api = Router();

// ---- Meals ----
api.get("/meals", async (req: Request, res: Response) => {
  const sortBy = (req.query.sortBy as string) || "date";
  const sortDir = (req.query.sortDir as string) || "desc";
  const search = (req.query.search as string) || undefined;
  const validSort = ["date", "rating", "name"].includes(sortBy)
    ? (sortBy as "date" | "rating" | "name")
    : "date";
  const validDir = ["asc", "desc"].includes(sortDir)
    ? (sortDir as "asc" | "desc")
    : "desc";
  const rows = await storage.getMeals({
    sortBy: validSort,
    sortDir: validDir,
    search,
  });
  res.json(rows);
});

api.get("/meals/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string, 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid meal ID" });
    return;
  }
  const meal = await storage.getMealById(id);
  if (!meal) {
    res.status(404).json({ error: "Meal not found" });
    return;
  }
  res.json(meal);
});

api.get("/meals/:id/history", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string, 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid meal ID" });
    return;
  }
  const history = await storage.getMealHistory(id);
  res.json(history);
});

api.post("/meals", async (req: Request, res: Response) => {
  const parsed = createMealSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", issues: parsed.error.issues });
    return;
  }
  const input = parsed.data as CreateMealInput;
  try {
    const meal = await storage.createMeal(input);
    res.status(201).json(meal);
  } catch (e) {
    res.status(500).json({ error: "Failed to create meal" });
  }
});

api.put("/meals/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string, 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid meal ID" });
    return;
  }
  const parsed = updateMealSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", issues: parsed.error.issues });
    return;
  }
  const input = parsed.data as UpdateMealInput;
  const meal = await storage.updateMeal(id, input);
  if (!meal) {
    res.status(404).json({ error: "Meal not found" });
    return;
  }
  res.json(meal);
});

api.delete("/meals/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string, 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid meal ID" });
    return;
  }
  const meal = await storage.softDeleteMeal(id);
  if (!meal) {
    res.status(404).json({ error: "Meal not found" });
    return;
  }
  res.status(204).send();
});

// ---- Rank ----
api.get("/rank/pair", async (_req: Request, res: Response) => {
  const pair = await storage.getRankPair();
  if (!pair) {
    res.status(200).json({
      mealA: null,
      mealB: null,
      message: "Add at least 2 meals to start ranking!",
    });
    return;
  }
  res.json({
    mealA: pair.mealA,
    mealB: pair.mealB,
    message: null,
  });
});

api.post("/rank/vote", async (req: Request, res: Response) => {
  const parsed = voteSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", issues: parsed.error.issues });
    return;
  }
  const { winnerId, loserId } = parsed.data;
  const result = await storage.submitVote(winnerId, loserId);
  if (!result) {
    res.status(404).json({ error: "Meals not found" });
    return;
  }
  res.json({
    winner: result.winner,
    loser: result.loser,
    deltaWinner: result.deltaWinner,
    deltaLoser: result.deltaLoser,
  });
});

api.get("/rank/leaderboard", async (_req: Request, res: Response) => {
  const list = await storage.getLeaderboard();
  res.json(list);
});

// ---- Stats ----
api.get("/stats", async (_req: Request, res: Response) => {
  const stats = await storage.getStats();
  res.json(stats);
});

// ---- Recipes (parse from URL) ----
api.post("/recipes/parse", async (req: Request, res: Response) => {
  const parsed = parseRecipeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation failed", issues: parsed.error.issues });
    return;
  }
  try {
    const data = await parseRecipeFromUrl(parsed.data.url);
    res.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to parse recipe";
    res.status(400).json({ error: msg });
  }
});

// ---- Images ----
api.get("/images/:id", async (req: Request, res: Response) => {
  const id = parseInt(req.params.id as string, 10);
  if (Number.isNaN(id)) {
    res.status(400).json({ error: "Invalid image ID" });
    return;
  }
  const img = await storage.getImageById(id);
  if (!img) {
    res.status(404).json({ error: "Image not found" });
    return;
  }
  if (img.imageType === "url" && img.imageUrl) {
    res.redirect(302, img.imageUrl);
    return;
  }
  if (img.imageType === "base64" && img.imageData && img.mimeType) {
    const buf = Buffer.from(img.imageData, "base64");
    res.setHeader("Content-Type", img.mimeType);
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.send(buf);
    return;
  }
  res.status(404).json({ error: "Image not found" });
});
