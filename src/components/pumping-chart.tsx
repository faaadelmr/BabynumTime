"use client";

import { useMemo } from "react";
import { format, subDays, isSameDay } from "date-fns";
import { id } from 'date-fns/locale';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PumpingSession } from "@/lib/types";

interface PumpingChartProps {
  sessions: PumpingSession[];
}

export default function PumpingChart({ sessions }: PumpingChartProps) {
  const data = useMemo(() => {
    const today = new Date();
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(today, 6 - i);
      return {
        date,
        label: format(date, "EEE", { locale: id }), // Mon, Tue, etc.
        fullDate: format(date, "d MMM yyyy", { locale: id }),
        volume: 0,
      };
    });

    sessions.forEach(session => {
      const sessionDate = new Date(session.time);
      const dayData = last7Days.find(d => isSameDay(d.date, sessionDate));
      if (dayData) {
        dayData.volume += session.volume;
      }
    });

    return last7Days;
  }, [sessions]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-6"
    >
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Grafik Volume Pumping (7 Hari Terakhir)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="label" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `${value}`} 
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(236, 72, 153, 0.1)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const dataPoint = payload[0].payload;
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="grid grid-cols-2 gap-2">
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] uppercase text-muted-foreground">
                                {dataPoint.fullDate}
                              </span>
                              <span className="font-bold text-muted-foreground">
                                {payload[0].value} ml
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Bar 
                  dataKey="volume" 
                  fill="#ec4899" 
                  radius={[4, 4, 0, 0]} 
                  animationDuration={1500}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
