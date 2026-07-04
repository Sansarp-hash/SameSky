import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  shipsApi,
  actressesApi,
  seriesApi,
  charactersApi,
  tarotApi,
  astrologyApi,
  dashboardApi,
  mysticProfileApi,
  type ReadingType,
} from "@/lib/mystic-api";

export function useMysticProfile() {
  return useQuery({ queryKey: ["mystic", "me"], queryFn: mysticProfileApi.me });
}

export function useUpgradeMystic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: mysticProfileApi.upgrade,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mystic"] });
    },
  });
}

export function useShips() {
  return useQuery({ queryKey: ["mystic", "ships"], queryFn: shipsApi.list });
}
export function useCreateShip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: shipsApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["mystic", "ships"] }); qc.invalidateQueries({ queryKey: ["mystic", "dashboard"] }); },
  });
}
export function useDeleteShip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: shipsApi.remove,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["mystic", "ships"] }); qc.invalidateQueries({ queryKey: ["mystic", "dashboard"] }); },
  });
}

export function useActresses() {
  return useQuery({ queryKey: ["mystic", "actresses"], queryFn: actressesApi.list });
}
export function useCreateActress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: actressesApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["mystic", "actresses"] }); qc.invalidateQueries({ queryKey: ["mystic", "dashboard"] }); },
  });
}
export function useDeleteActress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: actressesApi.remove,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["mystic", "actresses"] }); qc.invalidateQueries({ queryKey: ["mystic", "dashboard"] }); },
  });
}

export function useSeries() {
  return useQuery({ queryKey: ["mystic", "series"], queryFn: seriesApi.list });
}
export function useCreateSeries() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: seriesApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["mystic", "series"] }); qc.invalidateQueries({ queryKey: ["mystic", "dashboard"] }); },
  });
}
export function useDeleteSeries() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: seriesApi.remove,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["mystic", "series"] }); qc.invalidateQueries({ queryKey: ["mystic", "dashboard"] }); },
  });
}

export function useCharacters(seriesId: number) {
  return useQuery({
    queryKey: ["mystic", "characters", seriesId],
    queryFn: () => charactersApi.list(seriesId),
    enabled: !!seriesId,
  });
}
export function useCreateCharacter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: charactersApi.create,
    onSuccess: (_, v) => { qc.invalidateQueries({ queryKey: ["mystic", "characters", v.seriesId] }); qc.invalidateQueries({ queryKey: ["mystic", "dashboard"] }); },
  });
}
export function useDeleteCharacter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: charactersApi.remove,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["mystic", "characters"] }); qc.invalidateQueries({ queryKey: ["mystic", "dashboard"] }); },
  });
}

export function useTarotHistory() {
  return useQuery({ queryKey: ["mystic", "tarot", "history"], queryFn: tarotApi.history });
}
export function useDrawTarot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (readingType?: ReadingType) => tarotApi.draw(readingType),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["mystic", "tarot"] }); qc.invalidateQueries({ queryKey: ["mystic", "dashboard"] }); },
  });
}

export function useAstrologyProfile() {
  return useQuery({ queryKey: ["mystic", "astrology", "profile"], queryFn: astrologyApi.profile });
}
export function useGenerateAstrology() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: astrologyApi.generate,
    onSuccess: (data) => { qc.setQueryData(["mystic", "astrology", "profile"], data); qc.invalidateQueries({ queryKey: ["mystic", "dashboard"] }); },
  });
}

export function useDashboardSummary() {
  return useQuery({ queryKey: ["mystic", "dashboard"], queryFn: dashboardApi.summary });
}
