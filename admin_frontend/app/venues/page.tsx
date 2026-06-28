"use client";

import { VenueList } from "@/features/venues/VenueList";
import { CreateVenueForm } from "@/features/venues/CreateVenueForm";
import { Button } from "@/components/ui/button";
import { MapPin, Plus, Download } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { useState } from "react";

export default function VenuesPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight text-left">Venue Management</h1>
          <p className="text-slate-500 mt-1 text-left">Manage locations, seating capacities, and physical addresses.</p>
        </div>
        <div className="flex items-center gap-3">

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-slate-900 hover:bg-slate-800 shadow-md">
                <Plus className="h-4 w-4" />
                Add Venue
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Register New Venue</DialogTitle>
                <DialogDescription>
                  Configure a new location for hosting platform events.
                </DialogDescription>
              </DialogHeader>
              <CreateVenueForm onSuccess={() => setIsCreateOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <VenueList />
      </div>
    </div>
  );
}
