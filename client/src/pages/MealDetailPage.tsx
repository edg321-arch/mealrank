import { useParams, Link } from "wouter";
import { useMeal, useMealHistory } from "@/hooks/use-meals";
import { RatingBadge } from "@/components/RatingBadge";
import { NutritionDisplay } from "@/components/NutritionDisplay";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { imageSrc } from "@/lib/images";
import { cn } from "@/lib/utils";
import { ExternalLink, ChevronLeft } from "lucide-react";

type Meal = {
  id: number;
  name: string;
  rating: number;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  recipeUrl?: string | null;
  instructions?: string | null;
  notes?: string | null;
  ingredients?: { name: string; amount: number; unit: string }[];
  images?: { id: number; imageType: string; imageUrl?: string | null; imageData?: string | null; mimeType?: string | null }[];
};

type HistoryItem = {
  type: "win" | "loss";
  opponentName: string;
  createdAt: string;
};

export function MealDetailPage() {
  const params = useParams<"/meals/:id">();
  const id = params?.id ? parseInt(params.id, 10) : null;
  const { data: meal, isLoading, error } = useMeal(id);
  const { data: history } = useMealHistory(id);

  if (id == null || Number.isNaN(id)) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <p className="text-destructive">Invalid meal.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="aspect-video rounded-xl mb-6" />
        <Skeleton className="h-24 rounded-xl mb-4" />
      </div>
    );
  }

  if (error || !meal) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <p className="text-destructive">Meal not found.</p>
        <Link href="/meals" className="text-primary hover:underline mt-2 inline-block">
          Back to Meals
        </Link>
      </div>
    );
  }

  const m = meal as Meal;
  const imgs = m.images ?? [];
  const heroSrc = imgs[0] ? imageSrc(imgs[0]) : null;

  const winCount = (history as HistoryItem[] | undefined)?.filter((h) => h.type === "win").length ?? 0;
  const lossCount = (history as HistoryItem[] | undefined)?.filter((h) => h.type === "loss").length ?? 0;
  const streak = (() => {
    const h = (history as HistoryItem[] | undefined) ?? [];
    if (!h.length) return 0;
    const t = h[0]!.type;
    let s = 0;
    for (const x of h) {
      if (x.type !== t) break;
      s++;
    }
    return t === "win" ? s : -s;
  })();

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6">
      <Link
        href="/meals"
        className="inline-flex items-center gap-1 mb-4 -ml-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="size-4" />
        Meals
      </Link>

      <div className="aspect-video rounded-xl overflow-hidden bg-muted mb-6 relative">
        {heroSrc ? (
          <img src={heroSrc} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">🍽</div>
        )}
        <div className="absolute top-3 right-3">
          <RatingBadge rating={m.rating} size="lg" />
        </div>
      </div>

      <h1 className="text-2xl font-bold mb-2">{m.name}</h1>
      {m.recipeUrl && (
        <a
          href={m.recipeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-primary hover:underline mb-4"
        >
          <ExternalLink className="size-4" />
          View Original Recipe
        </a>
      )}

      <div className="mb-6">
        <NutritionDisplay
          calories={m.totalCalories}
          protein={m.totalProtein}
          carbs={m.totalCarbs}
          fat={m.totalFat}
        />
      </div>

      {m.ingredients && m.ingredients.length > 0 && (
        <Accordion type="single" collapsible className="mb-4">
          <AccordionItem value="ingredients">
            <AccordionTrigger>Ingredients</AccordionTrigger>
            <AccordionContent>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                {m.ingredients.map((i, idx) => (
                  <li key={idx}>
                    {i.amount} {i.unit} {i.name}
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {m.instructions && (
        <Accordion type="single" collapsible className="mb-4">
          <AccordionItem value="instructions">
            <AccordionTrigger>Instructions</AccordionTrigger>
            <AccordionContent className="whitespace-pre-wrap text-muted-foreground">
              {m.instructions}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      {m.notes && (
        <div className="rounded-lg border bg-muted/30 p-4 mb-6">
          <h3 className="font-semibold mb-2">Notes</h3>
          <p className="text-muted-foreground text-sm whitespace-pre-wrap">{m.notes}</p>
        </div>
      )}

      {history != null && (history as HistoryItem[]).length > 0 && (
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            Matchup History
            {streak >= 3 && (
              <span className="text-sm font-normal text-amber-500">🔥 {streak}-win streak</span>
            )}
            {streak <= -3 && (
              <span className="text-sm font-normal text-muted-foreground">{streak}-loss streak</span>
            )}
          </h3>
          <ul className="space-y-2">
            {(history as HistoryItem[]).map((h, idx) => (
              <li
                key={idx}
                className={cn(
                  "flex items-center justify-between py-1.5 px-2 rounded",
                  h.type === "win" ? "bg-green-500/10 text-green-600 dark:text-green-400" : "bg-red-500/10 text-red-600 dark:text-red-400"
                )}
              >
                <span>{h.type === "win" ? "Won vs" : "Lost to"}</span>
                <span className="font-medium">{h.opponentName}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

        <div className="mt-6 flex gap-2">
        <Link
          href={`/meals/${id}/edit`}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Edit Meal
        </Link>
      </div>
    </div>
  );
}
