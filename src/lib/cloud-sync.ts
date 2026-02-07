// Cloud sync service for Google Sheets API

import type { Feeding, DiaperChange, CryAnalysis, PumpingSession } from './types';
import { getStorageConfig, type BabyInfo } from './storage-mode';

// Internal API endpoint
const API_URL = '/api/sheets';

const SYNC_INTERVAL = 30 * 60 * 1000; // 30 minutes
const LAST_SYNC_KEY = 'babynumtime-last-sync';
const PENDING_SYNC_KEY = 'babynumtime-pending-sync';

let syncTimer: NodeJS.Timeout | null = null;

// Check if API is configured (always true with internal API)
export function isApiConfigured(): boolean {
    return true;
}

// Mark that there are changes to sync
export function markPendingSync(): void {
    localStorage.setItem(PENDING_SYNC_KEY, 'true');
}

// Check if there are pending changes
export function hasPendingSync(): boolean {
    return localStorage.getItem(PENDING_SYNC_KEY) === 'true';
}

// Clear pending sync flag
function clearPendingSync(): void {
    localStorage.removeItem(PENDING_SYNC_KEY);
}

// Get last sync time
export function getLastSyncTime(): Date | null {
    const stored = localStorage.getItem(LAST_SYNC_KEY);
    if (!stored) return null;
    return new Date(stored);
}

// Create a new baby in cloud
export async function createBabyInCloud(birthDate: string, babyName?: string): Promise<{ success: boolean; babyId?: string; error?: string }> {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'createBaby',
                birthDate,
                babyName: babyName || '',
            }),
        });

        const result = await response.json();

        if (result.success && result.baby) {
            return { success: true, babyId: result.baby.babyId };
        }

        return { success: false, error: result.error || 'Gagal membuat baby' };
    } catch (error) {
        console.error('Error creating baby:', error);
        return { success: false, error: 'Network error. Pastikan terhubung ke internet.' };
    }
}

// Get baby info from cloud
export async function getBabyFromCloud(babyId: string): Promise<{ success: boolean; baby?: BabyInfo; error?: string }> {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'getBaby',
                babyId,
            }),
        });

        const result = await response.json();

        if (result.success && result.baby) {
            return {
                success: true,
                baby: {
                    babyId: result.baby.babyId,
                    birthDate: result.baby.birthDate,
                    babyName: result.baby.babyName,
                    storageMode: 'cloud',
                },
            };
        }

        return { success: false, error: result.error || 'Baby tidak ditemukan' };
    } catch (error) {
        console.error('Error getting baby:', error);
        return { success: false, error: 'Network error' };
    }
}

// Get all data from cloud
export async function getDataFromCloud(babyId: string): Promise<{
    success: boolean;
    data?: { feedings: Feeding[]; diapers: DiaperChange[]; cryAnalyses: CryAnalysis[]; pumpingSessions: PumpingSession[] };
    error?: string;
}> {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'getData',
                babyId,
            }),
        });

        const result = await response.json();

        if (result.success && result.data) {
            return { success: true, data: result.data };
        }

        return { success: false, error: result.error || 'Gagal mengambil data' };
    } catch (error) {
        console.error('Error getting data:', error);
        return { success: false, error: 'Network error' };
    }
}

// Sync data to cloud
export async function syncToCloud(
    babyId: string,
    data: { feedings: Feeding[]; diapers: DiaperChange[]; cryAnalyses: CryAnalysis[]; pumpingSessions?: PumpingSession[] }
): Promise<{ success: boolean; error?: string }> {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'syncData',
                babyId,
                data,
            }),
        });

        const result = await response.json();

        if (result.success) {
            localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
            clearPendingSync();
            return { success: true };
        }

        return { success: false, error: result.error || 'Sinkronisasi gagal' };
    } catch (error) {
        console.error('Error syncing:', error);
        return { success: false, error: 'Network error' };
    }
}

// Manual full sync (push and pull)
export async function triggerFullSync(
    getData: () => { feedings: Feeding[]; diapers: DiaperChange[]; cryAnalyses: CryAnalysis[]; pumpingSessions: PumpingSession[] },
    onDataReceived?: (data: { feedings: Feeding[]; diapers: DiaperChange[]; cryAnalyses: CryAnalysis[]; pumpingSessions: PumpingSession[] }) => void
): Promise<{ success: boolean; error?: string }> {
    const config = getStorageConfig();
    if (!config || config.storageMode !== 'cloud' || !config.babyId) {
        return { success: false, error: 'Not in cloud mode' };
    }

    // 1. Push
    const data = getData();
    const pushResult = await syncToCloud(config.babyId, data);
    if (!pushResult.success) {
        return pushResult;
    }

    // 2. Pull
    const pullResult = await getDataFromCloud(config.babyId);
    if (pullResult.success && pullResult.data) {
        // Update Local Storage
        localStorage.setItem('babyCareFeedings', JSON.stringify(pullResult.data.feedings));
        localStorage.setItem('babyCareDiapers', JSON.stringify(pullResult.data.diapers));
        localStorage.setItem('babyCareCryAnalyses', JSON.stringify(pullResult.data.cryAnalyses));
        localStorage.setItem('motherPumpingSessions', JSON.stringify(pullResult.data.pumpingSessions || []));

        onDataReceived?.(pullResult.data);
    }

    return { success: true };
}

