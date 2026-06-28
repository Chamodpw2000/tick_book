"use client";

import { Event } from "@/api/events";
import { useArtists } from "@/hooks/useArtists";
import { useVenues } from "@/hooks/useVenues";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Calendar, 
  MapPin, 
  Users, 
  Ticket, 
  Clock,
  Info,
  ExternalLink
} from "lucide-react";
import { format } from "date-fns";

interface EventDetailsSheetProps {
  event: Event | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EventDetailsSheet({ event, open, onOpenChange }: EventDetailsSheetProps) {
  const { data: artists } = useArtists();
  const { data: venues } = useVenues();

  if (!event) return null;

  const venue = venues?.find(v => v._id === event.venueId.toString());
  const eventArtistIds = event.eventArtists?.map(ea => ea.artistId.toString()) || [];
  const assignedArtists = artists?.filter(a => eventArtistIds.includes(a._id));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[540px] overflow-y-auto p-8">
        <SheetHeader className="text-left">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className="text-[10px] uppercase tracking-wider text-slate-400">
              {event.category || "General"}
            </Badge>
            <Badge 
              variant={event.status === "published" ? "success" : "secondary"}
              className="capitalize text-[10px]"
            >
              {event.status}
            </Badge>
          </div>
          <SheetTitle className="text-2xl font-bold text-slate-900 leading-tight">
            {event.title}
          </SheetTitle>
          <SheetDescription className="text-slate-500 mt-2">
            Detailed overview of the event configuration and resource allocation.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-8 space-y-10 pb-10">
          {/* Banner Placeholder */}
          <div className="relative aspect-[21/9] w-full rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 shadow-inner group">
            {event.bannerUrl ? (
              <img src={event.bannerUrl} alt="Banner" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            ) : (
               <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 bg-gradient-to-br from-slate-50 to-slate-100">
                <ExternalLink className="h-8 w-8 mb-2 opacity-20" />
                <span className="text-[10px] font-medium uppercase tracking-widest opacity-60">No Banner Image</span>
               </div>
            )}
          </div>

          {/* Key Info Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100/50 space-y-3">
              <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">Start Time</h4>
                <p className="text-sm font-semibold text-slate-900">{format(new Date(event.startTime), "MMM d, h:mm a")}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100/50 space-y-3">
              <div className="h-8 w-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-1">End Time</h4>
                <p className="text-sm font-semibold text-slate-900">{format(new Date(event.endTime), "MMM d, h:mm a")}</p>
              </div>
            </div>
          </div>

          {/* Location Section */}
          <section className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-sm">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Venue Location</h4>
                <p className="text-base font-bold text-slate-900 leading-tight">
                  {venue ? venue.name : `Venue #${event.venueId}`}
                </p>
              </div>
            </div>
            
            {venue && (
              <div className="pl-13 space-y-1">
                <p className="text-sm text-slate-600 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  {venue.address}
                </p>
                <p className="text-xs text-slate-400 pl-3.5">
                  {venue.city}, {venue.country}
                </p>
              </div>
            )}
          </section>

          <Separator className="opacity-50" />

          {/* Lineup Section */}
          <section className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Users className="h-4 w-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Event Lineup</h4>
              </div>
              <Badge variant="outline" className="bg-white text-slate-500 font-medium px-3">
                {assignedArtists?.length || 0} Professional(s)
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {assignedArtists && assignedArtists.length > 0 ? (
                assignedArtists.map((artist) => (
                  <div key={artist._id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 bg-white shadow-sm hover:shadow-md hover:border-purple-100 transition-all group">
                    <div className="h-12 w-12 rounded-full border-2 border-slate-50 bg-slate-100 overflow-hidden flex-shrink-0 shadow-inner group-hover:border-purple-50">
                      {artist.profileImageUrl ? (
                        <img src={artist.profileImageUrl} alt={artist.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-slate-400 text-[10px] uppercase font-black">
                          {artist.name.substring(0, 2)}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{artist.name}</p>
                      <p className="text-[10px] text-slate-500 uppercase tracking-tighter font-semibold truncate">{artist.genre || "Global Artist"}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-8 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
                  <p className="text-sm text-slate-400 italic font-medium">No artists assigned yet.</p>
                </div>
              )}
            </div>
          </section>

          <Separator className="opacity-50" />

          {/* Ticket Inventory Section */}
          <section className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Ticket className="h-4 w-4" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Ticket Tiers</h4>
              </div>
              <Badge className="bg-slate-900 text-[10px] uppercase font-bold tracking-widest px-3">
                {event.eventTicketTypes?.length || 0} Categories
              </Badge>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {event.eventTicketTypes?.map((tt) => (
                <div key={tt.id} className="group relative p-5 rounded-2xl border border-slate-100 bg-white hover:border-amber-100 hover:shadow-xl transition-all duration-300">
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-1">
                      <h5 className="text-lg font-black text-slate-900 group-hover:text-amber-600 transition-colors leading-none">{tt.name}</h5>
                      <p className="text-xs text-slate-500 max-w-[240px] line-clamp-1">{tt.description || "Standard entry access."}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Price</span>
                      <span className="text-xl font-black text-slate-900 tracking-tight">
                        <span className="text-xs text-amber-500 mr-1">{tt.currency}</span>
                        {tt.price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Available Allocation</span>
                    </div>
                    <span className="text-sm font-black text-slate-700 bg-slate-50 px-3 py-1 rounded-full">{tt.initialStock} Units</span>
                  </div>
                </div>
              ))}
              {(!event.eventTicketTypes || event.eventTicketTypes.length === 0) && (
                <div className="py-12 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
                  <p className="text-sm text-slate-400 italic font-medium">Inventory has not been initialized.</p>
                </div>
              )}
            </div>
          </section>

          {/* Description Section */}
          {event.description && (
            <section className="p-6 rounded-2xl bg-slate-900 text-white space-y-3 shadow-2xl">
              <h4 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2 text-slate-400">
                <Info className="h-3 w-3" />
                About this Event
              </h4>
              <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed font-medium">
                {event.description}
              </p>
            </section>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
