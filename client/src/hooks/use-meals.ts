import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { API } from "@/lib/utils";

type SortBy = "date" | "rating" | "name";
type SortDir = "asc" | "desc";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, init);
  if (!r.ok) {
    const err = await r.json().catch(() => ({ error: r.statusText }));
    throw new Error((err as { error?: string }).error ?? "Request failed");
  }
  return r.json();
}

export function useMeals(options?: {
  sortBy?: SortBy;
  sortDir?: SortDir;
  search?: string;
}) {
  const params = new URLSearchParams();
  if (options?.sortBy) params.set("sortBy", options.sortBy);
  if (options?.sortDir) params.set("sortDir", options.sortDir);
  if (options?.search) params.set("search", options.search);
  const q = params.toString();
  const url = `${API}/meals${q ? `?${q}` : ""}`;

  return useQuery({
    queryKey: ["meals", options?.sortBy, options?.sortDir, options?.search],
    queryFn: () => fetchJson<unknown[]>(url),
  });
}

export function useMeal(id: number | null) {
  return useQuery({
    queryKey: ["meal", id],
    queryFn: () => fetchJson<unknown>(`${API}/meals/${id}`),
    enabled: id != null,
  });
}

export function useMealHistory(id: number | null) {
  return useQuery({
    queryKey: ["mealHistory", id],
    queryFn: () => fetchJson<unknown[]>(`${API}/meals/${id}/history`),
    enabled: id != null,
  });
}

export function useCreateMeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: unknown) =>
      fetchJson<unknown>(`${API}/meals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meals"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
      qc.invalidateQueries({ queryKey: ["rankPair"] });
    },
  });
}

export function useUpdateMeal(id: number | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: unknown) =>
      fetchJson<unknown>(`${API}/meals/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      if (id == null) return;
      qc.invalidateQueries({ queryKey: ["meals"] });
      qc.invalidateQueries({ queryKey: ["meal", id] });
      qc.invalidateQueries({ queryKey: ["mealHistory", id] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
      qc.invalidateQueries({ queryKey: ["rankPair"] });
    },
  });
}

export function useDeleteMeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      fetch(`${API}/meals/${id}`, { method: "DELETE" }).then((r) => {
        if (!r.ok) throw new Error("Delete failed");
      }),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["meals"] });
      qc.invalidateQueries({ queryKey: ["meal", id] });
      qc.invalidateQueries({ queryKey: ["mealHistory", id] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
      qc.invalidateQueries({ queryKey: ["rankPair"] });
    },
  });
}
