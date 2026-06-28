import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { artistService } from "@/api/artists";

export function useArtists() {
  return useQuery({
    queryKey: ["artists"],
    queryFn: artistService.getAll,
  });
}

export function useCreateArtist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => artistService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artists"] });
    },
  });
}

export function useDeleteArtist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => artistService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artists"] });
    },
  });
}
