"use client";

import { Baby, Settings, User, KeyRound, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

type AppHeaderProps = {
  onEditBirthDate: () => void;
  showActions: boolean;
};

// Puter credentials
const PUTER_USERNAME = "kitacobatest";
const PUTER_PASSWORD = "Kitacobatest1!";

export default function AppHeader({ onEditBirthDate, showActions }: AppHeaderProps) {
  const { toast } = useToast();
  const [copiedField, setCopiedField] = useState<'username' | 'password' | null>(null);

  const copyToClipboard = async (text: string, field: 'username' | 'password') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast({
        title: "Berhasil Disalin!",
        description: field === 'username' ? "Username telah disalin." : "Password telah disalin.",
      });
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast({
        variant: "destructive",
        title: "Gagal Menyalin",
        description: "Tidak dapat menyalin ke clipboard.",
      });
    }
  };

  return (
    <header className="w-full border-b border-border/50">
      <div className="container mx-auto flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 text-primary p-2 rounded-lg">
            <Baby className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-headline font-bold text-foreground">
            Babynum Time
          </h1>
        </div>
        {showActions && (
          <div className="flex items-center gap-2">
            {/* Puter Credentials */}
            <div className="flex items-center gap-1 text-xs mr-2">
              <span className="text-muted-foreground hidden sm:inline">Login Puter:</span>

              {/* Username */}
              <button
                onClick={() => copyToClipboard(PUTER_USERNAME, 'username')}
                className="flex items-center gap-1 bg-muted hover:bg-accent px-1.5 py-1 rounded transition-colors"
                title="Klik untuk menyalin username"
              >
                <User className="h-3 w-3 text-muted-foreground" />
                <span className="font-mono">{PUTER_USERNAME}</span>
                {copiedField === 'username' && <Check className="h-3 w-3 text-green-500" />}
              </button>

              {/* Password */}
              <button
                onClick={() => copyToClipboard(PUTER_PASSWORD, 'password')}
                className="flex items-center gap-1 bg-muted hover:bg-accent px-1.5 py-1 rounded transition-colors"
                title="Klik untuk menyalin password"
              >
                <KeyRound className="h-3 w-3 text-muted-foreground" />
                <span className="font-mono">••••••••</span>
                {copiedField === 'password' && <Check className="h-3 w-3 text-green-500" />}
              </button>
            </div>

            <Button variant="ghost" size="icon" onClick={onEditBirthDate} aria-label="Pengaturan">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
