"use client";

import { useState } from 'react';
import { Cloud, Smartphone, Loader2, Copy, Check, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { setStorageConfig, type BabyInfo } from '@/lib/storage-mode';
import { createBabyInCloud, getBabyFromCloud, isApiConfigured } from '@/lib/cloud-sync';

interface OnboardingProps {
    onComplete: (config: BabyInfo) => void;
}

type Step = 'mode' | 'cloud-choice' | 'create-new' | 'join-existing' | 'offline-setup';

export default function Onboarding({ onComplete }: OnboardingProps) {
    const { toast } = useToast();
    const [step, setStep] = useState<Step>('mode');
    const [isLoading, setIsLoading] = useState(false);

    // Form states
    const [birthDate, setBirthDate] = useState('');
    const [babyName, setBabyName] = useState('');
    const [existingBabyId, setExistingBabyId] = useState('');
    const [createdBabyId, setCreatedBabyId] = useState('');
    const [copied, setCopied] = useState(false);

    const handleOfflineSetup = () => {
        if (!birthDate) {
            toast({ variant: 'destructive', title: 'Tanggal lahir wajib diisi' });
            return;
        }

        const config: BabyInfo = {
            birthDate,
            babyName: babyName || undefined,
            storageMode: 'offline',
        };

        setStorageConfig(config);
        onComplete(config);
    };

    const handleCreateNew = async () => {
        if (!birthDate) {
            toast({ variant: 'destructive', title: 'Tanggal lahir wajib diisi' });
            return;
        }

        if (!isApiConfigured()) {
            toast({
                variant: 'destructive',
                title: 'API belum dikonfigurasi',
                description: 'Hubungi developer untuk setup cloud sync.'
            });
            return;
        }

        setIsLoading(true);
        const result = await createBabyInCloud(birthDate, babyName || undefined);
        setIsLoading(false);

        if (result.success && result.babyId) {
            setCreatedBabyId(result.babyId);
            toast({
                title: 'Berhasil!',
                description: `ID Bayi: ${result.babyId}`
            });
        } else {
            toast({
                variant: 'destructive',
                title: 'Gagal',
                description: result.error
            });
        }
    };

    const handleConfirmCreate = () => {
        const config: BabyInfo = {
            babyId: createdBabyId,
            birthDate,
            babyName: babyName || undefined,
            storageMode: 'cloud',
        };

        setStorageConfig(config);
        onComplete(config);
    };

    const handleJoinExisting = async () => {
        if (!existingBabyId.trim()) {
            toast({ variant: 'destructive', title: 'ID Bayi wajib diisi' });
            return;
        }

        if (!isApiConfigured()) {
            toast({
                variant: 'destructive',
                title: 'API belum dikonfigurasi',
                description: 'Hubungi developer untuk setup cloud sync.'
            });
            return;
        }

        setIsLoading(true);
        const result = await getBabyFromCloud(existingBabyId.trim().toUpperCase());

        if (result.success && result.baby) {
            // Fetch existing data from cloud
            const { getDataFromCloud } = await import('@/lib/cloud-sync');
            const dataResult = await getDataFromCloud(existingBabyId.trim().toUpperCase());

            if (dataResult.success && dataResult.data) {
                // Save fetched data to localStorage
                if (dataResult.data.feedings && dataResult.data.feedings.length > 0) {
                    localStorage.setItem("babyCareFeedings", JSON.stringify(dataResult.data.feedings));
                }
                if (dataResult.data.diapers && dataResult.data.diapers.length > 0) {
                    localStorage.setItem("babyCareDiapers", JSON.stringify(dataResult.data.diapers));
                }
                if (dataResult.data.cryAnalyses && dataResult.data.cryAnalyses.length > 0) {
                    localStorage.setItem("babyCareCryAnalyses", JSON.stringify(dataResult.data.cryAnalyses));
                }
                if (dataResult.data.pumpingSessions && dataResult.data.pumpingSessions.length > 0) {
                    localStorage.setItem("motherPumpingSessions", JSON.stringify(dataResult.data.pumpingSessions));
                }
                toast({
                    title: 'Berhasil terhubung!',
                    description: `Data berhasil dimuat: ${dataResult.data.feedings?.length || 0} minum, ${dataResult.data.diapers?.length || 0} popok`
                });
            } else {
                toast({ title: 'Berhasil terhubung!', description: 'Belum ada data tersimpan di cloud.' });
            }

            setStorageConfig(result.baby);
            setIsLoading(false);
            onComplete(result.baby);
        } else {
            setIsLoading(false);
            toast({
                variant: 'destructive',
                title: 'ID tidak ditemukan',
                description: 'Pastikan ID Bayi benar'
            });
        }
    };

    const copyBabyId = async () => {
        await navigator.clipboard.writeText(createdBabyId);
        setCopied(true);
        toast({ title: 'ID disalin!' });
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-primary/5 to-background">
            <Card className="w-full max-w-md shadow-xl">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-headline">
                        {step === 'mode' && '🍼 Selamat Datang!'}
                        {step === 'cloud-choice' && '☁️ Mode Cloud'}
                        {step === 'create-new' && '✨ Buat ID Baru'}
                        {step === 'join-existing' && '🔗 Gabung dengan ID'}
                        {step === 'offline-setup' && '📱 Mode Offline'}
                    </CardTitle>
                    <CardDescription>
                        {step === 'mode' && 'Pilih cara menyimpan data bayi Anda'}
                        {step === 'cloud-choice' && 'Buat ID baru atau gabung dengan ID yang ada'}
                        {step === 'create-new' && 'Masukkan informasi bayi untuk membuat ID'}
                        {step === 'join-existing' && 'Masukkan ID Bayi untuk melihat data'}
                        {step === 'offline-setup' && 'Data hanya tersimpan di perangkat ini'}
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                    {/* Step: Mode Selection */}
                    {step === 'mode' && (
                        <div className="space-y-3">
                            <button
                                onClick={() => setStep('offline-setup')}
                                className="w-full p-4 rounded-lg border-2 border-muted hover:border-primary/50 transition-all text-left flex items-start gap-4"
                            >
                                <div className="bg-muted p-3 rounded-lg">
                                    <Smartphone className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">Mode Offline</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Data tersimpan hanya di perangkat ini. Tidak perlu internet.
                                    </p>
                                </div>
                            </button>

                            <button
                                onClick={() => setStep('cloud-choice')}
                                className="w-full p-4 rounded-lg border-2 border-muted hover:border-primary/50 transition-all text-left flex items-start gap-4"
                            >
                                <div className="bg-primary/10 p-3 rounded-lg">
                                    <Cloud className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold">Mode Cloud</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Berbagi data dengan keluarga. Sinkronisasi otomatis.
                                    </p>
                                    <div className="flex items-center gap-1 mt-1 text-xs text-primary">
                                        <Users className="h-3 w-3" />
                                        <span>Bagikan ke suami/istri/keluarga</span>
                                    </div>
                                </div>
                            </button>
                        </div>
                    )}

                    {/* Step: Cloud Choice */}
                    {step === 'cloud-choice' && (
                        <div className="space-y-3">
                            <button
                                onClick={() => setStep('create-new')}
                                className="w-full p-4 rounded-lg border-2 border-muted hover:border-primary/50 transition-all text-left"
                            >
                                <h3 className="font-semibold">✨ Buat ID Bayi Baru</h3>
                                <p className="text-sm text-muted-foreground">
                                    Buat ID unik untuk bayi Anda (contoh: BNT4239)
                                </p>
                            </button>

                            <button
                                onClick={() => setStep('join-existing')}
                                className="w-full p-4 rounded-lg border-2 border-muted hover:border-primary/50 transition-all text-left"
                            >
                                <h3 className="font-semibold">🔗 Masuk dengan ID yang Ada</h3>
                                <p className="text-sm text-muted-foreground">
                                    Sudah punya ID? Masukkan untuk melihat data.
                                </p>
                            </button>

                            <Button variant="ghost" className="w-full" onClick={() => setStep('mode')}>
                                ← Kembali
                            </Button>
                        </div>
                    )}

                    {/* Step: Create New */}
                    {step === 'create-new' && !createdBabyId && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="birthDate">Tanggal Lahir Bayi *</Label>
                                <Input
                                    id="birthDate"
                                    type="date"
                                    value={birthDate}
                                    onChange={(e) => setBirthDate(e.target.value)}
                                    max={new Date().toISOString().split('T')[0]}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="babyName">Nama Bayi (opsional)</Label>
                                <Input
                                    id="babyName"
                                    placeholder="Contoh: Andi"
                                    value={babyName}
                                    onChange={(e) => setBabyName(e.target.value)}
                                />
                            </div>

                            <Button
                                className="w-full"
                                onClick={handleCreateNew}
                                disabled={isLoading || !birthDate}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Membuat...
                                    </>
                                ) : (
                                    'Buat ID Bayi'
                                )}
                            </Button>

                            <Button variant="ghost" className="w-full" onClick={() => setStep('cloud-choice')}>
                                ← Kembali
                            </Button>
                        </div>
                    )}

                    {/* Step: Created - Show Baby ID */}
                    {step === 'create-new' && createdBabyId && (
                        <div className="space-y-4 text-center">
                            <div className="bg-primary/10 p-6 rounded-lg">
                                <p className="text-sm text-muted-foreground mb-2">ID Bayi Anda:</p>
                                <div className="flex items-center justify-center gap-2">
                                    <span className="text-3xl font-mono font-bold text-primary">
                                        {createdBabyId}
                                    </span>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={copyBabyId}
                                    >
                                        {copied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
                                    </Button>
                                </div>
                            </div>

                            <p className="text-sm text-muted-foreground">
                                ⚠️ Simpan ID ini! Bagikan ke keluarga agar bisa melihat data bayi yang sama.
                            </p>

                            <Button className="w-full" onClick={handleConfirmCreate}>
                                Mulai Gunakan Aplikasi →
                            </Button>
                        </div>
                    )}

                    {/* Step: Join Existing */}
                    {step === 'join-existing' && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="existingId">ID Bayi</Label>
                                <Input
                                    id="existingId"
                                    placeholder="Contoh: BNT4239"
                                    value={existingBabyId}
                                    onChange={(e) => setExistingBabyId(e.target.value.toUpperCase())}
                                    className="text-center font-mono text-lg uppercase"
                                    maxLength={7}
                                />
                            </div>

                            <Button
                                className="w-full"
                                onClick={handleJoinExisting}
                                disabled={isLoading || !existingBabyId.trim()}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Mencari...
                                    </>
                                ) : (
                                    'Gabung'
                                )}
                            </Button>

                            <Button variant="ghost" className="w-full" onClick={() => setStep('cloud-choice')}>
                                ← Kembali
                            </Button>
                        </div>
                    )}

                    {/* Step: Offline Setup */}
                    {step === 'offline-setup' && (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="birthDateOffline">Tanggal Lahir Bayi *</Label>
                                <Input
                                    id="birthDateOffline"
                                    type="date"
                                    value={birthDate}
                                    onChange={(e) => setBirthDate(e.target.value)}
                                    max={new Date().toISOString().split('T')[0]}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="babyNameOffline">Nama Bayi (opsional)</Label>
                                <Input
                                    id="babyNameOffline"
                                    placeholder="Contoh: Andi"
                                    value={babyName}
                                    onChange={(e) => setBabyName(e.target.value)}
                                />
                            </div>

                            <Button
                                className="w-full"
                                onClick={handleOfflineSetup}
                                disabled={!birthDate}
                            >
                                Mulai →
                            </Button>

                            <Button variant="ghost" className="w-full" onClick={() => setStep('mode')}>
                                ← Kembali
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
