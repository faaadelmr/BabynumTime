"use client";

import { useState, useRef } from 'react';
import { Droplet, CircleDot, Layers, Camera, X, Sparkles, AlertTriangle, Loader2, CheckCircle, PenLine, Bot, ImagePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import type { DiaperChange, PoopAIAnalysis } from '@/lib/types';
import { analyzePoopWithAI } from '@/ai/flows/analyze-poop-flow';
import { format } from 'date-fns';

interface DiaperFormProps {
    onAddDiaper: (diaper: Omit<DiaperChange, 'id' | 'time'> & { time: Date }) => void;
    babyAgeInMonths: number;
}

const diaperTypes: { value: DiaperChange['type']; label: string; icon: React.ReactNode; description: string }[] = [
    { value: 'basah', label: 'Basah', icon: <Droplet className="h-5 w-5" />, description: 'Hanya pipis' },
    { value: 'kotor', label: 'BAB', icon: <CircleDot className="h-5 w-5" />, description: 'Hanya BAB' },
    { value: 'keduanya', label: 'Keduanya', icon: <Layers className="h-5 w-5" />, description: 'Pipis + BAB' },
];

const colorOptions = [
    { value: 'kuning', label: 'Kuning' },
    { value: 'kuning_keemasan', label: 'Kuning Keemasan' },
    { value: 'hijau', label: 'Hijau' },
    { value: 'coklat', label: 'Coklat' },
    { value: 'hitam', label: 'Hitam' },
    { value: 'merah', label: 'Merah/Berdarah' },
    { value: 'putih', label: 'Putih/Pucat' },
];

const textureOptions = [
    { value: 'lembek', label: 'Lembek' },
    { value: 'berbiji', label: 'Berbiji' },
    { value: 'cair', label: 'Cair/Encer' },
    { value: 'keras', label: 'Keras' },
    { value: 'padat', label: 'Padat' },
    { value: 'berlendir', label: 'Berlendir' },
];

type InputMode = 'manual' | 'ai';

export default function DiaperForm({ onAddDiaper, babyAgeInMonths }: DiaperFormProps) {
    const { toast } = useToast();
    const [selectedType, setSelectedType] = useState<DiaperChange['type']>('basah');
    const [inputMode, setInputMode] = useState<InputMode>('manual');

    // Manual input
    const [manualColor, setManualColor] = useState('kuning');
    const [manualTexture, setManualTexture] = useState('lembek');
    const [notes, setNotes] = useState('');

    // AI Analysis
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [aiAnalysis, setAiAnalysis] = useState<PoopAIAnalysis | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Custom time
    const [showCustomTime, setShowCustomTime] = useState(false);
    const [customTime, setCustomTime] = useState<Date>(new Date());

    const showPoopOptions = selectedType === 'kotor' || selectedType === 'keduanya';

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast({
                    variant: 'destructive',
                    title: 'File terlalu besar',
                    description: 'Maksimal ukuran gambar adalah 5MB.',
                });
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setImagePreview(result);
                // Auto-start AI analysis when image is captured
                startAIAnalysis(result);
            };
            reader.readAsDataURL(file);
        }
    };

    const startAIAnalysis = async (imageData: string) => {
        setIsAnalyzing(true);
        setAiAnalysis(null);
        try {
            const result = await analyzePoopWithAI(imageData, babyAgeInMonths);

            if (result.success && result.data) {
                setAiAnalysis(result.data);
                toast({
                    title: 'Analisis Selesai!',
                    description: result.data.isNormal ? 'Feses bayi terlihat normal.' : 'Ada catatan penting untuk diperhatikan.',
                });
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Gagal Menganalisis',
                    description: result.message || 'Silakan coba lagi atau gunakan mode manual.',
                });
            }
        } catch {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Terjadi kesalahan. Silakan coba lagi.',
            });
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Check if manual input indicates warning
    const isManualWarning = manualColor === 'putih' || manualColor === 'merah' || manualColor === 'hitam';

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        let poopType: DiaperChange['poopType'] = 'biasa';
        if (showPoopOptions) {
            if (inputMode === 'manual') {
                if (manualTexture === 'cair') poopType = 'cair';
                else if (manualTexture === 'keras' || manualTexture === 'padat') poopType = 'keras';
            } else if (aiAnalysis) {
                const consistency = aiAnalysis.consistency.toLowerCase();
                if (consistency.includes('cair') || consistency.includes('encer')) poopType = 'cair';
                else if (consistency.includes('keras') || consistency.includes('padat')) poopType = 'keras';
            }
        }

        // Build manual analysis if in manual mode with BAB
        let finalAiAnalysis: PoopAIAnalysis | undefined;
        if (showPoopOptions && inputMode === 'manual') {
            const colorLabel = colorOptions.find(c => c.value === manualColor)?.label || manualColor;
            const textureLabel = textureOptions.find(t => t.value === manualTexture)?.label || manualTexture;

            finalAiAnalysis = {
                color: colorLabel,
                consistency: textureLabel,
                isNormal: !isManualWarning,
                description: `Feses berwarna ${colorLabel.toLowerCase()} dengan tekstur ${textureLabel.toLowerCase()}.`,
                warning: isManualWarning ? 'Warna feses tidak normal. Segera konsultasikan ke dokter.' : undefined,
                advice: isManualWarning
                    ? 'Segera bawa bayi ke dokter atau fasilitas kesehatan terdekat.'
                    : 'Lanjutkan pemantauan rutin.',
            };
        } else if (showPoopOptions && aiAnalysis) {
            finalAiAnalysis = aiAnalysis;
        }

        onAddDiaper({
            type: selectedType,
            poopType: showPoopOptions ? poopType : undefined,
            notes: notes.trim() || undefined,
            image: showPoopOptions && imagePreview ? imagePreview : undefined,
            aiAnalysis: finalAiAnalysis,
            time: showCustomTime ? customTime : new Date(),
        });

        const typeLabel = diaperTypes.find(t => t.value === selectedType)?.label || selectedType;
        toast({
            title: 'Pergantian Popok Dicatat!',
            description: `Popok ${typeLabel} telah dicatat.`,
        });

        // Reset form
        resetForm();
    };

    const resetForm = () => {
        setSelectedType('basah');
        setInputMode('manual');
        setManualColor('kuning');
        setManualTexture('lembek');
        setNotes('');
        setImagePreview(null);
        setAiAnalysis(null);
        setShowCustomTime(false);
        setCustomTime(new Date());
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Diaper Type Selection */}
            <div className="space-y-2">
                <Label>Jenis Popok</Label>
                <div className="grid grid-cols-3 gap-2">
                    {diaperTypes.map((type) => (
                        <button
                            key={type.value}
                            type="button"
                            onClick={() => {
                                setSelectedType(type.value);
                                if (type.value === 'basah') {
                                    setAiAnalysis(null);
                                    setImagePreview(null);
                                }
                            }}
                            className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${selectedType === type.value
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-muted hover:border-primary/50'
                                }`}
                        >
                            {type.icon}
                            <span className="font-medium text-sm">{type.label}</span>
                            <span className="text-xs text-muted-foreground">{type.description}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Input Mode Selection (shown when BAB selected) */}
            {showPoopOptions && (
                <div className="space-y-2">
                    <Label>Cara Input BAB</Label>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                setInputMode('manual');
                                setImagePreview(null);
                                setAiAnalysis(null);
                            }}
                            className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${inputMode === 'manual'
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-muted hover:border-primary/50'
                                }`}
                        >
                            <PenLine className="h-4 w-4" />
                            <span className="font-medium text-sm">Catat Manual</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setInputMode('ai')}
                            className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${inputMode === 'ai'
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-muted hover:border-primary/50'
                                }`}
                        >
                            <Bot className="h-4 w-4" />
                            <span className="font-medium text-sm">Analisis AI</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Manual Input Mode */}
            {showPoopOptions && inputMode === 'manual' && (
                <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                    {/* Color Selection */}
                    <div className="space-y-2">
                        <Label>Warna Feses</Label>
                        <div className="grid grid-cols-4 gap-1.5">
                            {colorOptions.map((color) => {
                                const isWarningColor = color.value === 'putih' || color.value === 'merah' || color.value === 'hitam';
                                return (
                                    <button
                                        key={color.value}
                                        type="button"
                                        onClick={() => setManualColor(color.value)}
                                        className={`p-2 rounded-md border text-xs font-medium transition-all ${manualColor === color.value
                                            ? isWarningColor
                                                ? 'border-destructive bg-destructive/10 text-destructive'
                                                : 'border-primary bg-primary/10 text-primary'
                                            : 'border-muted hover:border-primary/50'
                                            }`}
                                    >
                                        {color.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Texture Selection */}
                    <div className="space-y-2">
                        <Label>Tekstur Feses</Label>
                        <div className="grid grid-cols-3 gap-1.5">
                            {textureOptions.map((texture) => (
                                <button
                                    key={texture.value}
                                    type="button"
                                    onClick={() => setManualTexture(texture.value)}
                                    className={`p-2 rounded-md border text-xs font-medium transition-all ${manualTexture === texture.value
                                        ? 'border-primary bg-primary/10 text-primary'
                                        : 'border-muted hover:border-primary/50'
                                        }`}
                                >
                                    {texture.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Warning for abnormal colors */}
                    {isManualWarning && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Perhatian!</AlertTitle>
                            <AlertDescription>
                                Warna feses ini tidak normal. Segera konsultasikan ke dokter atau fasilitas kesehatan terdekat.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Image Upload for Manual Mode */}
                    <div className="space-y-2">
                        <Label>Foto BAB (opsional)</Label>
                        <div className="flex flex-col items-center gap-3">
                            {imagePreview ? (
                                <div className="relative w-full max-w-[180px]">
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="w-full h-auto rounded-lg border"
                                    />
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="absolute -top-2 -right-2 h-6 w-6"
                                        onClick={() => {
                                            setImagePreview(null);
                                            if (fileInputRef.current) fileInputRef.current.value = '';
                                        }}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="w-full flex gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => {
                                            if (fileInputRef.current) {
                                                fileInputRef.current.removeAttribute('capture');
                                                fileInputRef.current.click();
                                            }
                                        }}
                                    >
                                        <ImagePlus className="h-4 w-4 mr-1" />
                                        Galeri
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => {
                                            if (fileInputRef.current) {
                                                fileInputRef.current.setAttribute('capture', 'environment');
                                                fileInputRef.current.click();
                                            }
                                        }}
                                    >
                                        <Camera className="h-4 w-4 mr-1" />
                                        Kamera
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* AI Analysis Mode */}
            {showPoopOptions && inputMode === 'ai' && (
                <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                    <div className="flex flex-col items-center gap-3">
                        {imagePreview ? (
                            <div className="relative w-full max-w-[180px]">
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="w-full h-auto rounded-lg border"
                                />
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute -top-2 -right-2 h-6 w-6"
                                    onClick={() => {
                                        setImagePreview(null);
                                        setAiAnalysis(null);
                                        if (fileInputRef.current) fileInputRef.current.value = '';
                                    }}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                            <div className="w-full space-y-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => {
                                        // Remove capture to allow gallery selection
                                        if (fileInputRef.current) {
                                            fileInputRef.current.removeAttribute('capture');
                                            fileInputRef.current.click();
                                        }
                                    }}
                                >
                                    <ImagePlus className="h-4 w-4 mr-2" />
                                    Pilih dari Galeri
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => {
                                        if (fileInputRef.current) {
                                            fileInputRef.current.setAttribute('capture', 'environment');
                                            fileInputRef.current.click();
                                        }
                                    }}
                                >
                                    <Camera className="h-4 w-4 mr-2" />
                                    Ambil Foto
                                </Button>
                            </div>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                        />
                    </div>

                    {/* Loading State */}
                    {isAnalyzing && (
                        <div className="flex items-center justify-center gap-2 py-4">
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            <span className="text-sm text-muted-foreground">Menganalisis foto...</span>
                        </div>
                    )}

                    {/* AI Analysis Result */}
                    {aiAnalysis && !isAnalyzing && (
                        <div className="space-y-3">
                            {aiAnalysis.warning && (
                                <Alert variant="destructive">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertTitle>Perhatian!</AlertTitle>
                                    <AlertDescription>{aiAnalysis.warning}</AlertDescription>
                                </Alert>
                            )}

                            <div className={`p-3 rounded-lg border ${aiAnalysis.isNormal ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    {aiAnalysis.isNormal ? (
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                    ) : (
                                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                    )}
                                    <span className="font-semibold text-sm">
                                        {aiAnalysis.isNormal ? 'Feses Normal' : 'Perlu Perhatian'}
                                    </span>
                                </div>

                                <div className="space-y-1.5 text-sm">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <span className="text-muted-foreground text-xs">Warna:</span>
                                            <p className="font-medium">{aiAnalysis.color}</p>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground text-xs">Tekstur:</span>
                                            <p className="font-medium">{aiAnalysis.consistency}</p>
                                        </div>
                                    </div>

                                    <div>
                                        <span className="text-muted-foreground text-xs">Deskripsi:</span>
                                        <p className="text-xs">{aiAnalysis.description}</p>
                                    </div>

                                    <div className="pt-1.5 border-t">
                                        <span className="text-muted-foreground text-xs">💡 Saran:</span>
                                        <p className="font-medium text-xs">{aiAnalysis.advice}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Custom Time Option */}
            <div className="space-y-3">
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="custom-time-diaper"
                        checked={showCustomTime}
                        onCheckedChange={(checked) => {
                            setShowCustomTime(!!checked);
                            if (!checked) {
                                setCustomTime(new Date());
                            }
                        }}
                    />
                    <label
                        htmlFor="custom-time-diaper"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                        Atur waktu & tanggal secara manual
                    </label>
                </div>
                {showCustomTime && (
                    <Input
                        type="datetime-local"
                        value={format(customTime, "yyyy-MM-dd'T'HH:mm")}
                        onChange={(e) => setCustomTime(new Date(e.target.value))}
                    />
                )}
            </div>

            {/* Notes (optional) */}
            <div className="space-y-2">
                <Label htmlFor="diaper-notes">Catatan Tambahan (opsional)</Label>
                <Textarea
                    id="diaper-notes"
                    placeholder="Contoh: ruam popok, bau tidak biasa, dll..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                />
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full" disabled={isAnalyzing}>
                Catat Pergantian Popok
            </Button>
        </form>
    );
}
