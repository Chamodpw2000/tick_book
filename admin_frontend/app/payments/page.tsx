"use client";

import { PaymentList } from "@/features/payments/PaymentList";
import { usePayments } from "@/hooks/usePayments";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function PaymentsPage() {
  const { data: payments, isLoading } = usePayments();

  // Calculations
  const totalVolume = payments
    ?.filter(p => p.status === "PAID")
    .reduce((sum, p) => sum + p.amount, 0) || 0;

  const totalPayments = payments?.length || 0;
  const refundedCount = payments?.filter(p => p.status === "REFUNDED").length || 0;
  const refundRatio = totalPayments > 0 ? (refundedCount / totalPayments) * 100 : 0;

  const settledCount = payments?.filter(p => p.status === "PAID").length || 0;

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight text-left">Financial Operations</h1>
          <p className="text-slate-500 mt-1 text-left">Audit all successfully processed payments and manage refund offsets.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border-slate-200 shadow-sm text-left">
          <p className="text-sm text-slate-500 font-medium">Total Volume</p>
          {isLoading ? (
            <Skeleton className="h-8 w-32 mt-1" />
          ) : (
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR' }).format(totalVolume)}
            </h3>
          )}
          <p className="text-[10px] text-green-600 mt-1 font-medium">Live from Payment Service</p>
        </Card>
        
        <Card className="p-6 border-slate-200 shadow-sm text-left">
          <p className="text-sm text-slate-500 font-medium">Refund Ratio</p>
          {isLoading ? (
            <Skeleton className="h-8 w-16 mt-1" />
          ) : (
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {refundRatio.toFixed(1)}%
            </h3>
          )}
          <p className="text-[10px] text-slate-400 mt-1 font-medium">
            {refundedCount} total refunds processed
          </p>
        </Card>

        <Card className="p-6 border-slate-200 shadow-sm text-left">
          <p className="text-sm text-slate-500 font-medium">Settled Payouts</p>
          {isLoading ? (
            <Skeleton className="h-8 w-24 mt-1" />
          ) : (
            <h3 className="text-2xl font-bold text-slate-900 mt-1">
              {settledCount} Transactions
            </h3>
          )}
          <p className="text-[10px] text-blue-600 mt-1 font-medium">Automatic settlement enabled</p>
        </Card>
      </div>

      <PaymentList />
    </div>
  );
}
