/**
 * Nutrition per single unit. Units: cup | tbsp | tsp | egg | clove | unit
 */
const NUTRITION_DB: {
  keys: string[];
  unit: "cup" | "tbsp" | "tsp" | "egg" | "clove" | "unit";
  cal: number;
  protein: number;
  carbs: number;
  fat: number;
}[] = [
  { keys: ["flour", "all-purpose flour", "all purpose flour", "plain flour"], unit: "cup", cal: 455, protein: 13, carbs: 95, fat: 1 },
  { keys: ["sugar", "granulated sugar", "white sugar", "caster sugar"], unit: "cup", cal: 774, protein: 0, carbs: 200, fat: 0 },
  { keys: ["brown sugar"], unit: "cup", cal: 828, protein: 0, carbs: 214, fat: 0 },
  { keys: ["butter"], unit: "cup", cal: 1628, protein: 2, carbs: 0, fat: 184 },
  { keys: ["milk", "whole milk", "full-fat milk"], unit: "cup", cal: 149, protein: 8, carbs: 12, fat: 8 },
  { keys: ["skim milk", "skimmed milk", "fat-free milk"], unit: "cup", cal: 83, protein: 8, carbs: 12, fat: 0 },
  { keys: ["egg", "eggs", "large egg", "large eggs"], unit: "egg", cal: 72, protein: 6, carbs: 0, fat: 5 },
  { keys: ["cocoa powder", "unsweetened cocoa", "cocoa"], unit: "cup", cal: 196, protein: 17, carbs: 47, fat: 12 },
  { keys: ["oil", "vegetable oil", "cooking oil", "olive oil", "canola oil", "rapeseed oil"], unit: "cup", cal: 1927, protein: 0, carbs: 0, fat: 218 },
  { keys: ["baking powder"], unit: "tsp", cal: 5, protein: 0, carbs: 1, fat: 0 },
  { keys: ["baking soda", "bicarbonate of soda", "bicarb"], unit: "tsp", cal: 0, protein: 0, carbs: 0, fat: 0 },
  { keys: ["salt", "table salt", "sea salt", "kosher salt"], unit: "tsp", cal: 0, protein: 0, carbs: 0, fat: 0 },
  { keys: ["vanilla extract", "vanilla", "vanilla essence"], unit: "tsp", cal: 12, protein: 0, carbs: 1, fat: 0 },
  { keys: ["honey"], unit: "cup", cal: 1031, protein: 0, carbs: 279, fat: 0 },
  { keys: ["maple syrup"], unit: "cup", cal: 840, protein: 0, carbs: 216, fat: 0 },
  { keys: ["cornstarch", "corn starch", "cornflour"], unit: "cup", cal: 488, protein: 0, carbs: 117, fat: 0 },
  { keys: ["oatmeal", "rolled oats", "oats", "old-fashioned oats"], unit: "cup", cal: 307, protein: 11, carbs: 55, fat: 5 },
  { keys: ["rice", "white rice", "long-grain rice", "jasmine rice"], unit: "cup", cal: 242, protein: 4, carbs: 53, fat: 0 },
  { keys: ["breadcrumbs", "bread crumbs", "panko"], unit: "cup", cal: 427, protein: 15, carbs: 77, fat: 6 },
  { keys: ["cream cheese"], unit: "cup", cal: 792, protein: 14, carbs: 8, fat: 78 },
  { keys: ["sour cream"], unit: "cup", cal: 492, protein: 7, carbs: 9, fat: 48 },
  { keys: ["yogurt", "greek yogurt", "plain yogurt"], unit: "cup", cal: 149, protein: 8, carbs: 11, fat: 8 },
  { keys: ["cream", "heavy cream", "double cream", "whipping cream"], unit: "cup", cal: 821, protein: 5, carbs: 7, fat: 88 },
  { keys: ["parmesan", "parmesan cheese", "parmigiano"], unit: "cup", cal: 431, protein: 28, carbs: 4, fat: 29 },
  { keys: ["cheddar", "cheddar cheese", "sharp cheddar"], unit: "cup", cal: 455, protein: 28, carbs: 1, fat: 37 },
  { keys: ["mozzarella", "mozzarella cheese"], unit: "cup", cal: 336, protein: 25, carbs: 3, fat: 25 },
  { keys: ["garlic", "garlic clove", "garlic cloves"], unit: "clove", cal: 4, protein: 0, carbs: 1, fat: 0 },
  { keys: ["onion", "onions", "yellow onion", "white onion"], unit: "cup", cal: 64, protein: 2, carbs: 15, fat: 0 },
  { keys: ["tomato", "tomatoes", "tomato puree", "tomato paste"], unit: "cup", cal: 32, protein: 2, carbs: 7, fat: 0 },
  { keys: ["chicken broth", "chicken stock", "vegetable broth", "vegetable stock", "beef broth", "stock"], unit: "cup", cal: 39, protein: 5, carbs: 1, fat: 1 },
  { keys: ["soy sauce"], unit: "tbsp", cal: 9, protein: 1, carbs: 1, fat: 0 },
  { keys: ["vinegar", "white vinegar", "apple cider vinegar", "red wine vinegar"], unit: "tbsp", cal: 3, protein: 0, carbs: 0, fat: 0 },
  { keys: ["mustard", "dijon mustard", "yellow mustard"], unit: "tsp", cal: 3, protein: 0, carbs: 0, fat: 0 },
  { keys: ["mayonnaise", "mayo"], unit: "tbsp", cal: 94, protein: 0, carbs: 0, fat: 10 },
  { keys: ["ketchup", "tomato ketchup"], unit: "tbsp", cal: 17, protein: 0, carbs: 5, fat: 0 },
  { keys: ["peanut butter", "almond butter"], unit: "tbsp", cal: 94, protein: 4, carbs: 3, fat: 8 },
  { keys: ["nuts", "almonds", "walnuts", "pecans", "cashews", "peanuts"], unit: "cup", cal: 523, protein: 15, carbs: 21, fat: 45 },
  { keys: ["chocolate chips", "chocolate chunks", "dark chocolate chips"], unit: "cup", cal: 805, protein: 9, carbs: 93, fat: 51 },
  { keys: ["coconut", "shredded coconut", "desiccated coconut"], unit: "cup", cal: 283, protein: 3, carbs: 12, fat: 27 },
  { keys: ["lemon juice", "lime juice", "citrus juice"], unit: "tbsp", cal: 4, protein: 0, carbs: 1, fat: 0 },
  { keys: ["olives"], unit: "cup", cal: 154, protein: 1, carbs: 8, fat: 15 },
  { keys: ["spinach", "baby spinach", "leaf spinach"], unit: "cup", cal: 7, protein: 1, carbs: 1, fat: 0 },
  { keys: ["lettuce", "romaine", "iceberg", "mixed greens"], unit: "cup", cal: 8, protein: 1, carbs: 2, fat: 0 },
  { keys: ["carrot", "carrots"], unit: "cup", cal: 52, protein: 1, carbs: 12, fat: 0 },
  { keys: ["celery"], unit: "cup", cal: 14, protein: 1, carbs: 3, fat: 0 },
  { keys: ["bell pepper", "bell peppers", "pepper", "red pepper", "green pepper"], unit: "cup", cal: 46, protein: 1, carbs: 9, fat: 0 },
  { keys: ["potato", "potatoes", "russet potato", "yukon gold"], unit: "cup", cal: 116, protein: 2, carbs: 27, fat: 0 },
  { keys: ["black pepper", "ground pepper", "peppercorns"], unit: "tsp", cal: 6, protein: 0, carbs: 2, fat: 0 },
  { keys: ["paprika", "smoked paprika"], unit: "tsp", cal: 6, protein: 0, carbs: 1, fat: 0 },
  { keys: ["cumin", "ground cumin"], unit: "tsp", cal: 8, protein: 0, carbs: 1, fat: 0 },
  { keys: ["cinnamon", "ground cinnamon"], unit: "tsp", cal: 6, protein: 0, carbs: 2, fat: 0 },
  { keys: ["nutmeg", "ground nutmeg"], unit: "tsp", cal: 12, protein: 0, carbs: 1, fat: 1 },
  { keys: ["oregano", "dried oregano", "fresh oregano"], unit: "tsp", cal: 3, protein: 0, carbs: 1, fat: 0 },
  { keys: ["basil", "fresh basil", "dried basil"], unit: "tsp", cal: 1, protein: 0, carbs: 0, fat: 0 },
  { keys: ["parsley", "fresh parsley", "dried parsley"], unit: "tbsp", cal: 1, protein: 0, carbs: 0, fat: 0 },
  { keys: ["thyme", "fresh thyme", "dried thyme"], unit: "tsp", cal: 3, protein: 0, carbs: 1, fat: 0 },
  { keys: ["rosemary", "fresh rosemary", "dried rosemary"], unit: "tsp", cal: 4, protein: 0, carbs: 1, fat: 0 },
  { keys: ["gelatin", "gelatine"], unit: "tbsp", cal: 32, protein: 8, carbs: 0, fat: 0 },
  { keys: ["corn syrup", "light corn syrup", "golden syrup"], unit: "cup", cal: 1031, protein: 0, carbs: 279, fat: 0 },
  { keys: ["molasses"], unit: "tbsp", cal: 58, protein: 0, carbs: 15, fat: 0 },
  { keys: ["raisins", "dried raisins"], unit: "cup", cal: 434, protein: 5, carbs: 115, fat: 1 },
  { keys: ["cranberries", "dried cranberries", "craisins"], unit: "cup", cal: 123, protein: 0, carbs: 33, fat: 0 },
  { keys: ["banana", "bananas"], unit: "cup", cal: 200, protein: 2, carbs: 51, fat: 1 },
  { keys: ["apple", "apples"], unit: "cup", cal: 57, protein: 0, carbs: 15, fat: 0 },
  { keys: ["water"], unit: "cup", cal: 0, protein: 0, carbs: 0, fat: 0 },
];

