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

/**
 * WHO Recommendation for weekly poop frequency by age
 * Reference: WHO Infant and Young Child Feeding guidelines
 */
export const getWeeklyPoopRecommendation = (ageInMonths: number): { min: number, max: number, note: string } => {
  if (ageInMonths < 1) { // 0-4 minggu (newborn)
    // Newborns may poop 3-5 times per day = 21-35 per week
    return { min: 21, max: 35, note: "Frekuensi tinggi normal pada bayi baru lahir" };
  }
  if (ageInMonths < 2) { // 1-2 bulan
    // 2-4 times per day = 14-28 per week
    return { min: 14, max: 28, note: "BAB sering, dapat setiap habis menyusu" };
  }
  if (ageInMonths < 4) { // 2-4 bulan
    // May slow down to 1-3 times per day or even less
    return { min: 3, max: 21, note: "Frekuensi mulai berkurang, normal hingga 1x/3 hari" };
  }
  if (ageInMonths < 6) { // 4-6 bulan
    // Can be 1-2 times per day or every other day
    return { min: 3, max: 14, note: "Normal 1-2x/hari atau 1x setiap 2-3 hari" };
  }
  // 6+ bulan (dengan MPASI)
  return { min: 5, max: 14, note: "Setelah MPASI, frekuensi lebih teratur 1-2x/hari" };
};
