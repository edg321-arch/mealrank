# Deploy MealRank to Vercel

Run all commands below from the project root (`mealrank/`).

## 1. Git setup

```bash
git init
git add .
git commit -m "Initial commit"
```

(`.env` is gitignored; keep your `DATABASE_URL` local and add it in Vercel later.)

## 2. Create GitHub repo and push

### Option A: GitHub CLI

```bash
# Install GitHub CLI: https://cli.github.com/
brew install gh   # macOS
# or: winget install GitHub.cli   # Windows

gh auth login
gh repo create mealrank --private --source=. --push
```

### Option B: Manual

1. Create a new repository on [github.com/new](https://github.com/new) named `mealrank` (no README, .gitignore, or license).
2. Run:

```bash
git remote add origin https://github.com/YOUR_USERNAME/mealrank.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

## 3. Vercel deploy

### Install Vercel CLI and login

```bash
npm i -g vercel
vercel login
```

### Deploy

```bash
vercel --prod
```

Follow the prompts (link to existing project or create new, root directory `.`).

### Add `DATABASE_URL`

1. Open [vercel.com](https://vercel.com) → your project → **Settings** → **Environment Variables**.
2. Add:
   - **Name:** `DATABASE_URL`
   - **Value:** `postgresql://postgres:MollyDawg321!@db.oqyrjluxyuqowojqgchk.supabase.co:5432/postgres`
   - **Environment:** Production (and Preview if you use branch deploys).
3. **Redeploy** (Deployments → ⋮ on latest → Redeploy) so the variable is applied.

## 4. Live URL

After `vercel --prod`, your app is live at:

**`https://mealrank.vercel.app`**

(or whatever project name you chose, e.g. `https://mealrank-xxx.vercel.app`).

---

## Summary

- **Frontend:** Vite build → `dist/`, served as static. SPA rewrites send non-API routes to `index.html`.
- **Backend:** Express in `api/[[...path]].ts` runs as a serverless function; `/api/*` hits it.
- **DB:** Supabase Postgres via `DATABASE_URL`. Ensure tables exist (run `supabase-schema.sql` in Supabase SQL Editor if needed).
