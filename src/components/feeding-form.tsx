"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Plus } from "lucide-react";
import { format } from 'date-fns';
import { useState } from 'react';

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
import { useToast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";

const formSchema = z.object({
  time: z.date({ required_error: "Waktu harus diisi." }),
  quantity: z.coerce.number().min(1, "Harus positif").max(500, "Nilai terlalu tinggi"),
  type: z.enum(["breast", "formula"], {
    required_error: "Anda harus memilih jenis pemberian minum.",
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
  const [showCustomTime, setShowCustomTime] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      time: new Date(),
      quantity: 80,
      type: "breast",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    const submissionData = {
      ...values,
      time: showCustomTime ? values.time : new Date(),
    };
    onAddFeeding(submissionData);
    toast({
      title: "Pemberian Minum Dicatat!",
      description: `Menambahkan ${values.quantity}ml ${values.type === 'breast' ? 'ASI' : 'susu formula'}.`,
    });
    form.reset({
      time: new Date(),
      quantity: 80,
      type: form.getValues('type')
    });
    setShowCustomTime(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kuantitas (ml)</FormLabel>
              <FormControl>
                <Input type="number" placeholder="misal, 120" {...field} />
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
              <FormLabel>Jenis Pemberian Minum</FormLabel>
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
                      ASI
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="formula" />
                    </FormControl>
                    <FormLabel className="font-normal">Susu Formula</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="space-y-3">
            <div className="flex items-center space-x-2">
                <Checkbox 
                    id="custom-time-feed" 
                    checked={showCustomTime} 
                    onCheckedChange={(checked) => {
                        setShowCustomTime(!!checked);
                        if (!checked) {
                            form.setValue('time', new Date());
                        }
                    }} 
                />
                <label
                    htmlFor="custom-time-feed"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                    Atur waktu & tanggal secara manual
                </label>
            </div>
            {showCustomTime && (
                <FormField
                    control={form.control}
                    name="time"
                    render={({ field }) => (
                        <FormItem>
                            <FormControl>
                                <Input 
                                type="datetime-local" 
                                value={field.value ? format(field.value, "yyyy-MM-dd'T'HH:mm") : ''}
                                onChange={(e) => field.onChange(new Date(e.target.value))}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            )}
        </div>

        <Button type="submit" className="w-full">
          <Plus className="mr-2 h-4 w-4" /> Catat Pemberian Minum
        </Button>
      </form>
    </Form>
  );
}
