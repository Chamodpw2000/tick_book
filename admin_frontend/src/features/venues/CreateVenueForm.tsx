"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { useCreateVenue } from "@/hooks/useVenues";

const venueSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().default(""),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().default(""),
  country: z.string().min(1, "Country is required"),
  postalCode: z.string().default(""),
  capacity: z.string().min(1, "Capacity is required"),
  phone: z.string().default(""),
  isActive: z.boolean().default(true),
});

type VenueValues = z.infer<typeof venueSchema>;

interface CreateVenueFormProps {
  onSuccess?: () => void;
}

export function CreateVenueForm({ onSuccess }: CreateVenueFormProps) {
  const createVenue = useCreateVenue();

  const form: any = useForm<VenueValues>({
    resolver: zodResolver(venueSchema) as any,
    defaultValues: {
      name: "",
      description: "",
      address: "",
      city: "",
      state: "",
      country: "USA",
      postalCode: "",
      capacity: "1000",
      phone: "",
      isActive: true,
    },
  });

  async function onSubmit(values: VenueValues) {
    try {
      await createVenue.mutateAsync({
        ...values,
        capacity: parseInt(values.capacity),
      });
      toast.success("Venue profile created!");
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to create venue");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 text-left">
        <FormField
          control={form.control}
          name="name"
          render={({ field }: any) => (
            <FormItem>
              <FormLabel>Venue Name</FormLabel>
              <FormControl>
                <Input placeholder="Madison Square Garden" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="capacity"
            render={({ field }: any) => (
              <FormItem>
                <FormLabel>Capacity</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
            render={({ field }: any) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input placeholder="+1..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }: any) => (
            <FormItem>
              <FormLabel>Street Address</FormLabel>
              <FormControl>
                <Input placeholder="123 venue street..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="city"
            render={({ field }: any) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="state"
            render={({ field }: any) => (
              <FormItem>
                <FormLabel>State</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="postalCode"
            render={({ field }: any) => (
              <FormItem>
                <FormLabel>Zip</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="country"
          render={({ field }: any) => (
            <FormItem>
              <FormLabel>Country</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }: any) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Venue highlights..." className="resize-none" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full bg-slate-900" disabled={createVenue.isPending}>
          {createVenue.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Register Venue
        </Button>
      </form>
    </Form>
  );
}
