import { format } from "date-fns";
import { id } from 'date-fns/locale';
import Image from 'next/image';
import { Camera, Trash2 } from "lucide-react";

import type { Poop } from "@/lib/types";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PoopHistoryProps {
  poops: Poop[];
  onDelete: (id: string) => void;
}

export default function PoopHistory({ poops, onDelete }: PoopHistoryProps) {
  return (
    <ScrollArea className="h-[350px] rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Waktu</TableHead>
            <TableHead>Jenis</TableHead>
            <TableHead>Catatan</TableHead>
            <TableHead className="text-center">Gambar</TableHead>
            <TableHead className="text-center">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {poops.length > 0 ? (
            poops.map((poop) => (
              <TableRow key={poop.id}>
                <TableCell className="font-medium">
                  {format(new Date(poop.time), "p, d MMM", { locale: id })}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="capitalize">
                    {poop.type}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-[150px] truncate">
                  {poop.notes || "-"}
                </TableCell>
                <TableCell className="text-center">
                  {poop.image ? (
                    <Dialog>
                      <DialogTrigger asChild>
                        <button className="text-primary hover:underline flex items-center gap-1 justify-center mx-auto">
                          <Camera className="h-4 w-4" />
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Gambar Eek</DialogTitle>
                        </DialogHeader>
                        <div className="relative aspect-square mt-4">
                           <Image src={poop.image} alt="Gambar eek" layout="fill" objectFit="contain" />
                        </div>
                      </DialogContent>
                    </Dialog>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <Button variant="ghost" size="icon" onClick={() => onDelete(poop.id)} aria-label="Hapus">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={5}
                className="h-24 text-center text-muted-foreground"
              >
                Belum ada catatan eek.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
