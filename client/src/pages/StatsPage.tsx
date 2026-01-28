import { useStats } from "@/hooks/use-stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { UtensilsCrossed, GitCompare, Flame } from "lucide-react";

export function StatsPage() {
  const { data: stats, isLoading, error } = useStats();

  if (isLoading) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">Stats</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <p className="text-destructive">Failed to load stats.</p>
      </div>
    );
  }

  const s = stats ?? { totalMeals: 0, totalComparisons: 0, avgCalories: 0 };

  return (
    <div className="container max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Stats</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <UtensilsCrossed className="size-5 text-primary" />
            <CardTitle className="text-base font-medium">Total Meals</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{s.totalMeals}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <GitCompare className="size-5 text-primary" />
            <CardTitle className="text-base font-medium">Total Comparisons</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{s.totalComparisons}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Flame className="size-5 text-primary" />
            <CardTitle className="text-base font-medium">Avg. Calories</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{s.avgCalories || "—"}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
