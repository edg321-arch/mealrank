import { useParams, useLocation } from "wouter";
import { useEffect, useState, useCallback } from "react";
import { useMeal, useCreateMeal, useUpdateMeal } from "@/hooks/use-meals";
import { useParseRecipe, type ParsedRecipe } from "@/hooks/use-parse-recipe";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageUpload } from "@/components/ImageUpload";
import { Skeleton } from "@/components/ui/skeleton";
import { toImageItem, type ImageItem } from "@/lib/images";
import { VALIDATION } from "@shared/validation";
import { Plus, Trash2, Loader2, FileDown } from "lucide-react";

type IngredientRow = {
  id: number;
  name: string;
  amount: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type Meal = {
  id: number;
  name: string;
  date: string;
  recipeUrl?: string | null;
  servings: number;
  instructions?: string | null;
  notes?: string | null;
  ingredients?: { name: string; amount: number; unit: string; calories: number; protein: number; carbs: number; fat: number }[];
  images?: { id: number; imageType: string; imageUrl?: string | null; imageData?: string | null; mimeType?: string | null }[];
};

const emptyIngredient = (id: number): IngredientRow => ({
  id,
  name: "",
  amount: 0,
  unit: "",
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
});

function imagesToPayload(items: ImageItem[]) {
  return items.map((img) => {
    if (img.type === "url") return { type: "url" as const, url: img.url };
    return {
      type: "base64" as const,
      base64: img.data,
      mimeType: img.mimeType ?? undefined,
    };
  });
}

function parsedToImageItems(urls: string[], startId: number): ImageItem[] {
  return urls.slice(0, VALIDATION.MAX_IMAGES_PER_MEAL).map((url, i) => ({
    type: "url" as const,
    id: startId + i,
    url,
  }));
}

export function EditMealPage() {
  const params = useParams<"/meals/:id/edit" | "/meals/new">();
  const [location, setLocation] = useLocation();
  const isNew = location === "/meals/new";
  const id = isNew ? null : params?.id ? parseInt(params.id, 10) : null;

  const { data: meal, isLoading } = useMeal(id);
  const createMeal = useCreateMeal();
  const updateMeal = useUpdateMeal(id);

  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [servings, setServings] = useState(1);
  const [recipeUrl, setRecipeUrl] = useState("");
  const [instructions, setInstructions] = useState("");
  const [notes, setNotes] = useState("");
  const [ingredients, setIngredients] = useState<IngredientRow[]>([]);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [nextId, setNextId] = useState(0);
  const [nutritionOverride, setNutritionOverride] = useState<
    { totalCalories?: number; totalProtein?: number; totalCarbs?: number; totalFat?: number } | null
  >(null);

  const parseRecipe = useParseRecipe();

  useEffect(() => {
    if (!meal && !isNew) return;
    if (isNew) {
      setName("");
      setDate(new Date().toISOString().slice(0, 10));
      setServings(1);
      setRecipeUrl("");
      setInstructions("");
      setNotes("");
      setIngredients([emptyIngredient(0)]);
      setImages([]);
      setNextId(1);
      return;
    }
    const m = meal as Meal;
    setName(m.name);
    setDate(m.date ? new Date(m.date).toISOString().slice(0, 10) : "");
    setServings(m.servings ?? 1);
    setRecipeUrl(m.recipeUrl ?? "");
    setInstructions(m.instructions ?? "");
    setNotes(m.notes ?? "");
    const ings = (m.ingredients ?? []).map((i, idx) => ({
      ...i,
      id: idx,
    })) as IngredientRow[];
    setIngredients(ings.length ? ings : [emptyIngredient(0)]);
    setImages((m.images ?? []).map(toImageItem));
    setNextId(ings.length || 1);
    setNutritionOverride(null);
  }, [meal, isNew]);

  const handleImportFromUrl = useCallback(() => {
    const url = recipeUrl.trim();
    if (!url) return;
    try {
      new URL(url);
    } catch {
      return;
    }
    parseRecipe.mutate(url, {
      onSuccess: (data: ParsedRecipe) => {
        if (data.name) setName(data.name);
        if (data.servings != null && data.servings >= 1) setServings(data.servings);
        if (data.instructions) setInstructions(data.instructions);
        if (data.ingredients?.length) {
          const rows: IngredientRow[] = data.ingredients.slice(0, VALIDATION.MAX_INGREDIENTS).map((ing, i) => ({
            id: i,
            name: ing.name,
            amount: ing.amount,
            unit: ing.unit || "unit",
            calories: ing.calories ?? 0,
            protein: ing.protein ?? 0,
            carbs: ing.carbs ?? 0,
            fat: ing.fat ?? 0,
          }));
          setIngredients(rows);
          setNextId(rows.length);
        }
        if (data.images?.length) {
          setImages(parsedToImageItems(data.images, -200));
        }
        if (data.nutrition && (data.nutrition.calories != null || data.nutrition.protein != null || data.nutrition.carbs != null || data.nutrition.fat != null)) {
          setNutritionOverride({
            totalCalories: data.nutrition.calories,
            totalProtein: data.nutrition.protein,
            totalCarbs: data.nutrition.carbs,
            totalFat: data.nutrition.fat,
          });
        } else {
          setNutritionOverride(null);
        }
      },
    });
  }, [recipeUrl, parseRecipe]);

  const addIngredient = useCallback(() => {
    if (ingredients.length >= VALIDATION.MAX_INGREDIENTS) return;
    setNextId((n) => n + 1);
    setIngredients((prev) => [...prev, emptyIngredient(nextId)]);
  }, [ingredients.length, nextId]);

  const removeIngredient = useCallback((idx: number) => {
    setIngredients((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      return next.length ? next : [emptyIngredient(0)];
    });
  }, []);

  const updateIngredient = useCallback(
    (idx: number, field: keyof IngredientRow, value: string | number) => {
      setIngredients((prev) => {
        const next = [...prev];
        const row = next[idx];
        if (!row) return prev;
        if (field === "amount" || field === "calories" || field === "protein" || field === "carbs" || field === "fat") {
          (row as Record<string, unknown>)[field] = Number(value) || 0;
        } else {
          (row as Record<string, unknown>)[field] = value;
        }
        return next;
      });
    },
    []
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ingPayload = ingredients
      .filter((i) => i.name.trim())
      .map(({ name: n, amount, unit, calories, protein, carbs, fat }) => ({
        name: n,
        amount,
        unit,
        calories,
        protein,
        carbs,
        fat,
      }));

    const payload: Record<string, unknown> = {
      name: name.trim(),
      date: date || undefined,
      servings,
      recipeUrl: recipeUrl.trim() || undefined,
      instructions: instructions.trim() || undefined,
      notes: notes.trim() || undefined,
      ingredients: ingPayload,
      images: imagesToPayload(images),
    };
    if (nutritionOverride) payload.nutritionOverride = nutritionOverride;

    if (isNew) {
      createMeal.mutate(payload, {
        onSuccess: (data) => {
          const d = data as { id: number };
          setLocation(`/meals/${d.id}`);
        },
      });
    } else if (id != null) {
      updateMeal.mutate(payload, {
        onSuccess: () => {
          setLocation(`/meals/${id}`);
        },
      });
    }
  };

  if (!isNew && (id == null || Number.isNaN(id))) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <p className="text-destructive">Invalid meal.</p>
      </div>
    );
  }

  if (!isNew && isLoading) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-6">
        <Skeleton className="h-8 w-64 mb-6" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const mutating = createMeal.isPending || updateMeal.isPending;

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">{isNew ? "New Meal" : "Edit Meal"}</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Garlic Butter Salmon"
            maxLength={VALIDATION.MAX_MEAL_NAME}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="servings">Servings</Label>
            <Input
              id="servings"
              type="number"
              min={1}
              value={servings}
              onChange={(e) => setServings(Number(e.target.value) || 1)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="recipeUrl">Recipe URL</Label>
          <div className="flex gap-2">
            <Input
              id="recipeUrl"
              type="url"
              value={recipeUrl}
              onChange={(e) => {
                setRecipeUrl(e.target.value);
                if (parseRecipe.isError) parseRecipe.reset();
              }}
              placeholder="https://..."
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleImportFromUrl}
              disabled={!recipeUrl.trim() || parseRecipe.isPending || mutating}
              className="shrink-0 gap-2"
              title="Fetch and fill from recipe page"
            >
              {parseRecipe.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <FileDown className="size-4" />
              )}
              Import from URL
            </Button>
          </div>
          {parseRecipe.isError && (
            <p className="text-sm text-destructive">
              {parseRecipe.error instanceof Error ? parseRecipe.error.message : "Import failed"}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Images</Label>
          <ImageUpload value={images} onChange={setImages} disabled={mutating} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Ingredients</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addIngredient}
              disabled={ingredients.length >= VALIDATION.MAX_INGREDIENTS}
              className="gap-1"
            >
              <Plus className="size-4" />
              Add
            </Button>
          </div>
          <div className="space-y-3">
            {ingredients.map((row, idx) => (
              <div
                key={row.id}
                className="flex flex-wrap items-end gap-2 p-3 rounded-lg border bg-muted/30"
              >
                <Input
                  placeholder="Name"
                  value={row.name}
                  onChange={(e) => updateIngredient(idx, "name", e.target.value)}
                  className="flex-1 min-w-[120px]"
                />
                <Input
                  type="number"
                  min={0}
                  step={0.25}
                  placeholder="Amt"
                  value={row.amount || ""}
                  onChange={(e) => updateIngredient(idx, "amount", e.target.value)}
                  className="w-20"
                />
                <Input
                  placeholder="Unit"
                  value={row.unit}
                  onChange={(e) => updateIngredient(idx, "unit", e.target.value)}
                  className="w-20"
                />
                <Input
                  type="number"
                  min={0}
                  placeholder="Cal"
                  value={row.calories || ""}
                  onChange={(e) => updateIngredient(idx, "calories", e.target.value)}
                  className="w-16"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeIngredient(idx)}
                  disabled={ingredients.length <= 1}
                  aria-label="Remove ingredient"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="instructions">Instructions</Label>
          <textarea
            id="instructions"
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="Steps..."
            rows={4}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Tasting notes, tips..."
            rows={2}
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={mutating}>
            {mutating ? "Saving…" : "Save"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setLocation(isNew ? "/meals" : `/meals/${id}`)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
