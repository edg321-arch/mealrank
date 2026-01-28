import * as cheerio from "cheerio";
import { lookupNutrition } from "./nutritionDb.js";

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export interface ParsedRecipe {
  name?: string;
  ingredients?: { name: string; amount: number; unit: string; calories?: number; protein?: number; carbs?: number; fat?: number }[];
  servings?: number;
  instructions?: string;
  images?: string[];
  nutrition?: { calories?: number; protein?: number; carbs?: number; fat?: number };
}

function extractNumber(s: unknown): number | undefined {
  if (typeof s === "number" && !Number.isNaN(s)) return Math.max(0, s);
  if (typeof s !== "string") return undefined;
  const m = s.match(/[\d.,]+/);
  if (!m) return undefined;
  const n = parseFloat(m[0].replace(/,/g, ""));
  return Number.isNaN(n) ? undefined : Math.max(0, n);
}

function liftValue(x: unknown): unknown {
  if (x != null && typeof x === "object" && "value" in x) return (x as { value: unknown }).value;
  return x;
}

function parseNutrition(obj: Record<string, unknown>): ParsedRecipe["nutrition"] {
  const cal = liftValue(obj.calories ?? obj.calorieContent);
  const protein = liftValue(obj.proteinContent ?? obj.protein);
  const carbs = liftValue(obj.carbohydrateContent ?? obj.carbohydrates ?? obj.carbohydrate);
  const fat = liftValue(obj.fatContent ?? obj.fat);

  const out: NonNullable<ParsedRecipe["nutrition"]> = {};
  const c = extractNumber(typeof cal === "string" ? cal.replace(/\s*calories?/i, "") : cal);
  if (c != null) out.calories = Math.round(c);
  const p = extractNumber(typeof protein === "string" ? (protein as string).replace(/\s*g(?:rams?)?/gi, "") : protein);
  if (p != null) out.protein = Math.round(p);
  const cr = extractNumber(typeof carbs === "string" ? (carbs as string).replace(/\s*g(?:rams?)?/gi, "") : carbs);
  if (cr != null) out.carbs = Math.round(cr);
  const f = extractNumber(typeof fat === "string" ? (fat as string).replace(/\s*g(?:rams?)?/gi, "") : fat);
  if (f != null) out.fat = Math.round(f);
  return Object.keys(out).length ? out : undefined;
}

const AMOUNT_UNIT =
  /^\s*([\d¼½¾⅓⅔⅛⅜⅝⅞.,\/\s]+)\s*(tbsp|tablespoon|tablespoons|tsp|teaspoon|teaspoons|cup|cups|oz|ounce|ounces|lb|lbs|pound|pounds|g|gram|grams|kg|ml|milliliter|milliliters|clove|cloves|pinch|can|cans|slice|slices|stalk|stalks|bunch|piece|pieces|large|medium|small)?\s+(.+)$/i;

const MAX_INGREDIENT_LENGTH = 100;

/** Substrings that indicate nav/sidebar/related content, not recipe ingredients. */
const NAV_PHRASES = [
  " or less",
  " or more",
  " days of",
  " that are",
  " that is",
  " tested",
  " reviewed",
  " video",
  " photo",
  " comforting",
  " surprise me",
  " highly rated",
  " more from",
  " related ",
  " categories",
  " sign up",
  " newsletter",
  " view shopping",
  " add to shopping",
  " ingredient substitution",
  " deselect all",
  "cook mode",
  "dismiss",
  " healthy meals",
  " easy chicken",
  " best ",
  " vacuum sealer",
  " air fryer",
  " coffeemaker",
  " pulled pork",
  " slow cooker",
  " recipe ",
  " recipes ",
  "recipe-",
  "recipes/",
];

/** Regex: "7 Ingredients or Less", "12 Days of Cookies", "40 Minutes or Less", etc. */
const NAV_PATTERN = /^\d+\s+(ingredients?|recipes?|days?|minutes?|hours?)\s+(or|of|that)/i;

