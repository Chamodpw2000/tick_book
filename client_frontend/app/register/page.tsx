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
import { getAuthTokenFromStorage } from "@/lib/auth";
import { HttpError } from "@/lib/http";
import { userClient } from "@/lib/clients/userClient";

export default function RegisterPage() {
  const router = useRouter();

  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [birthday, setBirthday] = React.useState("");
  const [bio, setBio] = React.useState("");
  
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

    return "Registration failed.";
  };

  const onSubmit = async (event: React.SyntheticEvent) => {
    event.preventDefault();
    setError(null);

    if (!email.trim() || !password || !firstName.trim() || !lastName.trim()) {
      setError("First name, last name, email, and password are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await userClient.register({
        email: email.trim(),
        password,
        profile: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          bio: bio.trim() || undefined,
          birthday: birthday.trim() || undefined,
        }
      });

      router.push("/login");
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
          <CardTitle className="text-center text-2xl">Create account</CardTitle>
          <CardDescription className="text-center">Register with email, password, and your profile details.</CardDescription>
        </CardHeader>

        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="firstName">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="lastName">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

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
                autoComplete="new-password"
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="birthday">
                Birthday (Optional)
              </label>
              <input
                id="birthday"
                name="birthday"
                type="date"
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="bio">
                Bio (Optional)
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={3}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>

            {error ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create account"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-between">
          <span className="text-sm text-muted-foreground">Already have an account?</span>
          <Button asChild variant="link" className="px-0">
            <Link href="/login">Sign in</Link>
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
