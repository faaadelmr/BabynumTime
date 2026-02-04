"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Square, Loader2, BarChart, XCircle, RefreshCw, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { analyzeCry, type AnalysisResponse } from '@/ai/flows/analyze-cry-flow';
import type { CryAnalysisResult } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { PuterCredentials } from '@/components/puter-credentials';

// Recording duration in seconds (5 seconds is optimal for capturing baby cry patterns)
const RECORDING_DURATION = 5;

interface CryAnalyzerFormProps {
  onAddAnalysis: (analysis: { result: CryAnalysisResult; time: Date; detectedSound?: string }) => void;
}

// Dunstan Baby Language labels
const reasonLabels: { [key in keyof CryAnalysisResult]: { label: string; sound: string; description: string } } = {
  lapar: { label: 'Lapar', sound: 'NEH', description: 'Refleks menghisap' },
  mengantuk: { label: 'Mengantuk', sound: 'OWH', description: 'Refleks menguap' },
  sendawa: { label: 'Perlu Sendawa', sound: 'EH', description: 'Udara di kerongkongan' },
  perutKembung: { label: 'Perut Kembung', sound: 'EAIRH', description: 'Gas/kolik' },
  tidakNyaman: { label: 'Tidak Nyaman', sound: 'HEH', description: 'Popok basah/kepanasan' },
};

