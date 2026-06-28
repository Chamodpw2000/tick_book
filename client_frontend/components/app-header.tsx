"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import {
  clearAuthTokenFromStorage,
  clearAuthUserFromStorage,
  getAuthTokenFromStorage,
  getAuthUserFromStorage,
  notifyAuthChanged,
} from "@/lib/auth";

const readSession = () => {
  const token = getAuthTokenFromStorage();
  const user = getAuthUserFromStorage();
  return { token, user };
};

export function AppHeader() {
  const [{ token, user }, setSession] = React.useState<ReturnType<typeof readSession>>({
    token: null,
    user: null,
  });

  const handleLogout = () => {
    clearAuthTokenFromStorage();
    clearAuthUserFromStorage();
    notifyAuthChanged();
  };

  React.useEffect(() => {
    const sync = () => setSession(readSession());

    sync();

    globalThis.addEventListener("storage", sync);
    globalThis.addEventListener("auth-changed", sync as EventListener);

    return () => {
      globalThis.removeEventListener("storage", sync);
      globalThis.removeEventListener("auth-changed", sync as EventListener);
    };
  }, []);

  console.log(user,"user in header");

  const displayName = user?.displayName || "User";

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/85 shadow-[0_8px_30px_rgba(2,6,23,0.45)] backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight text-white">
          <Image src="/logo.png" alt="Tickety Logo" width={32} height={32} className="h-8 w-auto" />
          Tickety
        </Link>

        <nav className="flex items-center gap-2">
          {token ? (
            <>
              <span className="hidden text-sm text-slate-200 sm:inline">
                {displayName ? `Hello  ${displayName} !` : "Signed in"}
              </span>
              <Button asChild variant="ghost" size="sm" className="text-slate-100 hover:bg-white/10 hover:text-white">
                <Link href="/profile">Profile</Link>
              </Button>
              <Button variant="outline" size="sm" className="border-white/20 bg-white/5 text-white hover:bg-white/10" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="text-slate-100 hover:bg-white/10 hover:text-white">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild size="sm" className="bg-cyan-300 text-slate-950 hover:bg-cyan-200">
                <Link href="/register">Register</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
