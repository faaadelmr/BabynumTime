"use client";

import { format } from "date-fns";
import { id } from 'date-fns/locale';
import { Droplet, CircleDot, Layers, Trash2, Image as ImageIcon } from "lucide-react";
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
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

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
                                                        onClick={() => setSelectedImage(diaper.image || null)}
                                                    >
                                                        <ImageIcon className="h-4 w-4 text-primary" />
                                                    </Button>
                                                )}
                                                <span className="text-muted-foreground text-sm max-w-[100px] truncate">
                                                    {diaper.notes || '-'}
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

            {/* Image Preview Dialog */}
            <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Foto BAB</DialogTitle>
                    </DialogHeader>
                    {selectedImage && (
                        <img
                            src={selectedImage}
                            alt="BAB"
                            className="w-full h-auto rounded-lg"
                        />
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
