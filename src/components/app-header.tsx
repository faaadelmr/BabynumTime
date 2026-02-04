"use client";

import { Baby, Settings, HelpCircle, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type AppHeaderProps = {
  onEditBirthDate: () => void;
  showActions: boolean;
  babyName?: string;
  lastSync?: Date | null;
};

export default function AppHeader({ onEditBirthDate, showActions, babyName, lastSync }: AppHeaderProps) {
  const { toast } = useToast();
  const [showAbout, setShowAbout] = useState(false);

  return (
    <>
      <header className="w-full border-b border-border/50">
        <div className="container mx-auto p-3 sm:p-4">
          {/* Main row: Logo + Title + Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="bg-primary/20 text-primary p-1.5 sm:p-2 rounded-lg">
                <Baby className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-headline font-bold text-foreground">
                  Babynum Time
                </h1>
                {showActions && (
                  <p className="text-xs sm:text-sm text-muted-foreground -mt-0.5">
                    Hi bunda, catatan {babyName ? <span className="font-medium text-primary">{babyName}</span> : 'si kecil'} 👋
                  </p>
                )}
              </div>
            </div>

            {showActions && (
              <div className="flex flex-col items-end">
              <div className="flex items-center gap-1 sm:gap-2">
                {/* Desktop credentials removed */}

                <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={() => setShowAbout(true)} aria-label="Tentang Aplikasi">
                  <HelpCircle className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={onEditBirthDate} aria-label="Pengaturan">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
              {lastSync && (
                  <span className="text-[10px] text-muted-foreground mr-1">
                    Update: {format(lastSync, "HH:mm", { locale: id })}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Credentials moved to specific tabs */}
        </div>
      </header>

      {/* About Dialog */}
      <Dialog open={showAbout} onOpenChange={setShowAbout}>
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">
              🍼 Mengapa aplikasi ini dibuat?
            </DialogTitle>
            <DialogDescription className="text-sm leading-relaxed">
              Aplikasi ini dibuat khusus untuk istri saya, Caca ❤️, dan buah hati tercinta kami.
              Sebagai orang tua baru, kami sadar betapa menantangnya mengingat jadwal menyusui,
              ganti popok, dan rutinitas lainnya di tengah kesibukan.
              Semoga aplikasi sederhana ini bisa membantu para orang tua baru dalam mencatat
              kegiatan harian si kecil dengan lebih mudah.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 sm:py-4">
            <div className="space-y-2 text-sm">
              <p className="font-medium text-sm sm:text-base">Bagaimana Cara Support Aplikasi ini? 🤷‍♀️🤷‍♂️</p>
              <p className="text-muted-foreground leading-relaxed">
                Aplikasi ini sepenuhnya Gratis tanpa perlu donasi atau biaya langganan.
                Dukungan terbaik yang bisa Anda berikan adalah selipan doa baik untuk anak kami,
                <strong> Haru Muamar Rifai</strong>. Terima kasih.
              </p>
            </div>

            <div className="space-y-2 text-sm">
              <p className="font-medium text-sm sm:text-base">✨ Fitur Utama:</p>
              <ul className="text-muted-foreground space-y-1.5 list-disc list-inside text-xs sm:text-sm">
                <li><strong>Pelacak Menyusui</strong> - Catat waktu dan jumlah ASI/sufor</li>
                <li><strong>Pelacak Popok</strong> - Monitor ganti popok & analisis AI feses</li>
                <li><strong>Analisis Tangisan AI</strong> - Pahami arti tangisan bayi</li>
                <li><strong>Sinkronisasi Cloud</strong> - Berbagi data dengan keluarga</li>
                <li><strong>Mode Offline</strong> - Bekerja tanpa internet</li>
              </ul>
            </div>

            <div className="pt-3 border-t text-center">
              <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                Dibuat dengan <Heart className="h-3 w-3 text-red-500 fill-red-500" /> untuk para orang tua baru
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                © 2026 Babynum Time
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
