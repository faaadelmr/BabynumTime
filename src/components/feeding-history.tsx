import { format } from "date-fns";
import { id } from 'date-fns/locale';
import type { Feeding } from "@/lib/types";
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
import { Droplets, FlaskConical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FeedingHistoryProps {
  feedings: Feeding[];
  onDelete: (id: string) => void;
}

export default function FeedingHistory({ feedings, onDelete }: FeedingHistoryProps) {
  return (
    <ScrollArea className="h-[350px] rounded-md border">
      <Table className="min-w-[500px]">
        <TableHeader>
          <TableRow>
            <TableHead>Waktu</TableHead>
            <TableHead>Jenis</TableHead>
            <TableHead className="text-right">Kuantitas</TableHead>
            <TableHead className="text-center w-[80px]">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {feedings.length > 0 ? (
            feedings.map((feeding) => (
              <TableRow key={feeding.id}>
                <TableCell className="font-medium">
                  {format(new Date(feeding.time), "p, d MMM", { locale: id })}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="flex items-center gap-1.5 w-fit">
                    {feeding.type === 'breast' 
                      ? <Droplets className="h-3 w-3" /> 
                      : <FlaskConical className="h-3 w-3" />
                    }
                    {feeding.type === "breast" ? "ASI" : "Susu Formula"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {feeding.quantity} ml
                </TableCell>
                <TableCell className="text-center">
                  <Button variant="ghost" size="icon" onClick={() => onDelete(feeding.id)} aria-label="Hapus">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={4}
                className="h-24 text-center text-muted-foreground"
              >
                Belum ada catatan pemberian minum.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
