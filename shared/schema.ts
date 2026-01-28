import {
  pgTable,
  serial,
  text,
  timestamp,
  integer,
  real,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const meals = pgTable(
  "meals",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    date: timestamp("date").defaultNow().notNull(),
    instructions: text("instructions"),
    notes: text("notes"),
    recipeUrl: text("recipe_url"),
    servings: integer("servings").default(1).notNull(),
    rating: integer("rating").default(1000).notNull(),
    wins: integer("wins").default(0).notNull(),
    losses: integer("losses").default(0).notNull(),
    matches: integer("matches").default(0).notNull(),
    totalCalories: integer("total_calories").default(0).notNull(),
    totalProtein: integer("total_protein").default(0).notNull(),
    totalCarbs: integer("total_carbs").default(0).notNull(),
    totalFat: integer("total_fat").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    deletedAt: timestamp("deleted_at"),
  },
  (table) => ({
    ratingIdx: index("meals_rating_idx").on(table.rating),
    deletedAtIdx: index("meals_deleted_at_idx").on(table.deletedAt),
    dateIdx: index("meals_date_idx").on(table.date),
  })
);

export const ingredients = pgTable(
  "ingredients",
  {
    id: serial("id").primaryKey(),
    mealId: integer("meal_id")
      .notNull()
      .references(() => meals.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    amount: real("amount").notNull(),
    unit: text("unit").notNull(),
    calories: integer("calories").default(0).notNull(),
    protein: integer("protein").default(0).notNull(),
    carbs: integer("carbs").default(0).notNull(),
    fat: integer("fat").default(0).notNull(),
  },
  (table) => ({
    mealIdIdx: index("ingredients_meal_id_idx").on(table.mealId),
  })
);

export const images = pgTable(
  "images",
  {
    id: serial("id").primaryKey(),
    mealId: integer("meal_id")
      .notNull()
      .references(() => meals.id, { onDelete: "cascade" }),
    imageUrl: text("image_url"),
    imageData: text("image_data"),
    imageType: text("image_type").notNull(), // 'url' | 'base64'
    mimeType: text("mime_type"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    mealIdIdx: index("images_meal_id_idx").on(table.mealId),
  })
);

export const matchups = pgTable(
  "matchups",
  {
    id: serial("id").primaryKey(),
    winnerId: integer("winner_id")
      .notNull()
      .references(() => meals.id, { onDelete: "cascade" }),
    loserId: integer("loser_id")
      .notNull()
      .references(() => meals.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    winnerIdIdx: index("matchups_winner_id_idx").on(table.winnerId),
    loserIdIdx: index("matchups_loser_id_idx").on(table.loserId),
  })
);

export const mealsRelations = relations(meals, ({ many }) => ({
  ingredients: many(ingredients),
  images: many(images),
}));

export const ingredientsRelations = relations(ingredients, ({ one }) => ({
  meal: one(meals),
}));

export const imagesRelations = relations(images, ({ one }) => ({
  meal: one(meals),
}));

export type Meal = typeof meals.$inferSelect;
export type NewMeal = typeof meals.$inferInsert;
export type Ingredient = typeof ingredients.$inferSelect;
export type NewIngredient = typeof ingredients.$inferInsert;
export type Image = typeof images.$inferSelect;
export type NewImage = typeof images.$inferInsert;
export type Matchup = typeof matchups.$inferSelect;
export type NewMatchup = typeof matchups.$inferInsert;
