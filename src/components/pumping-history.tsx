"use client";

import { format } from "date-fns";
import { id } from 'date-fns/locale';
import { motion, AnimatePresence } from "framer-motion";
import type { PumpingSession } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Milk, Timer, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PumpingHistoryProps {
  sessions: PumpingSession[];
  onDelete: (id: string) => void;
}

const MotionTableRow = motion(TableRow);

export default function PumpingHistory({ sessions, onDelete }: PumpingHistoryProps) {
  return (
    <ScrollArea className="h-[350px] rounded-md border">
      <Table className="w-full">
        <TableHeader>
          <TableRow>
            <TableHead>Waktu</TableHead>
            <TableHead className="hidden sm:table-cell">Sisi</TableHead>
            <TableHead className="text-right">Volume</TableHead>
            <TableHead className="hidden sm:table-cell text-right">Durasi</TableHead>
            <TableHead className="text-center w-[60px]">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <AnimatePresence mode="popLayout" initial={false}>
            {sessions.length > 0 ? (
              sessions.map((session) => (
                <MotionTableRow
                  key={session.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2 }}
                >
                  <TableCell className="font-medium whitespace-nowrap">
                    {format(new Date(session.time), "p, d MMM", { locale: id })}
                    <div className="sm:hidden text-xs text-muted-foreground mt-1">
                      {session.side === 'both' ? 'Kiri & Kanan' : session.side === 'left' ? 'Kiri' : 'Kanan'}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="secondary" className="w-fit">
                      {session.side === 'both' ? 'Kiri & Kanan' : session.side === 'left' ? 'Kiri' : 'Kanan'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Milk className="h-3 w-3 text-pink-500" />
                      {session.volume}
                      <span className="text-xs text-muted-foreground ml-0.5">ml</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-right">
                    {session.duration ? (
                        <div className="flex items-center justify-end gap-1 text-muted-foreground">
                            <Timer className="h-3 w-3" />
                            {session.duration} m
                        </div>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="icon" onClick={() => onDelete(session.id)} aria-label="Hapus">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </MotionTableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground"
                >
                  Belum ada catatan pumping ASI.
                </TableCell>
              </TableRow>
            )}
          </AnimatePresence>
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
