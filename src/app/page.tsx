"use client";

import { useState, useEffect } from "react";
import AppHeader from "@/components/app-header";
import InitialSetup from "@/components/initial-setup";
import Dashboard from "@/components/dashboard";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    const storedBirthDate = localStorage.getItem("babyCareBirthDate");
    if (storedBirthDate) {
      setBirthDate(new Date(storedBirthDate));
    }
    setIsClient(true);
  }, []);

  const handleSaveBirthDate = (date: Date) => {
    localStorage.setItem("babyCareBirthDate", date.toISOString());
    setBirthDate(date);
  };
  
  const handleReset = () => {
    localStorage.removeItem("babyCareBirthDate");
    localStorage.removeItem("babyCareFeedings");
    setBirthDate(null);
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <AppHeader onReset={handleReset} showReset={!!birthDate && isClient} />
      <main className="flex-grow container mx-auto p-4 md:p-8">
        {!isClient ? (
          <div className="space-y-8">
            <Skeleton className="h-32 w-full" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Skeleton className="h-64 col-span-1 lg:col-span-2" />
              <Skeleton className="h-64 col-span-1" />
            </div>
          </div>
        ) : birthDate ? (
          <Dashboard birthDate={birthDate} />
        ) : (
          <InitialSetup onSaveBirthDate={handleSaveBirthDate} />
        )}
      </main>
    </div>
  );
}