function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .replace(/s$/, ""); // plural strip
}

function toCups(amount: number, unit: string): number {
  const u = (unit || "").toLowerCase();
  if (u === "cup" || u === "cups") return amount;
  if (u === "tablespoon" || u === "tablespoons" || u === "tbsp") return amount / 16;
  if (u === "teaspoon" || u === "teaspoons" || u === "tsp") return amount / 48;
  if (u === "fluid ounce" || u === "fluid ounces" || u === "fl oz" || u === "oz") return amount / 8;
  if (u === "ml" || u === "milliliter" || u === "milliliters") return amount / 237;
  return 0;
}

function toTbsp(amount: number, unit: string): number {
  const u = (unit || "").toLowerCase();
  if (u === "tablespoon" || u === "tablespoons" || u === "tbsp") return amount;
  if (u === "teaspoon" || u === "teaspoons" || u === "tsp") return amount / 3;
  if (u === "cup" || u === "cups") return amount * 16;
  if (u === "fluid ounce" || u === "fluid ounces" || u === "fl oz" || u === "oz") return amount * 2;
  return 0;
}

function toTsp(amount: number, unit: string): number {
  const u = (unit || "").toLowerCase();
  if (u === "teaspoon" || u === "teaspoons" || u === "tsp") return amount;
  if (u === "tablespoon" || u === "tablespoons" || u === "tbsp") return amount * 3;
  if (u === "cup" || u === "cups") return amount * 48;
  if (u === "pinch" || u === "pinches") return amount / 16;
  return 0;
}

