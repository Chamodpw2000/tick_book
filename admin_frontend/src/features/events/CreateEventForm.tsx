"use client";

import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { CalendarIcon, Loader2, Clock } from "lucide-react";
import { format } from "date-fns";

import { cn } from "@/lib/utils";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

import { useCreateEvent } from "@/hooks/useEvents";
import { useVenues } from "@/hooks/useVenues";

import { ImageUpload } from "@/components/ImageUpload";

// Define schema with strict types that match defaultValues exactly
const formSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters."),
  description: z.string(),
  category: z.string(),
  venueId: z.string().min(1, "Please select a venue."),
  startTime: z.date(),
  endTime: z.date(),
  status: z.string(),
  bannerImage: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateEventFormProps {
  onSuccess?: () => void;
}

export function CreateEventForm({ onSuccess }: CreateEventFormProps) {
  const createEvent = useCreateEvent();
  const { data: venues, isLoading: isLoadingVenues } = useVenues();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "Music",
      venueId: "",
      status: "draft",
      bannerImage: "",
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      await createEvent.mutateAsync({
        venueId: values.venueId,
        title: values.title,
        description: values.description,
        category: values.category,
        startTime: values.startTime.toISOString(),
        endTime: values.endTime.toISOString(),
        status: values.status,
        bannerImage: values.bannerImage,
      });
      toast.success("Event created successfully!");
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to create event");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 text-left">
        <FormField
          control={form.control}
          name="bannerImage"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <ImageUpload 
                  value={field.value} 
                  onChange={field.onChange} 
                  onRemove={() => field.onChange("")}
                  label="Event Banner"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="title"
          render={({ field }: any) => (
            <FormItem>
              <FormLabel>Event Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter event name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="venueId"
            render={({ field }: any) => (
              <FormItem>
                <FormLabel>Venue</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={isLoadingVenues ? "Loading..." : "Select venue"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {venues?.map((v) => (
                      <SelectItem key={v._id} value={v._id.toString()}>
                        {v.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }: any) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Music">Music</SelectItem>
                    <SelectItem value="Conference">Conference</SelectItem>
                    <SelectItem value="Sports">Sports</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }: any) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                        {field.value instanceof Date ? format(field.value, "PPP p") : <span>Pick a date & time</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-4 space-y-3" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={(date) => {
                      if (!date) return;
                      const newDate = new Date(date);
                      if (field.value) {
                        newDate.setHours(field.value.getHours(), field.value.getMinutes());
                      }
                      field.onChange(newDate);
                    }} initialFocus />
                    <div className="flex items-center gap-2 border-t pt-3">
                      <Clock className="h-4 w-4 text-slate-400" />
                      <Input 
                        type="time" 
                        className="h-8"
                        value={field.value instanceof Date ? format(field.value, "HH:mm") : "00:00"}
                        onChange={(e) => {
                          const [hours, minutes] = e.target.value.split(':');
                          const newDate = new Date(field.value || new Date());
                          newDate.setHours(parseInt(hours), parseInt(minutes));
                          field.onChange(newDate);
                        }}
                      />
                    </div>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endTime"
            render={({ field }: any) => (
              <FormItem className="flex flex-col">
                <FormLabel>End Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button variant="outline" className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                        {field.value instanceof Date ? format(field.value, "PPP p") : <span>Pick a date & time</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-4 space-y-3" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={(date) => {
                      if (!date) return;
                      const newDate = new Date(date);
                      if (field.value) {
                        newDate.setHours(field.value.getHours(), field.value.getMinutes());
                      }
                      field.onChange(newDate);
                    }} initialFocus />
                     <div className="flex items-center gap-2 border-t pt-3">
                      <Clock className="h-4 w-4 text-slate-400" />
                      <Input 
                        type="time" 
                        className="h-8"
                        value={field.value instanceof Date ? format(field.value, "HH:mm") : "00:00"}
                        onChange={(e) => {
                          const [hours, minutes] = e.target.value.split(':');
                          const newDate = new Date(field.value || new Date());
                          newDate.setHours(parseInt(hours), parseInt(minutes));
                          field.onChange(newDate);
                        }}
                      />
                    </div>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }: any) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Details..." className="resize-none" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="ghost" onClick={() => form.reset()} className="text-slate-500">Reset</Button>
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={createEvent.isPending}>
            {createEvent.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Publish Event
          </Button>
        </div>
      </form>
    </Form>
  );
}
