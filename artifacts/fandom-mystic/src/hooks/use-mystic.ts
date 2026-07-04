import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  shipsApi,
  actressesApi,
  seriesApi,
  charactersApi,
  tarotApi,
  astrologyApi,
  dashboardApi,
  profileApi,
  type ReadingType,
} from "@/lib/api";

export function useShips() {
  return useQuery({
    queryKey: ["ships"],
    queryFn: shipsApi.list,
  });
}

export function useCreateShip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: shipsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ships"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "summary"] });
    },
  });
}

export function useDeleteShip() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: shipsApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ships"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "summary"] });
    },
  });
}

export function useActresses() {
  return useQuery({
    queryKey: ["actresses"],
    queryFn: actressesApi.list,
  });
}

export function useCreateActress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: actressesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["actresses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "summary"] });
    },
  });
}

export function useDeleteActress() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: actressesApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["actresses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "summary"] });
    },
  });
}

export function useSeries() {
  return useQuery({
    queryKey: ["series"],
    queryFn: seriesApi.list,
  });
}

export function useCreateSeries() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: seriesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["series"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "summary"] });
    },
  });
}

export function useUpdateSeries() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof seriesApi.update>[1] }) =>
      seriesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["series"] });
    },
  });
}

export function useDeleteSeries() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: seriesApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["series"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "summary"] });
    },
  });
}

export function useCharacters(seriesId: number) {
  return useQuery({
    queryKey: ["characters", seriesId],
    queryFn: () => charactersApi.list(seriesId),
    enabled: !!seriesId,
  });
}

export function useCreateCharacter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: charactersApi.create,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["characters", variables.seriesId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "summary"] });
    },
  });
}

export function useUpdateCharacter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof charactersApi.update>[1] }) =>
      charactersApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["characters"] });
    },
  });
}

export function useDeleteCharacter() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: charactersApi.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["characters"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "summary"] });
    },
  });
}

export function useTarotHistory() {
  return useQuery({
    queryKey: ["tarot", "history"],
    queryFn: tarotApi.history,
  });
}

export function useDrawTarot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (readingType?: ReadingType) => tarotApi.draw(readingType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tarot", "history"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", "summary"] });
    },
  });
}

export function useAstrologyProfile() {
  return useQuery({
    queryKey: ["astrology", "profile"],
    queryFn: astrologyApi.profile,
  });
}

export function useGenerateAstrology() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: astrologyApi.generate,
    onSuccess: (data) => {
      queryClient.setQueryData(["astrology", "profile"], data);
      queryClient.invalidateQueries({ queryKey: ["dashboard", "summary"] });
    },
  });
}

export function useDashboardSummary() {
  return useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: dashboardApi.summary,
  });
}

export function useUpgrade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: profileApi.upgrade,
    onSuccess: (user) => {
      queryClient.setQueryData(["auth", "me"], user);
      queryClient.invalidateQueries({ queryKey: ["dashboard", "summary"] });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: profileApi.changePassword,
  });
}
