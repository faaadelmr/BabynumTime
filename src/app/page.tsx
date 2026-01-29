"use client";

import { useState, useEffect } from "react";
import AppHeader from "@/components/app-header";
import InitialSetup from "@/components/initial-setup";
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
import { id } from 'date-fns/locale';
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function Home() {
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [showEditBirthDate, setShowEditBirthDate] = useState(false);
  const [newBirthDate, setNewBirthDate] = useState<Date | undefined>();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    const storedBirthDate = localStorage.getItem("babyCareBirthDate");
    if (storedBirthDate) {
      const date = new Date(storedBirthDate);
      setBirthDate(date);
    }
    setIsClient(true);
  }, []);

  const handleSaveBirthDate = (date: Date) => {
    localStorage.setItem("babyCareBirthDate", date.toISOString());
    setBirthDate(date);
  };
  
  const handleUpdateBirthDate = () => {
    if (newBirthDate) {
      handleSaveBirthDate(newBirthDate);
      setShowEditBirthDate(false);
    }
  }

  const openSettingsDialog = () => {
    setNewBirthDate(birthDate || undefined);
    setShowEditBirthDate(true);
  };

  const handleResetApp = () => {
    localStorage.removeItem("babyCareBirthDate");
    localStorage.removeItem("babyCareFeedings");
    localStorage.removeItem("babyCarePoops");
    window.location.reload();
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <AppHeader 
        onEditBirthDate={openSettingsDialog}
        showActions={!!birthDate && isClient}
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
          <Dashboard birthDate={birthDate} />
        ) : (
          <InitialSetup onSaveBirthDate={handleSaveBirthDate} />
        )}
      </main>

      <Dialog open={showEditBirthDate} onOpenChange={setShowEditBirthDate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pengaturan</DialogTitle>
            <DialogDescription>
              Perbarui tanggal lahir bayi Anda di sini. Semua data Anda, termasuk catatan minum dan eek, disimpan dengan aman di peramban (browser) Anda dan tidak dikirim ke tempat lain.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 flex justify-center">
            <Input
              type="date"
              value={newBirthDate ? format(newBirthDate, 'yyyy-MM-dd') : ''}
              onChange={(e) => {
                  if (e.target.value) {
                      const [year, month, day] = e.target.value.split('-').map(Number);
                      // Create date in local timezone to avoid timezone shift issues
                      setNewBirthDate(new Date(year, month - 1, day));
                  } else {
                      setNewBirthDate(undefined);
                  }
              }}
              className="w-[280px]"
              max={format(new Date(), 'yyyy-MM-dd')}
            />
          </div>
          <DialogFooter>
            <Button variant="destructive" className="mr-auto" onClick={() => setShowResetConfirm(true)}>
                <Trash2 className="mr-2 h-4 w-4" />
                Atur Ulang Data
            </Button>
            <Button variant="outline" onClick={() => setShowEditBirthDate(false)}>Batal</Button>
            <Button onClick={handleUpdateBirthDate} disabled={!newBirthDate}>Simpan Perubahan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Anda yakin ingin mengatur ulang?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan menghapus semua data aplikasi (tanggal lahir, riwayat minum, dan riwayat eek) secara permanen. Data ini tidak dapat dipulihkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetApp}>Ya, Atur Ulang</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
