"use client";

import { useVenues } from "@/hooks/useVenues";
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
import { MapPin, Users, Phone, MoreVertical } from "lucide-react";
import { ServiceError } from "@/components/ServiceError";

export function VenueList() {
  const { data: venues, isLoading, error } = useVenues();

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorMessage />;

  return (
    <Card className="border-slate-200 shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="font-semibold text-slate-700">Venue</TableHead>
            <TableHead className="font-semibold text-slate-700">Location</TableHead>
            <TableHead className="font-semibold text-slate-700">Capacity</TableHead>
            <TableHead className="font-semibold text-slate-700">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {venues?.map((venue) => (
            <TableRow key={venue._id} className="hover:bg-slate-50/50 transition-colors text-left">
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-bold text-slate-900">{venue.name}</span>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Phone className="h-3 w-3" />
                    {venue.phone || "No phone"}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col text-sm text-slate-600">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-slate-400" />
                    <span>{venue.city}, {venue.country}</span>
                  </div>
                  <span className="text-xs text-slate-400">{venue.address}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                  <Users className="h-4 w-4 text-slate-400" />
                  {venue.capacity.toLocaleString()}
                </div>
              </TableCell>
              <TableCell>
                <Badge 
                  variant={venue.isActive ? "success" : "secondary"}
                  className="capitalize"
                >
                  {venue.isActive ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

function LoadingSkeleton() {
  return (
    <Card className="border-slate-200">
      <div className="p-4 space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-6 w-20" />
          </div>
        ))}
      </div>
    </Card>
  );
}

function ErrorMessage() {
  return (
    <ServiceError 
      serviceName="Venue Hub" 
      port="3005" 
      icon={MapPin} 
    />
  );
}
