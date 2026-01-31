'use client';

/**
 * @fileOverview Baby cry analysis using Priscilla Dunstan Baby Language method.
 * Enhanced with better audio processing and more accurate analysis.
 * 
 * Dunstan Baby Language sounds:
 * - "Neh" = Hungry (lapar) - sucking reflex, tongue to palate
 * - "Owh" = Sleepy (mengantuk) - yawning reflex, oval mouth
 * - "Eh" = Needs burping (sendawa) - air trapped in esophagus
 * - "Eairh" = Gas/colic (perut kembung) - air in lower abdomen
 * - "Heh" = Discomfort (tidak nyaman) - skin sensitivity, hot/wet diaper
 */

export interface CryAnalysisInput {
  audioDataUri: string;
}

export interface CryAnalysisOutput {
  lapar: number;       // "Neh" sound
  mengantuk: number;   // "Owh" sound
  sendawa: number;     // "Eh" sound
  perutKembung: number; // "Eairh" sound
  tidakNyaman: number;  // "Heh" sound
}

export interface AnalysisResponse {
  success: boolean;
  data?: CryAnalysisOutput;
  detectedSound?: string;
  soundDescription?: string;
  recommendation?: string;
  needRerecord?: boolean;
  message?: string;
}

declare const puter: {
  ai: {
    chat: (prompt: string, options?: { model?: string }) => Promise<{ message: { content: string } }>;
  };
};

const DUNSTAN_ANALYSIS_PROMPT = `Anda adalah pakar analisis tangisan bayi dengan keahlian khusus dalam metode Dunstan Baby Language yang dikembangkan oleh Priscilla Dunstan.

## METODE DUNSTAN BABY LANGUAGE

Bayi usia 0-3 bulan memiliki 5 suara refleks universal yang dapat diidentifikasi:

### 1. "NEH" - LAPAR
- Karakteristik: Suara "neh neh neh" berulang
- Mekanisme: Refleks menghisap, lidah menekan langit-langit mulut
- Pola: Ritmis, semakin intens jika tidak segera dipenuhi
- Ciri tambahan: Bayi mungkin menoleh mencari payudara/botol

### 2. "OWH" - MENGANTUK  
- Karakteristik: Suara panjang "owwwh" dengan mulut oval
- Mekanisme: Refleks menguap
- Pola: Lambat, bergantian dengan keheningan
- Ciri tambahan: Mata mulai sayu, gerakan melambat

### 3. "EH" - PERLU SENDAWA
- Karakteristik: Suara pendek "eh eh" dari dada/tenggorokan
- Mekanisme: Udara terperangkap di kerongkongan mencoba keluar
- Pola: Terputus-putus, datang tiba-tiba
- Ciri tambahan: Sering setelah menyusu

### 4. "EAIRH" - PERUT KEMBUNG / KOLIK
- Karakteristik: Suara panjang tegang "eairrrhh"
- Mekanisme: Gas/udara terperangkap di perut bawah
- Pola: Tegang, menahan, kadang melengking
- Ciri tambahan: Kaki ditarik ke perut, wajah memerah

### 5. "HEH" - TIDAK NYAMAN
- Karakteristik: Suara "heh heh" breathy/bernapas
- Mekanisme: Respons kulit terhadap ketidaknyamanan
- Pola: Tidak terlalu kuat, cenderung rewel
- Ciri tambahan: Gelisah, menggeliat

## ATURAN ANALISIS

1. **KEJUJURAN PRIORITAS UTAMA**: Jika audio tidak jelas, tidak ada tangisan, hanya noise, atau bukan tangisan bayi - WAJIB menolak analisis.

2. **JANGAN MENGARANG**: Lebih baik meminta rekam ulang daripada memberikan analisis palsu.

3. **IDENTIFIKASI POLA**: Dengarkan pola ritmis, nada, dan intensitas untuk mengidentifikasi suara Dunstan.

4. **BERIKAN REKOMENDASI**: Sertakan saran singkat untuk orangtua.

## FORMAT RESPONS (JSON ONLY)

Jika TIDAK DAPAT DIANALISIS:
{
  "status": "unclear",
  "reason": "alasan spesifik",
  "message": "Pesan untuk user"
}

Jika BERHASIL DIANALISIS:
{
  "status": "success",
  "detected": "NEH/OWH/EH/EAIRH/HEH",
  "description": "Deskripsi singkat suara yang terdeteksi",
  "lapar": 0-100,
  "mengantuk": 0-100,
  "sendawa": 0-100,
  "perutKembung": 0-100,
  "tidakNyaman": 0-100,
  "recommendation": "Saran singkat untuk orangtua"
}

Total persentase HARUS = 100.

BALAS HANYA DENGAN JSON, tanpa penjelasan tambahan.`;

// Recommendations based on detected sound
const RECOMMENDATIONS: Record<string, string> = {
  NEH: "Bayi kemungkinan lapar. Coba tawarkan ASI atau susu formula.",
  OWH: "Bayi tampak mengantuk. Ciptakan suasana tenang dan bantu bayi tidur.",
  EH: "Bayi perlu disendawakan. Gendong tegak dan tepuk punggung lembut.",
  EAIRH: "Bayi mungkin kembung. Coba pijat perut searah jarum jam atau gerakan kaki bersepeda.",
  HEH: "Bayi tidak nyaman. Periksa popok, suhu ruangan, atau posisi bayi.",
};

