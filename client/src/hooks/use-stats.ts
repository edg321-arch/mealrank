import { useQuery } from "@tanstack/react-query";
import { API } from "@/lib/utils";

async function fetchJson<T>(url: string): Promise<T> {
  const r = await fetch(url);
  if (!r.ok) {
    const err = await r.json().catch(() => ({ error: r.statusText }));
    throw new Error((err as { error?: string }).error ?? "Request failed");
  }
  return r.json();
}

type Stats = {
  totalMeals: number;
  totalComparisons: number;
  avgCalories: number;
};

export function useStats() {
  return useQuery({
    queryKey: ["stats"],
    queryFn: () => fetchJson<Stats>(`${API}/stats`),
  });
}
