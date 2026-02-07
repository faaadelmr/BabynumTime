import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

// Environment variables needed:
// GOOGLE_SERVICE_ACCOUNT_EMAIL - Service account email
// GOOGLE_PRIVATE_KEY - Private key from service account JSON
// GOOGLE_SPREADSHEET_ID - ID of the spreadsheet to use

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;

// Sheet names
const BABIES_SHEET = 'Babies';
const FEEDINGS_SHEET = 'Feedings';
const DIAPERS_SHEET = 'Diapers';
const CRY_ANALYSES_SHEET = 'CryAnalyses';
const PUMPING_SHEET = 'Pumping';

// Initialize Google Sheets API
function getGoogleSheetsClient() {
    const auth = new google.auth.GoogleAuth({
        credentials: {
            client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    return google.sheets({ version: 'v4', auth });
}

// Generate a 6-character Baby ID
function generateBabyId(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing characters
    let id = '';
    for (let i = 0; i < 6; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
}

// Ensure all required sheets exist
async function ensureSheetsExist(sheets: ReturnType<typeof google.sheets>) {
    try {
        const spreadsheet = await sheets.spreadsheets.get({
            spreadsheetId: SPREADSHEET_ID,
        });

        const existingSheets = spreadsheet.data.sheets?.map(s => s.properties?.title) || [];
        const requiredSheets = [BABIES_SHEET, FEEDINGS_SHEET, DIAPERS_SHEET, CRY_ANALYSES_SHEET, PUMPING_SHEET];
        const sheetsToCreate = requiredSheets.filter(s => !existingSheets.includes(s));

        if (sheetsToCreate.length > 0) {
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId: SPREADSHEET_ID,
                requestBody: {
                    requests: sheetsToCreate.map(title => ({
                        addSheet: {
                            properties: { title },
                        },
                    })),
                },
            });

            // Add headers to new sheets
            const headerRequests = [];
            if (sheetsToCreate.includes(BABIES_SHEET)) {
                headerRequests.push({
                    range: `${BABIES_SHEET}!A1:D1`,
                    values: [['babyId', 'birthDate', 'babyName', 'createdAt']],
                });
            }
            if (sheetsToCreate.includes(FEEDINGS_SHEET)) {
                headerRequests.push({
                    range: `${FEEDINGS_SHEET}!A1:E1`,
                    values: [['babyId', 'id', 'time', 'type', 'quantity']],
                });
            }
            if (sheetsToCreate.includes(DIAPERS_SHEET)) {
                headerRequests.push({
                    range: `${DIAPERS_SHEET}!A1:H1`,
                    values: [['babyId', 'id', 'time', 'type', 'poopType', 'notes', 'image', 'aiAnalysis']],
                });
            }
            if (sheetsToCreate.includes(CRY_ANALYSES_SHEET)) {
                headerRequests.push({
                    range: `${CRY_ANALYSES_SHEET}!A1:E1`,
                    values: [['babyId', 'id', 'time', 'result', 'detectedSound']],
                });
            }
            if (sheetsToCreate.includes(PUMPING_SHEET)) {
                headerRequests.push({
                    range: `${PUMPING_SHEET}!A1:G1`,
                    values: [['babyId', 'id', 'time', 'volume', 'duration', 'side', 'notes']],
                });
            }

            if (headerRequests.length > 0) {
                await sheets.spreadsheets.values.batchUpdate({
                    spreadsheetId: SPREADSHEET_ID,
                    requestBody: {
                        valueInputOption: 'RAW',
                        data: headerRequests,
                    },
                });
            }
        }
    } catch (error) {
        console.error('Error ensuring sheets exist:', error);
        throw error;
    }
}

// Create a new baby
async function createBaby(birthDate: string, babyName?: string) {
    const sheets = getGoogleSheetsClient();
    await ensureSheetsExist(sheets);

    const babyId = generateBabyId();
    const createdAt = new Date().toISOString();

    await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${BABIES_SHEET}!A:D`,
        valueInputOption: 'RAW',
        requestBody: {
            values: [[babyId, birthDate, babyName || '', createdAt]],
        },
    });

    return { babyId, birthDate, babyName };
}

// Get baby info by ID
async function getBaby(babyId: string) {
    const sheets = getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${BABIES_SHEET}!A:D`,
    });

    const rows = response.data.values || [];
    // Skip header row
    for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] === babyId) {
            return {
                babyId: rows[i][0],
                birthDate: rows[i][1],
                babyName: rows[i][2] || undefined,
            };
        }
    }

    return null;
}