function looksLikeRealIngredient(line: string): boolean {
  const t = line.trim();
  if (!t || t.length > MAX_INGREDIENT_LENGTH) return false;
  if (!AMOUNT_UNIT.test(t)) return false;
  if (NAV_PATTERN.test(t)) return false;
  const lower = t.toLowerCase();
  for (const p of NAV_PHRASES) {
    if (lower.includes(p)) return false;
  }
  const m = t.match(AMOUNT_UNIT);
  if (!m) return false;
  const name = (m[3] ?? "").trim();
  if (name.length < 2) return false;
  if (/^(recipes?|ingredients?|links?|photos?|videos?)$/i.test(name)) return false;
  return true;
}

function looksLikeRealIngredientList(lines: string[]): boolean {
  if (!lines.length) return false;
  const trimmed = lines.map((s) => s.trim()).filter(Boolean);
  if (trimmed.length < 2) return false;
  const valid = trimmed.filter(looksLikeRealIngredient);
  if (valid.length < 2) return false;
  const invalid = trimmed.filter((l) => !looksLikeRealIngredient(l));
  if (invalid.length > valid.length) return false;
  return true;
}

function parseIngredientLine(line: string): { name: string; amount: number; unit: string } {
  const t = line.trim();
  const m = t.match(AMOUNT_UNIT);
  if (!m) return { name: t || "Ingredient", amount: 0, unit: "unit" };

  let amount = 0;
  const numPart = (m[1] ?? "").replace(/,/g, "").trim();
  if (numPart) {
    const frac = numPart.match(/(\d+)\s*\/\s*(\d+)/);
    if (frac) amount = (parseFloat(frac[1]!) || 0) / (parseFloat(frac[2]!) || 1);
    else amount = parseFloat(numPart) || 0;
  }
  const unit = (m[2] ?? "").trim() || "unit";
  const name = (m[3] ?? "").trim() || "Ingredient";
  return { name, amount, unit };
}