export async function analyzeCry(input: CryAnalysisInput): Promise<AnalysisResponse> {
  try {
    // Check if puter is available
    if (typeof puter === 'undefined') {
      return {
        success: false,
        message: 'Puter AI tidak tersedia. Pastikan koneksi internet stabil dan refresh halaman.',
      };
    }

    // Validate audio data
    if (!input.audioDataUri || input.audioDataUri.length < 100) {
      return {
        success: false,
        needRerecord: true,
        message: 'Data audio terlalu pendek. Silakan rekam ulang dengan durasi lebih lama.',
      };
    }

    // Send to AI for analysis
    const fullPrompt = `${DUNSTAN_ANALYSIS_PROMPT}\n\n---\nAudio Recording Data:\nFormat: ${input.audioDataUri.split(';')[0].split(':')[1] || 'audio/webm'}\nData: ${input.audioDataUri.substring(0, 200)}... [truncated base64 audio data]`;

    const response = await puter.ai.chat(fullPrompt, {
      model: 'gpt-4o-mini'
    });

    const content = response.message.content.trim();

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        success: false,
        needRerecord: true,
        message: 'AI tidak dapat memproses audio. Silakan rekam ulang tangisan bayi dengan lebih jelas.',
      };
    }

    let result;
    try {
      result = JSON.parse(jsonMatch[0]);
    } catch {
      return {
        success: false,
        needRerecord: true,
        message: 'Format respons AI tidak valid. Silakan coba lagi.',
      };
    }

    // Handle unclear/failed analysis
    if (result.status === 'unclear' || result.status === 'failed') {
      return {
        success: false,
        needRerecord: true,
        message: result.message || result.reason || 'Rekaman tidak jelas. Pastikan merekam tangisan bayi dengan jelas.',
      };
    }

    // Validate required fields
    if (result.lapar === undefined && result.mengantuk === undefined) {
      return {
        success: false,
        needRerecord: true,
        message: 'Tidak terdeteksi pola tangisan bayi. Pastikan audio berisi suara tangisan yang jelas.',
      };
    }

    // Build output with defaults
    const output: CryAnalysisOutput = {
      lapar: Math.max(0, Number(result.lapar) || 0),
      mengantuk: Math.max(0, Number(result.mengantuk) || 0),
      sendawa: Math.max(0, Number(result.sendawa) || 0),
      perutKembung: Math.max(0, Number(result.perutKembung) || 0),
      tidakNyaman: Math.max(0, Number(result.tidakNyaman) || 0),
    };

    // Calculate total and validate
    const total = Object.values(output).reduce((sum, val) => sum + val, 0);

    if (total === 0) {
      return {
        success: false,
        needRerecord: true,
        message: 'Tidak terdeteksi pola tangisan yang dapat diidentifikasi. Silakan rekam ulang.',
      };
    }

    // Normalize to exactly 100%
    const normalizedOutput: CryAnalysisOutput = {
      lapar: Math.round((output.lapar / total) * 100),
      mengantuk: Math.round((output.mengantuk / total) * 100),
      sendawa: Math.round((output.sendawa / total) * 100),
      perutKembung: Math.round((output.perutKembung / total) * 100),
      tidakNyaman: Math.round((output.tidakNyaman / total) * 100),
    };

    // Fix rounding errors
    const finalTotal = Object.values(normalizedOutput).reduce((sum, val) => sum + val, 0);
    const diff = 100 - finalTotal;

    if (diff !== 0) {
      // Find the key with maximum value and adjust
      const entries = Object.entries(normalizedOutput) as [keyof CryAnalysisOutput, number][];
      const maxEntry = entries.reduce((max, curr) => curr[1] > max[1] ? curr : max);
      normalizedOutput[maxEntry[0]] += diff;
    }

    // Get detected sound and recommendation
    const detectedSound = result.detected?.toUpperCase() ||
      (Object.entries(normalizedOutput).reduce((max, curr) =>
        curr[1] > max[1] ? curr : max)[0] as string).toUpperCase();

    const soundKey = detectedSound === 'LAPAR' ? 'NEH' :
      detectedSound === 'MENGANTUK' ? 'OWH' :
        detectedSound === 'SENDAWA' ? 'EH' :
          detectedSound === 'PERUTKEMBUNG' ? 'EAIRH' :
            detectedSound === 'TIDAKNYAMAN' ? 'HEH' : detectedSound;

    return {
      success: true,
      data: normalizedOutput,
      detectedSound: soundKey,
      soundDescription: result.description || undefined,
      recommendation: result.recommendation || RECOMMENDATIONS[soundKey] || undefined,
    };
  } catch (error) {
    console.error('Error analyzing cry:', error);
    return {
      success: false,
      needRerecord: true,
      message: 'Terjadi kesalahan saat menganalisis audio. Pastikan koneksi internet stabil dan coba lagi.',
    };
  }
}
