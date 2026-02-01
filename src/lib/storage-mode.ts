// Storage mode types and helpers

export type StorageMode = 'offline' | 'cloud';

export interface BabyInfo {
    babyId?: string;
    birthDate: string;
    babyName?: string;
    storageMode: StorageMode;
}

const STORAGE_KEY = 'babynumtime-config';

export function getStorageConfig(): BabyInfo | null {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    try {
        return JSON.parse(stored);
    } catch {
        return null;
    }
}

export function setStorageConfig(config: BabyInfo): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function clearStorageConfig(): void {
    localStorage.removeItem(STORAGE_KEY);
}

export function isOnboardingComplete(): boolean {
    return getStorageConfig() !== null;
}
