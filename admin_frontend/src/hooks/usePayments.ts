import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { paymentService } from "@/api/payments";

export function usePayments() {
  return useQuery({
    queryKey: ["payments"],
    queryFn: paymentService.getAll,
  });
}

export function useRefund() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ paymentId, reason }: { paymentId: number; reason?: string }) => 
      paymentService.refund(paymentId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
  });
}
