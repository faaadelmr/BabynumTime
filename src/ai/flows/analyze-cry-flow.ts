
'use server';

/**
 * @fileOverview A baby cry analysis AI agent.
 *
 * - analyzeCry - A function that handles the baby cry analysis process.
 * - CryAnalysisInput - The input type for the analyzeCry function.
 * - CryAnalysisOutput - The return type for the analyzeCry function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const CryAnalysisInputSchema = z.object({
  audioDataUri: z
    .string()
    .describe(
      "An audio recording of a baby's cry, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type CryAnalysisInput = z.infer<typeof CryAnalysisInputSchema>;

const CryAnalysisOutputSchema = z.object({
    lapar: z.number().describe("Persentase kemungkinan bayi lapar."),
    mengantuk: z.number().describe("Persentase kemungkinan bayi mengantuk."),
    tidakNyaman: z.number().describe("Persentase kemungkinan bayi merasa tidak nyaman (misal: popok basah, kepanasan)."),
    sakit: z.number().describe("Persentase kemungkinan bayi merasa sakit atau nyeri."),
    bosan: z.number().describe("Persentase kemungkinan bayi merasa bosan atau butuh perhatian."),
});
export type CryAnalysisOutput = z.infer<typeof CryAnalysisOutputSchema>;


export async function analyzeCry(input: CryAnalysisInput): Promise<CryAnalysisOutput> {
  return analyzeCryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeCryPrompt',
  input: { schema: CryAnalysisInputSchema },
  output: { schema: CryAnalysisOutputSchema },
  prompt: `Anda adalah seorang ahli dalam menganalisis tangisan bayi. Berdasarkan rekaman audio tangisan bayi berikut, prediksi kemungkinan alasan mengapa bayi tersebut menangis.

Berikan analisis Anda sebagai objek JSON dengan kunci berikut, dan nilai persentase probabilitasnya (total harus mendekati 100): 'lapar', 'mengantuk', 'tidakNyaman', 'sakit', 'bosan'.

Contoh: {'lapar': 70, 'mengantuk': 20, 'tidakNyaman': 5, 'sakit': 5, 'bosan': 0}

Audio tangisan: {{media url=audioDataUri}}`,
});

const analyzeCryFlow = ai.defineFlow(
  {
    name: 'analyzeCryFlow',
    inputSchema: CryAnalysisInputSchema,
    outputSchema: CryAnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      throw new Error("AI analysis failed to produce an output.");
    }
    // Normalize to 100%
    const total = Object.values(output).reduce((sum, val) => sum + val, 0);
    if (total === 0) return output; // Avoid division by zero
    
    const normalizedOutput: CryAnalysisOutput = {
        lapar: Math.round((output.lapar / total) * 100),
        mengantuk: Math.round((output.mengantuk / total) * 100),
        tidakNyaman: Math.round((output.tidakNyaman / total) * 100),
        sakit: Math.round((output.sakit / total) * 100),
        bosan: Math.round((output.bosan / total) * 100),
    };
    
    // Adjust rounding errors to make sure it sums to 100
    const finalTotal = Object.values(normalizedOutput).reduce((sum, val) => sum + val, 0);
    const diff = 100 - finalTotal;
    
    // Add difference to the largest value
    if (diff !== 0) {
        let maxKey: keyof CryAnalysisOutput = 'lapar';
        let maxValue = -1;
        for (const key of Object.keys(normalizedOutput) as Array<keyof CryAnalysisOutput>) {
            if (normalizedOutput[key] > maxValue) {
                maxValue = normalizedOutput[key];
                maxKey = key;
            }
        }
        normalizedOutput[maxKey] += diff;
    }

    return normalizedOutput;
  }
);