// Get all data for a baby
async function getData(babyId: string) {
    const sheets = getGoogleSheetsClient();

    // Get all data in parallel
    const [feedingsRes, diapersRes, cryAnalysesRes, pumpingRes] = await Promise.all([
        sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${FEEDINGS_SHEET}!A:E`,
        }),
        sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${DIAPERS_SHEET}!A:H`,
        }),
        sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${CRY_ANALYSES_SHEET}!A:E`,
        }),
        sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${PUMPING_SHEET}!A:G`,
        }),
    ]);

    // Parse feedings
    const feedingsRows = feedingsRes.data.values || [];
    const feedings = [];
    for (let i = 1; i < feedingsRows.length; i++) {
        if (feedingsRows[i][0] === babyId) {
            feedings.push({
                id: feedingsRows[i][1],
                time: feedingsRows[i][2],
                type: feedingsRows[i][3],
                quantity: parseInt(feedingsRows[i][4], 10) || 0,
            });
        }
    }

    // Parse diapers
    const diapersRows = diapersRes.data.values || [];
    const diapers = [];
    for (let i = 1; i < diapersRows.length; i++) {
        if (diapersRows[i][0] === babyId) {
            const diaper: Record<string, unknown> = {
                id: diapersRows[i][1],
                time: diapersRows[i][2],
                type: diapersRows[i][3],
            };
            if (diapersRows[i][4]) diaper.poopType = diapersRows[i][4];
            if (diapersRows[i][5]) diaper.notes = diapersRows[i][5];
            if (diapersRows[i][6]) diaper.image = diapersRows[i][6];
            if (diapersRows[i][7]) {
                try {
                    diaper.aiAnalysis = JSON.parse(diapersRows[i][7]);
                } catch {
                    // Ignore parse errors
                }
            }
            diapers.push(diaper);
        }
    }

    // Parse cry analyses
    const cryRows = cryAnalysesRes.data.values || [];
    const cryAnalyses = [];
    for (let i = 1; i < cryRows.length; i++) {
        if (cryRows[i][0] === babyId) {
            const analysis: Record<string, unknown> = {
                id: cryRows[i][1],
                time: cryRows[i][2],
            };
            if (cryRows[i][3]) {
                try {
                    analysis.result = JSON.parse(cryRows[i][3]);
                } catch {
                    // Ignore parse errors
                }
            }
            if (cryRows[i][4]) analysis.detectedSound = cryRows[i][4];
            cryAnalyses.push(analysis);
        }
    }

    // Parse pumping sessions
    const pumpingRows = pumpingRes.data.values || [];
    const pumpingSessions = [];
    for (let i = 1; i < pumpingRows.length; i++) {
        if (pumpingRows[i][0] === babyId) {
            const session: Record<string, unknown> = {
                id: pumpingRows[i][1],
                time: pumpingRows[i][2],
                volume: parseInt(pumpingRows[i][3], 10) || 0,
            };
            if (pumpingRows[i][4]) session.duration = parseInt(pumpingRows[i][4], 10);
            if (pumpingRows[i][5]) session.side = pumpingRows[i][5];
            if (pumpingRows[i][6]) session.notes = pumpingRows[i][6];
            pumpingSessions.push(session);
        }
    }

    return { feedings, diapers, cryAnalyses, pumpingSessions };
}

