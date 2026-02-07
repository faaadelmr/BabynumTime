"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { format, formatDistanceToNowStrict, isToday, subDays, isAfter } from "date-fns";
import { id } from 'date-fns/locale';
import { Clock, Baby, Shirt, Droplets, FlaskConical, History, RotateCcw, Milk, User as MomIcon } from "lucide-react";
import type { Feeding, CryAnalysis, CryAnalysisResult, DiaperChange, PumpingSession } from "@/lib/types";
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
import PumpingForm from "./pumping-form";
import PumpingHistory from "./pumping-history";
import InfoCard from "./info-card";
import FeedingCountdownComponent from "./feeding-countdown";
import FeedingProgressCard from "./feeding-progress-card";
import PumpingProgressCard from "./pumping-progress-card";
import DiaperProgressCard from "./diaper-progress-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { sendDataToCloud } from "@/lib/cloud-sync";
import { cn } from "@/lib/utils";

interface DashboardProps {
  birthDate: Date;
  onDataChange?: () => void;
  lastSync?: Date | null;
}

export default function Dashboard({ birthDate, onDataChange, lastSync }: DashboardProps) {
  const [feedings, setFeedings] = useState<Feeding[]>([]);
  const [cryAnalyses, setCryAnalyses] = useState<CryAnalysis[]>([]);
  const [diapers, setDiapers] = useState<DiaperChange[]>([]);
  const [pumpingSessions, setPumpingSessions] = useState<PumpingSession[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'feeding' | 'cry' | 'diaper' | 'pumping', id: string } | null>(null);
  const [isActivityFlipped, setIsActivityFlipped] = useState(false);
  const { toast } = useToast();

  const loadData = () => {
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
    const storedPumping = localStorage.getItem("motherPumpingSessions");
    if (storedPumping) {
      setPumpingSessions(JSON.parse(storedPumping));
    }
  };

  useEffect(() => {
    loadData();
    setIsClient(true);
  }, [lastSync]); // Reload data when lastSync changes

  const sortedFeedings = useMemo(() => {
    return [...feedings].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  }, [feedings]);

  const sortedCryAnalyses = useMemo(() => {
    return [...cryAnalyses].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  }, [cryAnalyses]);

  const sortedDiapers = useMemo(() => {
    return [...diapers].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  }, [diapers]);

  const sortedPumpingSessions = useMemo(() => {
    return [...pumpingSessions].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  }, [pumpingSessions]);

  const addFeeding = (newFeeding: Omit<Feeding, "id" | "time"> & { time: Date }) => {
    // Generate ID with format FD001, FD002, etc.
    const maxId = feedings.reduce((max, f) => {
      const match = f.id.match(/^FD(\d+)$/);
      return match ? Math.max(max, parseInt(match[1], 10)) : max;
    }, 0);
    const nextNum = maxId + 1;
    const digits = Math.max(3, String(nextNum).length);
    const newId = `FD${String(nextNum).padStart(digits, '0')}`;

    const feedingWithId: Feeding = {
      ...newFeeding,
      id: newId,
      time: newFeeding.time.toISOString(),
    };
    const updatedFeedings = [feedingWithId, ...feedings];
    setFeedings(updatedFeedings);
    localStorage.setItem("babyCareFeedings", JSON.stringify(updatedFeedings));
    onDataChange?.();
    // Real-time sync to cloud
    sendDataToCloud();
  };

  const addCryAnalysis = (newAnalysis: { result: CryAnalysisResult, time: Date, detectedSound?: string }) => {
    // Generate ID with format CR001, CR002, etc.
    const maxId = cryAnalyses.reduce((max, c) => {
      const match = c.id.match(/^CR(\d+)$/);
      return match ? Math.max(max, parseInt(match[1], 10)) : max;
    }, 0);
    const nextNum = maxId + 1;
    const digits = Math.max(3, String(nextNum).length);
    const newId = `CR${String(nextNum).padStart(digits, '0')}`;

    const analysisWithId: CryAnalysis = {
      ...newAnalysis,
      id: newId,
      time: newAnalysis.time.toISOString(),
      detectedSound: newAnalysis.detectedSound,
    };
    const updatedAnalyses = [analysisWithId, ...cryAnalyses];
    setCryAnalyses(updatedAnalyses);
    localStorage.setItem("babyCareCryAnalyses", JSON.stringify(updatedAnalyses));
    onDataChange?.();
    // Real-time sync to cloud
    sendDataToCloud();
  };

  const addDiaper = (newDiaper: Omit<DiaperChange, "id" | "time"> & { time: Date }) => {
    // Generate ID with format DP001, DP002, etc.
    const maxId = diapers.reduce((max, d) => {
      const match = d.id.match(/^DP(\d+)$/);
      return match ? Math.max(max, parseInt(match[1], 10)) : max;
    }, 0);
    const nextNum = maxId + 1;
    const digits = Math.max(3, String(nextNum).length);
    const newId = `DP${String(nextNum).padStart(digits, '0')}`;

    const diaperWithId: DiaperChange = {
      ...newDiaper,
      id: newId,
      time: newDiaper.time.toISOString(),
    };
    const updatedDiapers = [diaperWithId, ...diapers];
    setDiapers(updatedDiapers);
    localStorage.setItem("babyCareDiapers", JSON.stringify(updatedDiapers));
    onDataChange?.();
    // Real-time sync to cloud
    sendDataToCloud();
  };

  const addPumpingSession = (newPumping: Omit<PumpingSession, "id" | "time"> & { time: Date }) => {
    // Generate ID with format PM001, PM002, etc.
    const maxId = pumpingSessions.reduce((max, p) => {
      const match = p.id.match(/^PM(\d+)$/);
      return match ? Math.max(max, parseInt(match[1], 10)) : max;
    }, 0);
    const nextNum = maxId + 1;
    const digits = Math.max(3, String(nextNum).length);
    const newId = `PM${String(nextNum).padStart(digits, '0')}`;

    const pumpingWithId: PumpingSession = {
      ...newPumping,
      id: newId,
      time: newPumping.time.toISOString(),
    };
    const updatedSessions = [pumpingWithId, ...pumpingSessions];
    setPumpingSessions(updatedSessions);
    localStorage.setItem("motherPumpingSessions", JSON.stringify(updatedSessions));
    // Real-time sync to cloud
    sendDataToCloud();
  };

  const deleteFeeding = (id: string) => {
    const updatedFeedings = feedings.filter(f => f.id !== id);
    setFeedings(updatedFeedings);
    localStorage.setItem("babyCareFeedings", JSON.stringify(updatedFeedings));
    onDataChange?.();
    toast({ title: "Catatan minum dihapus." });
    sendDataToCloud();
  };

  const deleteCryAnalysis = (id: string) => {
    const updatedAnalyses = cryAnalyses.filter(c => c.id !== id);
    setCryAnalyses(updatedAnalyses);
    localStorage.setItem("babyCareCryAnalyses", JSON.stringify(updatedAnalyses));
    onDataChange?.();
    toast({ title: "Catatan analisis dihapus." });
    sendDataToCloud();
  };

  const deleteDiaper = (id: string) => {
    const updatedDiapers = diapers.filter(d => d.id !== id);
    setDiapers(updatedDiapers);
    localStorage.setItem("babyCareDiapers", JSON.stringify(updatedDiapers));
    onDataChange?.();
    toast({ title: "Catatan pergantian popok dihapus." });
    sendDataToCloud();
  };

  const deletePumpingSession = (id: string) => {
    const updatedSessions = pumpingSessions.filter(p => p.id !== id);
    setPumpingSessions(updatedSessions);
    localStorage.setItem("motherPumpingSessions", JSON.stringify(updatedSessions));
    onDataChange?.();
    toast({ title: "Catatan pumping dihapus." });
    sendDataToCloud();
  };

  const handleDeleteConfirm = () => {
    if (!itemToDelete) return;

    if (itemToDelete.type === 'feeding') {
      deleteFeeding(itemToDelete.id);
    } else if (itemToDelete.type === 'cry') {
      deleteCryAnalysis(itemToDelete.id);
    } else if (itemToDelete.type === 'pumping') {
      deletePumpingSession(itemToDelete.id);
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <InfoCard
            icon={Baby}
            title="Usia Bayi"
            value={ageString}
            description={`${ageInMonths} Bulan`}
            className="h-full"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <FeedingCountdownComponent nextFeedingTime={nextFeedingTime} className="h-full" />
        </motion.div>

        {/* Card 3: Feeding Progress (Flippable) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="perspective-1000"
        >
          <div
            className={`relative transition-transform duration-500 preserve-3d h-full ${isActivityFlipped ? "rotate-y-180" : ""}`}
            style={{
              transformStyle: 'preserve-3d',
              transform: isActivityFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            {/* Front Side: Feeding Progress */}
            <div className="backface-hidden relative z-10 h-full" style={{ backfaceVisibility: 'hidden' }}>
              <FeedingProgressCard
                icon={lastFeedingIcon}
                title="Terakhir Minum"
                lastFeedingAmount={lastFeeding ? lastFeeding.quantity : null}
                totalToday={totalFeedingToday}
                recommendedMin={feedingReco.min}
                recommendedMax={feedingReco.max}
                isClient={isClient}
                feedings={sortedFeedings}
                className="h-full"
              />
            </div>

            {/* Back Side: Pumping Progress */}
            <div
              className="absolute inset-0 backface-hidden rotate-y-180 h-full"
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            >
              <PumpingProgressCard
                icon={Milk}
                title="Pumping Hari Ini"
                sessions={sortedPumpingSessions}
                isClient={isClient}
                className="h-full"
              />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <DiaperProgressCard
            icon={Shirt}
            title="Popok Hari Ini"
            diapers={sortedDiapers}
            isClient={isClient}
            totalToday={totalDiapersToday}
            totalPoopsThisWeek={totalPoopsThisWeek}
            weeklyPoopMin={weeklyPoopReco.min}
            weeklyPoopMax={weeklyPoopReco.max}
            className="h-full"
          />
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1 perspective-1000">
          <div
            className={cn(
              "relative transition-transform duration-700 preserve-3d h-full",
              isActivityFlipped && "rotate-y-180"
            )}
            style={{
              transformStyle: 'preserve-3d',
              transform: isActivityFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            {/* Front Side: Baby Activities */}
            <Card className="shadow-lg h-full backface-hidden relative z-10" style={{ backfaceVisibility: 'hidden' }}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="font-headline text-2xl">Catat Aktivitas Bayi</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-pink-500 border-pink-200 hover:bg-pink-50 hover:text-pink-600"
                    onClick={() => setIsActivityFlipped(true)}
                  >
                    Mode Bunda
                    <MomIcon className="ml-2 h-3 w-3" />
                  </Button>
                </div>
                <CardDescription>Rekam sesi pemberian minum, popok, atau analisis tangisan.</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="feeding">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="feeding">Minum</TabsTrigger>
                    <TabsTrigger value="diaper">Popok</TabsTrigger>
                    <TabsTrigger value="cry">Analisis</TabsTrigger>
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

            {/* Back Side: Mother Pumping */}
            <Card
              className="shadow-lg h-full absolute inset-0 backface-hidden rotate-y-180 border-pink-200"
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="font-headline text-2xl text-pink-700">Catatan Bunda</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-cyan-500 border-cyan-200 hover:bg-cyan-50 hover:text-cyan-600"
                    onClick={() => setIsActivityFlipped(false)}
                  >
                    Mode Bayi
                    <Baby className="ml-2 h-3 w-3" />
                  </Button>
                </div>
                <CardDescription>Rekam aktivitas pumping ASI.</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="pumping">
                  <TabsList className="grid w-full grid-cols-1">
                    <TabsTrigger value="pumping" className="data-[state=active]:bg-pink-100 data-[state=active]:text-pink-900">Pumping ASI</TabsTrigger>
                  </TabsList>
                  <TabsContent value="pumping" className="pt-6">
                    <PumpingForm onAddSession={addPumpingSession} />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="lg:col-span-2 perspective-1000">
          <div
            className={cn(
              "relative transition-transform duration-700 preserve-3d h-full",
              isActivityFlipped && "rotate-y-180"
            )}
            style={{
              transformStyle: 'preserve-3d',
              transform: isActivityFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            {/* Front Side: Baby History */}
            <Card className="shadow-lg h-full backface-hidden relative z-10" style={{ backfaceVisibility: 'hidden' }}>
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

            {/* Back Side: Mother History */}
            <Card
              className="shadow-lg h-full absolute inset-0 backface-hidden rotate-y-180 border-pink-200"
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            >
              <CardHeader>
                <CardTitle className="font-headline text-2xl flex items-center gap-2 text-pink-700">
                  <History className="h-6 w-6" /> Riwayat Bunda
                </CardTitle>
                <CardDescription>Catatan aktivitas pumping ASI Anda.</CardDescription>
              </CardHeader>
              <CardContent>
                <PumpingHistory
                  sessions={sortedPumpingSessions}
                  onDelete={(id) => setItemToDelete({ type: 'pumping', id })}
                />
              </CardContent>
            </Card>
          </div>
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
    </motion.div>
  );
}
