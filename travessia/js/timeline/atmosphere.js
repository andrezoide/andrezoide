// Atmosfera: a própria interface atravessa os séculos.
//
// Cada era tem uma paleta e uma textura (curvas de nível, linhas de rumo
// das cartas náuticas, gravura, colunas de jornal, retícula fotográfica,
// grade de dados). A posição do centro da tela define um peso para cada
// era; cores e texturas são interpoladas, nunca trocadas de uma vez.

import { yearToU } from '../core/time.js';

export const ERAS = [
  { id: 'originarios', name: 'Povos originários', start: -50000, end: 1500, texture: 'contours',
    paper: '#e7dac2', paper2: '#dccbad', ink: '#2b1d14', muted: '#6f5a47', accent: '#a4412a', accent2: '#2f5d50' },
  { id: 'colonia', name: 'Colônia', start: 1500, end: 1808, texture: 'rhumb',
    paper: '#ece1c8', paper2: '#e0d2b3', ink: '#2a2118', muted: '#6e5f4b', accent: '#8c2f1b', accent2: '#35597a' },
  { id: 'imperio', name: 'Império', start: 1808, end: 1889, texture: 'engraving',
    paper: '#efeadb', paper2: '#e3dcc8', ink: '#1e2a22', muted: '#5d665c', accent: '#1f5c3a', accent2: '#a07c24' },
  { id: 'republica', name: 'Primeira República', start: 1889, end: 1930, texture: 'newsprint',
    paper: '#ebe9e2', paper2: '#dedbd2', ink: '#1b1b1b', muted: '#5f5d58', accent: '#a8261e', accent2: '#2f4a6d' },
  { id: 'seculo20', name: 'Século XX', start: 1930, end: 1985, texture: 'halftone',
    paper: '#e7e5df', paper2: '#d9d6ce', ink: '#161616', muted: '#5b5a57', accent: '#c4501e', accent2: '#1e6e8c' },
  { id: 'contemporaneo', name: 'Brasil contemporâneo', start: 1985, end: 2031, texture: 'grid',
    paper: '#f3f4f1', paper2: '#e5e8e4', ink: '#111418', muted: '#59616b', accent: '#0b62c4', accent2: '#0c8a62' },
];
ERAS.forEach((e) => { e.u0 = yearToU(e.start); e.u1 = yearToU(e.end); e.rgb = {}; for (const k of TOKENS()) e.rgb[k] = hex(e[k]); });

function TOKENS() { return ['paper', 'paper2', 'ink', 'muted', 'accent', 'accent2']; }
function hex(c) { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }

const BLEND_U = 34; // largura da transição, em unidades virtuais (≈ anos no período moderno)

/** pesos de cada era para uma posição u */
export function eraWeights(u) {
  const w = ERAS.map(() => 0);
  let i = ERAS.findIndex((e) => u < e.u1);
  if (i < 0) i = ERAS.length - 1;
  w[i] = 1;
  const e = ERAS[i];
  // aproximação da fronteira seguinte / anterior
  if (i < ERAS.length - 1 && e.u1 - u < BLEND_U / 2) {
    const t = 0.5 - (e.u1 - u) / BLEND_U; w[i] = 1 - t; w[i + 1] = t;
  } else if (i > 0 && u - e.u0 < BLEND_U / 2) {
    const t = 0.5 - (u - e.u0) / BLEND_U; w[i] = 1 - t; w[i - 1] = t;
  }
  return w;
}

export function blendTokens(weights) {
  const out = {};
  for (const k of TOKENS()) {
    const c = [0, 0, 0];
    weights.forEach((wt, i) => { if (wt) for (let j = 0; j < 3; j++) c[j] += ERAS[i].rgb[k][j] * wt; });
    out[k] = c.map(Math.round);
  }
  return out;
}

let lastKey = '';
export function applyTokens(tokens, weights) {
  const key = Object.values(tokens).join('|');
  if (key === lastKey) return;
  lastKey = key;
  const r = document.documentElement.style;
  for (const [k, [a, b, c]] of Object.entries(tokens)) {
    r.setProperty(`--${k}`, `rgb(${a} ${b} ${c})`);
    r.setProperty(`--${k}-rgb`, `${a} ${b} ${c}`);
  }
  const dom = weights.indexOf(Math.max(...weights));
  document.documentElement.dataset.era = ERAS[dom].id;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = `rgb(${tokens.paper.join(' ')})`;
}

// ------------------------------------------------------------- texturas

