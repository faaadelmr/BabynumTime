"use client";

import { useState, useRef } from 'react';
import { Droplet, CircleDot, Layers, Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import type { DiaperChange } from '@/lib/types';

interface DiaperFormProps {
    onAddDiaper: (diaper: Omit<DiaperChange, 'id' | 'time'> & { time: Date }) => void;
}

const diaperTypes: { value: DiaperChange['type']; label: string; icon: React.ReactNode; description: string }[] = [
    { value: 'basah', label: 'Basah', icon: <Droplet className="h-5 w-5" />, description: 'Hanya pipis' },
    { value: 'kotor', label: 'BAB', icon: <CircleDot className="h-5 w-5" />, description: 'Hanya BAB' },
    { value: 'keduanya', label: 'Keduanya', icon: <Layers className="h-5 w-5" />, description: 'Pipis + BAB' },
];

const poopTypes: { value: NonNullable<DiaperChange['poopType']>; label: string }[] = [
    { value: 'biasa', label: 'Normal' },
    { value: 'cair', label: 'Cair' },
    { value: 'keras', label: 'Keras' },
];

export default function DiaperForm({ onAddDiaper }: DiaperFormProps) {
    const { toast } = useToast();
    const [selectedType, setSelectedType] = useState<DiaperChange['type']>('basah');
    const [poopType, setPoopType] = useState<DiaperChange['poopType']>('biasa');
    const [notes, setNotes] = useState('');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const showPoopOptions = selectedType === 'kotor' || selectedType === 'keduanya';

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                toast({
                    variant: 'destructive',
                    title: 'File terlalu besar',
                    description: 'Maksimal ukuran gambar adalah 5MB.',
                });
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        onAddDiaper({
            type: selectedType,
            poopType: showPoopOptions ? poopType : undefined,
            notes: notes.trim() || undefined,
            image: showPoopOptions ? imagePreview || undefined : undefined,
            time: new Date(),
        });

        const typeLabel = diaperTypes.find(t => t.value === selectedType)?.label || selectedType;
        toast({
            title: 'Pergantian Popok Dicatat!',
            description: `Popok ${typeLabel} telah dicatat.`,
        });

        // Reset form
        setSelectedType('basah');
        setPoopType('biasa');
        setNotes('');
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Diaper Type Selection */}
            <div className="space-y-2">
                <Label>Jenis Popok</Label>
                <div className="grid grid-cols-3 gap-2">
                    {diaperTypes.map((type) => (
                        <button
                            key={type.value}
                            type="button"
                            onClick={() => setSelectedType(type.value)}
                            className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${selectedType === type.value
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

            {/* Poop Type Selection (shown when BAB selected) */}
            {showPoopOptions && (
                <div className="space-y-2">
                    <Label>Jenis BAB</Label>
                    <div className="grid grid-cols-3 gap-2">
                        {poopTypes.map((type) => (
                            <button
                                key={type.value}
                                type="button"
                                onClick={() => setPoopType(type.value)}
                                className={`p-3 rounded-lg border-2 transition-all text-sm font-medium ${poopType === type.value
                                        ? 'border-primary bg-primary/10 text-primary'
                                        : 'border-muted hover:border-primary/50'
                                    }`}
                            >
                                {type.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Image Upload (shown when BAB selected) */}
            {showPoopOptions && (
                <div className="space-y-2">
                    <Label>Foto BAB (opsional)</Label>
                    <div className="flex flex-col items-center gap-3">
                        {imagePreview ? (
                            <div className="relative w-full max-w-[200px]">
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
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Camera className="h-4 w-4 mr-2" />
                                Ambil Foto
                            </Button>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleImageChange}
                            className="hidden"
                        />
                    </div>
                </div>
            )}

            {/* Notes (optional) */}
            <div className="space-y-2">
                <Label htmlFor="diaper-notes">Catatan (opsional)</Label>
                <Textarea
                    id="diaper-notes"
                    placeholder="Contoh: ruam popok, warna tidak biasa, dll..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                />
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full">
                Catat Pergantian Popok
            </Button>
        </form>
    );
}
