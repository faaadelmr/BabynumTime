import { format } from "date-fns";
import type { Feeding } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Droplets, FlaskConical, History } from "lucide-react";

interface FeedingHistoryProps {
  feedings: Feeding[];
}

export default function FeedingHistory({ feedings }: FeedingHistoryProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl flex items-center gap-2">
            <History className="h-6 w-6" /> Feeding History
        </CardTitle>
        <CardDescription>A log of your baby's recent feedings.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[350px] rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Quantity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {feedings.length > 0 ? (
                feedings.map((feeding) => (
                  <TableRow key={feeding.id}>
                    <TableCell className="font-medium">
                      {format(new Date(feeding.time), "p, MMM d")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="flex items-center gap-1.5 w-fit">
                        {feeding.type === 'breast' 
                          ? <Droplets className="h-3 w-3" /> 
                          : <FlaskConical className="h-3 w-3" />
                        }
                        {feeding.type === "breast" ? "Breast Milk" : "Formula"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {feeding.quantity} ml
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No feedings logged yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
