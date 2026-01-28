# MealRank

A full-stack meal tracking and ranking app. Log meals with photos and nutrition, then rank them with a Tinder-style "which is better?" comparison. Rankings use an Elo rating system so your best meals rise to the top.

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Framer Motion, TanStack Query, Wouter
- **Backend:** Express.js, TypeScript, PostgreSQL, Drizzle ORM, Zod

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **PostgreSQL**

   Create a database and set `DATABASE_URL`:

   ```bash
   export DATABASE_URL="postgresql://user:pass@localhost:5432/mealrank"
   ```

   Or add a `.env` file:

   ```
   DATABASE_URL=postgresql://localhost:5432/mealrank
   ```

3. **Database schema**

   ```bash
   npm run db:push
   ```

4. **Run dev**

   ```bash
   npm run dev
   ```

   - API: http://localhost:3000  
   - Client: http://localhost:5173 (proxies /api to the server)

## Scripts

- `npm run dev` – Client + API with hot reload
- `npm run dev:client` – Vite only
- `npm run dev:server` – API only (tsx watch)
- `npm run build` – Build client and server
- `npm run start` – Run production server (after `npm run build`)
- `npm run db:push` – Push schema to DB
- `npm run db:generate` – Generate migrations
- `npm run db:migrate` – Run migrations
- `npm run db:studio` – Drizzle Studio

## Project structure

- `client/` – React app (Vite)
- `server/` – Express API
- `shared/` – Schema (Drizzle) and validation (Zod)
