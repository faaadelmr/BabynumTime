import { differenceInDays, differenceInMonths, add, formatDistanceToNow } from 'date-fns';
import type { Feeding } from '@/lib/types';

export const getAge = (birthDate: Date): string => {
  return formatDistanceToNow(birthDate, { addSuffix: true }).replace('about ', '');
};

export const getAgeInMonths = (birthDate: Date): number => {
  return differenceInMonths(new Date(), birthDate);
};

export const predictNextFeeding = (feedings: Feeding[], ageInMonths: number): Date | null => {
  if (feedings.length === 0) {
    return null;
  }
  const lastFeedingTime = new Date(feedings[0].time);
  
  let hoursToAdd = 3; // Default
  if (ageInMonths < 1) {
    hoursToAdd = 2.5;
  } else if (ageInMonths < 4) {
    hoursToAdd = 3.5;
  } else {
    hoursToAdd = 4;
  }

  return add(lastFeedingTime, { hours: hoursToAdd });
};

export const getDailyGuideline = (ageInMonths: number): { quantity: string, frequency: string, total: string } => {
  if (ageInMonths < 1) {
    return { 
      quantity: "60-90 ml", 
      frequency: "every 2-3 hours",
      total: "480-720 ml" 
    };
  }
  if (ageInMonths < 2) {
    return { 
      quantity: "90-120 ml", 
      frequency: "every 3-4 hours",
      total: "720-960 ml"
    };
  }
  if (ageInMonths < 4) {
    return {
      quantity: "120-180 ml",
      frequency: "every 3-4 hours",
      total: "960-1440 ml"
    };
  }
  if (ageInMonths < 6) {
    return {
      quantity: "180-240 ml",
      frequency: "every 4-5 hours",
      total: "1080-1440 ml"
    };
  }
  return {
    quantity: "240 ml",
    frequency: "every 4-6 hours",
    total: "Up to 1000 ml+"
  };
};

export const getTotalVolumeToday = (feedings: Feeding[]): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return feedings
    .filter(f => new Date(f.time) >= today)
    .reduce((total, f) => total + f.quantity, 0);
};
