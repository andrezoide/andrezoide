import { create } from 'zustand';
import type { EducationLevel } from '@/types/content';

export type LensMode = 'chronology' | 'area' | 'civilization';

export interface Filters {
  eraIds: string[];
  civilizationIds: string[];
  areaIds: string[];
  levels: EducationLevel[];
}

const EMPTY_FILTERS: Filters = { eraIds: [], civilizationIds: [], areaIds: [], levels: [] };

interface AtlasState {
  lens: LensMode;
  setLens: (lens: LensMode) => void;

  filters: Filters;
  setFilters: (f: Partial<Filters>) => void;
  clearFilters: () => void;

  searchOpen: boolean;
  setSearchOpen: (v: boolean) => void;

  filtersOpen: boolean;
  setFiltersOpen: (v: boolean) => void;

  reducedMotion: boolean;
  setReducedMotion: (v: boolean) => void;

  /** Ano representativo do centro da viewport atual — usado para o tema cronotópico. */
  focusYear: number;
  setFocusYear: (y: number) => void;

  visitedIds: Set<string>;
  markVisited: (id: string) => void;
}

export const useAtlasStore = create<AtlasState>((set, get) => ({
  lens: 'chronology',
  setLens: (lens) => set({ lens }),

  filters: EMPTY_FILTERS,
  setFilters: (f) => set({ filters: { ...get().filters, ...f } }),
  clearFilters: () => set({ filters: EMPTY_FILTERS }),

  searchOpen: false,
  setSearchOpen: (v) => set({ searchOpen: v }),

  filtersOpen: false,
  setFiltersOpen: (v) => set({ filtersOpen: v }),

  reducedMotion:
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  setReducedMotion: (v) => set({ reducedMotion: v }),

  focusYear: 1650,
  setFocusYear: (y) => set({ focusYear: y }),

  visitedIds: new Set(),
  markVisited: (id) =>
    set((s) => {
      const next = new Set(s.visitedIds);
      next.add(id);
      return { visitedIds: next };
    }),
}));
