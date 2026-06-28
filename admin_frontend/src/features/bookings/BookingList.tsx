"use client";

import { useBookings, useConfirmBooking } from "@/hooks/useBookings";
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
  Ticket, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MoreVertical, 
  Eye,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { ServiceError } from "@/components/ServiceError";

export function BookingList() {
  const { data: bookings, isLoading, error, refetch } = useBookings();
  const confirmBooking = useConfirmBooking();

  const handleConfirm = async (id: number) => {
    try {
      await confirmBooking.mutateAsync({ id });
      toast.success("Booking confirmed successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to confirm booking");
    }
  };

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorMessage />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-1">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Recent Transactions</h2>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => refetch()} 
          className="h-8 text-slate-500 gap-2"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Sync
        </Button>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-semibold text-slate-700">Reference</TableHead>
              <TableHead className="font-semibold text-slate-700">Order Details</TableHead>
              <TableHead className="font-semibold text-slate-700">Amount</TableHead>
              <TableHead className="font-semibold text-slate-700">Status</TableHead>
              <TableHead className="font-semibold text-slate-700">Payment</TableHead>
              <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings?.map((booking) => (
              <TableRow key={booking.id} className="hover:bg-slate-50/50 transition-colors">
                <TableCell>
                  <code className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    {booking.bookingReference}
                  </code>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-900">User #{booking.userId}</span>
                    <span className="text-xs text-slate-500 tracking-tight">Event #{booking.eventId}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-bold text-slate-900">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: booking.currency }).format(parseFloat(booking.totalAmount))}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge status={booking.status} />
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="border-slate-200 text-slate-500 font-medium">
                    {booking.paymentStatus}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem className="gap-2">
                        <Eye className="h-4 w-4" />
                        View Order Details
                      </DropdownMenuItem>
                      {booking.status === "PENDING" && (
                        <DropdownMenuItem 
                          className="gap-2 text-emerald-600 focus:text-emerald-600"
                          onClick={() => handleConfirm(booking.id)}
                        >
                          <CheckCircle className="h-4 w-4" />
                          Mark as Paid
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem className="gap-2 text-red-600 focus:text-red-600">
                        <XCircle className="h-4 w-4" />
                        Cancel Order
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "CONFIRMED":
      return <Badge variant="success" className="gap-1.5"><CheckCircle className="h-3 w-3" />Confirmed</Badge>;
    case "PENDING":
      return <Badge variant="secondary" className="gap-1.5"><Clock className="h-3 w-3" />Pending</Badge>;
    case "FAILED":
      return <Badge variant="destructive" className="gap-1.5"><XCircle className="h-3 w-3" />Failed</Badge>;
    default:
      return <Badge variant="outline" className="capitalize">{status.toLowerCase()}</Badge>;
  }
}

function LoadingSkeleton() {
  return (
    <Card className="border-slate-200">
      <div className="p-4 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center justify-between">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-8 w-8" />
          </div>
        ))}
      </div>
    </Card>
  );
}

function ErrorMessage() {
  return (
    <ServiceError 
      serviceName="Booking Engine" 
      port="3003" 
      icon={Ticket} 
    />
  );
}
