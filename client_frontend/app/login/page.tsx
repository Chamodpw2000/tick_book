"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getAuthTokenFromStorage,
  notifyAuthChanged,
  setAuthTokenToStorage,
  setAuthUserToStorage,
} from "@/lib/auth";
import { HttpError } from "@/lib/http";
import { userClient } from "@/lib/clients/userClient";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    const token = getAuthTokenFromStorage();
    if (token) {
      router.replace("/");
      router.refresh();
    }
  }, [router]);

  const getErrorMessage = (error: unknown) => {
    if (error instanceof HttpError) {
      if (typeof error.body === "object" && error.body !== null && "message" in error.body) {
        const message = (error.body as { message?: unknown }).message;
        if (typeof message === "string") return message;
      }

      return error.message;
    }

    return "Login failed.";
  };

  const toDisplayName = (firstName?: string | null, lastName?: string | null) => {
    const fullName = [firstName?.trim(), lastName?.trim()].filter(Boolean).join(" ");
    return fullName || "User";
  };

  const onSubmit = async (event: React.SyntheticEvent) => {
    event.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Email and password are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await userClient.login({
        email: email.trim(),
        password,
      });

      let displayName = "User";
      try {
        const userDetails = await userClient.byId(result.user.id);
        displayName = toDisplayName(userDetails.userProfile?.firstName, userDetails.userProfile?.lastName);
      } catch {
        // Keep fallback display name if profile fetch fails.
      }

      setAuthTokenToStorage(result.token);
      setAuthUserToStorage({ id: result.user.id, email: result.user.email, displayName });
      notifyAuthChanged();

      router.push("/");
      router.refresh();
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl items-center px-4 py-12">
      <Card className="w-full">
        <CardHeader>
          <div className="flex justify-center mb-6">
            <Image src="/logo.png" alt="Tickety Logo" width={80} height={80} className="h-20 w-auto" />
          </div>
          <CardTitle className="text-center text-2xl">Login</CardTitle>
          <CardDescription className="text-center">Sign in with your email and password.</CardDescription>
        </CardHeader>

        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-between">
          <span className="text-sm text-muted-foreground">Don’t have an account?</span>
          <Button asChild variant="link" className="px-0">
            <Link href="/register">Create one</Link>
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
