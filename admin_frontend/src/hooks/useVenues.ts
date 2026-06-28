import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { venueService } from "@/api/venues";

export function useVenues() {
  return useQuery({
    queryKey: ["venues"],
    queryFn: venueService.getAll,
  });
}

export function useCreateVenue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => venueService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["venues"] });
    },
  });
}
