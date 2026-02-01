"use client";

import { useState, useEffect, useCallback } from "react";
import AppHeader from "@/components/app-header";
import Onboarding from "@/components/onboarding";
import Dashboard from "@/components/dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Trash2, Cloud, RefreshCw, Loader2, Copy, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getStorageConfig, setStorageConfig, clearStorageConfig, type BabyInfo } from "@/lib/storage-mode";
import { startAutoSync, stopAutoSync, syncNow, syncToCloud, getLastSyncTime, markPendingSync, getDataFromCloud, createBabyInCloud, isApiConfigured } from "@/lib/cloud-sync";
import { useToast } from "@/hooks/use-toast";
import type { Feeding, DiaperChange, CryAnalysis } from "@/lib/types";

export default function Home() {
  const { toast } = useToast();
  const [config, setConfig] = useState<BabyInfo | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [showEditBirthDate, setShowEditBirthDate] = useState(false);
  const [newBirthDate, setNewBirthDate] = useState<Date | undefined>();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [copied, setCopied] = useState(false);
  const [showUpgradeToCloud, setShowUpgradeToCloud] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const [newBabyId, setNewBabyId] = useState<string | null>(null);

  // Get data function for sync
  const getData = useCallback(() => {
    const feedings = JSON.parse(localStorage.getItem("babyCareFeedings") || "[]") as Feeding[];
    const diapers = JSON.parse(localStorage.getItem("babyCareDiapers") || "[]") as DiaperChange[];
    const cryAnalyses = JSON.parse(localStorage.getItem("babyCareCryAnalyses") || "[]") as CryAnalysis[];
    return { feedings, diapers, cryAnalyses };
  }, []);

  useEffect(() => {
    const storedConfig = getStorageConfig();
    if (storedConfig) {
      setConfig(storedConfig);

      // Start auto-sync if in cloud mode
      if (storedConfig.storageMode === 'cloud' && storedConfig.babyId) {
        startAutoSync(getData, (success) => {
          if (success) {
            setLastSync(new Date());
            toast({ title: "Data tersinkron!" });
          }
        });
        setLastSync(getLastSyncTime());
      }
    }
    setIsClient(true);

    return () => {
      stopAutoSync();
    };
  }, [getData, toast]);

  const handleOnboardingComplete = async (newConfig: BabyInfo) => {
    setConfig(newConfig);

    // If cloud mode, try to fetch existing data
    if (newConfig.storageMode === 'cloud' && newConfig.babyId && isApiConfigured()) {
      const result = await getDataFromCloud(newConfig.babyId);
      if (result.success && result.data) {
        // Save fetched data to localStorage
        localStorage.setItem("babyCareFeedings", JSON.stringify(result.data.feedings || []));
        localStorage.setItem("babyCareDiapers", JSON.stringify(result.data.diapers || []));
        localStorage.setItem("babyCareCryAnalyses", JSON.stringify(result.data.cryAnalyses || []));
      }

      // Start auto-sync
      startAutoSync(getData, (success) => {
        if (success) {
          setLastSync(new Date());
        }
      });
    }
  };

  const handleUpdateBirthDate = () => {
    if (newBirthDate && config) {
      const updatedConfig = { ...config, birthDate: newBirthDate.toISOString() };
      setStorageConfig(updatedConfig);
      setConfig(updatedConfig);
      setShowEditBirthDate(false);
      markPendingSync();
    }
  };

  const openSettingsDialog = () => {
    if (config) {
      setNewBirthDate(new Date(config.birthDate));
    }
    setShowEditBirthDate(true);
  };

  const handleResetApp = () => {
    stopAutoSync();
    clearStorageConfig();
    localStorage.removeItem("babyCareFeedings");
    localStorage.removeItem("babyCareDiapers");
    localStorage.removeItem("babyCareCryAnalyses");
    localStorage.removeItem("babynumtime-last-sync");
    localStorage.removeItem("babynumtime-pending-sync");
    window.location.reload();
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    const result = await syncNow(getData);
    setIsSyncing(false);

    if (result.success) {
      setLastSync(new Date());
      toast({ title: "Sinkronisasi berhasil!" });
    } else {
      toast({ variant: "destructive", title: "Gagal sinkron", description: result.error });
    }
  };

  const copyBabyId = async () => {
    if (config?.babyId) {
      await navigator.clipboard.writeText(config.babyId);
      setCopied(true);
      toast({ title: "ID disalin!" });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Show onboarding if not configured
  if (isClient && !config) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  const birthDate = config ? new Date(config.birthDate) : null;

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <AppHeader
        onEditBirthDate={openSettingsDialog}
        showActions={!!config && isClient}
      />
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
          <Dashboard birthDate={birthDate} onDataChange={markPendingSync} />
        ) : null}
      </main>

      <Dialog open={showEditBirthDate} onOpenChange={setShowEditBirthDate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pengaturan</DialogTitle>
            <DialogDescription>
              Kelola pengaturan aplikasi Anda di sini.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Cloud Mode Info */}
            {config?.storageMode === 'cloud' && config.babyId && (
              <div className="p-4 bg-primary/10 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cloud className="h-4 w-4 text-primary" />
                    <span className="font-medium">Mode Cloud</span>
                  </div>
                  <Badge variant="secondary">ID: {config.babyId}</Badge>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyBabyId}
                  >
                    {copied ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                    Salin ID
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleManualSync}
                    disabled={isSyncing}
                  >
                    {isSyncing ? (
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3 mr-1" />
                    )}
                    Sinkron
                  </Button>
                </div>

                {lastSync && (
                  <p className="text-xs text-muted-foreground">
                    Terakhir sinkron: {format(lastSync, "HH:mm, d MMM")}
                  </p>
                )}
              </div>
            )}

            {/* Offline Mode Info */}
            {config?.storageMode === 'offline' && (
              <div className="p-4 bg-muted rounded-lg space-y-3">
                <p className="text-sm text-muted-foreground">
                  📱 Mode Offline - Data tersimpan di perangkat ini saja.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setShowEditBirthDate(false);
                    setShowUpgradeToCloud(true);
                  }}
                >
                  <Cloud className="h-4 w-4 mr-2" />
                  Upgrade ke Mode Cloud
                </Button>
              </div>
            )}

            {/* Birth Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Tanggal Lahir Bayi</label>
              <Input
                type="date"
                value={newBirthDate ? format(newBirthDate, 'yyyy-MM-dd') : ''}
                onChange={(e) => {
                  if (e.target.value) {
                    const [year, month, day] = e.target.value.split('-').map(Number);
                    setNewBirthDate(new Date(year, month - 1, day));
                  } else {
                    setNewBirthDate(undefined);
                  }
                }}
                max={format(new Date(), 'yyyy-MM-dd')}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="destructive" className="mr-auto" onClick={() => setShowResetConfirm(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Atur Ulang
            </Button>
            <Button variant="outline" onClick={() => setShowEditBirthDate(false)}>Batal</Button>
            <Button onClick={handleUpdateBirthDate} disabled={!newBirthDate}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Atur Ulang Aplikasi?</AlertDialogTitle>
            <AlertDialogDescription>
              Semua data lokal akan dihapus. {config?.storageMode === 'cloud' && 'Data di cloud tetap tersimpan dan dapat diakses kembali dengan ID Bayi.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetApp}>Ya, Atur Ulang</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Upgrade to Cloud Dialog */}
      <Dialog open={showUpgradeToCloud} onOpenChange={(open) => {
        if (!open) {
          setNewBabyId(null);
        }
        setShowUpgradeToCloud(open);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>☁️ Upgrade ke Mode Cloud</DialogTitle>
            <DialogDescription>
              {newBabyId
                ? "ID Bayi berhasil dibuat! Simpan ID ini untuk berbagi dengan keluarga."
                : "Data yang ada akan disimpan ke cloud dan bisa diakses dari perangkat lain."
              }
            </DialogDescription>
          </DialogHeader>

          {!newBabyId ? (
            <div className="py-4 space-y-4">
              <p className="text-sm text-muted-foreground">
                Dengan upgrade ke mode cloud:
              </p>
              <ul className="text-sm space-y-1 list-disc list-inside text-muted-foreground">
                <li>Data tersinkron otomatis setiap 30 menit</li>
                <li>Dapat diakses dari perangkat lain</li>
                <li>Bisa dibagikan ke suami/istri/keluarga</li>
              </ul>
              <Button
                className="w-full"
                onClick={async () => {
                  if (!config) return;
                  setUpgradeLoading(true);
                  const result = await createBabyInCloud(config.birthDate, config.babyName);
                  setUpgradeLoading(false);

                  if (result.success && result.babyId) {
                    setNewBabyId(result.babyId);

                    // Update config to cloud mode
                    const updatedConfig: BabyInfo = {
                      ...config,
                      babyId: result.babyId,
                      storageMode: 'cloud',
                    };
                    setStorageConfig(updatedConfig);
                    setConfig(updatedConfig);

                    // Sync existing data to cloud
                    const data = getData();
                    await syncToCloud(result.babyId, data);

                    // Start auto-sync
                    startAutoSync(getData, (success) => {
                      if (success) {
                        setLastSync(new Date());
                      }
                    });

                    toast({ title: "Berhasil upgrade ke cloud!" });
                  } else {
                    toast({ variant: "destructive", title: "Gagal", description: result.error });
                  }
                }}
                disabled={upgradeLoading}
              >
                {upgradeLoading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Membuat ID...</>
                ) : (
                  <><Cloud className="h-4 w-4 mr-2" /> Upgrade Sekarang</>
                )}
              </Button>
            </div>
          ) : (
            <div className="py-4 space-y-4 text-center">
              <div className="bg-primary/10 p-6 rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">ID Bayi Anda:</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-3xl font-mono font-bold text-primary">{newBabyId}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={async () => {
                      await navigator.clipboard.writeText(newBabyId);
                      toast({ title: "ID disalin!" });
                    }}
                  >
                    <Copy className="h-5 w-5" />
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                ⚠️ Simpan ID ini! Bagikan ke keluarga untuk melihat data bayi yang sama.
              </p>
              <Button className="w-full" onClick={() => setShowUpgradeToCloud(false)}>
                Selesai
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
