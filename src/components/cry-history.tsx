import { format } from "date-fns";
import { id } from 'date-fns/locale';

import type { CryAnalysis, CryAnalysisResult } from "@/lib/types";
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
import { Trash2, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog";
import { Badge } from "./ui/badge";

interface CryHistoryProps {
  analyses: CryAnalysis[];
  onDelete: (id: string) => void;
}

const reasonLabels: { [key in keyof CryAnalysisResult]: string } = {
  lapar: 'Lapar',
  mengantuk: 'Mengantuk',
  tidakNyaman: 'Tidak Nyaman',
  sakit: 'Sakit',
  bosan: 'Bosan',
};

const getTopReason = (result: CryAnalysisResult): string => {
  const top = Object.entries(result)
    .sort(([, a], [, b]) => b - a)[0];
  return top ? reasonLabels[top[0] as keyof CryAnalysisResult] : "Tidak diketahui";
};


export default function CryHistory({ analyses, onDelete }: CryHistoryProps) {
  return (
    <ScrollArea className="h-[350px] rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Waktu</TableHead>
            <TableHead>Prediksi Utama</TableHead>
            <TableHead className="text-center">Detail</TableHead>
            <TableHead className="text-center">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {analyses.length > 0 ? (
            analyses.map((analysis) => {
              const sortedResults = Object.entries(analysis.result)
                .map(([key, value]) => ({ reason: key as keyof CryAnalysisResult, probability: value }))
                .sort((a, b) => b.probability - a.probability);

              return (
              <TableRow key={analysis.id}>
                <TableCell className="font-medium">
                  {format(new Date(analysis.time), "p, d MMM", { locale: id })}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{getTopReason(analysis.result)}</Badge>
                </TableCell>
                <TableCell className="text-center">
                   <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                           <Info className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Detail Analisis</DialogTitle>
                           <DialogDescription>
                             {format(new Date(analysis.time), "p, d MMMM yyyy", { locale: id })}
                           </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                            {sortedResults.filter(r => r.probability > 0).map(({ reason, probability }) => (
                                <div key={reason} className="flex items-center gap-4">
                                    <span className="w-24 text-sm font-medium text-muted-foreground">{reasonLabels[reason]}</span>
                                    <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                                        <div 
                                            className="bg-primary h-full rounded-full flex items-center justify-end pr-2 text-primary-foreground text-xs"
                                            style={{ width: `${probability}%` }}
                                        >
                                        </div>
                                    </div>
                                    <span className="w-10 text-sm font-bold">{probability}%</span>
                                </div>
                            ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                </TableCell>
                <TableCell className="text-center">
                  <Button variant="ghost" size="icon" onClick={() => onDelete(analysis.id)} aria-label="Hapus">
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
                Belum ada riwayat analisis.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
