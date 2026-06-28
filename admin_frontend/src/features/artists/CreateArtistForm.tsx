"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2, Music } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

import { ImageUpload } from "@/components/ImageUpload";
import { useCreateArtist } from "@/hooks/useArtists";

const artistSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  bio: z.string().default(""),
  genre: z.string().default(""),
  profileImage: z.string().default(""),
  isActive: z.boolean().default(true),
});

type ArtistValues = z.infer<typeof artistSchema>;

interface CreateArtistFormProps {
  onSuccess?: () => void;
}

export function CreateArtistForm({ onSuccess }: CreateArtistFormProps) {
  const createArtist = useCreateArtist();

  const form: any = useForm<ArtistValues>({
    resolver: zodResolver(artistSchema) as any,
    defaultValues: {
      name: "",
      email: "",
      bio: "",
      genre: "",
      profileImage: "",
      isActive: true,
    },
  });

  async function onSubmit(values: ArtistValues) {
    try {
      await createArtist.mutateAsync({
        name: values.name,
        email: values.email,
        bio: values.bio,
        genre: values.genre,
        profileImage: values.profileImage,
        isActive: values.isActive,
      });
      toast.success("Artist profile created!");
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to create artist");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 text-left">
        <FormField
          control={form.control}
          name="profileImage"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <ImageUpload 
                  value={field.value} 
                  onChange={field.onChange} 
                  onRemove={() => field.onChange("")}
                  label="Artist Profile Image"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }: any) => (
            <FormItem>
              <FormLabel>Artist Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. The Rockers" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }: any) => (
            <FormItem>
              <FormLabel>Contact Email</FormLabel>
              <FormControl>
                <Input placeholder="artist@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="genre"
            render={({ field }: any) => (
              <FormItem>
                <FormLabel>Genre</FormLabel>
                <FormControl>
                  <Input placeholder="Rock, Jazz, Pop" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isActive"
            render={({ field }: any) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>Active Status</FormLabel>
                  <FormDescription>Visibility in system</FormDescription>
                </div>
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="bio"
          render={({ field }: any) => (
            <FormItem>
              <FormLabel>Biography</FormLabel>
              <FormControl>
                <Textarea placeholder="Tell us about the artist..." className="resize-none" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full bg-slate-900" disabled={createArtist.isPending}>
          {createArtist.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Register Artist
        </Button>
      </form>
    </Form>
  );
}
