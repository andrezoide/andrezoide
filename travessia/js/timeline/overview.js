// Régua geral: toda a história numa faixa, com densidade de acontecimentos
// e a janela visível. Arrastar a janela ou clicar move a câmera.

import { store } from '../core/store.js';
import { U_MAX, yearToU, SEGMENTS } from '../core/time.js';
import { h, clamp } from '../core/dom.js';
import { ERAS } from './atmosphere.js';

const MARKS = [-40000, -10000, -5000, 0, 1000, 1500, 1600, 1700, 1800, 1900, 2000];

export class Overview {
  constructor(root, timeline) {
    this.tl = timeline;
    this.canvas = h('canvas', { 'aria-hidden': 'true' });
    this.win = h('div.ov-window', { role: 'slider', 'aria-label': 'Janela visível na linha do tempo', tabindex: 0 });
    root.append(this.canvas, this.win);
    this.root = root;
    this.#density();
    new ResizeObserver(() => this.draw()).observe(root);
    let drag = null;
    root.addEventListener('pointerdown', (e) => {
      root.setPointerCapture(e.pointerId);
      const r = root.getBoundingClientRect();
      const x = e.clientX - r.left;
      const onWin = e.target === this.win;
      drag = { x, cu: onWin ? this.tl.cu : this.#uAt(x) };
      if (!onWin) this.tl.flyTo(this.#uAt(x) - (this.tl.W / 2 - this.tl.viewCenterX) / this.tl.k, this.tl.k, { duration: 380 });
    });
    root.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const r = root.getBoundingClientRect();
      const dx = e.clientX - r.left - drag.x;
      if (Math.abs(dx) < 2) return;
      cancelAnimationFrame(this.tl.flyRaf);
      this.tl.setView(drag.cu + dx / this.scale, this.tl.k);
    });
    root.addEventListener('pointerup', () => (drag = null));
    this.win.addEventListener('keydown', (e) => {
      const step = (this.tl.W / this.tl.k) * 0.25;
      if (e.key === 'ArrowLeft') this.tl.setView(this.tl.cu - step, this.tl.k);
      if (e.key === 'ArrowRight') this.tl.setView(this.tl.cu + step, this.tl.k);
    });
  }

  get scale() { return this.W / U_MAX; }
  #uAt(x) { return clamp(x / this.scale, 0, U_MAX); }

  #density() {
    const bins = new Float32Array(240);
    for (const e of store.events) {
      const i = Math.min(bins.length - 1, Math.floor((e.u0 / U_MAX) * bins.length));
      bins[i] += e.weight;
    }
    const max = Math.max(...bins);
    this.bins = Array.from(bins, (v) => Math.sqrt(v / max));
  }

  draw() {
    const r = this.root.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.W = r.width; this.H = r.height;
    const c = this.canvas;
    c.width = r.width * dpr; c.height = r.height * dpr;
    c.style.width = r.width + 'px'; c.style.height = r.height + 'px';
    const g = c.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const H = this.H, s = this.scale;
    // eras como faixas de cor
    for (const era of ERAS) {
      g.fillStyle = era.paper2;
      g.fillRect(era.u0 * s, 0, (era.u1 - era.u0) * s, H);
      g.fillStyle = era.accent;
      g.globalAlpha = 0.9;
      g.fillRect(era.u0 * s, H - 3, (era.u1 - era.u0) * s, 3);
      g.globalAlpha = 1;
    }
    // densidade de acontecimentos
    const bw = this.W / this.bins.length;
    g.fillStyle = 'rgba(20,20,20,.55)';
    this.bins.forEach((v, i) => { if (v) g.fillRect(i * bw + 0.5, H - 4 - v * (H - 18), Math.max(1, bw - 1), v * (H - 18)); });
    // marcos
    g.font = '500 9.5px "IBM Plex Mono", monospace';
    g.fillStyle = 'rgba(20,20,20,.75)';
    g.textBaseline = 'top';
    let lastX = -99;
    for (const y of MARKS) {
      const x = yearToU(y) * s;
      if (x - lastX < 34) continue;
      g.fillRect(x, 0, 1, 5);
      g.fillText(y < 0 ? `${-y / 1000}k a.C.` : String(y), x + 3, 2);
      lastX = x;
    }
    for (const seg of SEGMENTS.slice(1)) { g.fillStyle = 'rgba(140,47,27,.8)'; g.fillRect(seg.u0 * s, 0, 1, H); }
    this.update();
  }

  update() {
    if (!this.W) return;
    const { cu, k, W } = this.tl;
    const u0 = cu - W / 2 / k, u1 = cu + W / 2 / k;
    const s = this.scale;
    const x0 = clamp(u0 * s, 0, this.W), x1 = clamp(u1 * s, 0, this.W);
    Object.assign(this.win.style, { left: x0 + 'px', width: Math.max(6, x1 - x0) + 'px' });
    this.win.setAttribute('aria-valuetext', `${Math.round(this.tl.year)}`);
  }
}
