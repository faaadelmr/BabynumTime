"use client";

import { useState, useMemo } from 'react';
import type { LucideProps } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { format, subDays, isAfter, startOfDay } from 'date-fns';
import { id } from 'date-fns/locale';
import type { DiaperChange } from '@/lib/types';
import { RotateCcw } from 'lucide-react';

interface DiaperProgressCardProps {
    icon: React.ComponentType<LucideProps>;
    title: string;
    totalToday: number;
    totalPoopsThisWeek: number;
    weeklyPoopMin: number;
    weeklyPoopMax: number;
    isClient: boolean;
    className?: string;
    diapers: DiaperChange[];
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-background/95 border rounded-md px-2 py-1 shadow-lg text-xs">
                <p className="font-semibold mb-1">{label}</p>
                {payload.map((item: any, index: number) => (
                    <p key={index} style={{ color: item.color }}>
                        {item.name}: {item.value}x
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

export default function DiaperProgressCard({
    icon: Icon,
    title,
    totalToday,
    totalPoopsThisWeek,
    weeklyPoopMin,
    weeklyPoopMax,
    isClient,
    className,
    diapers,
}: DiaperProgressCardProps) {
    const [isFlipped, setIsFlipped] = useState(false);

    // Get last 7 days diaper data for chart
    const chartData = useMemo(() => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const date = subDays(new Date(), i);
            const dayStart = startOfDay(date);
            const dayEnd = startOfDay(subDays(date, -1));

            const dayDiapers = diapers.filter(d => {
                const diaperTime = new Date(d.time);
                return isAfter(diaperTime, dayStart) && !isAfter(diaperTime, dayEnd);
            });

            const wetCount = dayDiapers.filter(d => d.type === 'basah').length;
            const dirtyCount = dayDiapers.filter(d => d.type === 'kotor' || d.type === 'keduanya').length;

            days.push({
                day: format(date, 'EEE', { locale: id }),
                fullDate: format(date, 'd MMM', { locale: id }),
                Pipis: wetCount + dayDiapers.filter(d => d.type === 'keduanya').length,
                BAB: dirtyCount,
                total: dayDiapers.length,
                isToday: i === 0,
            });
        }
        return days;
    }, [diapers]);

    return (
        <div
            className={cn("perspective-1000 cursor-pointer", className)}
            style={{ perspective: '1000px' }}
            onClick={() => setIsFlipped(!isFlipped)}
        >
            <div
                className={cn(
                    "relative transition-transform duration-500 preserve-3d",
                    isFlipped && "rotate-y-180"
                )}
                style={{
                    transformStyle: 'preserve-3d',
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                }}
            >
                {/* Front Side - Stats */}
                <Card
                    className="shadow-sm backface-hidden h-full"
                    style={{ backfaceVisibility: 'hidden' }}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">{title}</CardTitle>
                        <Icon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold font-headline">
                            {isClient ? `${totalToday}x hari ini` : 'Memuat...'}
                        </div>
                        {isClient && (
                            <p className="text-xs text-muted-foreground">
                                BAB minggu ini: {totalPoopsThisWeek}x (Rek. {weeklyPoopMin}-{weeklyPoopMax}x)
                            </p>
                        )}
                        <p className="text-[10px] text-muted-foreground mt-1">Tap untuk grafik →</p>
                    </CardContent>
                </Card>

                {/* Back Side - Line Chart */}
                <Card
                    className="shadow-sm absolute inset-0 backface-hidden rotate-y-180"
                    style={{
                        backfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)',
                    }}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3">
                        <CardTitle className="text-xs font-medium">Popok 7 Hari</CardTitle>
                        <RotateCcw className="h-3 w-3 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="pb-2 pt-0">
                        <div className="h-[75px] w-full">
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
                                        allowDecimals={false}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Line
                                        type="monotone"
                                        dataKey="Pipis"
                                        stroke="#60a5fa"
                                        strokeWidth={2}
                                        dot={{ fill: '#60a5fa', strokeWidth: 0, r: 2.5 }}
                                        activeDot={{ r: 4, fill: '#3b82f6' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="BAB"
                                        stroke="#f59e0b"
                                        strokeWidth={2}
                                        dot={{ fill: '#f59e0b', strokeWidth: 0, r: 2.5 }}
                                        activeDot={{ r: 4, fill: '#d97706' }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex justify-center gap-4 text-[9px] text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-0.5 bg-blue-400 rounded"></span> Pipis
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="w-2 h-0.5 bg-amber-500 rounded"></span> BAB
                            </span>
                            <span className="font-medium">Hari ini: {totalToday}x</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
