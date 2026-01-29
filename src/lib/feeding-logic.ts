import { differenceInMonths, add, formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import type { Feeding } from '@/lib/types';

export const getAge = (birthDate: Date): string => {
  return formatDistanceToNow(birthDate, { addSuffix: true, locale: id }).replace('sekitar ', '');
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

export const getDailyFeedingRecommendation = (ageInMonths: number): { min: number, max: number } => {
    if (ageInMonths < 1) { // 0-1 bulan
        return { min: 480, max: 720 };
    }
    if (ageInMonths < 3) { // 1-3 bulan
        return { min: 700, max: 950 };
    }
    if (ageInMonths < 6) { // 3-6 bulan
        return { min: 800, max: 1000 };
    }
    return { min: 700, max: 900 }; // 6+ bulan (dengan asumsi sudah ada makanan padat)
};

export const getDailyPoopRecommendation = (ageInMonths: number): { min: number, max: number } => {
    if (ageInMonths < 1) { // 0-1 bulan
        return { min: 3, max: 5 };
    }
    if (ageInMonths < 2) { // 1-2 bulan
        return { min: 2, max: 4 };
    }
    return { min: 1, max: 3 }; // 2+ bulan
};
