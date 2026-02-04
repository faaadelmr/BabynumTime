// Cloud sync service for Google Spreadsheet

import type { Feeding, DiaperChange, CryAnalysis } from './types';
import { getStorageConfig, setStorageConfig, type BabyInfo } from './storage-mode';

// ⚠️ PENTING: Ganti URL ini dengan URL Web App dari Google Apps Script Anda
const API_URL = 'https://script.google.com/macros/s/AKfycbzyjW-H5Bu-gI-SZvXTwk2go9cZgxDOnj2HUMPYK1mcw2rNtfvhkfezSwKj_5iPbX47MA/exec';

const SYNC_INTERVAL = 30 * 60 * 1000; // 30 minutes
const LAST_SYNC_KEY = 'babynumtime-last-sync';
const PENDING_SYNC_KEY = 'babynumtime-pending-sync';

let syncTimer: NodeJS.Timeout | null = null;

// Check if API URL is configured
export function isApiConfigured(): boolean {
    return API_URL.startsWith('https://script.google.com');
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
    if (!isApiConfigured()) {
        return { success: false, error: 'API URL not configured' };
    }

    try {
        // Use URL params to avoid CORS preflight
        const params = new URLSearchParams({
            action: 'createBaby',
            birthDate,
            babyName: babyName || '',
        });

        const response = await fetch(`${API_URL}?${params.toString()}`, {
            method: 'GET',
            redirect: 'follow',
        });

        const raw = await response.text();
        let result: any;
        try {
            result = JSON.parse(raw);
        } catch {
            return { success: false, error: 'Respons server tidak valid. Periksa URL Web App.' };
        }

        if (result.success && result.baby) {
            return { success: true, babyId: result.baby.babyId };
        }

        return { success: false, error: result.error || 'Failed to create baby' };
    } catch (error) {
        console.error('Error creating baby:', error);
        return { success: false, error: 'Network error. Pastikan terhubung ke internet.' };
    }
}

// Get baby info from cloud
export async function getBabyFromCloud(babyId: string): Promise<{ success: boolean; baby?: BabyInfo; error?: string }> {
    if (!isApiConfigured()) {
        return { success: false, error: 'API URL not configured' };
    }

    try {
        const response = await fetch(`${API_URL}?action=getBaby&babyId=${encodeURIComponent(babyId)}`);
        const raw = await response.text();
        let result: any;
        try {
            result = JSON.parse(raw);
        } catch {
            return { success: false, error: 'Respons server tidak valid saat mengambil data bayi.' };
        }

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

        return { success: false, error: result.error || 'Baby not found' };
    } catch (error) {
        console.error('Error getting baby:', error);
        return { success: false, error: 'Network error' };
    }
}

// Get all data from cloud
export async function getDataFromCloud(babyId: string): Promise<{
    success: boolean;
    data?: { feedings: Feeding[]; diapers: DiaperChange[]; cryAnalyses: CryAnalysis[] };
    error?: string;
}> {
    if (!isApiConfigured()) {
        return { success: false, error: 'API URL not configured' };
    }

    try {
        const response = await fetch(`${API_URL}?action=getData&babyId=${encodeURIComponent(babyId)}`);
        const raw = await response.text();
        let result: any;
        try {
            result = JSON.parse(raw);
        } catch {
            return { success: false, error: 'Respons server tidak valid saat mengambil data.' };
        }

        if (result.success && result.data) {
            return { success: true, data: result.data };
        }

        return { success: false, error: result.error || 'Failed to get data' };
    } catch (error) {
        console.error('Error getting data:', error);
        return { success: false, error: 'Network error' };
    }
}

// Sync data to cloud
export async function syncToCloud(
    babyId: string,
    data: { feedings: Feeding[]; diapers: DiaperChange[]; cryAnalyses: CryAnalysis[] }
): Promise<{ success: boolean; error?: string }> {
    if (!isApiConfigured()) {
        return { success: false, error: 'API URL not configured' };
    }

    try {
        // Use URL params with encoded JSON data to avoid CORS preflight
        const params = new URLSearchParams({
            action: 'syncData',
            babyId,
            data: JSON.stringify(data),
        });

        const response = await fetch(`${API_URL}?${params.toString()}`, {
            method: 'GET',
            redirect: 'follow',
        });

        const raw = await response.text();
        let result: any;
        try {
            result = JSON.parse(raw);
        } catch {
            return { success: false, error: 'Respons server tidak valid saat sinkronisasi.' };
        }

        if (result.success) {
            localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
            clearPendingSync();
            return { success: true };
        }

        return { success: false, error: result.error || 'Sync failed' };
    } catch (error) {
        console.error('Error syncing:', error);
        return { success: false, error: 'Network error' };
    }
}

// Start auto-sync timer
export function startAutoSync(
    getData: () => { feedings: Feeding[]; diapers: DiaperChange[]; cryAnalyses: CryAnalysis[] },
    onSyncComplete?: (success: boolean) => void,
    onDataReceived?: (data: { feedings: Feeding[]; diapers: DiaperChange[]; cryAnalyses: CryAnalysis[] }) => void
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
    getData: () => { feedings: Feeding[]; diapers: DiaperChange[]; cryAnalyses: CryAnalysis[] }
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

    if (!isApiConfigured()) {
        return { success: false, error: 'API URL not configured' };
    }

    try {
        // Get all data from localStorage
        const feedingsStr = localStorage.getItem('babyCareFeedings');
        const diapersStr = localStorage.getItem('babyCareDiapers');
        const cryAnalysesStr = localStorage.getItem('babyCareCryAnalyses');

        const data = {
            feedings: feedingsStr ? JSON.parse(feedingsStr) : [],
            diapers: diapersStr ? JSON.parse(diapersStr) : [],
            cryAnalyses: cryAnalysesStr ? JSON.parse(cryAnalysesStr) : [],
        };

        // Use URL params with encoded JSON data
        const params = new URLSearchParams({
            action: 'syncData',
            babyId: config.babyId,
            data: JSON.stringify(data),
        });

        const response = await fetch(`${API_URL}?${params.toString()}`, {
            method: 'GET',
            redirect: 'follow',
        });

        const raw = await response.text();
        let result: any;
        try {
            result = JSON.parse(raw);
        } catch {
            markPendingSync();
            return { success: false, error: 'Respons server tidak valid saat mengirim data.' };
        }

        if (result.success) {
            localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
            clearPendingSync();
            return { success: true };
        }

        markPendingSync();
        return { success: false, error: result.error || 'Sync failed' };
    } catch (error) {
        console.error('Error sending data to cloud:', error);
        markPendingSync();
        return { success: false, error: 'Network error' };
    }
}
