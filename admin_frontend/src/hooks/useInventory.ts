import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { inventoryService } from "@/api/inventory";

export function useInventoryRecords() {
  return useQuery({
    queryKey: ["inventory-records"],
    queryFn: inventoryService.getRecords,
  });
}

export function useInventoryHolds() {
  return useQuery({
    queryKey: ["inventory-holds"],
    queryFn: inventoryService.getHolds,
  });
}

export function useReleaseHold() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (holdId: number) => inventoryService.releaseHold(holdId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-holds"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-records"] });
    },
  });
}
