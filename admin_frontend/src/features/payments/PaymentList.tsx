"use client";

import { usePayments, useRefund } from "@/hooks/usePayments";
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
  CreditCard, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  MoreVertical,
  Search,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { ServiceError } from "@/components/ServiceError";

export function PaymentList() {
  const { data: payments, isLoading, error } = usePayments();
  const refundMutation = useRefund();

  const handleRefund = async (paymentId: number) => {
    if (confirm("Are you sure you want to refund this payment? This action cannot be undone.")) {
      try {
        await refundMutation.mutateAsync({ 
          paymentId, 
          reason: "Administrative refund via dashboard" 
        });
        toast.success("Refund initiated successfully");
      } catch (err: any) {
        toast.error(err.message || "Failed to initiate refund");
      }
    }
  };

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorMessage />;

  return (
    <Card className="border-slate-200 shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="font-semibold text-slate-700">Transaction ID</TableHead>
            <TableHead className="font-semibold text-slate-700">Amount</TableHead>
            <TableHead className="font-semibold text-slate-700">Status</TableHead>
            <TableHead className="font-semibold text-slate-700">Method</TableHead>
            <TableHead className="font-semibold text-slate-700">Date</TableHead>
            <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments?.map((payment) => (
            <TableRow key={payment.id} className="hover:bg-slate-50/50 transition-colors">
              <TableCell className="font-mono text-xs text-slate-500">
                #TX-{payment.id.toString().padStart(6, '0')}
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-bold text-slate-900">
                    {payment.currency} {payment.amount.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400">Booking #{payment.bookingId}</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge 
                  variant={payment.status === "PAID" ? "success" : payment.status === "REFUNDED" ? "secondary" : "destructive"}
                  className="capitalize gap-1"
                >
                  {payment.status === "PAID" && <CheckCircle2 className="h-3 w-3" />}
                  {payment.status === "REFUNDED" && <RotateCcw className="h-3 w-3" />}
                  {payment.status === "PAID" ? "Paid" : payment.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 text-slate-600">
                  <CreditCard className="h-4 w-4 text-slate-400" />
                  <span className="text-xs font-medium">{payment.providerName} ({payment.paymentMethod})</span>
                </div>
              </TableCell>
              <TableCell className="text-xs text-slate-500">
                {new Date(payment.createdAt).toLocaleDateString()} {new Date(payment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
                      <ExternalLink className="h-4 w-4" />
                      View Audit Log
                    </DropdownMenuItem>
                    {payment.status === "PAID" && (
                      <DropdownMenuItem 
                        className="gap-2 text-red-600 focus:text-red-600"
                        onClick={() => handleRefund(payment.id)}
                        disabled={refundMutation.isPending}
                      >
                        <RotateCcw className="h-4 w-4" />
                        Refund Transaction
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
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
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        ))}
      </div>
    </Card>
  );
}

function ErrorMessage() {
  return (
    <ServiceError 
      serviceName="Payment Ledger" 
      port="3006" 
      icon={CreditCard} 
    />
  );
}
