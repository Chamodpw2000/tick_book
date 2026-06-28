"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { Sidebar } from "@/features/layout/Sidebar";
import { Header } from "@/features/layout/Header";
import { LoadingBar } from "@/features/layout/LoadingBar";
import { ReactNode } from "react";
import { Loader2 } from "lucide-react";

const PUBLIC_PATHS = ["/login"];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isLoading, token } = useAuth();

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // Show a centered loader while hydrating auth state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  // Public pages (login) — no sidebar/header
  if (isPublic) {
    return <>{children}</>;
  }

  // Not authenticated and not a public path? 
  // Wait for AuthProvider's redirect effect to take us to /login
  if (!token) {
    return null;
  }


  // Authenticated pages — full dashboard shell
  return (
    <>
      <LoadingBar />
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex flex-1 flex-col pl-64">
          <Header />
          <main className="flex-1 p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </>
  );
}
