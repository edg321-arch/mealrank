import { Link } from "wouter";
import { useLeaderboard } from "@/hooks/use-rank";
import { useMealHistory } from "@/hooks/use-meals";
import { imageSrc } from "@/lib/images";
import { RatingBadge } from "@/components/RatingBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type Meal = {
  id: number;
  name: string;
  rating: number;
  wins: number;
  losses: number;
  images?: { id: number; imageType: string; imageUrl?: string | null; imageData?: string | null; mimeType?: string | null }[];
};

function LeaderboardRow({
  meal,
  rank,
  streak,
}: {
  meal: Meal;
  rank: number;
  streak: number;
}) {
  const img = meal.images?.[0];
  const src = img ? imageSrc(img) : null;
  const isTop3 = rank <= 3;
  const bg =
    rank === 1
      ? "bg-amber-500/10 border-amber-500/30"
      : rank === 2
        ? "bg-zinc-400/10 border-zinc-400/30"
        : rank === 3
          ? "bg-amber-700/10 border-amber-700/30"
          : "bg-card";

  return (
    <Link
      href={`/meals/${meal.id}`}
      className={cn(
        "flex items-center gap-4 p-4 rounded-xl border transition-colors hover:bg-muted/50 block",
        bg
      )}
    >
        <span
          className={cn(
            "text-xl font-bold w-8 shrink-0",
            rank === 1 && "text-amber-500",
            rank === 2 && "text-zinc-400",
            rank === 3 && "text-amber-700"
          )}
        >
          #{rank}
        </span>
        <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted shrink-0">
          {src ? (
            <img src={src} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">🍽</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{meal.name}</p>
          <p className="text-sm text-muted-foreground">
            {meal.wins}W – {meal.losses}L
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {streak >= 3 && (
            <span className="text-sm text-amber-500" title={`${streak}-win streak`}>
              🔥 {streak}
            </span>
          )}
          <RatingBadge rating={meal.rating} size="sm" />
        </div>
    </Link>
  );
}

export function LeaderboardPage() {
  const { data: list, isLoading, error } = useLeaderboard();
  const meals = (list ?? []) as Meal[];

  if (isLoading) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Leaderboard</h1>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-8">
        <p className="text-destructive">Failed to load leaderboard.</p>
      </div>
    );
  }

  if (!meals.length) {
    return (
      <div className="container max-w-2xl mx-auto px-4 py-12 text-center text-muted-foreground">
        <p className="text-lg mb-2">No meals yet</p>
        <p className="text-sm">Add and rank meals to see the leaderboard.</p>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Leaderboard</h1>
      <div className="space-y-2">
        {meals.map((meal, i) => (
          <LeaderboardRowWithStreak key={meal.id} meal={meal} rank={i + 1} />
        ))}
      </div>
    </div>
  );
}

function LeaderboardRowWithStreak({ meal, rank }: { meal: Meal; rank: number }) {
  const { data: history } = useMealHistory(meal.id);
  const h = (history ?? []) as { type: "win" | "loss" }[];
  let streak = 0;
  if (h.length && h[0]!.type === "win") {
    for (const x of h) {
      if (x.type !== "win") break;
      streak++;
    }
  }
  return <LeaderboardRow meal={meal} rank={rank} streak={streak} />;
}