// Sync data to spreadsheet (full replace for this baby)
async function syncData(
    babyId: string,
    data: {
        feedings: Array<{ id: string; time: string; type: string; quantity: number }>;
        diapers: Array<Record<string, unknown>>;
        cryAnalyses: Array<Record<string, unknown>>;
        pumpingSessions?: Array<Record<string, unknown>>;
    }
) {
    const sheets = getGoogleSheetsClient();
    await ensureSheetsExist(sheets);

    // Get existing data to find rows to delete
    const [feedingsRes, diapersRes, cryRes, pumpingRes] = await Promise.all([
        sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${FEEDINGS_SHEET}!A:E`,
        }),
        sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${DIAPERS_SHEET}!A:H`,
        }),
        sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${CRY_ANALYSES_SHEET}!A:E`,
        }),
        sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${PUMPING_SHEET}!A:G`,
        }),
    ]);

    // For simplicity, we'll clear and rewrite all data for this baby
    // First, filter out this baby's data from existing
    const existingFeedings = (feedingsRes.data.values || []).filter(
        (row, i) => i === 0 || row[0] !== babyId
    );
    const existingDiapers = (diapersRes.data.values || []).filter(
        (row, i) => i === 0 || row[0] !== babyId
    );
    const existingCry = (cryRes.data.values || []).filter(
        (row, i) => i === 0 || row[0] !== babyId
    );
    const existingPumping = (pumpingRes.data.values || []).filter(
        (row, i) => i === 0 || row[0] !== babyId
    );

    // Ensure headers exist if sheets are empty
    const feedingsHeader = [['babyId', 'id', 'time', 'type', 'quantity']];
    const diapersHeader = [['babyId', 'id', 'time', 'type', 'poopType', 'notes', 'image', 'aiAnalysis']];
    const cryHeader = [['babyId', 'id', 'time', 'result', 'detectedSound']];
    const pumpingHeader = [['babyId', 'id', 'time', 'volume', 'duration', 'side', 'notes']];

    // If no existing data (or only header), add header
    const feedingsWithHeader = existingFeedings.length > 0 ? existingFeedings : feedingsHeader;
    const diapersWithHeader = existingDiapers.length > 0 ? existingDiapers : diapersHeader;
    const cryWithHeader = existingCry.length > 0 ? existingCry : cryHeader;
    const pumpingWithHeader = existingPumping.length > 0 ? existingPumping : pumpingHeader;

    // Add new data for this baby
    const newFeedings = data.feedings.map(f => [babyId, f.id, f.time, f.type, f.quantity]);
    const newDiapers = data.diapers.map(d => [
        babyId,
        d.id,
        d.time,
        d.type,
        d.poopType || '',
        d.notes || '',
        d.image || '',
        d.aiAnalysis ? JSON.stringify(d.aiAnalysis) : '',
    ]);
    const newCry = data.cryAnalyses.map(c => [
        babyId,
        c.id,
        c.time,
        c.result ? JSON.stringify(c.result) : '',
        c.detectedSound || '',
    ]);
    const newPumping = (data.pumpingSessions || []).map(p => [
        babyId,
        p.id,
        p.time,
        p.volume || 0,
        p.duration || '',
        p.side || '',
        p.notes || '',
    ]);

    // Clear and update sheets
    await Promise.all([
        sheets.spreadsheets.values.clear({
            spreadsheetId: SPREADSHEET_ID,
            range: `${FEEDINGS_SHEET}!A:E`,
        }),
        sheets.spreadsheets.values.clear({
            spreadsheetId: SPREADSHEET_ID,
            range: `${DIAPERS_SHEET}!A:H`,
        }),
        sheets.spreadsheets.values.clear({
            spreadsheetId: SPREADSHEET_ID,
            range: `${CRY_ANALYSES_SHEET}!A:E`,
        }),
        sheets.spreadsheets.values.clear({
            spreadsheetId: SPREADSHEET_ID,
            range: `${PUMPING_SHEET}!A:G`,
        }),
    ]);

    // Write back all data
    const allFeedings = [...feedingsWithHeader, ...newFeedings];
    const allDiapers = [...diapersWithHeader, ...newDiapers];
    const allCry = [...cryWithHeader, ...newCry];
    const allPumping = [...pumpingWithHeader, ...newPumping];

    await Promise.all([
        allFeedings.length > 0 && sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `${FEEDINGS_SHEET}!A1`,
            valueInputOption: 'RAW',
            requestBody: { values: allFeedings },
        }),
        allDiapers.length > 0 && sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `${DIAPERS_SHEET}!A1`,
            valueInputOption: 'RAW',
            requestBody: { values: allDiapers },
        }),
        allCry.length > 0 && sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `${CRY_ANALYSES_SHEET}!A1`,
            valueInputOption: 'RAW',
            requestBody: { values: allCry },
        }),
        allPumping.length > 0 && sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `${PUMPING_SHEET}!A1`,
            valueInputOption: 'RAW',
            requestBody: { values: allPumping },
        }),
    ]);

    return { success: true };
}

