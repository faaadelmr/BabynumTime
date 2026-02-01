"use client";

import { useState, useEffect, useMemo } from "react";
import { format, formatDistanceToNowStrict, isToday, subDays, isAfter } from "date-fns";
import { id } from 'date-fns/locale';
import { Clock, Baby, Shirt, Droplets, FlaskConical, History } from "lucide-react";
import type { Feeding, CryAnalysis, CryAnalysisResult, DiaperChange } from "@/lib/types";
import {
  getAge,
  getAgeInMonths,
  predictNextFeeding,
  getDailyFeedingRecommendation,
  getWeeklyPoopRecommendation,
} from "@/lib/feeding-logic";
import FeedingForm from "./feeding-form";
import FeedingHistory from "./feeding-history";
import DiaperForm from "./diaper-form";
import DiaperHistory from "./diaper-history";
import InfoCard from "./info-card";
import FeedingCountdown from "./feeding-countdown";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import CryAnalyzerForm from "./cry-analyzer-form";
import CryHistory from "./cry-history";

interface DashboardProps {
  birthDate: Date;
  onDataChange?: () => void;
}

export default function Dashboard({ birthDate, onDataChange }: DashboardProps) {
  const [feedings, setFeedings] = useState<Feeding[]>([]);
  const [cryAnalyses, setCryAnalyses] = useState<CryAnalysis[]>([]);
  const [diapers, setDiapers] = useState<DiaperChange[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'feeding' | 'cry' | 'diaper', id: string } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const storedFeedings = localStorage.getItem("babyCareFeedings");
    if (storedFeedings) {
      setFeedings(JSON.parse(storedFeedings));
    }
    const storedCryAnalyses = localStorage.getItem("babyCareCryAnalyses");
    if (storedCryAnalyses) {
      setCryAnalyses(JSON.parse(storedCryAnalyses));
    }
    const storedDiapers = localStorage.getItem("babyCareDiapers");
    if (storedDiapers) {
      setDiapers(JSON.parse(storedDiapers));
    }
    setIsClient(true);
  }, []);

  const sortedFeedings = useMemo(() => {
    return [...feedings].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  }, [feedings]);

  const sortedCryAnalyses = useMemo(() => {
    return [...cryAnalyses].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  }, [cryAnalyses]);

  const sortedDiapers = useMemo(() => {
    return [...diapers].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  }, [diapers]);

  const addFeeding = (newFeeding: Omit<Feeding, "id" | "time"> & { time: Date }) => {
    const feedingWithId: Feeding = {
      ...newFeeding,
      id: new Date().toISOString() + Math.random(),
      time: newFeeding.time.toISOString(),
    };
    const updatedFeedings = [feedingWithId, ...feedings];
    setFeedings(updatedFeedings);
    localStorage.setItem("babyCareFeedings", JSON.stringify(updatedFeedings));
    onDataChange?.();
  };

  const addCryAnalysis = (newAnalysis: { result: CryAnalysisResult, time: Date, detectedSound?: string }) => {
    const analysisWithId: CryAnalysis = {
      ...newAnalysis,
      id: new Date().toISOString() + Math.random(),
      time: newAnalysis.time.toISOString(),
      detectedSound: newAnalysis.detectedSound,
    };
    const updatedAnalyses = [analysisWithId, ...cryAnalyses];
    setCryAnalyses(updatedAnalyses);
    localStorage.setItem("babyCareCryAnalyses", JSON.stringify(updatedAnalyses));
    onDataChange?.();
  };

  const addDiaper = (newDiaper: Omit<DiaperChange, "id" | "time"> & { time: Date }) => {
    const diaperWithId: DiaperChange = {
      ...newDiaper,
      id: new Date().toISOString() + Math.random(),
      time: newDiaper.time.toISOString(),
    };
    const updatedDiapers = [diaperWithId, ...diapers];
    setDiapers(updatedDiapers);
    localStorage.setItem("babyCareDiapers", JSON.stringify(updatedDiapers));
    onDataChange?.();
  };

  const deleteFeeding = (id: string) => {
    const updatedFeedings = feedings.filter(f => f.id !== id);
    setFeedings(updatedFeedings);
    localStorage.setItem("babyCareFeedings", JSON.stringify(updatedFeedings));
    onDataChange?.();
    toast({ title: "Catatan minum dihapus." });
  };

  const deleteCryAnalysis = (id: string) => {
    const updatedAnalyses = cryAnalyses.filter(c => c.id !== id);
    setCryAnalyses(updatedAnalyses);
    localStorage.setItem("babyCareCryAnalyses", JSON.stringify(updatedAnalyses));
    onDataChange?.();
    toast({ title: "Catatan analisis dihapus." });
  };

  const deleteDiaper = (id: string) => {
    const updatedDiapers = diapers.filter(d => d.id !== id);
    setDiapers(updatedDiapers);
    localStorage.setItem("babyCareDiapers", JSON.stringify(updatedDiapers));
    onDataChange?.();
    toast({ title: "Catatan pergantian popok dihapus." });
  };

  const handleDeleteConfirm = () => {
    if (!itemToDelete) return;

    if (itemToDelete.type === 'feeding') {
      deleteFeeding(itemToDelete.id);
    } else if (itemToDelete.type === 'cry') {
      deleteCryAnalysis(itemToDelete.id);
    } else {
      deleteDiaper(itemToDelete.id);
    }
    setItemToDelete(null);
  };

  const ageInMonths = getAgeInMonths(birthDate);
  const ageString = getAge(birthDate);
  const nextFeedingTime = predictNextFeeding(sortedFeedings, ageInMonths);

  const feedingsToday = useMemo(() => sortedFeedings.filter(f => isToday(new Date(f.time))), [sortedFeedings]);
  const totalFeedingToday = useMemo(() => feedingsToday.reduce((sum, f) => sum + f.quantity, 0), [feedingsToday]);
  const feedingReco = getDailyFeedingRecommendation(ageInMonths);

  // Diaper stats
  const diapersToday = useMemo(() => sortedDiapers.filter(d => isToday(new Date(d.time))), [sortedDiapers]);
  const totalDiapersToday = diapersToday.length;
  const lastDiaper = sortedDiapers[0];

  // Weekly poop (BAB) stats - count only 'kotor' or 'keduanya' types
  const oneWeekAgo = subDays(new Date(), 7);
  const poopsThisWeek = useMemo(() =>
    sortedDiapers.filter(d =>
      (d.type === 'kotor' || d.type === 'keduanya') &&
      isAfter(new Date(d.time), oneWeekAgo)
    ), [sortedDiapers, oneWeekAgo]);
  const totalPoopsThisWeek = poopsThisWeek.length;
  const weeklyPoopReco = getWeeklyPoopRecommendation(ageInMonths);

  const lastFeeding = sortedFeedings[0];
  const lastFeedingIcon = lastFeeding?.type === 'breast' ? Droplets : FlaskConical;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <InfoCard icon={Baby} title="Usia Bayi" value={ageString} />
        <FeedingCountdown nextFeedingTime={nextFeedingTime} />
        <InfoCard
          icon={lastFeedingIcon}
          title="Terakhir Minum"
          value={lastFeeding ? `${lastFeeding.quantity} ml` : 'N/A'}
          description={isClient ? `Hari ini: ${totalFeedingToday}ml / Rek. ${feedingReco.min}-${feedingReco.max}ml` : 'Memuat...'}
        />
        <InfoCard
          icon={Shirt}
          title="Ganti Popok"
          value={isClient ? `${totalDiapersToday}x hari ini` : 'Memuat...'}
          description={isClient ? `BAB minggu ini: ${totalPoopsThisWeek}x (Rek. ${weeklyPoopReco.min}-${weeklyPoopReco.max}x)` : 'Memuat...'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-2xl">Catat Aktivitas</CardTitle>
              <CardDescription>Rekam sesi pemberian minum, popok, atau analisis tangisan.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="feeding">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="feeding">Minum</TabsTrigger>
                  <TabsTrigger value="diaper">Popok</TabsTrigger>
                  <TabsTrigger value="cry">AI</TabsTrigger>
                </TabsList>
                <TabsContent value="feeding" className="pt-6">
                  <FeedingForm onAddFeeding={addFeeding} />
                </TabsContent>
                <TabsContent value="diaper" className="pt-6">
                  <DiaperForm onAddDiaper={addDiaper} babyAgeInMonths={ageInMonths} />
                </TabsContent>
                <TabsContent value="cry" className="pt-6">
                  <CryAnalyzerForm onAddAnalysis={addCryAnalysis} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-2xl flex items-center gap-2">
                <History className="h-6 w-6" /> Riwayat Aktivitas
              </CardTitle>
              <CardDescription>Catatan aktivitas bayi Anda baru-baru ini.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="feeding">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="feeding">Minum</TabsTrigger>
                  <TabsTrigger value="diaper">Popok</TabsTrigger>
                  <TabsTrigger value="cry">Analisis</TabsTrigger>
                </TabsList>
                <TabsContent value="feeding" className="pt-2">
                  <FeedingHistory feedings={sortedFeedings} onDelete={(id) => setItemToDelete({ type: 'feeding', id })} />
                </TabsContent>
                <TabsContent value="diaper" className="pt-2">
                  <DiaperHistory diapers={sortedDiapers} onDelete={(id) => setItemToDelete({ type: 'diaper', id })} />
                </TabsContent>
                <TabsContent value="cry" className="pt-2">
                  <CryHistory analyses={sortedCryAnalyses} onDelete={(id) => setItemToDelete({ type: 'cry', id })} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anda yakin?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan menghapus data riwayat secara permanen dan tidak dapat dipulihkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Ya, Hapus</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
