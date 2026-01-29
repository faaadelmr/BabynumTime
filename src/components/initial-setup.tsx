"use client";

import { useState } from "react";
import { format } from "date-fns";
import { id } from 'date-fns/locale';
import { Calendar as CalendarIcon, Info } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface InitialSetupProps {
  onSaveBirthDate: (date: Date) => void;
}

export default function InitialSetup({ onSaveBirthDate }: InitialSetupProps) {
  const [date, setDate] = useState<Date | undefined>();

  const handleSave = () => {
    if (date) {
      onSaveBirthDate(date);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md mx-auto shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="font-headline text-3xl">Selamat Datang!</CardTitle>
          <CardDescription>
            Mari kita mulai dengan mengatur tanggal lahir bayi Anda.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[280px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP", { locale: id }) : <span>Pilih tanggal lahir</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                locale={id}
                mode="single"
                selected={date}
                onSelect={setDate}
                disabled={(date) =>
                  date > new Date() || date < new Date("1900-01-01")
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Alert className="mt-4 text-left">
            <Info className="h-4 w-4" />
            <AlertTitle>Privasi Anda Terjaga</AlertTitle>
            <AlertDescription>
              Semua data yang Anda masukkan disimpan dengan aman di peramban (browser) Anda dan tidak dikirim ke server mana pun.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full"
            onClick={handleSave}
            disabled={!date}
          >
            Simpan dan Lanjutkan
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
