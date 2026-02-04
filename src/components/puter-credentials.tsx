"use client";

import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { PUTER_USERNAME, PUTER_PASSWORD } from "@/lib/constants";

export function PuterCredentials() {
  const { toast } = useToast();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Disalin!",
      description: `${label} telah disalin ke clipboard.`,
    });
  };

  return (
    <div className="mt-6 p-4 border rounded-lg bg-muted/30 text-sm">
      <div className="font-semibold mb-3 flex items-center gap-2 text-primary">
        <span>🔑 Login Puter AI</span>
      </div>
      <div className="space-y-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Username:</span>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-background px-3 py-1.5 rounded border font-mono text-xs">{PUTER_USERNAME}</code>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => copyToClipboard(PUTER_USERNAME, "Username")}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Password:</span>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-background px-3 py-1.5 rounded border font-mono text-xs">{PUTER_PASSWORD}</code>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => copyToClipboard(PUTER_PASSWORD, "Password")}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground mt-3 italic">
        Gunakan akun ini saat diminta login oleh layanan AI.
      </p>
    </div>
  );
}
