-- MealRank schema for Supabase
-- Run this in Supabase SQL Editor

-- Meals
CREATE TABLE IF NOT EXISTS meals (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  date TIMESTAMP NOT NULL DEFAULT NOW(),
  instructions TEXT,
  notes TEXT,
  recipe_url TEXT,
  servings INTEGER NOT NULL DEFAULT 1,
  rating INTEGER NOT NULL DEFAULT 1000,
  wins INTEGER NOT NULL DEFAULT 0,
  losses INTEGER NOT NULL DEFAULT 0,
  matches INTEGER NOT NULL DEFAULT 0,
  total_calories INTEGER NOT NULL DEFAULT 0,
  total_protein INTEGER NOT NULL DEFAULT 0,
  total_carbs INTEGER NOT NULL DEFAULT 0,
  total_fat INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS meals_rating_idx ON meals (rating);
CREATE INDEX IF NOT EXISTS meals_deleted_at_idx ON meals (deleted_at);
CREATE INDEX IF NOT EXISTS meals_date_idx ON meals (date);

-- Ingredients
CREATE TABLE IF NOT EXISTS ingredients (
  id SERIAL PRIMARY KEY,
  meal_id INTEGER NOT NULL REFERENCES meals (id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  amount REAL NOT NULL,
  unit TEXT NOT NULL,
  calories INTEGER NOT NULL DEFAULT 0,
  protein INTEGER NOT NULL DEFAULT 0,
  carbs INTEGER NOT NULL DEFAULT 0,
  fat INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS ingredients_meal_id_idx ON ingredients (meal_id);

-- Images
CREATE TABLE IF NOT EXISTS images (
  id SERIAL PRIMARY KEY,
  meal_id INTEGER NOT NULL REFERENCES meals (id) ON DELETE CASCADE,
  image_url TEXT,
  image_data TEXT,
  image_type TEXT NOT NULL,
  mime_type TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS images_meal_id_idx ON images (meal_id);

-- Matchups
CREATE TABLE IF NOT EXISTS matchups (
  id SERIAL PRIMARY KEY,
  winner_id INTEGER NOT NULL REFERENCES meals (id) ON DELETE CASCADE,
  loser_id INTEGER NOT NULL REFERENCES meals (id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS matchups_winner_id_idx ON matchups (winner_id);
CREATE INDEX IF NOT EXISTS matchups_loser_id_idx ON matchups (loser_id);
