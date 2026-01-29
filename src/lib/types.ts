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
