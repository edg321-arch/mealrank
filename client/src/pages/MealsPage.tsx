import { useState } from "react";
import { Link } from "wouter";
import { useMeals } from "@/hooks/use-meals";
import { MealCard } from "@/components/MealCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, ChevronDown } from "lucide-react";

type SortBy = "date" | "rating" | "name";
type SortDir = "asc" | "desc";

const sortLabels: Record<SortBy, string> = {
  date: "Date",
  rating: "Rating",
  name: "Name",
};

export function MealsPage() {
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const { data: meals, isLoading, error } = useMeals({
    sortBy,
    sortDir,
    search: search || undefined,
  });

  const applySearch = () => setSearch(searchInput);

  return (
    <div className="container max-w-6xl mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">Meals</h1>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-1 min-w-[200px] max-w-sm">
            <Input
              placeholder="Search meals..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applySearch()}
              className="rounded-r-none border-r-0"
            />
            <Button
              type="button"
              variant="secondary"
              className="rounded-l-none border"
              onClick={applySearch}
              aria-label="Search"
            >
              <Search className="size-4" />
            </Button>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                {sortLabels[sortBy]} {sortDir === "asc" ? "↑" : "↓"}
                <ChevronDown className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(["date", "rating", "name"] as SortBy[]).map((s) => (
                <DropdownMenuItem
                  key={s}
                  onClick={() => {
                    if (sortBy === s) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
                    else setSortBy(s);
                  }}
                >
                  {sortLabels[s]} {sortBy === s ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <p className="text-destructive">Failed to load meals.</p>
      ) : !meals?.length ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg mb-2">No meals yet</p>
          <p className="text-sm mb-4">Add your first meal to start tracking and ranking.</p>
          <Link
            href="/meals/new"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Add Meal
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {(meals as unknown[]).map((m: { id: number; name: string; rating: number; images?: unknown[] }) => (
            <MealCard key={m.id} meal={m} />
          ))}
        </div>
      )}

      <Link
        href="/meals/new"
        className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-40 inline-flex items-center justify-center rounded-full h-14 w-14 bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        aria-label="Add meal"
      >
        <Plus className="size-6" />
      </Link>
    </div>
  );
}
