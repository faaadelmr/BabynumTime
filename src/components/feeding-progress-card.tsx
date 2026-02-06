"use client";

import { useState, useMemo } from 'react';
import type { LucideProps } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine } from 'recharts';
import { format, subDays, isAfter, startOfDay } from 'date-fns';
import { id } from 'date-fns/locale';
import type { Feeding } from '@/lib/types';
import { RotateCcw } from 'lucide-react';

interface FeedingProgressCardProps {
    icon: React.ComponentType<LucideProps>;
    title: string;
    lastFeedingAmount: number | null;
    totalToday: number;
    recommendedMin: number;
    recommendedMax: number;
    isClient: boolean;
    className?: string;
    feedings: Feeding[];
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-background/95 border rounded-md px-2 py-1 shadow-lg text-xs">
                <p className="font-semibold">{label}</p>
                <p className="text-cyan-600">{payload[0].value} ml</p>
            </div>
        );
    }
    return null;
};

export default function FeedingProgressCard({
    icon: Icon,
    title,
    lastFeedingAmount,
    totalToday,
    recommendedMin,
    recommendedMax,
    isClient,
    className,
    feedings,
}: FeedingProgressCardProps) {
    const [isFlipped, setIsFlipped] = useState(false);

    // Calculate fill percentage based on recommended average
    const fillPercentage = useMemo(() => {
        const target = (recommendedMin + recommendedMax) / 2;
        const percentage = Math.min((totalToday / target) * 100, 100);
        return percentage;
    }, [totalToday, recommendedMin, recommendedMax]);

    // Get last 7 days feeding data for chart
    const chartData = useMemo(() => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const date = subDays(new Date(), i);
            const dayStart = startOfDay(date);
            const dayEnd = startOfDay(subDays(date, -1));

            const dayTotal = feedings
                .filter(f => {
                    const feedTime = new Date(f.time);
                    return isAfter(feedTime, dayStart) && !isAfter(feedTime, dayEnd);
                })
                .reduce((sum, f) => sum + f.quantity, 0);

            days.push({
                day: format(date, 'EEE', { locale: id }),
                fullDate: format(date, 'd MMM', { locale: id }),
                total: dayTotal,
                isToday: i === 0,
            });
        }
        return days;
    }, [feedings]);

    const targetAvg = (recommendedMin + recommendedMax) / 2;

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
                {/* Front Side - Water Animation */}
                <Card
                    className="shadow-sm relative overflow-hidden backface-hidden h-full"
                    style={{ backfaceVisibility: 'hidden' }}
                >
                    {/* Water fill container */}
                    <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
                        <div
                            className="absolute bottom-0 left-0 right-0 transition-all duration-1000 ease-out animate-water-wobble"
                            style={{
                                height: isClient ? `${fillPercentage}%` : '0%',
                                background: 'linear-gradient(180deg, rgba(34, 211, 238, 0.7) 0%, rgba(6, 182, 212, 0.85) 50%, rgba(8, 145, 178, 0.95) 100%)',
                            }}
                        >
                            <div className="absolute inset-0 animate-shimmer bg-gradient-to-br from-white/20 via-transparent to-white/10" />
                            <svg
                                className="absolute -top-3 left-0 w-[200%] animate-wave"
                                viewBox="0 0 1200 60"
                                preserveAspectRatio="none"
                                style={{ height: '16px' }}
                            >
                                <path d="M0,30 C150,50 350,10 600,30 C850,50 1050,10 1200,30 L1200,60 L0,60 Z" fill="rgba(34, 211, 238, 0.6)" />
                                <path d="M0,40 C200,20 400,50 600,35 C800,20 1000,45 1200,35 L1200,60 L0,60 Z" fill="rgba(6, 182, 212, 0.7)" />
                            </svg>
                            {isClient && (
                                <>
                                    <div className="absolute w-2 h-2 bg-white/60 rounded-full animate-bubble" style={{ left: '15%', animationDelay: '0s' }} />
                                    <div className="absolute w-3 h-3 bg-white/50 rounded-full animate-bubble" style={{ left: '45%', animationDelay: '0.5s' }} />
                                    <div className="absolute w-1.5 h-1.5 bg-white/70 rounded-full animate-bubble" style={{ left: '75%', animationDelay: '1s' }} />
                                </>
                            )}
                        </div>
                    </div>

                    <div className="relative z-10">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium drop-shadow-sm">{title}</CardTitle>
                            <Icon className="h-4 w-4 text-muted-foreground drop-shadow-sm" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold font-headline drop-shadow-sm">
                                {lastFeedingAmount !== null ? `${lastFeedingAmount} ml` : 'N/A'}
                            </div>
                            {isClient && (
                                <p className="text-xs text-muted-foreground drop-shadow-sm">
                                    Hari ini: <span className="font-semibold">{totalToday}ml</span> / {recommendedMin}-{recommendedMax}ml
                                </p>
                            )}
                            <p className="text-[10px] text-muted-foreground mt-1">Tap untuk grafik →</p>
                        </CardContent>
                    </div>
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
                        <CardTitle className="text-xs font-medium">Minum 7 Hari</CardTitle>
                        <RotateCcw className="h-3 w-3 text-muted-foreground" />
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
                                    <ReferenceLine
                                        y={targetAvg}
                                        stroke="#94a3b8"
                                        strokeDasharray="3 3"
                                        strokeWidth={1}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="total"
                                        stroke="#06b6d4"
                                        strokeWidth={2}
                                        dot={{ fill: '#06b6d4', strokeWidth: 0, r: 3 }}
                                        activeDot={{ r: 5, fill: '#0891b2' }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex justify-between items-center text-[9px] text-muted-foreground px-1">
                            <span>--- Target: {Math.round(targetAvg)}ml</span>
                            <span className="font-medium text-cyan-600">Hari ini: {totalToday}ml</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