// Delete all data for a baby (privacy feature)
async function deleteAllData(babyId: string) {
    const sheets = getGoogleSheetsClient();

    // Get all data from all sheets
    const [babiesRes, feedingsRes, diapersRes, cryRes, pumpingRes] = await Promise.all([
        sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${BABIES_SHEET}!A:D`,
        }),
        sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${FEEDINGS_SHEET}!A:E`,
        }),
        sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${DIAPERS_SHEET}!A:H`,
        }),
        sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${CRY_ANALYSES_SHEET}!A:E`,
        }),
        sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: `${PUMPING_SHEET}!A:G`,
        }),
    ]);

    // Filter out the baby's data (keep header row i === 0, remove rows where babyId matches)
    const remainingBabies = (babiesRes.data.values || []).filter(
        (row, i) => i === 0 || row[0] !== babyId
    );
    const remainingFeedings = (feedingsRes.data.values || []).filter(
        (row, i) => i === 0 || row[0] !== babyId
    );
    const remainingDiapers = (diapersRes.data.values || []).filter(
        (row, i) => i === 0 || row[0] !== babyId
    );
    const remainingCry = (cryRes.data.values || []).filter(
        (row, i) => i === 0 || row[0] !== babyId
    );
    const remainingPumping = (pumpingRes.data.values || []).filter(
        (row, i) => i === 0 || row[0] !== babyId
    );

    // Clear all sheets
    await Promise.all([
        sheets.spreadsheets.values.clear({
            spreadsheetId: SPREADSHEET_ID,
            range: `${BABIES_SHEET}!A:D`,
        }),
        sheets.spreadsheets.values.clear({
            spreadsheetId: SPREADSHEET_ID,
            range: `${FEEDINGS_SHEET}!A:E`,
        }),
        sheets.spreadsheets.values.clear({
            spreadsheetId: SPREADSHEET_ID,
            range: `${DIAPERS_SHEET}!A:H`,
        }),
        sheets.spreadsheets.values.clear({
            spreadsheetId: SPREADSHEET_ID,
            range: `${CRY_ANALYSES_SHEET}!A:E`,
        }),
        sheets.spreadsheets.values.clear({
            spreadsheetId: SPREADSHEET_ID,
            range: `${PUMPING_SHEET}!A:G`,
        }),
    ]);

    // Write back remaining data (without the deleted baby)
    await Promise.all([
        remainingBabies.length > 0 && sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `${BABIES_SHEET}!A1`,
            valueInputOption: 'RAW',
            requestBody: { values: remainingBabies },
        }),
        remainingFeedings.length > 0 && sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `${FEEDINGS_SHEET}!A1`,
            valueInputOption: 'RAW',
            requestBody: { values: remainingFeedings },
        }),
        remainingDiapers.length > 0 && sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `${DIAPERS_SHEET}!A1`,
            valueInputOption: 'RAW',
            requestBody: { values: remainingDiapers },
        }),
        remainingCry.length > 0 && sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `${CRY_ANALYSES_SHEET}!A1`,
            valueInputOption: 'RAW',
            requestBody: { values: remainingCry },
        }),
        remainingPumping.length > 0 && sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `${PUMPING_SHEET}!A1`,
            valueInputOption: 'RAW',
            requestBody: { values: remainingPumping },
        }),
    ]);

    return { success: true };
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, babyId, birthDate, babyName, data } = body;

        // Validate environment
        if (!SPREADSHEET_ID || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
            return NextResponse.json(
                { success: false, error: 'Server tidak terkonfigurasi dengan benar. Hubungi administrator.' },
                { status: 500 }
            );
        }

        switch (action) {
            case 'createBaby': {
                if (!birthDate) {
                    return NextResponse.json(
                        { success: false, error: 'birthDate diperlukan' },
                        { status: 400 }
                    );
                }
                const baby = await createBaby(birthDate, babyName);
                return NextResponse.json({ success: true, baby });
            }

            case 'getBaby': {
                if (!babyId) {
                    return NextResponse.json(
                        { success: false, error: 'babyId diperlukan' },
                        { status: 400 }
                    );
                }
                const baby = await getBaby(babyId);
                if (!baby) {
                    return NextResponse.json(
                        { success: false, error: 'Baby tidak ditemukan' },
                        { status: 404 }
                    );
                }
                return NextResponse.json({ success: true, baby });
            }

            case 'getData': {
                if (!babyId) {
                    return NextResponse.json(
                        { success: false, error: 'babyId diperlukan' },
                        { status: 400 }
                    );
                }
                const result = await getData(babyId);
                return NextResponse.json({ success: true, data: result });
            }

            case 'syncData': {
                if (!babyId || !data) {
                    return NextResponse.json(
                        { success: false, error: 'babyId dan data diperlukan' },
                        { status: 400 }
                    );
                }
                await syncData(babyId, data);
                return NextResponse.json({ success: true });
            }

            case 'deleteAllData': {
                if (!babyId) {
                    return NextResponse.json(
                        { success: false, error: 'babyId diperlukan' },
                        { status: 400 }
                    );
                }
                await deleteAllData(babyId);
                return NextResponse.json({ success: true });
            }

            default:
                return NextResponse.json(
                    { success: false, error: 'Action tidak valid' },
                    { status: 400 }
                );
        }
    } catch (error) {
        console.error('Sheets API error:', error);
        return NextResponse.json(
            { success: false, error: 'Terjadi kesalahan server' },
            { status: 500 }
        );
    }
}
