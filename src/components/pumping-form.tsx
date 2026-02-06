"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Milk, Clock, Save, RotateCcw } from "lucide-react";
import type { PumpingSession } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const formSchema = z.object({
  time: z.date({ required_error: "Waktu harus diisi." }),
  volume: z.coerce.number().min(1, "Harus positif").max(1000, "Nilai terlalu tinggi"),
  side: z.enum(["left", "right", "both"], {
    required_error: "Pilih payudara.",
  }),
  duration: z.coerce.number().optional(),
  notes: z.string().optional(),
});

interface PumpingFormProps {
  onAddSession: (session: Omit<PumpingSession, "id" | "time"> & { time: Date }) => void;
}

export default function PumpingForm({ onAddSession }: PumpingFormProps) {
  const { toast } = useToast();
  const [showCustomTime, setShowCustomTime] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      time: new Date(),
      volume: 0,
      side: "both",
      duration: 15,
      notes: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    onAddSession(values);
    toast({
      title: "Pumping berhasil dicatat!",
      description: `${values.volume}ml (${values.side === 'both' ? 'Kiri & Kanan' : values.side === 'left' ? 'Kiri' : 'Kanan'})`,
    });
    // Reset form but keep time current if not custom
    form.reset({
      time: new Date(),
      volume: 0,
      side: "both",
      duration: 15,
      notes: "",
    });
    if (showCustomTime) {
        setShowCustomTime(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Time Selection */}
        <div className="space-y-2">
            <div className="flex items-center space-x-2">
                <Checkbox 
                    id="custom-time-pumping" 
                    checked={showCustomTime} 
                    onCheckedChange={(checked) => {
                        setShowCustomTime(!!checked);
                        if (!checked) {
                            form.setValue('time', new Date());
                        }
                    }} 
                />
                <label
                    htmlFor="custom-time-pumping"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                    Waktu lain? (Mundur)
                </label>
            </div>
            {showCustomTime && (
                 <FormField
                 control={form.control}
                 name="time"
                 render={({ field }) => (
                   <FormItem className="flex flex-col">
                     <FormControl>
                        <Input
                            type="datetime-local"
                            value={field.value ? format(field.value, "yyyy-MM-dd'T'HH:mm") : ""}
                            onChange={(e) => field.onChange(new Date(e.target.value))}
                            max={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                        />
                     </FormControl>
                     <FormMessage />
                   </FormItem>
                 )}
               />
            )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="volume"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Volume (ml)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Milk className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input type="number" placeholder="100" className="pl-8" {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Durasi (menit)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Clock className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input type="number" placeholder="15" className="pl-8" {...field} />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="side"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sisi Payudara</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex justify-between"
                >
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="left" />
                    </FormControl>
                    <Label className="font-normal">Kiri</Label>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="right" />
                    </FormControl>
                    <Label className="font-normal">Kanan</Label>
                  </FormItem>
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="both" />
                    </FormControl>
                    <Label className="font-normal">Keduanya</Label>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full bg-pink-600 hover:bg-pink-700">
          <Save className="mr-2 h-4 w-4" /> Simpan Catatan Bunda
        </Button>
      </form>
    </Form>
  );
}
