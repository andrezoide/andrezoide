export interface PlotScale {
  xScale: (x: number) => number;
  yScale: (y: number) => number;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

/** Escala linear simples para plotar f(x) em um SVG, com preenchimento automático do range de y. */
export function buildPlotScale(
  f: (x: number) => number,
  { width, height, pad, xMin, xMax }: { width: number; height: number; pad: number; xMin: number; xMax: number },
): PlotScale & { path: string } {
  const samples = 60;
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i <= samples; i++) {
    const x = xMin + ((xMax - xMin) * i) / samples;
    pts.push({ x, y: f(x) });
  }
  let yMin = Math.min(...pts.map((p) => p.y));
  let yMax = Math.max(...pts.map((p) => p.y));
  if (!isFinite(yMin) || !isFinite(yMax) || yMin === yMax) {
    yMin = -1;
    yMax = 1;
  }
  const yPad = (yMax - yMin) * 0.15;
  yMin -= yPad;
  yMax += yPad;

  const xScale = (x: number) => pad + ((x - xMin) / (xMax - xMin)) * (width - pad * 2);
  const yScale = (y: number) => height - pad - ((y - yMin) / (yMax - yMin)) * (height - pad * 2);

  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.x).toFixed(1)} ${yScale(p.y).toFixed(1)}`).join(' ');

  return { xScale, yScale, xMin, xMax, yMin, yMax, path };
}
