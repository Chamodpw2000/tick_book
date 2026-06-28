"use client";

import { AlertCircle, RefreshCw, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ServiceErrorProps {
  serviceName: string;
  port: number | string;
  icon: LucideIcon;
  onRetry?: () => void;
}

export function ServiceError({ 
  serviceName, 
  port, 
  icon: Icon, 
  onRetry = () => window.location.reload() 
}: ServiceErrorProps) {
  return (
    <div className="p-12 text-center bg-white rounded-2xl border-2 border-dashed border-slate-100 text-slate-500 shadow-sm max-w-2xl mx-auto my-8">
      <div className="h-14 w-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
        <Icon className="h-7 w-7" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 tracking-tight">
        {serviceName} Unreachable
      </h3>
      <p className="max-w-sm mx-auto mt-3 text-sm text-slate-500 leading-relaxed">
        Communication with the <strong>{serviceName.toLowerCase()}</strong> microservice has timed out. 
        Please ensure the service is active on port <code className="bg-slate-100 px-1 rounded font-mono text-blue-600">{port}</code>.
      </p>
      
      <div className="mt-8 flex items-center justify-center gap-3">
        <Button 
          variant="outline" 
          className="gap-2 border-slate-200 hover:bg-slate-50 font-semibold" 
          onClick={onRetry}
        >
          <RefreshCw className="h-4 w-4" />
          Retry Connection
        </Button>
      </div>
      
      <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest text-slate-400 font-bold">
        <AlertCircle className="h-3 w-3" />
        System Diagnostic Tool
      </div>
    </div>
  );
}
