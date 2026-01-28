import { useMutation } from "@tanstack/react-query";
import { API } from "@/lib/utils";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, init);
  if (!r.ok) {
    const err = await r.json().catch(() => ({ error: r.statusText }));
    throw new Error((err as { error?: string }).error ?? "Request failed");
  }
  return r.json();
}

export type ParsedRecipe = {
  name?: string;
  ingredients?: { name: string; amount: number; unit: string; calories?: number; protein?: number; carbs?: number; fat?: number }[];
  servings?: number;
  instructions?: string;
  images?: string[];
  nutrition?: { calories?: number; protein?: number; carbs?: number; fat?: number };
};

export function useParseRecipe() {
  return useMutation({
    mutationFn: (url: string) =>
      fetchJson<ParsedRecipe>(`${API}/recipes/parse`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      }),
  });
}
