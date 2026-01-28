import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API } from "@/lib/utils";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, init);
  if (!r.ok) {
    const err = await r.json().catch(() => ({ error: r.statusText }));
    throw new Error((err as { error?: string }).error ?? "Request failed");
  }
  return r.json();
}

type PairRes = {
  mealA: unknown | null;
  mealB: unknown | null;
  message: string | null;
};

type VoteRes = {
  winner: unknown;
  loser: unknown;
  deltaWinner: number;
  deltaLoser: number;
};

export function useRankPair() {
  return useQuery({
    queryKey: ["rankPair"],
    queryFn: () => fetchJson<PairRes>(`${API}/rank/pair`),
  });
}

export function useVote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { winnerId: number; loserId: number }) =>
      fetchJson<VoteRes>(`${API}/rank/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["rankPair"] });
      qc.invalidateQueries({ queryKey: ["leaderboard"] });
      qc.invalidateQueries({ queryKey: ["meals"] });
      qc.invalidateQueries({ queryKey: ["stats"] });
      const w = data.winner as { id: number };
      const l = data.loser as { id: number };
      if (w?.id) qc.invalidateQueries({ queryKey: ["mealHistory", w.id] });
      if (l?.id) qc.invalidateQueries({ queryKey: ["mealHistory", l.id] });
    },
  });
}

export function useSkip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {},
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["rankPair"] });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["rankPair"] });
    },
  });
}

export function useLeaderboard() {
  return useQuery({
    queryKey: ["leaderboard"],
    queryFn: () => fetchJson<unknown[]>(`${API}/rank/leaderboard`),
  });
}