function collectImages(obj: Record<string, unknown>): string[] {
  const imgs: string[] = [];
  const raw = obj.image ?? obj.images;
  if (typeof raw === "string" && /^https?:\/\//i.test(raw)) {
    imgs.push(raw);
    return imgs;
  }
  if (Array.isArray(raw)) {
    for (const x of raw) {
      if (typeof x === "string" && /^https?:\/\//i.test(x)) imgs.push(x);
      else if (x && typeof x === "object" && "url" in x && typeof (x as { url: unknown }).url === "string")
        imgs.push((x as { url: string }).url);
    }
  }
  return imgs;
}

function stepText(node: unknown): string | null {
  if (typeof node === "string") return node.trim() || null;
  if (!node || typeof node !== "object") return null;
  const o = node as Record<string, unknown>;
  const t = (o.text ?? o.name) as string | undefined;
  if (typeof t === "string" && t.trim()) return t.trim();
  const item = o.item;
  if (item) {
    const s = stepText(item);
    if (s) return s;
  }
  const list = o.itemListElement as unknown[] | undefined;
  if (!Array.isArray(list) || !list.length) return null;
  const bits: string[] = [];
  for (const x of list) {
    const s = stepText(x);
    if (s) bits.push(s);
  }
  return bits.length ? bits.join(" ") : null;
}

function flattenInstructions(raw: unknown): string[] {
  const out: string[] = [];
  if (typeof raw === "string") {
    const t = raw.trim();
    if (!t) return out;
    const byNewline = t.split(/\n+/).map((s) => s.trim()).filter(Boolean);
    if (byNewline.length > 1) {
      out.push(...byNewline);
      return out;
    }
    out.push(t);
    return out;
  }
  const arr = Array.isArray(raw) ? raw : raw && typeof raw === "object" ? [raw] : [];
  for (const node of arr) {
    if (typeof node === "string") {
      const t = node.trim();
      if (t) out.push(t);
      continue;
    }
    if (!node || typeof node !== "object") continue;
    const o = node as Record<string, unknown>;
    const t = ((o["@type"] as string) ?? "").toLowerCase();
    if (t === "itemlist") {
      const list = (o.itemListElement ?? o.itemList) as unknown[] | undefined;
      if (Array.isArray(list)) {
        for (const sub of list) {
          const s = stepText(sub);
          if (s) out.push(s);
        }
      }
      continue;
    }
    if (t === "howtosection") {
      const list = (o.itemListElement ?? o.step) as unknown[] | undefined;
      if (Array.isArray(list)) {
        for (const sub of list) {
          const s = stepText(sub);
          if (s) out.push(s);
        }
      }
      continue;
    }
    if (t === "howtostep" || t === "howtodirection" || t === "howtotip") {
      const s = stepText(node);
      if (s) out.push(s);
      continue;
    }
    const s = stepText(node);
    if (s) out.push(s);
  }
  return out;
}

function collectInstructions(obj: Record<string, unknown>): string | undefined {
  const raw = obj.recipeInstructions ?? obj.instructions;
  const steps = flattenInstructions(raw);
  if (!steps.length) return undefined;
  return steps.map((s, i) => `Step ${i + 1}: ${s}`).join("\n\n");
}

function findRecipeInLdJson(parsed: unknown): Record<string, unknown> | null {
  if (!parsed || typeof parsed !== "object") return null;
  const o = parsed as Record<string, unknown>;
  if (o["@type"] === "Recipe") return o;
  const graph = o["@graph"] as unknown[] | undefined;
  if (Array.isArray(graph)) {
    for (const item of graph) {
      if (item && typeof item === "object" && (item as Record<string, unknown>)["@type"] === "Recipe")
        return item as Record<string, unknown>;
    }
  }
  return null;
}

const FETCH_TIMEOUT_MS = 15_000;

function debugLog(...args: unknown[]): void {
  console.log("[recipeParser]", ...args);
}

function extractJsonFromScriptVar(html: string, varName: string): unknown {
  const escaped = varName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(?:window\\.|self\\.)?${escaped}\\s*=\\s*(\\{|\\[)`, "i");
  const m = html.match(re);
  if (!m) return null;
  const start = html.indexOf(m[1]!, m.index!);
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < html.length; i++) {
    const c = html[i]!;
    if (escape) {
      escape = false;
      continue;
    }
    if (inString) {
      if (c === "\\") escape = true;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') {
      inString = true;
      continue;
    }
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(html.slice(start, i + 1));
        } catch {
          return null;
        }
      }
    } else if (c === "[") depth++;
    else if (c === "]") {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(html.slice(start, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

function looksLikeRecipe(o: Record<string, unknown>): boolean {
  const name = o.name ?? o.title;
  const ing = o.recipeIngredient ?? o.ingredients;
  return (typeof name === "string" && name.trim().length > 0) && (Array.isArray(ing) && ing.length > 0);
}

function findRecipeInInitialState(obj: unknown): Record<string, unknown> | null {
  if (!obj || typeof obj !== "object") return null;
  const o = obj as Record<string, unknown>;
  if (o["@type"] === "Recipe") return o as Record<string, unknown>;
  if (looksLikeRecipe(o)) return o;
  const keys = ["recipe", "recipeDetail", "pageProps", "data", "content", "initialState", "props"];
  for (const k of keys) {
    const v = o[k];
    const r = findRecipeInInitialState(v);
    if (r) return r;
  }
  if (Array.isArray(o.recipes) && (o.recipes as unknown[]).length) {
    const r = (o.recipes as unknown[])[0];
    if (r && typeof r === "object") return r as Record<string, unknown>;
  }
  const graph = o["@graph"] as unknown[] | undefined;
  if (Array.isArray(graph)) {
    for (const item of graph) {
      if (item && typeof item === "object" && (item as Record<string, unknown>)["@type"] === "Recipe")
        return item as Record<string, unknown>;
    }
  }
  return null;
}

function recipeLikeFromJsState(html: string): Record<string, unknown> | null {
  const vars = ["__INITIAL_STATE__", "__PRELOADED_STATE__", "__NEXT_DATA__", "__NUXT_DATA__", "window.__APOLLO_STATE__"];
  for (const v of vars) {
    const parsed = extractJsonFromScriptVar(html, v.replace("window.", ""));
    const r = findRecipeInInitialState(parsed);
    if (r) {
      debugLog(`Found recipe-like data in ${v}`);
      return r;
    }
  }
  return null;
}

function extractFromMicrodata($: cheerio.CheerioAPI): Record<string, unknown> | null {
  const $recipe = $('[itemtype*="schema.org/Recipe"]').first();
  if (!$recipe.length) return null;
  const name = $recipe.find('[itemprop="name"]').first().text().trim();
  if (!name) return null;
  const ingredients: string[] = [];
  $recipe.find('[itemprop="recipeIngredient"]').each((_, el) => {
    const t = $(el).text().trim();
    if (t) ingredients.push(t);
  });
  const instructions: string[] = [];
  $recipe.find('[itemprop="recipeInstructions"]').each((_, el) => {
    const t = $(el).text().trim();
    if (t) instructions.push(t);
  });
  const img = $recipe.find('[itemprop="image"]').attr("content") ?? $recipe.find('[itemprop="image"] img').attr("src");
  const yieldVal = $recipe.find('[itemprop="recipeYield"]').first().text().trim();
  const recipe: Record<string, unknown> = { name, recipeIngredient: ingredients };
  if (instructions.length) recipe.recipeInstructions = instructions;
  if (img) recipe.image = img;
  if (yieldVal) recipe.recipeYield = yieldVal;
  return recipe;
}

/** Recipe-scoped containers for ingredients (avoid nav/sidebar). Food Network + generic. */
const INGREDIENT_SCOPES = [
  ".o-Ingredients__m-Body",
  ".o-Ingredients__a-List",
  "[class*='o-Ingredients']",
  ".ingredient-list",
  "[id*='ingredients']",
  "[class*='recipe-ingredients']",
  "[class*='RecipeIngredients']",
  "main [class*='ingredient']",
  "article [class*='ingredient']",
  "[role='main'] [class*='ingredient']",
];

/** Recipe-scoped containers for instructions. */
const INSTRUCTION_SCOPES = [
  ".o-Method__m-Body",
  ".o-AssetDescription__a-Body",
  "[class*='o-Method']",
  "[class*='o-AssetDescription']",
  ".recipe-instructions",
  "[class*='recipe-instructions']",
  "[class*='recipeSteps']",
  "[class*='recipe-steps']",
  "main [class*='instruction']",
  "main [class*='method']",
  "article [class*='instruction']",
  "article [class*='method']",
  "[role='main'] [class*='instruction']",
];

function collectScopedIngredients($: cheerio.CheerioAPI): string[] {
  const raw: string[] = [];
  for (const scope of INGREDIENT_SCOPES) {
    const $scope = $(scope).first();
    if (!$scope.length) continue;
    $scope.find("li").each((_, el) => {
      const t = $(el).text().trim();
      if (t) raw.push(t);
    });
    if (raw.length) break;
  }
  if (!raw.length) {
    $("main li, article li").each((_, el) => {
      const t = $(el).text().trim();
      if (t) raw.push(t);
    });
  }
  const filtered = raw.filter(looksLikeRealIngredient);
  const toValidate = filtered.length ? filtered : raw;
  if (!looksLikeRealIngredientList(toValidate)) {
    debugLog("HTML fallback: ingredient validation failed (nav/sidebar or too few real ingredients)", {
      rawCount: raw.length,
      filteredCount: filtered.length,
    });
    return [];
  }
  return filtered;
}

function collectScopedInstructions($: cheerio.CheerioAPI): string[] {
  const steps: string[] = [];
  for (const scope of INSTRUCTION_SCOPES) {
    const $scope = $(scope).first();
    if (!$scope.length) continue;
    $scope.find("li").each((_, el) => {
      const t = $(el).text().trim();
      if (t && t.length > 15) steps.push(t);
    });
    if (steps.length) break;
  }
  if (!steps.length) {
    for (const scope of INSTRUCTION_SCOPES) {
      const $scope = $(scope).first();
      if (!$scope.length) continue;
      $scope.find("p").each((_, el) => {
        const t = $(el).text().trim();
        if (t && t.length > 15) steps.push(t);
      });
      if (steps.length) break;
    }
  }
  return steps;
}

function extractFromHtml($: cheerio.CheerioAPI): Partial<ParsedRecipe> {
  const out: Partial<ParsedRecipe> = {};
  const title =
    $("h1").first().text().trim() ||
    $(".recipe-title").first().text().trim() ||
    $('[class*="recipe"][class*="title"]').first().text().trim() ||
    $('[class*="RecipeTitle"]').first().text().trim() ||
    $('[class*="title"]').filter((_, el) => $(el).closest("article, main, [role='main']").length).first().text().trim();
  if (title) out.name = title.slice(0, 200);

  const ingLines = collectScopedIngredients($);
  if (ingLines.length) {
    out.ingredients = ingLines.map((s) => {
      const { name, amount, unit } = parseIngredientLine(s);
      const nut = lookupNutrition(name, amount, unit);
      return {
        name,
        amount,
        unit,
        calories: nut?.calories ?? 0,
        protein: nut?.protein ?? 0,
        carbs: nut?.carbs ?? 0,
        fat: nut?.fat ?? 0,
      };
    });
  }

  const steps = collectScopedInstructions($);
  if (steps.length) out.instructions = steps.map((s, i) => `Step ${i + 1}: ${s}`).join("\n\n");

  let img =
    $('meta[property="og:image"]').attr("content") ??
    $(".recipe-image img, [class*='recipe'] img, [class*='hero'] img, [class*='Recipe'] img").first().attr("src");
  if (img && /^\/\//.test(img)) img = "https:" + img;
  if (img && /^https?:\/\//i.test(img)) out.images = [img];

  const bodyText = $("body").text();
  const yieldMatch = bodyText.match(/(?:yield|servings?|makes)\s*[:\s]*(?:about\s+)?(\d+)/i);
  if (yieldMatch) {
    const n = parseInt(yieldMatch[1]!, 10);
    if (n >= 1) out.servings = n;
  }
  return out;
}

function applyRecipeToResult(
  recipe: Record<string, unknown>,
  result: ParsedRecipe,
  $: cheerio.CheerioAPI
): void {
  const n = recipe.name;
  if (typeof n === "string" && n.trim()) result.name = n.trim().slice(0, 200);

  const ing = recipe.recipeIngredient ?? recipe.ingredients;
  if (Array.isArray(ing) && ing.length) {
    result.ingredients = ing
      .filter((x): x is string => typeof x === "string")
      .map((s) => {
        const { name, amount, unit } = parseIngredientLine(s);
        const nut = lookupNutrition(name, amount, unit);
        return {
          name,
          amount,
          unit,
          calories: nut?.calories ?? 0,
          protein: nut?.protein ?? 0,
          carbs: nut?.carbs ?? 0,
          fat: nut?.fat ?? 0,
        };
      });
  }

  const yieldVal = recipe.recipeYield;
  if (yieldVal != null) {
    const num = extractNumber(yieldVal);
    if (num != null && num >= 1) result.servings = Math.round(num);
  }

  const instr = collectInstructions(recipe);
  if (instr) result.instructions = instr;

  const imgs = collectImages(recipe);
  if (imgs.length) result.images = imgs;

  const nut = recipe.nutrition;
  if (nut && typeof nut === "object") {
    const parsed = parseNutrition(nut as Record<string, unknown>);
    if (parsed) result.nutrition = parsed;
  }
}

function applyPartialToResult(partial: Partial<ParsedRecipe>, result: ParsedRecipe): void {
  if (partial.name) result.name = partial.name;
  if (partial.ingredients?.length) result.ingredients = partial.ingredients;
  if (partial.instructions) result.instructions = partial.instructions;
  if (partial.images?.length) result.images = partial.images;
  if (partial.servings != null) result.servings = partial.servings;
  if (partial.nutrition) result.nutrition = partial.nutrition;
}

export async function parseRecipeFromUrl(url: string): Promise<ParsedRecipe> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/xhtml+xml" },
      redirect: "follow",
    });
    clearTimeout(timeout);
  } catch (e) {
    clearTimeout(timeout);
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error("Request timed out. The recipe page took too long to load.");
    }
    const msg = e instanceof Error ? e.message : String(e);
    if (/fetch failed|ECONNREFUSED|ENOTFOUND|ETIMEDOUT|network/i.test(msg)) {
      throw new Error("Could not connect to URL. Check the link or try again later.");
    }
    throw new Error(`Could not connect to URL: ${msg}`);
  }
  if (!res.ok) {
    if (res.status === 403) throw new Error("Access denied (403). This site may block automated requests.");
    if (res.status === 404) throw new Error("Page not found (404). Check the recipe URL.");
    throw new Error(`Failed to fetch recipe page: ${res.status} ${res.statusText}`);
  }
  const html = await res.text();
  debugLog(`Fetched HTML: ${html.length} bytes from ${url}`);

  const $ = cheerio.load(html);
  const result: ParsedRecipe = {};
  let recipe: Record<string, unknown> | null = null;
  let source = "";

  const ldJsonBlocks: string[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    const text = $(el).html()?.trim();
    if (text) ldJsonBlocks.push(text.slice(0, 200) + (text.length > 200 ? "..." : ""));
  });
  debugLog(`JSON-LD blocks found: ${ldJsonBlocks.length}`, ldJsonBlocks);

  $('script[type="application/ld+json"]').each((_, el) => {
    if (recipe) return;
    try {
      const text = $(el).html()?.trim();
      if (!text) return;
      const parsed = JSON.parse(text) as unknown;
      const r = findRecipeInLdJson(parsed);
      if (r) {
        recipe = r;
        source = "JSON-LD";
      }
    } catch {
      /* ignore */
    }
  });

  if (!recipe) {
    const fromState = recipeLikeFromJsState(html);
    if (fromState) {
      recipe = fromState;
      source = "initial-state";
    }
  }

  if (!recipe) {
    const fromMicro = extractFromMicrodata($);
    if (fromMicro) {
      recipe = fromMicro;
      source = "microdata";
      debugLog("Using recipe from microdata");
    }
  }

  if (recipe && source) {
    debugLog(`Using recipe from ${source}`);
    applyRecipeToResult(recipe, result, $);
  }

  if (!result.name || !result.ingredients?.length) {
    const fromHtml = extractFromHtml($);
    if (fromHtml.name || fromHtml.ingredients?.length) {
      debugLog("Using recipe from HTML fallback");
      applyPartialToResult(fromHtml, result);
    }
  }

  const ogImage = $('meta[property="og:image"]').attr("content");
  if (ogImage && /^https?:\/\//i.test(ogImage)) {
    result.images = result.images ?? [];
    if (!result.images.includes(ogImage)) result.images.unshift(ogImage);
  }
  const ogTitle = $('meta[property="og:title"]').attr("content");
  if (ogTitle && ogTitle.trim() && !result.name) result.name = ogTitle.trim().slice(0, 200);

  const hasAny = !!(result.name || (result.ingredients?.length ?? 0) || result.instructions);
  if (!hasAny) {
    throw new Error(
      "No recipe data found on this page. The site may use JavaScript to load the recipe, or the format is not supported."
    );
  }

  return result;
}
