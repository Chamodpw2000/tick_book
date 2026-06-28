"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAuthUserFromStorage, getAuthTokenFromStorage, setAuthUserToStorage, notifyAuthChanged } from "@/lib/auth";
import { userClient } from "@/lib/clients/userClient";
import { HttpError } from "@/lib/http";

export default function ProfilePage() {
  const router = useRouter();
  
  const [userId, setUserId] = React.useState<string | null>(null);
  const [email, setEmail] = React.useState("");
  const [firstName, setFirstName] = React.useState("");
  const [lastName, setLastName] = React.useState("");
  const [bio, setBio] = React.useState("");
  const [birthday, setBirthday] = React.useState("");
  const [password, setPassword] = React.useState("");
  
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [message, setMessage] = React.useState<{ type: "error" | "success"; text: string } | null>(null);

  React.useEffect(() => {
    const token = getAuthTokenFromStorage();
    const user = getAuthUserFromStorage();
    
    if (!token || !user) {
      router.replace("/login");
      return;
    }

    setUserId(user.id);
    
    userClient.byId(user.id)
      .then((res) => {
        setEmail(res.email || "");
        if (res.userProfile) {
          setFirstName(res.userProfile.firstName || "");
          setLastName(res.userProfile.lastName || "");
          setBio(res.userProfile.bio || "");
          if (res.userProfile.birthday) {
            const date = new Date(res.userProfile.birthday);
            if (!Number.isNaN(date.getTime())) {
              setBirthday(date.toISOString().split("T")[0]);
            }
          }
        }
      })
      .catch((e) => {
        setMessage({ type: "error", text: "Failed to load profile details." });
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [router]);

  const getErrorMessage = (error: unknown) => {
    if (error instanceof HttpError) {
      if (typeof error.body === "object" && error.body !== null && "message" in error.body) {
        const message = (error.body as { message?: unknown }).message;
        if (typeof message === "string") return message;
      }
      return error.message;
    }
    return "Failed to update profile.";
  };

  const onSubmit = async (event: React.SyntheticEvent) => {
    event.preventDefault();
    setMessage(null);

    if (!userId) return;

    if (!firstName.trim() || !lastName.trim()) {
      setMessage({ type: "error", text: "First name and last name are required." });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        profile: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          bio: bio.trim() || undefined,
          birthday: birthday.trim() || undefined,
        }
      };

      if (password) {
        payload.password = password;
      }

      await userClient.update(userId, payload);
      
      // Update local storage display name
      const user = getAuthUserFromStorage();
      if (user) {
        setAuthUserToStorage({
          id: user.id,
          email: user.email,
          displayName: `${firstName.trim()} ${lastName.trim()}`,
        });
        notifyAuthChanged();
      }

      setPassword("");
      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (e) {
      setMessage({ type: "error", text: getErrorMessage(e) });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-xl items-center justify-center px-4 py-12">
        <p className="text-slate-400">Loading profile...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl items-center px-4 py-12">
      <Card className="w-full border-white/10 bg-slate-900/80 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-white">Edit Profile</CardTitle>
          <CardDescription className="text-slate-400">Update your personal details. Your email cannot be changed.</CardDescription>
        </CardHeader>

        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-200" htmlFor="firstName">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  className="h-10 w-full rounded-lg border border-white/10 bg-black/40 px-3 text-sm text-white outline-none focus-visible:border-cyan-400"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-200" htmlFor="lastName">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  className="h-10 w-full rounded-lg border border-white/10 bg-black/40 px-3 text-sm text-white outline-none focus-visible:border-cyan-400"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-200" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                disabled
                className="h-10 w-full rounded-lg border border-white/5 bg-white/5 px-3 text-sm text-slate-500 outline-none cursor-not-allowed"
                value={email}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-200" htmlFor="birthday">
                Birthday (Optional)
              </label>
              <input
                id="birthday"
                name="birthday"
                type="date"
                className="h-10 w-full rounded-lg border border-white/10 bg-black/40 px-3 text-sm text-white outline-none focus-visible:border-cyan-400"
                value={birthday}
                onChange={(e) => setBirthday(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-200" htmlFor="bio">
                Bio (Optional)
              </label>
              <textarea
                id="bio"
                name="bio"
                rows={3}
                className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none focus-visible:border-cyan-400"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>

            <div className="border-t border-white/10 pt-4 mt-6">
              <h4 className="text-sm font-medium text-slate-200 mb-3">Change Password</h4>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400" htmlFor="password">
                  New Password (leave blank to keep current)
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  className="h-10 w-full rounded-lg border border-white/10 bg-black/40 px-3 text-sm text-white outline-none focus-visible:border-cyan-400"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {message ? (
              <div className={`rounded-lg border px-3 py-2 text-sm ${
                message.type === 'error' 
                  ? 'border-destructive/30 bg-destructive/10 text-destructive' 
                  : 'border-green-400/30 bg-green-400/10 text-green-400'
              }`}>
                {message.text}
              </div>
            ) : null}

            <Button type="submit" className="w-full bg-cyan-500 text-slate-950 hover:bg-cyan-400 mt-4" disabled={isSubmitting}>
              {isSubmitting ? "Saving changes..." : "Save Profile"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
