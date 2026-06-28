"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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

import { useAddTicketSaga } from "@/hooks/useEvents";

const sagaSchema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z.string().min(1, "Price is required"),
  currency: z.string(),
  description: z.string(),
  initialStock: z.string().min(1, "Initial stock is required"),
  totalQuantity: z.string().min(1, "Total quantity is required"),
});

type SagaValues = z.infer<typeof sagaSchema>;

interface TicketTypeSagaFormProps {
  eventId: number;
  onSuccess?: () => void;
}

export function TicketTypeSagaForm({ eventId, onSuccess }: TicketTypeSagaFormProps) {
  const addTicketSaga = useAddTicketSaga();

  const form = useForm<SagaValues>({
    resolver: zodResolver(sagaSchema),
    defaultValues: {
      name: "",
      price: "",
      currency: "LKR",
      description: "",
      initialStock: "",
      totalQuantity: "",
    },
  });

  async function onSubmit(values: SagaValues) {
    try {
      await addTicketSaga.mutateAsync({
        eventId,
        name: values.name,
        price: parseFloat(values.price),
        currency: values.currency,
        description: values.description,
        initialStock: parseInt(values.initialStock),
        totalQuantity: parseInt(values.totalQuantity),
      });
      toast.success("Ticket added successfully!");
      onSuccess?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to add ticket");
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
              <FormLabel>Ticket Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. VIP, Early Bird" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="price"
            render={({ field }: any) => (
              <FormItem>
                <FormLabel>Price</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="currency"
            render={({ field }: any) => (
              <FormItem>
                <FormLabel>Currency</FormLabel>
                <FormControl>
                  <Input {...field} readOnly className="bg-slate-50 cursor-not-allowed" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="initialStock"
            render={({ field }: any) => (
              <FormItem>
                <FormLabel>Initial Stock</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="totalQuantity"
            render={({ field }: any) => (
              <FormItem>
                <FormLabel>Total Capacity</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
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
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Special perks for this ticket..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full bg-slate-900" disabled={addTicketSaga.isPending}>
          {addTicketSaga.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Add Ticket
        </Button>
      </form>
    </Form>
  );
}
