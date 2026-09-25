import { useEffect, useRef } from 'react';
import { CHRONOTOPES } from './chronotopes';
import { PERIODS } from '@/data/periods';
import { useAtlasStore } from '@/store/atlasStore';
import type { ChronotopeTheme } from '@/types/content';

function themeForYear(year: number): ChronotopeTheme {
  const containing = PERIODS.find((p) => year >= p.startYear && year <= p.endYear);
  if (containing) return CHRONOTOPES[containing.themeId];

  // Sem período exato contendo o ano: usa o período mais próximo.
  let closest = PERIODS[0];
  let closestDist = Infinity;
  for (const p of PERIODS) {
    const mid = (p.startYear + p.endYear) / 2;
    const dist = Math.abs(mid - year);
    if (dist < closestDist) {
      closestDist = dist;
      closest = p;
    }
  }
  return CHRONOTOPES[closest.themeId];
}

function applyTheme(theme: ChronotopeTheme) {
  const root = document.documentElement;
  root.style.setProperty('--atlas-bg', theme.bg);
  root.style.setProperty('--atlas-bg-alt', theme.bgAlt);
  root.style.setProperty('--atlas-surface', theme.surface);
  root.style.setProperty('--atlas-ink', theme.ink);
  root.style.setProperty('--atlas-ink-dim', theme.inkDim);
  root.style.setProperty('--atlas-accent', theme.accent);
  root.style.setProperty('--atlas-accent-alt', theme.accentAlt);
  root.style.setProperty('--atlas-border', theme.border);
  root.style.setProperty('--atlas-font-display', theme.fontDisplay);
  root.setAttribute('data-chronotope', theme.id);
  root.setAttribute('data-texture', theme.texture ?? 'texture-paper');
}

/**
 * Aplica o tema cronotópico correspondente ao ano em foco no Atlas.
 * A transição visual é suave porque as propriedades CSS que consomem essas
 * variáveis (background-color, color, border-color) têm `transition`
 * definida globalmente — não porque interpolamos cor em JS.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const focusYear = useAtlasStore((s) => s.focusYear);
  const lastTheme = useRef<string | null>(null);

  useEffect(() => {
    const theme = themeForYear(focusYear);
    if (lastTheme.current !== theme.id) {
      applyTheme(theme);
      lastTheme.current = theme.id;
    }
  }, [focusYear]);

  return children as React.ReactElement;
}
