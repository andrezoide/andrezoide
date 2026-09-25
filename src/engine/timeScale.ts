import { ERAS } from '@/data/eras';
import type { Year } from '@/types/content';

/**
 * Escala esquemática do tempo — inspirada em mapas de metrô, não em uma
 * régua proporcional. Cada Era recebe uma largura mínima garantida, para que
 * a Antiguidade (milênios) não esmague o Século XX (décadas) nem o inverso.
 * Dentro de uma Era, a posição é proporcional ao ano real.
 *
 * Isso é o que torna o Atlas "navegável" como um mapa em vez de uma timeline
 * literal: cada grande capítulo da história ocupa um espaço visual
 * comparável, revelando detalhe quando o usuário se aproxima.
 */

interface EraStop {
  eraId: string;
  yStart: Year;
  yEnd: Year;
  xStart: number;
  xEnd: number;
}

const MIN_WEIGHT = 0.35;

function eraWeight(startYear: Year, endYear: Year): number {
  const duration = Math.max(1, endYear - startYear);
  return Math.max(MIN_WEIGHT, Math.log10(duration + 1));
}

function buildStops(): EraStop[] {
  const weights = ERAS.map((e) => eraWeight(e.startYear, e.endYear));
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const totalWidth = 12000; // unidades de mundo arbitrárias (px em k=1)

  let cursor = 0;
  return ERAS.map((era, i) => {
    const width = (weights[i] / totalWeight) * totalWidth;
    const stop: EraStop = {
      eraId: era.id,
      yStart: era.startYear,
      yEnd: era.endYear,
      xStart: cursor,
      xEnd: cursor + width,
    };
    cursor += width;
    return stop;
  });
}

const STOPS = buildStops();

export const WORLD_WIDTH = STOPS[STOPS.length - 1].xEnd;

export function yearToX(year: Year): number {
  const clamped = Math.min(
    Math.max(year, STOPS[0].yStart),
    STOPS[STOPS.length - 1].yEnd,
  );
  const stop =
    STOPS.find((s) => clamped >= s.yStart && clamped <= s.yEnd) ??
    STOPS[STOPS.length - 1];
  const t = (clamped - stop.yStart) / Math.max(1, stop.yEnd - stop.yStart);
  return stop.xStart + t * (stop.xEnd - stop.xStart);
}

export function xToYear(x: number): Year {
  const clamped = Math.min(Math.max(x, 0), WORLD_WIDTH);
  const stop =
    STOPS.find((s) => clamped >= s.xStart && clamped <= s.xEnd) ??
    STOPS[STOPS.length - 1];
  const t = (clamped - stop.xStart) / Math.max(1, stop.xEnd - stop.xStart);
  return Math.round(stop.yStart + t * (stop.yEnd - stop.yStart));
}

export function eraSpan(eraId: string): { xStart: number; xEnd: number } | undefined {
  const stop = STOPS.find((s) => s.eraId === eraId);
  if (!stop) return undefined;
  return { xStart: stop.xStart, xEnd: stop.xEnd };
}

export function formatYear(year: Year): string {
  if (year < 0) return `${Math.abs(year)} a.C.`;
  if (year === 0) return '1 a.C.';
  return `${year}`;
}

export function getStops(): EraStop[] {
  return STOPS;
}
