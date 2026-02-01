"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Clock, Bell, BellOff, BellRing } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface FeedingCountdownProps {
    nextFeedingTime: Date | null;
}

export default function FeedingCountdown({ nextFeedingTime }: FeedingCountdownProps) {
    const { toast } = useToast();
    const [countdown, setCountdown] = useState<{ hours: number; minutes: number; seconds: number } | null>(null);
    const [notificationEnabled, setNotificationEnabled] = useState(false);
    const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>("default");
    const [isComplete, setIsComplete] = useState(false);
    const notificationSentRef = useRef(false);

    // Check notification permission on mount
    useEffect(() => {
        if (typeof window !== "undefined" && "Notification" in window) {
            setNotificationPermission(Notification.permission);
            // Check if user has enabled notifications before
            const savedPref = localStorage.getItem("babynumtime-notification-enabled");
            if (savedPref === "true" && Notification.permission === "granted") {
                setNotificationEnabled(true);
            }
        }
    }, []);

    // Request notification permission
    const requestNotificationPermission = useCallback(async () => {
        if (!("Notification" in window)) {
            toast({
                variant: "destructive",
                title: "Notifikasi tidak didukung",
                description: "Browser Anda tidak mendukung notifikasi.",
            });
            return;
        }

        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);

        if (permission === "granted") {
            setNotificationEnabled(true);
            localStorage.setItem("babynumtime-notification-enabled", "true");
            toast({
                title: "Notifikasi Diaktifkan! 🔔",
                description: "Anda akan menerima pengingat saat waktu minum tiba.",
            });
        } else {
            toast({
                variant: "destructive",
                title: "Notifikasi Ditolak",
                description: "Anda dapat mengaktifkannya di pengaturan browser.",
            });
        }
    }, [toast]);

    // Toggle notifications
    const toggleNotification = useCallback(() => {
        if (notificationEnabled) {
            setNotificationEnabled(false);
            localStorage.setItem("babynumtime-notification-enabled", "false");
            toast({ title: "Notifikasi Dimatikan" });
        } else {
            if (notificationPermission === "granted") {
                setNotificationEnabled(true);
                localStorage.setItem("babynumtime-notification-enabled", "true");
                toast({ title: "Notifikasi Diaktifkan! 🔔" });
            } else {
                requestNotificationPermission();
            }
        }
    }, [notificationEnabled, notificationPermission, requestNotificationPermission, toast]);

    // Send notification
    const sendNotification = useCallback(() => {
        if (!notificationEnabled || notificationSentRef.current) return;

        notificationSentRef.current = true;

        // Web Notification API
        if ("Notification" in window && Notification.permission === "granted") {
            const notification = new Notification("🍼 Waktu Minum Bayi!", {
                body: "Saatnya memberikan minum untuk si kecil.",
                icon: "/icons/icon-192x192.png",
                badge: "/icons/icon-192x192.png",
                tag: "feeding-reminder",
                requireInteraction: true,
            });

            notification.onclick = () => {
                window.focus();
                notification.close();
            };
        }

        // Also vibrate if supported
        if ("vibrate" in navigator) {
            navigator.vibrate([200, 100, 200, 100, 200]);
        }

        toast({
            title: "🍼 Waktu Minum Tiba!",
            description: "Saatnya memberikan minum untuk si kecil.",
        });
    }, [notificationEnabled, toast]);

    // Countdown timer
    useEffect(() => {
        if (!nextFeedingTime) {
            setCountdown(null);
            setIsComplete(false);
            notificationSentRef.current = false;
            return;
        }

        const updateCountdown = () => {
            const now = new Date();
            const diff = nextFeedingTime.getTime() - now.getTime();

            if (diff <= 0) {
                setCountdown({ hours: 0, minutes: 0, seconds: 0 });
                setIsComplete(true);
                sendNotification();
                return;
            }

            setIsComplete(false);
            notificationSentRef.current = false;

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setCountdown({ hours, minutes, seconds });
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);

        return () => clearInterval(interval);
    }, [nextFeedingTime, sendNotification]);

    // Format number with leading zero
    const pad = (n: number) => n.toString().padStart(2, "0");

    if (!nextFeedingTime) {
        return (
            <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Minum Berikutnya</CardTitle>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold font-headline">N/A</div>
                    <p className="text-xs text-muted-foreground">Catat minum pertama</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={`shadow-sm transition-colors ${isComplete ? "bg-primary/10 border-primary" : ""}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-1">
                    {isComplete && <BellRing className="h-4 w-4 text-primary animate-bounce" />}
                    Minum Berikutnya
                </CardTitle>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={toggleNotification}
                    title={notificationEnabled ? "Matikan notifikasi" : "Aktifkan notifikasi"}
                >
                    {notificationEnabled ? (
                        <Bell className="h-4 w-4 text-primary" />
                    ) : (
                        <BellOff className="h-4 w-4 text-muted-foreground" />
                    )}
                </Button>
            </CardHeader>
            <CardContent>
                {isComplete ? (
                    <div className="text-2xl font-bold font-headline text-primary animate-pulse">
                        Sekarang! 🍼
                    </div>
                ) : countdown ? (
                    <div className="flex items-center gap-1">
                        <div className="bg-muted px-2 py-1 rounded text-lg font-mono font-bold">
                            {pad(countdown.hours)}
                        </div>
                        <span className="text-muted-foreground font-bold">:</span>
                        <div className="bg-muted px-2 py-1 rounded text-lg font-mono font-bold">
                            {pad(countdown.minutes)}
                        </div>
                        <span className="text-muted-foreground font-bold">:</span>
                        <div className="bg-muted px-2 py-1 rounded text-lg font-mono font-bold">
                            {pad(countdown.seconds)}
                        </div>
                    </div>
                ) : (
                    <div className="text-2xl font-bold font-headline">Memuat...</div>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                    {isComplete
                        ? "Ketuk untuk mencatat minum"
                        : `Jam ${nextFeedingTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}`}
                </p>
            </CardContent>
        </Card>
    );
}
