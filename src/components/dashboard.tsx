"use client";

import { useState, useEffect, useMemo } from "react";
import { format, formatDistanceToNowStrict } from "date-fns";
import { Clock, Target, Baby, Hourglass, Droplets, FlaskConical } from "lucide-react";
import type { Feeding } from "@/lib/types";
import {
  getAge,
  getAgeInMonths,
  getDailyGuideline,
  predictNextFeeding,
  getTotalVolumeToday,
} from "@/lib/feeding-logic";
import FeedingForm from "./feeding-form";
import FeedingHistory from "./feeding-history";
import InfoCard from "./info-card";

interface DashboardProps {
  birthDate: Date;
}

export default function Dashboard({ birthDate }: DashboardProps) {
  const [feedings, setFeedings] = useState<Feeding[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const storedFeedings = localStorage.getItem("babyCareFeedings");
    if (storedFeedings) {
      setFeedings(JSON.parse(storedFeedings));
    }
    setIsClient(true);

    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const sortedFeedings = useMemo(() => {
    return [...feedings].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  }, [feedings]);

  const addFeeding = (newFeeding: Omit<Feeding, "id" | "time"> & { time: Date }) => {
    const feedingWithId: Feeding = {
      ...newFeeding,
      id: new Date().toISOString() + Math.random(),
      time: newFeeding.time.toISOString(),
    };
    const updatedFeedings = [feedingWithId, ...feedings];
    setFeedings(updatedFeedings);
    localStorage.setItem("babyCareFeedings", JSON.stringify(updatedFeedings));
  };
  
  const ageInMonths = getAgeInMonths(birthDate);
  const ageString = getAge(birthDate);
  const dailyGuideline = getDailyGuideline(ageInMonths);
  const nextFeedingTime = predictNextFeeding(sortedFeedings, ageInMonths);
  const totalVolumeToday = getTotalVolumeToday(sortedFeedings);

  const lastFeeding = sortedFeedings[0];
  const lastFeedingIcon = lastFeeding?.type === 'breast' ? Droplets : FlaskConical;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <InfoCard icon={Baby} title="Baby's Age" value={ageString} />
        <InfoCard 
            icon={Clock} 
            title="Next Feeding" 
            value={nextFeedingTime ? format(nextFeedingTime, 'p') : "Log a feeding"}
            description={nextFeedingTime ? `In ${formatDistanceToNowStrict(nextFeedingTime)}` : "No data yet"}
        />
        <InfoCard 
          icon={lastFeedingIcon}
          title="Last Feeding"
          value={lastFeeding ? `${lastFeeding.quantity} ml` : 'N/A'}
          description={lastFeeding ? `${formatDistanceToNowStrict(new Date(lastFeeding.time))} ago` : 'Log first feeding'}
        />
        <InfoCard 
          icon={Target} 
          title="Today's Goal"
          value={`${totalVolumeToday} / ${dailyGuideline.total}`}
          description="Total daily intake"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1">
          <FeedingForm onAddFeeding={addFeeding} />
        </div>
        <div className="lg:col-span-2">
          <FeedingHistory feedings={sortedFeedings} />
        </div>
      </div>
    </div>
  );
}
