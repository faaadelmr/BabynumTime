export interface Feeding {
  id: string;
  time: string; // ISO string for localStorage compatibility
  type: 'breast' | 'formula';
  quantity: number; // in ml
}