// Start auto-sync timer
export function startAutoSync(
    getData: () => { feedings: Feeding[]; diapers: DiaperChange[]; cryAnalyses: CryAnalysis[]; pumpingSessions: PumpingSession[] },
    onSyncComplete?: (success: boolean) => void,
    onDataReceived?: (data: { feedings: Feeding[]; diapers: DiaperChange[]; cryAnalyses: CryAnalysis[]; pumpingSessions: PumpingSession[] }) => void
): void {
    if (syncTimer) {
        clearInterval(syncTimer);
    }

    const config = getStorageConfig();
    if (!config || config.storageMode !== 'cloud' || !config.babyId) {
        return;
    }

    // Function to perform sync (push and pull)
    const performSync = async () => {
        const currentConfig = getStorageConfig();
        if (!currentConfig || currentConfig.storageMode !== 'cloud' || !currentConfig.babyId) {
            stopAutoSync();
            return;
        }

        // 1. Push pending changes if any
        if (hasPendingSync()) {
            const data = getData();
            const pushResult = await syncToCloud(currentConfig.babyId, data);
            onSyncComplete?.(pushResult.success);
        }

        // 2. Pull latest data from cloud
        // Only pull if we don't have pending changes (to avoid overwriting local work)
        // Or if we just successfully pushed
        if (!hasPendingSync()) {
            const pullResult = await getDataFromCloud(currentConfig.babyId);
            if (pullResult.success && pullResult.data) {
                // Update Local Storage
                localStorage.setItem('babyCareFeedings', JSON.stringify(pullResult.data.feedings));
                localStorage.setItem('babyCareDiapers', JSON.stringify(pullResult.data.diapers));
                localStorage.setItem('babyCareCryAnalyses', JSON.stringify(pullResult.data.cryAnalyses));
                localStorage.setItem('motherPumpingSessions', JSON.stringify(pullResult.data.pumpingSessions || []));

                // Notify UI
                onDataReceived?.(pullResult.data);
            }
        }
    };

    // Initial sync check
    performSync();

    syncTimer = setInterval(performSync, SYNC_INTERVAL);
}

// Stop auto-sync timer
export function stopAutoSync(): void {
    if (syncTimer) {
        clearInterval(syncTimer);
        syncTimer = null;
    }
}

// Manual sync now
export async function syncNow(
    getData: () => { feedings: Feeding[]; diapers: DiaperChange[]; cryAnalyses: CryAnalysis[]; pumpingSessions: PumpingSession[] }
): Promise<{ success: boolean; error?: string }> {
    const config = getStorageConfig();
    if (!config || config.storageMode !== 'cloud' || !config.babyId) {
        return { success: false, error: 'Not in cloud mode' };
    }

    const data = getData();
    return syncToCloud(config.babyId, data);
}

// Send data to cloud immediately (real-time sync)
// This is called whenever data is added/modified/deleted
export async function sendDataToCloud(): Promise<{ success: boolean; error?: string }> {
    const config = getStorageConfig();
    if (!config || config.storageMode !== 'cloud' || !config.babyId) {
        return { success: false, error: 'Not in cloud mode' };
    }

    try {
        // Get all data from localStorage
        const feedingsStr = localStorage.getItem('babyCareFeedings');
        const diapersStr = localStorage.getItem('babyCareDiapers');
        const cryAnalysesStr = localStorage.getItem('babyCareCryAnalyses');
        const pumpingStr = localStorage.getItem('motherPumpingSessions');

        const data = {
            feedings: feedingsStr ? JSON.parse(feedingsStr) : [],
            diapers: diapersStr ? JSON.parse(diapersStr) : [],
            cryAnalyses: cryAnalysesStr ? JSON.parse(cryAnalysesStr) : [],
            pumpingSessions: pumpingStr ? JSON.parse(pumpingStr) : [],
        };

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'syncData',
                babyId: config.babyId,
                data,
            }),
        });

        const result = await response.json();

        if (result.success) {
            localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
            clearPendingSync();
            return { success: true };
        }

        markPendingSync();
        return { success: false, error: result.error || 'Sinkronisasi gagal' };
    } catch (error) {
        console.error('Error sending data to cloud:', error);
        markPendingSync();
        return { success: false, error: 'Network error' };
    }
}
