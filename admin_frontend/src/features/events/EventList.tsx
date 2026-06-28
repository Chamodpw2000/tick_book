"use client";

import { useEvents, useDeleteEvent } from "@/hooks/useEvents";
import { useVenues } from "@/hooks/useVenues";
import { AssignArtistsForm } from "./AssignArtistsForm";
import { TicketTypeSagaForm } from "./TicketTypeSagaForm";
import { EventDetailsSheet } from "./EventDetailsSheet";
import { Event } from "@/api/events";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { 
  MapPin, 
  MoreVertical, 
  Edit, 
  ExternalLink,
  UserPlus,
  Zap,
  Trash2,
  Loader2,
  Ticket
} from "lucide-react";
import { ServiceError } from "@/components/ServiceError";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function EventList() {
  const { data: events, isLoading, isError } = useEvents();
  const { data: venues } = useVenues();
  const deleteEvent = useDeleteEvent();
  const [isAssignArtistsOpen, setIsAssignArtistsOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isTicketSagaOpen, setIsTicketSagaOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);


  const handleOpenAssignArtists = (eventId: number) => {
    setSelectedEventId(eventId);
    setIsAssignArtistsOpen(true);
  };

  const handleOpenTicketSaga = (eventId: number) => {
    setSelectedEventId(eventId);
    setIsTicketSagaOpen(true);
  };

  const handleOpenDetails = (event: Event) => {
    setSelectedEvent(event);
    setIsDetailsOpen(true);
  };

  const handleOpenDelete = (event: Event) => {
    setEventToDelete(event);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!eventToDelete) return;
    
    try {
      await deleteEvent.mutateAsync(eventToDelete.id);
      toast.success("Event deleted successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to delete event");
    } finally {
      setIsDeleteDialogOpen(false);
      setEventToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-[250px]" />
        <Card>
          <div className="h-[400px] w-full flex flex-col gap-2 p-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <ServiceError 
        serviceName="Event Service" 
        port="3001" 
        icon={Zap} 
      />
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-semibold text-slate-700">Event</TableHead>
              <TableHead className="font-semibold text-slate-700">Status</TableHead>
              <TableHead className="font-semibold text-slate-700">Venue</TableHead>
              <TableHead className="font-semibold text-slate-700">Time</TableHead>
              <TableHead className="font-semibold text-slate-700">Tickets</TableHead>
              <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events?.map((event) => (
              <TableRow 
                key={event.id} 
                className="hover:bg-slate-50/50 transition-colors cursor-pointer group"
                onClick={() => handleOpenDetails(event)}
              >
                <TableCell className="font-medium text-slate-900 group-hover:text-blue-600 transition-colors">
                  {event.title}
                </TableCell>
                <TableCell>
                  <Badge 
                    className={cn(
                      "capitalize",
                      event.status === "published" ? "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    )}
                  >
                    {event.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{venues?.find(v => v._id === event.venueId)?.name || `Venue #${event.venueId}`}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col text-xs text-slate-500">
                    <span>{new Date(event.startTime).toLocaleDateString()}</span>
                    <span>{new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-blue-600 border-blue-100 bg-blue-50/30">
                    {event.eventTicketTypes?.length || 0} Types
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenuItem 
                        className="gap-2"
                        onClick={() => handleOpenDetails(event)}
                      >
                        <ExternalLink className="h-4 w-4" />
                        View Full Details
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="gap-2 text-indigo-600 focus:text-indigo-600"
                        onClick={() => handleOpenAssignArtists(event.id)}
                      >
                        <UserPlus className="h-4 w-4" />
                        Assign Artists
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="gap-2 text-emerald-600 focus:text-emerald-600"
                        onClick={() => handleOpenTicketSaga(event.id)}
                      >
                        <Ticket className="h-4 w-4" />
                        Add Ticket Type
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="gap-2 text-red-600 focus:text-red-600"
                        onClick={() => handleOpenDelete(event)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Event
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>


      <Dialog open={isAssignArtistsOpen} onOpenChange={setIsAssignArtistsOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Assign Artists</DialogTitle>
            <DialogDescription>
              Select artists from the directory to participate in this event.
            </DialogDescription>
          </DialogHeader>
          {selectedEventId && (
            <AssignArtistsForm 
              eventId={selectedEventId} 
              onSuccess={() => setIsAssignArtistsOpen(false)} 
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isTicketSagaOpen} onOpenChange={setIsTicketSagaOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Ticket</DialogTitle>
            <DialogDescription>
              Create a new ticket tier and set its initial inventory.
            </DialogDescription>
          </DialogHeader>
          {selectedEventId && (
            <TicketTypeSagaForm 
              eventId={selectedEventId} 
              onSuccess={() => setIsTicketSagaOpen(false)} 
            />
          )}
        </DialogContent>
      </Dialog>

      <EventDetailsSheet 
        event={selectedEvent} 
        open={isDetailsOpen} 
        onOpenChange={setIsDetailsOpen} 
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the event{" "}
              <span className="font-semibold text-slate-900">"{eventToDelete?.title}"</span>.
              All associated ticket types and artist assignments will be removed.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteEvent.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              disabled={deleteEvent.isPending}
            >
              {deleteEvent.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete Event
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
