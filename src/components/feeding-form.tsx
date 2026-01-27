"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Plus } from "lucide-react";

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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  quantity: z.coerce.number().min(1, "Must be positive").max(500, "Value too high"),
  type: z.enum(["breast", "formula"], {
    required_error: "You need to select a feeding type.",
  }),
});

interface FeedingFormProps {
  onAddFeeding: (feeding: {
    quantity: number;
    type: "breast" | "formula";
    time: Date;
  }) => void;
}

export default function FeedingForm({ onAddFeeding }: FeedingFormProps) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      quantity: 80,
      type: "breast",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    onAddFeeding({ ...values, time: new Date() });
    toast({
      title: "Feeding Logged!",
      description: `Added ${values.quantity}ml of ${values.type === 'breast' ? 'breast milk' : 'formula'}.`,
    });
    form.reset();
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Log a Feeding</CardTitle>
        <CardDescription>Record a new feeding session.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity (ml)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 120" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Feeding Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex flex-col space-y-1"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="breast" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          Breast Milk
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="formula" />
                        </FormControl>
                        <FormLabel className="font-normal">Formula</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              <Plus className="mr-2 h-4 w-4" /> Log Feeding
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
