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
