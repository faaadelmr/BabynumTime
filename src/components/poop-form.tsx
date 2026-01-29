"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Plus, Paperclip, X } from "lucide-react";
import Image from "next/image";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

const formSchema = z.object({
  time: z.date({ required_error: "Waktu harus diisi." }),
  type: z.enum(["biasa", "cair", "keras"], {
    required_error: "Anda harus memilih jenis eek.",
  }),
  notes: z.string().max(200, "Catatan terlalu panjang"),
  image: z.string().optional(),
});

interface PoopFormProps {
  onAddPoop: (poop: {
    type: "biasa" | "cair" | "keras";
    notes: string;
    time: Date;
    image?: string;
  }) => void;
}

export default function PoopForm({ onAddPoop }: PoopFormProps) {
  const { toast } = useToast();
  const [showCustomTime, setShowCustomTime] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      time: new Date(),
      type: "biasa",
      notes: "",
      image: "",
    },
  });
  
  const imageValue = form.watch("image");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({
          variant: "destructive",
          title: "Ukuran Gambar Terlalu Besar",
          description: "Pilih gambar dengan ukuran kurang dari 2MB.",
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        form.setValue("image", reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  function onSubmit(values: z.infer<typeof formSchema>) {
    const submissionData = {
        ...values,
        time: showCustomTime ? values.time : new Date(),
    };
    onAddPoop(submissionData);
    toast({
      title: "Catatan Eek Disimpan!",
      description: `Menambahkan catatan eek baru.`,
    });
    form.reset({
        time: new Date(),
        type: "biasa",
        notes: "",
        image: ""
    });
    setShowCustomTime(false);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Jenis Eek</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col space-y-1"
                >
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="biasa" />
                    </FormControl>
                    <FormLabel className="font-normal">
                      Biasa
                    </FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="cair" />
                    </FormControl>
                    <FormLabel className="font-normal">Cair</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center space-x-3 space-y-0">
                    <FormControl>
                      <RadioGroupItem value="keras" />
                    </FormControl>
                    <FormLabel className="font-normal">Keras</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Catatan (Opsional)</FormLabel>
              <FormControl>
                <Textarea placeholder="misal, warnanya hijau" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="image"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gambar (Opsional, maks 2MB)</FormLabel>
              {imageValue ? (
                <div className="relative w-32 h-32">
                   <Image src={imageValue} alt="Pratinjau Eek" layout="fill" objectFit="cover" className="rounded-md" />
                   <Button
                     variant="destructive"
                     size="icon"
                     className="absolute top-1 right-1 h-6 w-6"
                     onClick={() => form.setValue('image', '')}
                   >
                     <X className="h-4 w-4" />
                   </Button>
                </div>
              ) : (
                <FormControl>
                    <div className="relative">
                        <Input id="image-upload" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                        <label htmlFor="image-upload" className="cursor-pointer">
                            <div className="flex items-center justify-center w-full h-24 border-2 border-dashed rounded-md text-muted-foreground hover:bg-muted">
                                <Paperclip className="mr-2 h-4 w-4" />
                                <span>Lampirkan gambar</span>
                            </div>
                        </label>
                    </div>
                </FormControl>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="space-y-3">
            <div className="flex items-center space-x-2">
                <Checkbox 
                    id="custom-time-poop" 
                    checked={showCustomTime} 
                    onCheckedChange={(checked) => {
                        setShowCustomTime(!!checked);
                        if (!checked) {
                            form.setValue('time', new Date());
                        }
                    }} 
                />
                <label
                    htmlFor="custom-time-poop"
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
          <Plus className="mr-2 h-4 w-4" /> Catat Eek
        </Button>
      </form>
    </Form>
  );
}