function toEgg(amount: number, unit: string): number {
  const u = (unit || "").toLowerCase();
  if (!u || u === "unit" || u === "egg" || u === "eggs" || u === "large" || u === "medium" || u === "small") {
    const size = u === "medium" ? 0.85 : u === "small" ? 0.7 : 1;
    return amount * size;
  }
  return 0;
}

function toClove(amount: number, unit: string): number {
  const u = (unit || "").toLowerCase();
  if (u === "clove" || u === "cloves" || !u || u === "unit") return amount;
  return 0;
}

export function lookupNutrition(
  name: string,
  amount: number,
  unit: string
): { calories: number; protein: number; carbs: number; fat: number } | null {
  const norm = normalizeName(name);
  if (!norm) return null;

  for (const row of NUTRITION_DB) {
    const match = row.keys.some((k) => {
      const n = normalizeName(k);
      if (norm === n || n === norm) return true;
      if (norm.startsWith(n + " ") || norm.endsWith(" " + n) || norm.includes(" " + n + " ")) return true;
      if (n.startsWith(norm + " ") || n.endsWith(" " + norm) || n.includes(" " + norm + " ")) return true;
      return false;
    });
    if (!match) continue;

    let factor = 0;
    switch (row.unit) {
      case "cup":
        factor = toCups(amount, unit);
        if (factor <= 0 && (unit === "unit" || !unit)) factor = amount;
        break;
      case "tbsp":
        factor = toTbsp(amount, unit) || (toCups(amount, unit) > 0 ? toCups(amount, unit) * 16 : 0);
        break;
      case "tsp":
        factor = toTsp(amount, unit) || (toTbsp(amount, unit) > 0 ? toTbsp(amount, unit) * 3 : 0) || (toCups(amount, unit) > 0 ? toCups(amount, unit) * 48 : 0);
        break;
      case "egg":
        factor = toEgg(amount, unit);
        break;
      case "clove":
        factor = toClove(amount, unit);
        break;
      case "unit":
        factor = amount > 0 ? amount : 1;
        break;
    }
    if (factor <= 0) continue;

    return {
      calories: Math.round(row.cal * factor),
      protein: Math.round(row.protein * factor),
      carbs: Math.round(row.carbs * factor),
      fat: Math.round(row.fat * factor),
    };
  }
  return null;
}
