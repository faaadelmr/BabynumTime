"use client";

import { useState, useEffect, useMemo } from "react";
import { format, formatDistanceToNowStrict, isToday } from "date-fns";
import { id } from 'date-fns/locale';
import { Clock, Baby, Bean, Droplets, FlaskConical, History } from "lucide-react";
import type { Feeding, Poop, CryAnalysis, CryAnalysisResult } from "@/lib/types";
import {
  getAge,
  getAgeInMonths,
  predictNextFeeding,
  getDailyFeedingRecommendation,
  getDailyPoopRecommendation
} from "@/lib/feeding-logic";
import FeedingForm from "./feeding-form";
import FeedingHistory from "./feeding-history";
import PoopForm from "./poop-form";
import PoopHistory from "./poop-history";
import InfoCard from "./info-card";
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
}

export default function Dashboard({ birthDate }: DashboardProps) {
  const [feedings, setFeedings] = useState<Feeding[]>([]);
  const [poops, setPoops] = useState<Poop[]>([]);
  const [cryAnalyses, setCryAnalyses] = useState<CryAnalysis[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'feeding' | 'poop' | 'cry', id: string } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const storedFeedings = localStorage.getItem("babyCareFeedings");
    if (storedFeedings) {
      setFeedings(JSON.parse(storedFeedings));
    }
    const storedPoops = localStorage.getItem("babyCarePoops");
    if (storedPoops) {
      setPoops(JSON.parse(storedPoops));
    }
    const storedCryAnalyses = localStorage.getItem("babyCareCryAnalyses");
    if (storedCryAnalyses) {
      setCryAnalyses(JSON.parse(storedCryAnalyses));
    }
    setIsClient(true);
  }, []);

  const sortedFeedings = useMemo(() => {
    return [...feedings].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  }, [feedings]);

  const sortedPoops = useMemo(() => {
    return [...poops].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  }, [poops]);

  const sortedCryAnalyses = useMemo(() => {
    return [...cryAnalyses].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  }, [cryAnalyses]);


  const addFeeding = (newFeeding: Omit<Feeding, "id" | "time"> & { time: Date }) => {
    const feedingWithId: Feeding = {
      ...newFeeding,
      id: new Date().toISOString() + Math.random(),
      time: newFeeding.time.toISOString(),
    };
    const updatedFeedings = [feedingWithId, ...feedings];
    setFeedings(updatedFeedings);
    localStorage.setItem("babyCareFeedings", JSON.stringify(updatedFeedings));
  };

  const addPoop = (newPoop: Omit<Poop, "id" | "time"> & { time: Date }) => {
    const poopWithId: Poop = {
      ...newPoop,
      id: new Date().toISOString() + Math.random(),
      time: newPoop.time.toISOString(),
      notes: newPoop.notes || "",
    };
    const updatedPoops = [poopWithId, ...poops];
    setPoops(updatedPoops);
    localStorage.setItem("babyCarePoops", JSON.stringify(updatedPoops));
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
  };


  const deleteFeeding = (id: string) => {
    const updatedFeedings = feedings.filter(f => f.id !== id);
    setFeedings(updatedFeedings);
    localStorage.setItem("babyCareFeedings", JSON.stringify(updatedFeedings));
    toast({ title: "Catatan minum dihapus." });
  };

  const deletePoop = (id: string) => {
    const updatedPoops = poops.filter(p => p.id !== id);
    setPoops(updatedPoops);
    localStorage.setItem("babyCarePoops", JSON.stringify(updatedPoops));
    toast({ title: "Catatan eek dihapus." });
  };

  const deleteCryAnalysis = (id: string) => {
    const updatedAnalyses = cryAnalyses.filter(p => p.id !== id);
    setCryAnalyses(updatedAnalyses);
    localStorage.setItem("babyCareCryAnalyses", JSON.stringify(updatedAnalyses));
    toast({ title: "Catatan analisis dihapus." });
  };

  const handleDeleteConfirm = () => {
    if (!itemToDelete) return;

    if (itemToDelete.type === 'feeding') {
      deleteFeeding(itemToDelete.id);
    } else if (itemToDelete.type === 'poop') {
      deletePoop(itemToDelete.id);
    } else {
      deleteCryAnalysis(itemToDelete.id);
    }
    setItemToDelete(null);
  };


  const ageInMonths = getAgeInMonths(birthDate);
  const ageString = getAge(birthDate);
  const nextFeedingTime = predictNextFeeding(sortedFeedings, ageInMonths);

  const feedingsToday = useMemo(() => sortedFeedings.filter(f => isToday(new Date(f.time))), [sortedFeedings]);
  const totalFeedingToday = useMemo(() => feedingsToday.reduce((sum, f) => sum + f.quantity, 0), [feedingsToday]);
  const feedingReco = getDailyFeedingRecommendation(ageInMonths);

  const poopsToday = useMemo(() => sortedPoops.filter(p => isToday(new Date(p.time))), [sortedPoops]);
  const totalPoopsToday = poopsToday.length;
  const poopReco = getDailyPoopRecommendation(ageInMonths);

  const lastFeeding = sortedFeedings[0];
  const lastFeedingIcon = lastFeeding?.type === 'breast' ? Droplets : FlaskConical;
  const lastPoop = sortedPoops[0];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <InfoCard icon={Baby} title="Usia Bayi" value={ageString} />
        <InfoCard
          icon={Clock}
          title="Minum Berikutnya"
          value={nextFeedingTime ? format(nextFeedingTime, 'p', { locale: id }) : "N/A"}
          description={nextFeedingTime ? `Dalam ${formatDistanceToNowStrict(nextFeedingTime, { locale: id, addSuffix: false })}` : "Catat minum"}
        />
        <InfoCard
          icon={lastFeedingIcon}
          title="Terakhir Minum"
          value={lastFeeding ? `${lastFeeding.quantity} ml` : 'N/A'}
          description={isClient ? `Hari ini: ${totalFeedingToday}ml / Rek. ${feedingReco.min}-${feedingReco.max}ml` : 'Memuat...'}
        />
        <InfoCard
          icon={Bean}
          title="Eek Terakhir"
          value={lastPoop ? `${formatDistanceToNowStrict(new Date(lastPoop.time), { locale: id })} lalu` : 'N/A'}
          description={isClient ? `Hari ini: ${totalPoopsToday}x / Rek. ${poopReco.min}-${poopReco.max}x` : 'Memuat...'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-2xl">Catat Aktivitas</CardTitle>
              <CardDescription>Rekam sesi pemberian minum, eek, atau analisis tangisan.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="feeding">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="feeding">Minum</TabsTrigger>
                  <TabsTrigger value="poop">Eek</TabsTrigger>
                  <TabsTrigger value="cry">AI Analisis</TabsTrigger>
                </TabsList>
                <TabsContent value="feeding" className="pt-6">
                  <FeedingForm onAddFeeding={addFeeding} />
                </TabsContent>
                <TabsContent value="poop" className="pt-6">
                  <PoopForm onAddPoop={addPoop} />
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
                  <TabsTrigger value="feeding">Riwayat Minum</TabsTrigger>
                  <TabsTrigger value="poop">Riwayat Eek</TabsTrigger>
                  <TabsTrigger value="cry">Riwayat Analisis</TabsTrigger>
                </TabsList>
                <TabsContent value="feeding" className="pt-2">
                  <FeedingHistory feedings={sortedFeedings} onDelete={(id) => setItemToDelete({ type: 'feeding', id })} />
                </TabsContent>
                <TabsContent value="poop" className="pt-2">
                  <PoopHistory poops={sortedPoops} onDelete={(id) => setItemToDelete({ type: 'poop', id })} />
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
