import { parseRecipeFromUrl } from "./recipeParser.js";

const url = "https://www.foodnetwork.com/recipes/dave-lieberman/sweet-crepes-recipe-1916856";

parseRecipeFromUrl(url)
  .then((data) => {
    console.log("\n--- Parsed recipe ---");
    console.log(JSON.stringify(data, null, 2));
  })
  .catch((e) => {
    console.error("Parse failed:", e instanceof Error ? e.message : e);
    process.exit(1);
  });