const tiles = new Map();
function tile(kind, dpr) {
  const key = kind + dpr;
  if (tiles.has(key)) return tiles.get(key);
  const S = 360, c = document.createElement('canvas');
  c.width = c.height = S * dpr;
  const g = c.getContext('2d');
  g.scale(dpr, dpr);
  g.strokeStyle = '#000'; g.fillStyle = '#000';
  if (kind === 'contours') {
    // curvas de nível / rios — senoides com frequências inteiras para ladrilhar
    g.lineWidth = 0.8;
    for (let row = 0; row < 16; row++) {
      g.beginPath();
      const base = row * (S / 16);
      for (let x = 0; x <= S; x += 4) {
        const y = base + Math.sin((x / S) * Math.PI * 2 * 2 + row * 0.7) * 6 + Math.sin((x / S) * Math.PI * 2 * 5 + row) * 2.4;
        x ? g.lineTo(x, y) : g.moveTo(x, y);
      }
      g.stroke();
    }
  } else if (kind === 'engraving') {
    g.lineWidth = 0.55;
    for (let i = -S; i < S * 2; i += 5) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + S, S); g.stroke(); }
  } else if (kind === 'newsprint') {
    g.lineWidth = 0.8;
    for (let x = 0; x < S; x += 90) { g.beginPath(); g.moveTo(x + 0.5, 0); g.lineTo(x + 0.5, S); g.stroke(); }
    g.lineWidth = 0.5;
    for (let y = 0; y < S; y += 12) for (let x = 0; x < S; x += 90) {
      const len = 60 + ((x * 7 + y * 13) % 22);
      g.beginPath(); g.moveTo(x + 10, y + 6.5); g.lineTo(x + 10 + len, y + 6.5); g.stroke();
    }
  } else if (kind === 'halftone') {
    for (let y = 0; y < S; y += 9) for (let x = 0; x < S; x += 9) {
      const r = 0.6 + 1.9 * (0.5 + 0.5 * Math.sin((x / S) * Math.PI * 2) * Math.cos((y / S) * Math.PI * 4));
      g.beginPath(); g.arc(x + (y / 9 % 2 ? 4.5 : 0), y, r, 0, Math.PI * 2); g.fill();
    }
  } else if (kind === 'grid') {
    for (let x = 0; x <= S; x += 12) {
      g.lineWidth = x % 60 === 0 ? 0.9 : 0.35;
      g.beginPath(); g.moveTo(x + 0.5, 0); g.lineTo(x + 0.5, S); g.stroke();
      g.beginPath(); g.moveTo(0, x + 0.5); g.lineTo(S, x + 0.5); g.stroke();
    }
  }
  c.dataset.kind = key;
  tiles.set(key, c);
  return c;
}

const ALPHA = { contours: 0.11, rhumb: 0.14, engraving: 0.07, newsprint: 0.08, halftone: 0.075, grid: 0.09 };

/**
 * Desenha as texturas em parallax: movem-se mais devagar que os eventos,
 * dando profundidade à travessia.
 */
export function drawAtmosphere(ctx, W, H, dpr, weights, panPx, inkRgb) {
  ctx.clearRect(0, 0, W, H);
  const off = -panPx * 0.22;
  weights.forEach((wt, i) => {
    if (wt < 0.02) return;
    const era = ERAS[i];
    ctx.save();
    ctx.globalAlpha = wt * ALPHA[era.texture];
    if (era.texture === 'rhumb') {
      drawRhumb(ctx, W, H, off, inkRgb);
    } else {
      const t = tile(era.texture, dpr);
      const S = t.width / dpr;
      const ox = ((off % S) + S) % S;
      ctx.translate(ox - S, 0);
      // tinge a textura com a tinta atual
      const pat = ctx.createPattern(tinted(t, inkRgb), 'repeat');
      pat.setTransform(new DOMMatrix().scale(1 / dpr));
      ctx.fillStyle = pat;
      ctx.fillRect(0, 0, W + S * 2, H);
    }
    ctx.restore();
  });
}

const tintCache = new Map();
function tinted(t, rgb) {
  const key = t.dataset.kind + ':' + rgb.join(',');
  if (tintCache.has(key)) return tintCache.get(key);
  const c = document.createElement('canvas'); c.width = t.width; c.height = t.height;
  const g = c.getContext('2d');
  g.drawImage(t, 0, 0);
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = `rgb(${rgb.join(' ')})`; g.fillRect(0, 0, c.width, c.height);
  if (tintCache.size > 40) tintCache.clear();
  tintCache.set(key, c);
  return c;
}

// linhas de rumo das cartas portulanas: rosas dos ventos com 32 raios
function drawRhumb(ctx, W, H, off, rgb) {
  ctx.strokeStyle = ctx.fillStyle = `rgb(${rgb.join(' ')})`;
  ctx.lineWidth = 0.7;
  const spacing = 720;
  const R = Math.hypot(W, H);
  const start = Math.floor((-off - spacing) / spacing);
  for (let n = start; n < start + Math.ceil(W / spacing) + 3; n++) {
    const cx = n * spacing + off + spacing / 2, cy = H * (n % 2 ? 0.3 : 0.7);
    for (let i = 0; i < 32; i++) {
      const a = (i / 32) * Math.PI * 2;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(cx, cy, 26, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2); ctx.fill();
  }
}