export default function CryAnalyzerForm({ onAddAnalysis }: CryAnalyzerFormProps) {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<CryAnalysisResult | null>(null);
  const [detectedSound, setDetectedSound] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [needRerecord, setNeedRerecord] = useState(false);
  const [rerecordMessage, setRerecordMessage] = useState<string>('');
  const [countdown, setCountdown] = useState<number>(RECORDING_DURATION);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const countdownInterval = useRef<NodeJS.Timeout | null>(null);

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

  const stopRecording = useCallback(() => {
    if (mediaRecorder.current && mediaRecorder.current.state === "recording") {
      mediaRecorder.current.stop();
      setIsRecording(false);
      setCountdown(RECORDING_DURATION);
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
        countdownInterval.current = null;
      }
      toast({ title: 'Perekaman Selesai', description: 'Memproses audio...' });
    }
  }, [toast]);

  const startRecording = () => {
    if (mediaRecorder.current && mediaRecorder.current.state === "inactive") {
      setAnalysisResult(null);
      setDetectedSound(null);
      setAudioBlob(null);
      setNeedRerecord(false);
      setRerecordMessage('');
      setCountdown(RECORDING_DURATION);

      mediaRecorder.current.start();
      setIsRecording(true);
      toast({ title: 'Merekam...', description: `Rekaman akan berhenti dalam ${RECORDING_DURATION} detik.` });

      // Start countdown
      let timeLeft = RECORDING_DURATION;
      countdownInterval.current = setInterval(() => {
        timeLeft -= 1;
        setCountdown(timeLeft);
        if (timeLeft <= 0) {
          stopRecording();
        }
      }, 1000);
    }
  };

  useEffect(() => {
    if (audioBlob) {
      handleAnalyze();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioBlob]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
      }
    };
  }, []);

  const handleAnalyze = async () => {
    if (!audioBlob) return;
    setIsLoading(true);
    setAnalysisResult(null);
    setDetectedSound(null);
    setRecommendation(null);
    setNeedRerecord(false);

    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
      const base64Audio = reader.result as string;
      try {
        const response: AnalysisResponse = await analyzeCry({ audioDataUri: base64Audio });

        if (response.success && response.data) {
          setAnalysisResult(response.data);
          setDetectedSound(response.detectedSound || null);
          setRecommendation(response.recommendation || null);
          // Auto-save ke riwayat
          onAddAnalysis({
            result: response.data,
            time: new Date(),
            detectedSound: response.detectedSound
          });
          toast({
            title: 'Analisis Selesai & Tersimpan!',
            description: response.detectedSound
              ? `Suara "${response.detectedSound}" terdeteksi. Hasil tersimpan ke riwayat.`
              : 'Hasil sudah otomatis tersimpan ke riwayat.',
          });
        } else if (response.needRerecord) {
          setNeedRerecord(true);
          setRerecordMessage(response.message || 'Rekaman tidak jelas. Silakan rekam ulang.');
          toast({
            variant: 'destructive',
            title: 'Perlu Rekam Ulang',
            description: response.message || 'Tidak terdeteksi tangisan bayi yang jelas.',
          });
        } else {
          toast({
            variant: 'destructive',
            title: 'Analisis Gagal',
            description: response.message || 'Terjadi kesalahan.',
          });
        }
      } catch (error) {
        console.error(error);
        setNeedRerecord(true);
        setRerecordMessage('Terjadi kesalahan saat menganalisis. Silakan coba rekam ulang.');
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
      {/* Recording Button with Countdown */}
      <div className="flex flex-col items-center gap-4">
        <Button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isLoading}
          size="lg"
          className={`w-48 h-16 text-lg transition-all ${isRecording ? 'bg-red-500 hover:bg-red-600 animate-pulse' : ''}`}
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

        {/* Countdown Display */}
        {isRecording && (
          <div className="flex flex-col items-center gap-2">
            <div className="text-4xl font-bold text-primary tabular-nums">
              {countdown}
            </div>
            <div className="text-sm text-muted-foreground">
              detik tersisa
            </div>
            <div className="w-48 bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all duration-1000"
                style={{ width: `${(countdown / RECORDING_DURATION) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Dunstan Method Info */}
      {!isRecording && !isLoading && !analysisResult && !needRerecord && (
        <Card className="bg-muted/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Metode Dunstan Baby Language</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-1">
            <p>• <strong>NEH</strong> = Lapar (refleks menghisap)</p>
            <p>• <strong>OWH</strong> = Mengantuk (refleks menguap)</p>
            <p>• <strong>EH</strong> = Perlu sendawa</p>
            <p>• <strong>EAIRH</strong> = Perut kembung/kolik</p>
            <p>• <strong>HEH</strong> = Tidak nyaman</p>
          </CardContent>
        </Card>
      )}

      {/* Pesan untuk rekam ulang */}
      {needRerecord && (
        <Alert variant="destructive">
          <RefreshCw className="h-4 w-4" />
          <AlertTitle>Perlu Rekam Ulang</AlertTitle>
          <AlertDescription>
            {rerecordMessage}
            <br />
            <span className="text-sm opacity-80 mt-1 block">
              Pastikan merekam suara tangisan bayi dengan jelas selama {RECORDING_DURATION} detik.
            </span>
          </AlertDescription>
        </Alert>
      )}

      {/* Analysis Results */}
      {analysisResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-6 w-6" /> Hasil Analisis
              {detectedSound && (
                <span className="ml-auto text-sm font-normal bg-primary/10 text-primary px-2 py-1 rounded">
                  Suara: {detectedSound}
                </span>
              )}
            </CardTitle>
            <CardDescription>
              Analisis berdasarkan metode Dunstan Baby Language. Hasil otomatis tersimpan.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {sortedResults.filter(r => r.probability > 0).map(({ reason, probability }) => (
                <div key={reason} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">
                      {reasonLabels[reason].label}
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({reasonLabels[reason].sound})
                      </span>
                    </span>
                    <span className="font-bold">{probability}%</span>
                  </div>
                  <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all"
                      style={{ width: `${probability}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {reasonLabels[reason].description}
                  </p>
                </div>
              ))}
            </div>

            {/* Recommendation */}
            {recommendation && (
              <Alert className="bg-primary/5 border-primary/20">
                <Lightbulb className="h-4 w-4 text-primary" />
                <AlertTitle className="text-primary">Rekomendasi</AlertTitle>
                <AlertDescription>{recommendation}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      <PuterCredentials />
    </div>
  );
}
