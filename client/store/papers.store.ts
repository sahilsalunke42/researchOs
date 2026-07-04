import { create } from 'zustand';

interface PapersState {
  papers: unknown[];
  addBatch(batch: unknown[]): void;
  clear(): void;
}

export const usePapersStore = create<PapersState>((set) => ({
  papers: [],
  addBatch: (batch) => set((s) => ({ papers: [...s.papers, ...batch] })),
  clear: () => set({ papers: [] })
}));
