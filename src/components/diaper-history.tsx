"use client";

import { format } from "date-fns";
import { id } from 'date-fns/locale';
import { Droplet, CircleDot, Layers, Trash2, Image as ImageIcon, Sparkles, AlertTriangle, CheckCircle } from "lucide-react";
import { useState } from "react";

import type { DiaperChange } from "@/lib/types";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "./ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface DiaperHistoryProps {
    diapers: DiaperChange[];
    onDelete: (id: string) => void;
}

const typeConfig: Record<DiaperChange['type'], { label: string; icon: React.ReactNode; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    basah: { label: 'Basah', icon: <Droplet className="h-3 w-3" />, variant: 'secondary' },
    kotor: { label: 'BAB', icon: <CircleDot className="h-3 w-3" />, variant: 'default' },
    keduanya: { label: 'Keduanya', icon: <Layers className="h-3 w-3" />, variant: 'outline' },
};

const poopTypeLabels: Record<NonNullable<DiaperChange['poopType']>, string> = {
    biasa: 'Normal',
    cair: 'Cair',
    keras: 'Keras',
};

export default function DiaperHistory({ diapers, onDelete }: DiaperHistoryProps) {
    const [selectedDiaper, setSelectedDiaper] = useState<DiaperChange | null>(null);

    return (
        <>
            <ScrollArea className="h-[350px] rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Waktu</TableHead>
                            <TableHead>Jenis</TableHead>
                            <TableHead>Detail</TableHead>
                            <TableHead className="text-center">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {diapers.length > 0 ? (
                            diapers.map((diaper) => {
                                const config = typeConfig[diaper.type];
                                const showPoopDetails = diaper.type === 'kotor' || diaper.type === 'keduanya';
                                const hasAIAnalysis = !!diaper.aiAnalysis;
                                return (
                                    <TableRow key={diaper.id}>
                                        <TableCell className="font-medium">
                                            {format(new Date(diaper.time), "p, d MMM", { locale: id })}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
                                                    {config.icon}
                                                    <span>{config.label}</span>
                                                </Badge>
                                                {showPoopDetails && diaper.poopType && (
                                                    <span className="text-xs text-muted-foreground">
                                                        BAB: {poopTypeLabels[diaper.poopType]}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {diaper.image && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="p-1 h-auto"
                                                        onClick={() => setSelectedDiaper(diaper)}
                                                    >
                                                        <ImageIcon className="h-4 w-4 text-primary" />
                                                    </Button>
                                                )}
                                                {hasAIAnalysis && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="p-1 h-auto"
                                                        onClick={() => setSelectedDiaper(diaper)}
                                                    >
                                                        {diaper.aiAnalysis?.isNormal ? (
                                                            <Sparkles className="h-4 w-4 text-green-600" />
                                                        ) : (
                                                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                                        )}
                                                    </Button>
                                                )}
                                                <span className="text-muted-foreground text-sm max-w-[80px] truncate">
                                                    {diaper.notes || (hasAIAnalysis ? diaper.aiAnalysis?.color : '-')}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Button variant="ghost" size="icon" onClick={() => onDelete(diaper.id)} aria-label="Hapus">
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={4}
                                    className="h-24 text-center text-muted-foreground"
                                >
                                    Belum ada riwayat pergantian popok.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </ScrollArea>

            {/* Detail Dialog with Image and AI Analysis */}
            <Dialog open={!!selectedDiaper} onOpenChange={() => setSelectedDiaper(null)}>
                <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            Detail Popok
                            {selectedDiaper?.aiAnalysis && (
                                selectedDiaper.aiAnalysis.isNormal ? (
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                ) : (
                                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                                )
                            )}
                        </DialogTitle>
                    </DialogHeader>

                    {selectedDiaper && (
                        <div className="space-y-4">
                            {/* Timestamp */}
                            <p className="text-sm text-muted-foreground">
                                {format(new Date(selectedDiaper.time), "EEEE, d MMMM yyyy 'pukul' HH:mm", { locale: id })}
                            </p>

                            {/* Image */}
                            {selectedDiaper.image && (
                                <img
                                    src={selectedDiaper.image}
                                    alt="Foto BAB"
                                    className="w-full h-auto rounded-lg border"
                                />
                            )}

                            {/* AI Analysis */}
                            {selectedDiaper.aiAnalysis && (
                                <div className="space-y-3">
                                    {/* Warning Alert if not normal */}
                                    {selectedDiaper.aiAnalysis.warning && (
                                        <Alert variant="destructive">
                                            <AlertTriangle className="h-4 w-4" />
                                            <AlertTitle>Perhatian!</AlertTitle>
                                            <AlertDescription>{selectedDiaper.aiAnalysis.warning}</AlertDescription>
                                        </Alert>
                                    )}

                                    {/* Analysis Details */}
                                    <div className={`p-4 rounded-lg border ${selectedDiaper.aiAnalysis.isNormal ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                                        <div className="flex items-center gap-2 mb-3">
                                            <Sparkles className="h-5 w-5 text-primary" />
                                            <span className="font-semibold">Analisis AI</span>
                                        </div>

                                        <div className="space-y-2 text-sm">
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <span className="text-muted-foreground">Warna:</span>
                                                    <p className="font-medium">{selectedDiaper.aiAnalysis.color}</p>
                                                </div>
                                                <div>
                                                    <span className="text-muted-foreground">Tekstur:</span>
                                                    <p className="font-medium">{selectedDiaper.aiAnalysis.consistency}</p>
                                                </div>
                                            </div>

                                            <div>
                                                <span className="text-muted-foreground">Deskripsi:</span>
                                                <p>{selectedDiaper.aiAnalysis.description}</p>
                                            </div>

                                            <div className="pt-2 border-t">
                                                <span className="text-muted-foreground">💡 Saran:</span>
                                                <p className="font-medium">{selectedDiaper.aiAnalysis.advice}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Notes */}
                            {selectedDiaper.notes && (
                                <div>
                                    <span className="text-sm text-muted-foreground">Catatan:</span>
                                    <p className="text-sm">{selectedDiaper.notes}</p>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
