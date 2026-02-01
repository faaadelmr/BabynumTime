"use client";

import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }

        // Check localStorage for dismissed state
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        if (dismissed) {
            const dismissedTime = parseInt(dismissed, 10);
            // Show again after 7 days
            if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
                return;
            }
        }

        const handleBeforeInstall = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            setShowPrompt(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstall);

        // Check if on iOS
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        if (isIOS && !('standalone' in window.navigator)) {
            setShowPrompt(true);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        };
    }, []);

    const handleInstall = async () => {
        if (deferredPrompt) {
            await deferredPrompt.prompt();
            const choice = await deferredPrompt.userChoice;
            if (choice.outcome === 'accepted') {
                setShowPrompt(false);
                setIsInstalled(true);
            }
            setDeferredPrompt(null);
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    };

    if (!showPrompt || isInstalled) return null;

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    return (
        <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-4">
            <div className="bg-gradient-to-r from-primary to-purple-600 text-white rounded-xl p-4 shadow-xl">
                <div className="flex items-start gap-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                        <Download className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-lg">Install Babynum Time</h3>
                        {isIOS ? (
                            <p className="text-white/90 text-sm mt-1">
                                Tap <span className="font-semibold">Share</span> lalu pilih{' '}
                                <span className="font-semibold">&quot;Add to Home Screen&quot;</span>
                            </p>
                        ) : (
                            <p className="text-white/90 text-sm mt-1">
                                Install aplikasi untuk akses cepat tanpa browser
                            </p>
                        )}
                    </div>
                    <button
                        onClick={handleDismiss}
                        className="text-white/70 hover:text-white transition-colors"
                        aria-label="Tutup"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {!isIOS && deferredPrompt && (
                    <div className="mt-3 flex gap-2">
                        <Button
                            onClick={handleInstall}
                            variant="secondary"
                            className="flex-1 bg-white text-primary hover:bg-white/90"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Install Sekarang
                        </Button>
                        <Button
                            onClick={handleDismiss}
                            variant="ghost"
                            className="text-white hover:bg-white/20"
                        >
                            Nanti
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
