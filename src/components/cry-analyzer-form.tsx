"use client";

import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Loader2, Save, BarChart, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { analyzeCry } from '@/ai/flows/analyze-cry-flow';
import type { CryAnalysisResult } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface CryAnalyzerFormProps {
  onAddAnalysis: (analysis: { result: CryAnalysisResult; time: Date }) => void;
}

const reasonLabels: { [key in keyof CryAnalysisResult]: string } = {
  lapar: 'Lapar',
  mengantuk: 'Mengantuk',
  tidakNyaman: 'Tidak Nyaman',
  sakit: 'Sakit',
  bosan: 'Bosan',
};

export default function CryAnalyzerForm({ onAddAnalysis }: CryAnalyzerFormProps) {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<CryAnalysisResult | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        setHasPermission(true);
        mediaRecorder.current = new MediaRecorder(stream);
        mediaRecorder.current.ondataavailable = (event) => {
          audioChunks.current.push(event.data);
        };
        mediaRecorder.current.onstop = () => {
          const blob = new Blob(audioChunks.current, { type: 'audio/webm' });
          setAudioBlob(blob);
          audioChunks.current = [];
        };
      })
      .catch(err => {
        console.error("Error accessing microphone:", err);
        setHasPermission(false);
      });
  }, []);

  const startRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state === "inactive") {
      setAnalysisResult(null);
      setAudioBlob(null);
      mediaRecorder.current.start();
      setIsRecording(true);
      toast({ title: 'Merekam...', description: 'Perekaman tangisan bayi dimulai.' });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state === "recording") {
      mediaRecorder.current.stop();
      setIsRecording(false);
      toast({ title: 'Perekaman Selesai', description: 'Memproses audio...' });
      // The onstop event will handle the blob creation
    }
  };
  
  useEffect(() => {
    if (audioBlob) {
      handleAnalyze();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioBlob]);

  const handleAnalyze = async () => {
    if (!audioBlob) return;
    setIsLoading(true);
    setAnalysisResult(null);

    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
      const base64Audio = reader.result as string;
      try {
        const result = await analyzeCry({ audioDataUri: base64Audio });
        setAnalysisResult(result);
        toast({
          title: 'Analisis Selesai!',
          description: 'Lihat kemungkinan alasan bayi Anda menangis.',
        });
      } catch (error) {
        console.error(error);
        toast({
          variant: 'destructive',
          title: 'Analisis Gagal',
          description: 'Maaf, terjadi kesalahan saat menganalisis audio.',
        });
      } finally {
        setIsLoading(false);
      }
    };
  };

  const handleSave = () => {
    if (analysisResult) {
      onAddAnalysis({ result: analysisResult, time: new Date() });
      setAnalysisResult(null);
      setAudioBlob(null);
    }
  };

  if (hasPermission === false) {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertTitle>Akses Mikrofon Dibutuhkan</AlertTitle>
        <AlertDescription>
          Harap izinkan akses mikrofon di peramban Anda untuk menggunakan fitur ini.
        </AlertDescription>
      </Alert>
    );
  }
  
  if (hasPermission === null) {
      return <div className="text-center p-4">Meminta izin mikrofon...</div>
  }

  const sortedResults = analysisResult 
    ? Object.entries(analysisResult)
        .map(([key, value]) => ({ reason: key as keyof CryAnalysisResult, probability: value }))
        .sort((a, b) => b.probability - a.probability)
    : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <Button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isLoading}
          size="lg"
          className="w-48 h-16 text-lg"
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
          ) : isRecording ? (
            <Square className="mr-2 h-6 w-6" />
          ) : (
            <Mic className="mr-2 h-6 w-6" />
          )}
          {isLoading ? 'Menganalisis...' : isRecording ? 'Berhenti' : 'Mulai Merekam'}
        </Button>
      </div>

      {analysisResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-6 w-6" /> Hasil Analisis
            </CardTitle>
            <CardDescription>
              Ini adalah prediksi berdasarkan analisis AI. Ini mungkin tidak 100% akurat.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="space-y-2">
                {sortedResults.filter(r => r.probability > 0).map(({ reason, probability }) => (
                    <div key={reason} className="flex items-center gap-4">
                        <span className="w-24 text-sm font-medium text-muted-foreground">{reasonLabels[reason]}</span>
                        <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
                            <div 
                                className="bg-primary h-full rounded-full flex items-center justify-end pr-2 text-primary-foreground text-xs"
                                style={{ width: `${probability}%` }}
                            >
                            </div>
                        </div>
                         <span className="w-10 text-sm font-bold">{probability}%</span>
                    </div>
                ))}
            </div>
            <Button className="w-full" onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" /> Simpan ke Riwayat
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
