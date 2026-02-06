export interface Feeding {
  id: string;
  time: string; // ISO string for localStorage compatibility
  type: 'breast' | 'formula';
  quantity: number; // in ml
}

export interface Poop {
  id: string;
  time: string; // ISO string
  type: 'biasa' | 'cair' | 'keras';
  notes: string;
  image?: string; // Data URI of the image
}

// Dunstan Baby Language categories
export interface CryAnalysisResult {
  lapar: number;       // "Neh" sound
  mengantuk: number;   // "Owh" sound
  sendawa: number;     // "Eh" sound
  perutKembung: number; // "Eairh" sound
  tidakNyaman: number;  // "Heh" sound
}

export interface CryAnalysis {
  id: string;
  time: string; // ISO string
  result: CryAnalysisResult;
  detectedSound?: string; // Dominant Dunstan sound detected
}

// Diaper Change tracking
export interface DiaperChange {
  id: string;
  time: string; // ISO string
  type: 'basah' | 'kotor' | 'keduanya'; // wet, dirty, or both
  poopType?: 'biasa' | 'cair' | 'keras'; // jenis BAB jika ada
  notes?: string;
  image?: string; // Data URI of the image (untuk BAB)
  aiAnalysis?: PoopAIAnalysis; // AI analysis result
}

// AI Analysis result for poop
export interface PoopAIAnalysis {
  color: string; // warna feses
  consistency: string; // tekstur/konsistensi
  isNormal: boolean; // apakah normal untuk usia bayi
  description: string; // deskripsi tentang feses
  warning?: string; // peringatan jika ada yang tidak normal
  advice: string; // saran untuk orang tua
}

// Mother's Pumping Session
export interface PumpingSession {
  id: string;
  time: string; // ISO string
  volume: number; // in ml
  duration?: number; // in minutes
  side: 'left' | 'right' | 'both';
  notes?: string;
}
