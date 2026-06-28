import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { eventService, Event } from "@/api/events";

export function useEvents() {
  return useQuery({
    queryKey: ["events"],
    queryFn: eventService.getAll,
  });
}

export function useEvent(id: number) {
  return useQuery({
    queryKey: ["events", id],
    queryFn: () => eventService.getById(id),
    enabled: !!id,
  });
}

export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Event>) => eventService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function useAddTicketSaga() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => eventService.addTicketWithInventorySaga(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function useAssignArtists() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, artistIds }: { eventId: number; artistIds: string[] }) => 
      eventService.addArtists(eventId, artistIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}
export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => eventService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}
