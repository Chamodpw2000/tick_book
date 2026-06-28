"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import {
  clearAuthTokenFromStorage,
  clearAuthUserFromStorage,
  notifyAuthChanged,
} from "@/lib/auth";

export default function LogoutPage() {
  const router = useRouter();

  React.useEffect(() => {
    clearAuthTokenFromStorage();
    clearAuthUserFromStorage();
    notifyAuthChanged();
    router.replace("/login");
    router.refresh();
  }, [router]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl items-center justify-center px-4 py-12">
      <div className="text-sm text-muted-foreground">Signing you out…</div>
    </main>
  );
}
