import { useState, useCallback } from "react";
import { Link } from "wouter";
import { useRankPair, useVote, useSkip } from "@/hooks/use-rank";
import { VoteCard } from "@/components/VoteCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SkipForward } from "lucide-react";

type Meal = {
  id: number;
  name: string;
  rating: number;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  images?: { id: number; imageType: string; imageUrl?: string | null; imageData?: string | null; mimeType?: string | null }[];
};

export function RankPage() {
  const { data, isLoading, error, refetch } = useRankPair();
  const vote = useVote();
  const skip = useSkip();
  const [deltaA, setDeltaA] = useState<number | null>(null);
  const [deltaB, setDeltaB] = useState<number | null>(null);
  const [key, setKey] = useState(0);

  const mealA = data?.mealA as Meal | null | undefined;
  const mealB = data?.mealB as Meal | null | undefined;
  const message = data?.message as string | null | undefined;
  const noPair = !mealA || !mealB;

  const handleVote = useCallback(
    (winnerId: number, loserId: number) => {
      if (vote.isPending) return;
      vote.mutate(
        { winnerId, loserId },
        {
          onSuccess: (res) => {
            const wid = (res.winner as { id: number }).id;
            setDeltaA(wid === mealA?.id ? res.deltaWinner : res.deltaLoser);
            setDeltaB(wid === mealB?.id ? res.deltaWinner : res.deltaLoser);
            setTimeout(() => {
              setDeltaA(null);
              setDeltaB(null);
              setKey((k) => k + 1);
              refetch();
            }, 1500);
          },
        }
      );
    },
    [vote, mealA?.id, mealB?.id, refetch]
  );

  const handleSkip = useCallback(() => {
    skip.mutate(undefined, { onSettled: () => refetch() });
  }, [skip, refetch]);

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6 text-center">Which is better?</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <Skeleton className="aspect-[4/3] rounded-2xl" />
          <Skeleton className="aspect-[4/3] rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8 text-center">
        <p className="text-destructive mb-4">Something went wrong.</p>
        <Button onClick={() => refetch()}>Try again</Button>
      </div>
    );
  }

  if (noPair || message) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="max-w-md mx-auto space-y-4">
          <p className="text-muted-foreground text-lg">
            {message ?? "Add at least 2 meals to start ranking!"}
          </p>
          <p className="text-sm text-muted-foreground">
            Log your meals, then come back here to compare them. Your best meals will rise to the top.
          </p>
          <Link
            href="/meals/new"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium h-11 px-8 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Add Your First Meal
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto px-4 py-6 md:py-8">
      <h1 className="text-2xl font-bold mb-6 text-center">Which is better?</h1>

      <div
        className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 md:items-stretch"
        key={key}
      >
        <div className="w-full max-w-sm md:max-w-xs flex flex-col">
          <VoteCard
            meal={mealA!}
            delta={deltaA}
            onClick={() => handleVote(mealA!.id, mealB!.id)}
            disabled={vote.isPending}
          />
        </div>
        <span className="text-2xl font-bold text-muted-foreground shrink-0">VS</span>
        <div className="w-full max-w-sm md:max-w-xs flex flex-col">
          <VoteCard
            meal={mealB!}
            delta={deltaB}
            onClick={() => handleVote(mealB!.id, mealA!.id)}
            disabled={vote.isPending}
          />
        </div>
      </div>

      <div className="flex justify-center mt-6">
        <Button
          variant="ghost"
          size="lg"
          onClick={handleSkip}
          disabled={skip.isPending || vote.isPending}
          className="gap-2"
        >
          <SkipForward className="size-4" />
          Skip
        </Button>
      </div>
    </div>
  );
}
