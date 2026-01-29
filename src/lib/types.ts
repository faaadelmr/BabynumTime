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

export interface CryAnalysisResult {
  lapar: number;
  mengantuk: number;
  tidakNyaman: number;
  sakit: number;
  bosan: number;
}

export interface CryAnalysis {
  id: string;
  time: string; // ISO string
  result: CryAnalysisResult;
}
