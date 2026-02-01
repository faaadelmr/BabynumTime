import type { PoopAIAnalysis } from '@/lib/types';

declare const puter: {
    ai: {
        chat: (prompt: string, options?: { model?: string }) => Promise<{ message: { content: string } }>;
    };
};

const POOP_ANALYSIS_PROMPT = `Anda adalah ahli kesehatan bayi yang menganalisis foto feses/tinja bayi.

USIA BAYI: {ageInMonths} bulan

Berdasarkan gambar feses bayi yang diberikan, analisis dan berikan respons dalam format JSON berikut:
{
  "color": "warna feses (contoh: kuning keemasan, hijau, coklat, dll)",
  "consistency": "tekstur feses (contoh: lembek, encer, keras, berbiji, dll)",
  "isNormal": true/false,
  "description": "deskripsi singkat tentang kondisi feses sesuai usia bayi",
  "warning": "peringatan jika ada yang tidak normal (kosongkan jika normal)",
  "advice": "saran praktis untuk orang tua"
}

PANDUAN WARNA FESES BAYI:
- NORMAL: Kuning keemasan, kuning mustard, hijau kehijauan ringan (terutama pada bayi ASI)
- PERHATIAN: Hijau gelap terus-menerus
- WARNING/SEGERA KE DOKTER:
  * PUTIH/PUCAT/DEMPUL: Bisa mengindikasikan masalah hati
  * MERAH/BERDARAH: Kemungkinan alergi, infeksi, atau masalah pencernaan
  * HITAM (setelah usia 1 minggu): Bisa mengindikasikan perdarahan

PANDUAN KONSISTENSI:
- Bayi ASI: Lembek seperti pasta, kadang berbiji (normal)
- Bayi susu formula: Lebih padat, seperti selai kacang
- Terlalu encer/berair: Bisa diare
- Terlalu keras/bulat: Bisa konstipasi

Berikan respons HANYA dalam format JSON, tanpa teks tambahan.`;

export async function analyzePoopWithAI(
    imageDataUri: string,
    ageInMonths: number
): Promise<{ success: boolean; data?: PoopAIAnalysis; message?: string }> {
    try {
        if (typeof puter === 'undefined') {
            return {
                success: false,
                message: 'Puter AI tidak tersedia. Pastikan script Puter.js sudah dimuat.',
            };
        }

        if (!imageDataUri || imageDataUri.length < 100) {
            return {
                success: false,
                message: 'Gambar tidak valid. Silakan ambil foto ulang.',
            };
        }

        const prompt = POOP_ANALYSIS_PROMPT.replace('{ageInMonths}', String(ageInMonths));
        const fullPrompt = `${prompt}\n\nGambar feses (base64): ${imageDataUri.substring(0, 200)}...`;

        const response = await puter.ai.chat(fullPrompt, {
            model: 'gpt-4o-mini'
        });

        const content = response.message.content;

        // Extract JSON from response
        const jsonMatch = content.match(/\{[\s\S]*?\}/);
        if (!jsonMatch) {
            return {
                success: false,
                message: 'Tidak dapat menganalisis gambar. Silakan coba lagi.',
            };
        }

        const result = JSON.parse(jsonMatch[0]) as PoopAIAnalysis;

        // Validate required fields
        if (!result.color || !result.consistency || !result.description || !result.advice) {
            return {
                success: false,
                message: 'Hasil analisis tidak lengkap. Silakan coba lagi.',
            };
        }

        return {
            success: true,
            data: result,
        };
    } catch (error) {
        console.error('Error analyzing poop:', error);
        return {
            success: false,
            message: 'Terjadi kesalahan saat menganalisis. Silakan coba lagi.',
        };
    }
}
