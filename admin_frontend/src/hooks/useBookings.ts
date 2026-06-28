import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { bookingService, Booking } from "@/api/bookings";

export function useBookings() {
  return useQuery({
    queryKey: ["bookings"],
    queryFn: bookingService.getAll,
  });
}

export function useBooking(id: number) {
  return useQuery({
    queryKey: ["bookings", id],
    queryFn: () => bookingService.getById(id),
    enabled: !!id,
  });
}

export function useConfirmBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) => 
      bookingService.confirm(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}

export function useExpireStaleBookings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bookingService.expireStale,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    },
  });
}
