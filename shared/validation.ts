import { z } from "zod";

const MAX_MEAL_NAME = 200;
const MAX_IMAGES_PER_MEAL = 10;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_INGREDIENTS = 50;

const urlSchema = z
  .string()
  .url()
  .optional()
  .or(z.literal(""))
  .transform((v) => (v === "" ? undefined : v));

export const mealNameSchema = z
  .string()
  .min(1, "Name is required")
  .max(MAX_MEAL_NAME, `Name must be at most ${MAX_MEAL_NAME} characters`);

export const recipeUrlSchema = urlSchema;

export const ingredientSchema = z.object({
  name: z.string().min(1, "Ingredient name is required"),
  amount: z.number().min(0),
  unit: z.string().min(1, "Unit is required"),
  calories: z.number().int().min(0).default(0),
  protein: z.number().int().min(0).default(0),
  carbs: z.number().int().min(0).default(0),
  fat: z.number().int().min(0).default(0),
});

export const imageUploadSchema = z.object({
  type: z.enum(["url", "base64"]),
  url: z.string().url().optional(),
  base64: z.string().optional(),
  mimeType: z.string().optional(),
});

const nutritionOverrideSchema = z
  .object({
    totalCalories: z.number().int().min(0).optional(),
    totalProtein: z.number().int().min(0).optional(),
    totalCarbs: z.number().int().min(0).optional(),
    totalFat: z.number().int().min(0).optional(),
  })
  .optional();

const createMealBaseSchema = z.object({
  name: mealNameSchema,
  date: z.coerce.date().optional(),
  instructions: z.string().optional(),
  notes: z.string().optional(),
  recipeUrl: recipeUrlSchema,
  servings: z.number().int().min(1).default(1),
  ingredients: z.array(ingredientSchema).max(MAX_INGREDIENTS).default([]),
  images: z
    .array(imageUploadSchema)
    .max(MAX_IMAGES_PER_MEAL)
    .optional()
    .default([]),
  nutritionOverride: nutritionOverrideSchema,
});

export const createMealSchema = createMealBaseSchema.refine(
  (data) => {
    if (!data.images?.length) return true;
    return data.images.length <= MAX_IMAGES_PER_MEAL;
  },
  { message: `Maximum ${MAX_IMAGES_PER_MEAL} images per meal` }
);

export const updateMealSchema = createMealBaseSchema
  .partial()
  .extend({
    name: mealNameSchema.optional(),
    nutritionOverride: nutritionOverrideSchema,
  });

export const voteSchema = z.object({
  winnerId: z.number().int().positive(),
  loserId: z.number().int().positive(),
});

export const parseRecipeSchema = z.object({
  url: z.string().url(),
});

export type CreateMealInput = z.infer<typeof createMealSchema>;
export type UpdateMealInput = z.infer<typeof updateMealSchema>;
export type VoteInput = z.infer<typeof voteSchema>;
export type IngredientInput = z.infer<typeof ingredientSchema>;
export type ParseRecipeInput = z.infer<typeof parseRecipeSchema>;

export const VALIDATION = {
  MAX_MEAL_NAME,
  MAX_IMAGES_PER_MEAL,
  MAX_IMAGE_BYTES,
  ALLOWED_IMAGE_TYPES,
  MAX_INGREDIENTS,
} as const;
