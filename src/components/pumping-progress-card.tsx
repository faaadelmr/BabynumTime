"use client";

import { useState, useMemo } from 'react';
import type { LucideProps } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { PumpingSession } from '@/lib/types';
import { format, isToday, subDays, startOfDay, isAfter } from 'date-fns';
import { id } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { RotateCcw } from 'lucide-react';

interface PumpingProgressCardProps {
    icon: React.ComponentType<LucideProps>;
    title: string;
    sessions: PumpingSession[];
    className?: string;
    isClient: boolean;
}

export default function PumpingProgressCard({
    icon: Icon,
    title,
    sessions,
    className,
    isClient,
}: PumpingProgressCardProps) {
    const [isFlipped, setIsFlipped] = useState(false);
    
    // Stats calculation
    const todaySessions = useMemo(() => sessions.filter(s => isToday(new Date(s.time))), [sessions]);
    const totalVolumeToday = useMemo(() => todaySessions.reduce((sum, s) => sum + s.volume, 0), [todaySessions]);
    const lastSession = sessions[0]; // Assuming sorted

    // Get last 7 days pumping data for chart
    const chartData = useMemo(() => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const date = subDays(new Date(), i);
            const dayStart = startOfDay(date);
            const dayEnd = startOfDay(subDays(date, -1));

            const dayTotal = sessions
                .filter(s => {
                    const sessionTime = new Date(s.time);
                    return isAfter(sessionTime, dayStart) && !isAfter(sessionTime, dayEnd);
                })
                .reduce((sum, s) => sum + s.volume, 0);

            days.push({
                day: format(date, 'EEE', { locale: id }),
                fullDate: format(date, 'd MMM', { locale: id }),
                total: dayTotal,
                isToday: i === 0,
            });
        }
        return days;
    }, [sessions]);

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-background/95 border border-border p-2 rounded-lg shadow-lg text-xs">
                    <p className="font-medium">{payload[0].payload.fullDate}</p>
                    <p className="text-pink-600">
                        Total: {payload[0].value} ml
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div 
            className={cn("perspective-1000 cursor-pointer", className)}
            onClick={() => setIsFlipped(!isFlipped)}
        >
             <div
                className={cn(
                    "relative transition-transform duration-500 preserve-3d h-full",
                    isFlipped && "rotate-y-180"
                )}
                style={{
                    transformStyle: 'preserve-3d',
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}
            >
                {/* Front Side - Stats */}
                <Card 
                    className="shadow-sm relative overflow-hidden h-full border-pink-200 backface-hidden"
                    style={{ backfaceVisibility: 'hidden' }}
                >
                    {/* Background Decoration */}
                    <div className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none">
                        <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-pink-400 blur-xl" />
                        <div className="absolute -left-4 -bottom-4 w-20 h-20 rounded-full bg-pink-300 blur-xl" />
                    </div>

                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium drop-shadow-sm text-pink-700">{title}</CardTitle>
                        <Icon className="h-4 w-4 text-pink-500 drop-shadow-sm" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-headline drop-shadow-sm text-pink-900">
                            {totalVolumeToday} ml
                        </div>
                        {isClient && (
                            <div className="space-y-1 mt-1">
                                 <p className="text-xs text-muted-foreground">
                                    Total Hari Ini ({todaySessions.length} sesi)
                                </p>
                                {lastSession && (
                                    <p className="text-[10px] text-pink-600 font-medium pt-1 border-t border-pink-100 mt-2">
                                        Terakhir: {format(new Date(lastSession.time), "HH:mm", { locale: id })} ({lastSession.volume} ml)
                                    </p>
                                )}
                                <p className="text-[10px] text-muted-foreground mt-1">Tap untuk grafik →</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Back Side - Line Chart */}
                <Card
                    className="shadow-sm absolute inset-0 backface-hidden rotate-y-180 border-pink-200"
                    style={{
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                    }}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3">
                        <CardTitle className="text-xs font-medium text-pink-700">Pumping 7 Hari</CardTitle>
                        <RotateCcw className="h-3 w-3 text-pink-500" />
                    </CardHeader>
                    <CardContent className="pb-2 pt-0">
                        <div className="h-[85px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                                    <XAxis
                                        dataKey="day"
                                        tick={{ fontSize: 9 }}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 8 }}
                                        tickLine={false}
                                        axisLine={false}
                                        width={30}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Line
                                        type="monotone"
                                        dataKey="total"
                                        stroke="#ec4899"
                                        strokeWidth={2}
                                        dot={{ fill: '#ec4899', strokeWidth: 0, r: 3 }}
                                        activeDot={{ r: 5, fill: '#db2777' }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex justify-between items-center text-[9px] text-muted-foreground px-1">
                            <span className="font-medium text-pink-600">Hari ini: {totalVolumeToday}ml</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
