"use client";

import { useState } from "react";
import { EventList } from "@/features/events/EventList";
import { CreateEventForm } from "@/features/events/CreateEventForm";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";

export default function EventsPage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Event Management</h1>
          <p className="text-slate-500 mt-1">Manage event details, artists, and ticket inventory across venues.</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 shadow-sm gap-2">
              <Plus className="h-4 w-4" />
              Create New Event
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] overflow-y-auto max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
              <DialogDescription>
                Fill in the details below to publish a new event.
              </DialogDescription>
            </DialogHeader>
            <CreateEventForm onSuccess={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <EventList />
    </div>
  );
}
