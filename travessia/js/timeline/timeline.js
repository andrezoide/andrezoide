// A linha do tempo como território navegável.
//
// Câmera: centro `cu` (posição virtual) e escala `k` (pixels por unidade).
// Camadas:
//   canvas de fundo  — texturas das eras (parallax)
//   canvas principal — faixas de período, régua, intervalos, arcos da rede
//   DOM              — apenas os marcadores visíveis (virtualizados)
//
// Nada é desenhado fora da janela visível; o DOM é reciclado por id.

import { store } from '../core/store.js';
import { U_MAX, U_MIN, SEGMENTS, uToYear, yearToU, ticksFor, scaleLevel, yearLabel } from '../core/time.js';
import { clamp, lerp, ease, h } from '../core/dom.js';
import { eraWeights, blendTokens, applyTokens, drawAtmosphere, currentEra } from './atmosphere.js';
import { lodOf } from '../ui/nav.js';

// peso mínimo para um acontecimento ganhar rótulo em cada nível de detalhe
const LOD_MIN_WEIGHT = [4, 3, 1, 1];

export const LANES = [
  { id: 'poder', name: 'Poder e conflitos', short: 'Poder' },
  { id: 'territorio', name: 'Território e ambiente', short: 'Território' },
  { id: 'sociedade', name: 'Sociedade e direitos', short: 'Sociedade' },
  { id: 'economia', name: 'Economia e trabalho', short: 'Economia' },
  { id: 'cultura', name: 'Cultura, ciência e técnica', short: 'Cultura' },
  { id: 'mundo', name: 'Enquanto isso, no mundo', short: 'Mundo', world: true },
];

const EDGE_STYLE = {
  causa: { dash: [], width: 1.6, color: 'accent' },
  reacao: { dash: [6, 4], width: 1.4, color: 'accent' },
  sucessao: { dash: [2, 4], width: 1.4, color: 'ink' },
  contexto: { dash: [1, 3], width: 1.3, color: 'accent2' },
  relacionado: { dash: [8, 5], width: 1, color: 'muted' },
};

const FONT_DATE = '500 10.5px "IBM Plex Mono", ui-monospace, monospace';
const FONT_TITLE = '500 13px "IBM Plex Sans Condensed", "Arial Narrow", sans-serif';
const FONT_BIG = '600 15px Fraunces, Georgia, serif';

export class Timeline {
  constructor(root, app) {
    this.app = app;
    this.root = root;
    this.bg = h('canvas.tl-bg', { 'aria-hidden': 'true' });
    this.fg = h('canvas.tl-fg', { 'aria-hidden': 'true' });
    this.layer = h('div.tl-markers', { role: 'list', 'aria-label': 'Acontecimentos visíveis' });
    this.labels = h('div.tl-lanes');
    this.edges = h('div.tl-edges');
    this.tip = h('div.tl-tip', { role: 'tooltip' });
    this.empty = h('div.tl-empty', { 'aria-live': 'polite' }, h('b', 'Trecho ainda sem registros'), 'Afaste o zoom (−) ou siga as bordas para encontrar acontecimentos próximos.');
    root.append(this.bg, this.fg, this.labels, this.layer, this.edges, this.tip, this.empty);
    this.bctx = this.bg.getContext('2d');
    this.ctx = this.fg.getContext('2d');
    this.measure = document.createElement('canvas').getContext('2d');
    this.widths = new Map();
    this.pool = new Map();
    this.cu = yearToU(1000); this.k = 1;
    this.inset = { right: 0, bottom: 0 };
    this.focus = null; this.hover = null; this.highlight = null; this.thread = null; this.span = null;
    this.arcT = 1; this.collapsed = [];
    this.laneEls = LANES.map((l) => {
      const el = h('div.tl-lane', { title: l.name }, h('span.tl-lane-name', l.name), h('span.tl-lane-short', l.short));
      this.labels.append(el);
      return el;
    });
    this.resize();
    this.#bindInput();
    new ResizeObserver(() => { this.resize(); this.requestRender(); }).observe(root);
    document.fonts?.ready.then(() => { this.widths.clear(); this.requestRender(); });
  }

  // ------------------------------------------------------------ geometria

  resize() {
    const r = this.root.getBoundingClientRect();
    const W = Math.max(320, r.width), H = Math.max(300, r.height);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const prevW = this.W;
    Object.assign(this, { W, H, dpr });
    for (const c of [this.bg, this.fg]) {
      c.width = Math.round(W * dpr); c.height = Math.round(H * dpr);
      c.style.width = W + 'px'; c.style.height = H + 'px';
    }
    this.compact = W < 720;
    // no celular, a folha inferior cobre parte do palco: as faixas se comprimem acima dela
    const Hv = Math.max(260, H - (this.inset?.bottom || 0));
    const bandH = this.compact ? 30 : 36;
    const axisH = this.compact ? 34 : 40;
    const worldH = Math.max(this.compact ? 56 : 96, Math.round(Hv * 0.17));
    // faixa de "vidas" (pessoas) logo abaixo dos períodos; no celular não cabe
    const stripH = this.compact ? 0 : 30;
    const top = bandH + stripH + 6;
    const brazilH = Hv - top - axisH - worldH - 6;
    const laneH = brazilH / 5;
    this.rowH = this.compact ? 24 : 27;
    this.cardH = this.compact ? 54 : 70;
    this.geo = { bandH, stripH, axisH, top, axisY: top + brazilH, worldTop: top + brazilH + axisH, H: Hv };
    this.lanes = LANES.map((l, i) => {
      const y0 = l.world ? this.geo.worldTop : top + i * laneH;
      const hgt = l.world ? worldH : laneH;
      const rows = clamp(Math.floor((hgt - 24) / this.rowH), 1, 5);
      const cardRows = clamp(Math.floor((hgt - 20) / this.cardH), 1, 3);
      return { ...l, y0, h: hgt, rows, cardRows, rowTop: Math.min(19, Math.max(0, hgt - rows * this.rowH - 2)), cardTop: Math.min(18, Math.max(0, hgt - cardRows * this.cardH - 2)) };
    });
    this.lanes.forEach((l, i) => Object.assign(this.laneEls[i].style, { top: l.y0 + 'px', height: l.h + 'px' }));
    this.root.classList.toggle('is-squeezed', this.lanes[0].h < 48);
    this.kMin = W / (U_MAX * 1.04);
    this.kMax = 60000;
    if (!prevW) this.k = this.kMin;
    this.k = clamp(this.k, this.kMin, this.kMax);
  }

  setInsetBottom(px) {
    px = Math.max(0, Math.round(px));
    if (px === this.inset.bottom) return;
    this.inset.bottom = px;
    this.resize();
    this.widths.clear();
    this.requestRender();
  }

  laneOf(e) { return e.region === 'mundo' ? 'mundo' : (store.catById.get(e.categories[0])?.lane || 'sociedade'); }
  x(u) { return (u - this.cu) * this.k + this.W / 2; }
  u(x) { return this.cu + (x - this.W / 2) / this.k; }
  get ppy() { const y = uToYear(this.cu); return this.k * SEGMENTS.find((s) => y <= s.b || s === SEGMENTS[SEGMENTS.length - 1]).f; }
  get year() { return uToYear(this.cu); }
  /** centro da área útil (descontando o painel lateral) */
  get viewCenterX() { return (this.W - this.inset.right) / 2; }

  // ------------------------------------------------------------ câmera

  setView(cu, k) {
    this.k = clamp(k, this.kMin, this.kMax);
    const half = this.W / 2 / this.k;
    this.cu = clamp(cu, U_MIN - half * 0.5, U_MAX + half * 0.5);
    this.requestRender();
  }

  zoomAt(px, factor) {
    const ua = this.u(px);
    const k = clamp(this.k * factor, this.kMin, this.kMax);
    this.setView(ua - (px - this.W / 2) / k, k);
  }

  get reducedMotion() { return matchMedia('(prefers-reduced-motion: reduce)').matches; }

  /**
   * Câmera com alvo: roda e teclado definem um destino e a câmera desliza
   * até ele (amortecimento exponencial). Nada é travado — cada novo gesto
   * apenas atualiza o destino, e arrastar cancela o deslize na hora.
   */
  glide(cu, k) {
    k = clamp(k, this.kMin, this.kMax);
    const half = this.W / 2 / k;
    cu = clamp(cu, U_MIN - half * 0.5, U_MAX + half * 0.5);
    if (this.reducedMotion) { this.setView(cu, k); return; }
    cancelAnimationFrame(this.flyRaf); this.inertia = null;
    this.goal = { cu, k };
    if (this.glideRaf) return;
    let last = performance.now();
    const step = (now) => {
      const g = this.goal;
      if (!g) { this.glideRaf = 0; return; }
      const a = 1 - Math.exp(-(now - last) / 75);
      last = now;
      const lk = Math.log(this.k) + (Math.log(g.k) - Math.log(this.k)) * a;
      const ncu = this.cu + (g.cu - this.cu) * a;
      const done = Math.abs(g.cu - ncu) * this.k < 0.4 && Math.abs(Math.log(g.k) - lk) < 0.002;
      this.setView(done ? g.cu : ncu, done ? g.k : Math.exp(lk));
      if (done) { this.goal = null; this.glideRaf = 0; return; }
      this.glideRaf = requestAnimationFrame(step);
    };
    this.glideRaf = requestAnimationFrame(step);
  }

  /** destino atual (ou posição atual, se parado) */
  get aim() { return this.goal || { cu: this.cu, k: this.k }; }

  panBy(px) { const a = this.aim; this.glide(a.cu + px / a.k, a.k); }

  zoomBy(factor, px = this.viewCenterX) {
    const a = this.aim;
    const ua = a.cu + (px - this.W / 2) / a.k;
    const k = clamp(a.k * factor, this.kMin, this.kMax);
    this.glide(ua - (px - this.W / 2) / k, k);
  }

  stopMotion() { cancelAnimationFrame(this.flyRaf); this.goal = null; this.inertia = null; }

  /** voo com afastamento proporcional à distância (sensação de mapa) */
  flyTo(uT, kT, { duration } = {}) {
    kT = clamp(kT ?? this.k, this.kMin, this.kMax);
    // alvo deslocado para o centro da área útil
    uT = uT + (this.W / 2 - this.viewCenterX) / kT;
    const u0 = this.cu, k0 = this.k;
    const dist = Math.abs(uT - u0) * Math.min(k0, kT) / this.W;
    const bump = dist > 1.4 ? Math.log(dist / 1.4) * 0.9 : 0;
    const dur = duration ?? clamp(480 + 220 * Math.log2(1 + dist), 480, 1150);
    if (this.reducedMotion) { this.setView(uT, kT); return; }
    const t0 = performance.now();
    this.stopMotion();
    const step = (now) => {
      const t = clamp((now - t0) / dur, 0, 1), e = ease(t);
      const lk = lerp(Math.log(k0), Math.log(kT), e) - bump * Math.sin(Math.PI * e);
      const k = Math.exp(lk);
      // interpola em espaço de tela para manter a velocidade percebida
      const cu = lerp(u0, uT, e);
      this.setView(cu, k);
      if (t < 1) this.flyRaf = requestAnimationFrame(step);
    };
    this.flyRaf = requestAnimationFrame(step);
  }

  /** enquadra um intervalo de anos na área útil */
  frameYears(y0, y1, pad = 0.18) {
    const u0 = yearToU(y0), u1 = yearToU(y1);
    const avail = (this.W - this.inset.right) * (1 - pad * 2);
    const k = avail / Math.max(u1 - u0, 1e-4);
    this.flyTo((u0 + u1) / 2, k);
  }

  /** enquadra um evento e, quando próximos, seus vizinhos diretos */
  frameEvent(ev, { neighbors = true } = {}) {
    // o acontecimento fica no centro; a escala acomoda os vizinhos próximos
    const c = ev.isRange ? (ev.u0 + ev.u1) / 2 : ev.u0;
    let half = ev.isRange ? (ev.u1 - ev.u0) / 2 : 0;
    if (neighbors) {
      for (const n of store.neighbors(ev.id)) {
        const d = Math.max(Math.abs(n.event.u0 - c), Math.abs(n.event.u1 - c));
        if (d < 36) half = Math.max(half, d);
      }
    }
    const avail = (this.W - this.inset.right) * 0.8;
    let k = avail / Math.max(2 * half, 1e-6);
    k = clamp(k, this.kMin * 3, 900);
    this.flyTo(c, k);
  }

  // ------------------------------------------------------------ entrada

  #bindInput() {
    const el = this.root;
    const pts = new Map();
    let drag = null;

    el.addEventListener('wheel', (e) => {
      if (e.target.closest?.('.tl-ctrl')) return;
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? this.W : 1;
      const dx = e.deltaX * unit, dy = e.deltaY * unit;
      const px = e.clientX - this.root.getBoundingClientRect().left;
      if (e.ctrlKey || e.metaKey) {
        this.zoomBy(Math.exp(-clamp(dy, -120, 120) * 0.0085), px);
      } else if (e.altKey) {
        this.zoomBy(Math.exp(-clamp(dy, -120, 120) * 0.004), px);
      } else {
        // rolar = avançar no tempo (a câmera desliza até o destino)
        const d = Math.abs(dx) > Math.abs(dy) ? dx : dy;
        this.panBy(d);
      }
      this.app.emit('interact');
    }, { passive: false });

    el.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      if (e.target.closest?.('.tl-ctrl')) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      this.stopMotion();
      if (pts.size === 1) drag = { x: e.clientX, y: e.clientY, cu: this.cu, moved: 0, t: performance.now(), vx: 0, lx: e.clientX, lt: performance.now() };
      if (pts.size === 2) {
        const [a, b] = [...pts.values()];
        drag = { pinch: Math.hypot(a.x - b.x, a.y - b.y), k: this.k, mid: (a.x + b.x) / 2 - el.getBoundingClientRect().left, cu: this.cu, moved: 99 };
      }
    });
    el.addEventListener('pointermove', (e) => {
      if (!pts.has(e.pointerId)) { this.#hoverAt(e); return; }
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (!drag) return;
      if (drag.pinch && pts.size >= 2) {
        const [a, b] = [...pts.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        const k = clamp(drag.k * d / drag.pinch, this.kMin, this.kMax);
        const ua = drag.cu + (drag.mid - this.W / 2) / drag.k;
        const mid = (a.x + b.x) / 2 - el.getBoundingClientRect().left;
        this.setView(ua - (mid - this.W / 2) / k, k);
        return;
      }
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      // no celular, o arraste vertical também percorre o tempo
      const d = e.pointerType === 'touch' && Math.abs(dy) > Math.abs(dx) * 1.3 ? -dy : dx;
      drag.moved = Math.max(drag.moved, Math.abs(dx) + Math.abs(dy));
      if (drag.moved > 4) {
        if (!el.hasPointerCapture(e.pointerId)) el.setPointerCapture(e.pointerId);
        el.classList.add('is-dragging');
        this.setView(drag.cu - d / this.k, this.k);
        const now = performance.now();
        const cur = e.pointerType === 'touch' && Math.abs(dy) > Math.abs(dx) * 1.3 ? -e.clientY : e.clientX;
        drag.vx = (cur - (drag.lc ?? cur)) / Math.max(1, now - drag.lt);
        drag.lc = cur; drag.lt = now;
        this.tip.classList.remove('is-on');
      }
    });
    const end = (e) => {
      if (!pts.has(e.pointerId)) return;
      pts.delete(e.pointerId);
      el.classList.remove('is-dragging');
      if (drag && drag.moved > 4) {
        this.suppressClick = true; setTimeout(() => (this.suppressClick = false), 0);
        if (!drag.pinch && Math.abs(drag.vx) > 0.15) this.#coast(drag.vx);
        this.app.emit('interact');
      } else if (drag && e.type === 'pointerup') {
        this.#clickAt(e);
      }
      if (pts.size === 0) drag = null;
      else if (pts.size === 1) { const [p] = [...pts.values()]; drag = { x: p.x, y: p.y, cu: this.cu, moved: 99, lt: performance.now(), vx: 0 }; }
    };
    el.addEventListener('pointerup', end);
    el.addEventListener('pointercancel', end);
    el.addEventListener('pointerleave', () => { if (!pts.size) { this.#setHover(null); if (this.hoverPerson) { this.hoverPerson = null; this.personLit = null; this.requestRender(); } } });
    el.addEventListener('dblclick', (e) => {
      if (e.target.closest('.mk')) return;
      const r = el.getBoundingClientRect();
      this.zoomAtAnimated(e.clientX - r.left, e.shiftKey ? 1 / 2.6 : 2.6);
    });
    el.addEventListener('click', (e) => { if (this.suppressClick) { e.stopPropagation(); e.preventDefault(); } }, true);
  }

  zoomAtAnimated(px, factor) {
    const ua = this.u(px);
    const k = clamp(this.k * factor, this.kMin, this.kMax);
    const cu = ua - (px - this.W / 2) / k;
    this.flyTo(cu - (this.W / 2 - this.viewCenterX) / k, k, { duration: 420 });
  }

  #coast(v) {
    let vel = v * 16; // px por quadro
    const step = () => {
      if (!this.inertia) return;
      vel *= 0.93;
      this.setView(this.cu - vel / this.k, this.k);
      if (Math.abs(vel) > 0.3) requestAnimationFrame(step); else this.inertia = null;
    };
    this.inertia = true;
    requestAnimationFrame(step);
  }

  #hitCollapsed(px, py) {
    let best = null, bd = 10;
    for (const c of this.collapsed) {
      const d = Math.hypot(c.x - px, c.y - py);
      if (d < bd) { bd = d; best = c.ev; }
    }
    return best;
  }

  #lifeAt(px, py) { return this.lifeHits?.find((l) => px >= l.x0 && px <= l.x1 && py >= l.y0 && py <= l.y1)?.p; }

  #hoverAt(e) {
    const mk = e.target.closest?.('.mk');
    if (mk) { this.#setHover(store.byId.get(mk.dataset.id), mk); return; }
    const r = this.root.getBoundingClientRect();
    const person = this.#lifeAt(e.clientX - r.left, e.clientY - r.top);
    if ((person?.id || null) !== (this.hoverPerson || null)) {
      this.hoverPerson = person?.id || null;
      this.personLit = person ? new Set(store.eventsOfPerson(person.id).map((x) => x.id)) : null;
      this.requestRender();
    }
    if (person) {
      this.root.style.cursor = 'pointer';
      this.#setHover(null);
      this.tip.replaceChildren(h('span.tl-tip-date', [person.b ? yearLabel(person.b.y) : '?', person.d ? yearLabel(person.d.y) : ''].join('–')), h('strong.tl-tip-title', person.name), h('span.tl-tip-sum', person.summary), h('span.tl-tip-links', 'clique para ver a trajetória'));
      this.#placeTip(e.clientX - r.left, e.clientY - r.top);
      this.tip.classList.add('is-on');
      return;
    }
    const ev = this.#hitCollapsed(e.clientX - r.left, e.clientY - r.top);
    this.root.style.cursor = ev ? 'pointer' : '';
    this.#setHover(ev, null, e.clientX - r.left, e.clientY - r.top);
  }

  #setHover(ev, mk, px, py) {
    if (this.hover === ev) { if (ev && px != null) this.#placeTip(px, py); return; }
    this.hover = ev || null;
    this.requestRender();
    if (!ev) { this.tip.classList.remove('is-on'); return; }
    this.tip.replaceChildren(
      h('span.tl-tip-date', ev.label),
      h('strong.tl-tip-title', ev.title),
      h('span.tl-tip-sum', ev.summary),
      h('span.tl-tip-links', `${store.neighbors(ev.id).length} conexões · clique para abrir`),
    );
    if (mk) {
      const r = mk.getBoundingClientRect(), rr = this.root.getBoundingClientRect();
      this.#placeTip(r.left - rr.left, r.bottom - rr.top + 4, true);
    } else this.#placeTip(px, py);
    clearTimeout(this.tipTimer);
    this.tipTimer = setTimeout(() => this.hover === ev && this.tip.classList.add('is-on'), mk ? 380 : 60);
  }

  #placeTip(x, y, below) {
    const w = 300;
    const left = clamp(x + (below ? 0 : 14), 8, this.W - w - 8 - this.inset.right);
    let top = below ? y : y + 14;
    if (top + 140 > this.H) top = Math.max(8, y - 150);
    Object.assign(this.tip.style, { left: left + 'px', top: top + 'px', width: w + 'px' });
  }

  #clickAt(e) {
    if (e.target.closest('.mk, .tl-edge, button, a')) return;
    const r = this.root.getBoundingClientRect();
    const person = this.#lifeAt(e.clientX - r.left, e.clientY - r.top);
    if (person) { this.app.open('pessoa', person.id); return; }
    const ev = this.#hitCollapsed(e.clientX - r.left, e.clientY - r.top);
    if (ev) { this.app.portalFrom = new DOMRect(e.clientX - 6, e.clientY - 6, 12, 12); this.app.open('evento', ev.id); }
  }

  // ------------------------------------------------------------ render

  requestRender() {
    if (this.raf) return;
    this.raf = requestAnimationFrame(() => { this.raf = 0; this.render(); });
  }

  animateArcs() {
    const t0 = performance.now();
    const step = (now) => {
      this.arcT = clamp((now - t0) / 700, 0, 1);
      this.render();
      if (this.arcT < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  render() {
    const { W, H, dpr, ctx, geo } = this;
    const uL = this.u(0), uR = this.u(W);
    const ppy = this.ppy;

    // atmosfera
    const weights = eraWeights(this.cu);
    const tokens = blendTokens(weights);
    applyTokens(tokens, weights);
    this.tok = Object.fromEntries(Object.entries(tokens).map(([k, v]) => [k, v.join(' ')]));
    this.bctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawAtmosphere(this.bctx, W, H, dpr, weights, this.cu * this.k, tokens.ink);

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    this.#drawPeriods(uL, uR);
    this.#drawLanes();
    this.#drawAxis(uL, uR);
    this.#drawSpan();

    this.lod = lodOf(this.k * SEGMENTS.find((s) => uToYear(this.u(this.viewCenterX)) <= s.b || s === SEGMENTS[SEGMENTS.length - 1]).f);
    this.#drawGiants(uL, uR);
    this.#drawStrip(uL, uR);
    const placed = this.#layout(uL, uR);
    this.#drawAmbientLinks(placed);
    this.#drawRanges(placed);
    this.#drawCollapsed();
    this.#drawThread(placed);
    this.#drawTrail(placed);
    this.#drawArcs(placed);
    this.#drawPeek(placed);
    this.#syncMarkers(placed);
    const any = placed.some((p) => p.x1 >= 0 && p.x0 <= W - this.inset.right) || this.collapsed.some((c) => c.x >= 0 && c.x <= W);
    this.empty.classList.toggle('is-on', !any);
    this.empty.style.marginLeft = -this.inset.right / 2 + 'px';

    // posição de referência: o centro da área útil, não o da tela
    const uc = this.u(this.viewCenterX), yc = uToYear(uc);
    const ppyc = this.k * SEGMENTS.find((s) => yc <= s.b || s === SEGMENTS[SEGMENTS.length - 1]).f;
    this.app.emit('view', { uL, uR, cu: this.cu, k: this.k, ppy: ppyc, year: yc, level: scaleLevel(ppyc), placed });
  }

  rgba(tok, a) { return `rgb(${this.tok[tok]} / ${a})`; }

  #drawPeriods(uL, uR) {
    const { ctx, geo, W } = this;
    ctx.font = `600 ${this.compact ? 11 : 12}px "IBM Plex Sans Condensed", sans-serif`;
    ctx.textBaseline = 'middle';
    store.periods.forEach((p, i) => {
      if (p.u1 < uL || p.u0 > uR) return;
      const x0 = this.x(p.u0), x1 = this.x(p.u1);
      ctx.fillStyle = this.rgba('ink', i % 2 ? 0.035 : 0.065);
      ctx.fillRect(x0, 0, x1 - x0, geo.bandH);
      // fronteira do período atravessa as faixas
      ctx.strokeStyle = this.rgba('ink', 0.28);
      ctx.setLineDash([2, 5]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(Math.round(x0) + 0.5, 0); ctx.lineTo(Math.round(x0) + 0.5, geo.axisY); ctx.stroke();
      ctx.setLineDash([]);
      // rótulo "fixo" no trecho visível, como nomes de regiões num mapa
      const name = (x1 - x0) > 260 ? p.name : p.short;
      const label = spaced(name.toUpperCase());
      const tw = ctx.measureText(label).width;
      const lx = clamp(Math.max(x0, 0) + 10, x0 + 8, x1 - tw - 10);
      if (x1 - x0 > tw + 16) {
        ctx.fillStyle = this.rgba('ink', 0.78);
        ctx.fillText(label, lx, geo.bandH / 2);
      }
    });
    ctx.fillStyle = this.rgba('ink', 0.5);
    ctx.fillRect(0, geo.bandH - 1, W, 1);
  }

  /** de longe, os grandes períodos aparecem como regiões no mapa */
  #drawGiants(uL, uR) {
    if (this.lod > 0) return;
    const { ctx, geo } = this;
    const mid = (geo.top + geo.axisY) / 2;
    ctx.save();
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const p of store.periods) {
      if (p.u1 < uL || p.u0 > uR) continue;
      const x0 = Math.max(this.x(p.u0), 0), x1 = Math.min(this.x(p.u1), this.W - this.inset.right);
      const w = x1 - x0;
      if (w < 140) continue;
      const size = clamp(w / 9, 22, 64);
      ctx.font = `600 ${size}px Fraunces, Georgia, serif`;
      ctx.fillStyle = this.rgba('ink', 0.07);
      const words = p.short.split(' ');
      const lines = ctx.measureText(p.short).width > w * 0.9 && words.length > 1 ? [words.slice(0, Math.ceil(words.length / 2)).join(' '), words.slice(Math.ceil(words.length / 2)).join(' ')] : [p.short];
      lines.forEach((ln, i) => ctx.fillText(ln, (x0 + x1) / 2, mid + (i - (lines.length - 1) / 2) * size * 1.05));
    }
    ctx.restore();
  }

  /**
   * Faixa superior. De longe: as grandes eras (Antes de 1500, Colônia,
   * Império, República). Mais perto: as vidas dos personagens principais.
   */
  #drawStrip(uL, uR) {
    const { ctx, geo } = this;
    this.lifeHits = [];
    if (!geo.stripH) return;
    const y0 = geo.bandH, H = geo.stripH;
    ctx.fillStyle = this.rgba('paper2', 0.45);
    ctx.fillRect(0, y0, this.W, H);
    ctx.fillStyle = this.rgba('ink', 0.18);
    ctx.fillRect(0, y0 + H - 1, this.W, 1);
    ctx.textBaseline = 'middle';
    if (this.lod === 0) {
      for (const g of store.groups) {
        const x0 = this.x(yearToU(g.start)), x1 = this.x(yearToU(g.end));
        if (x1 < 0 || x0 > this.W) continue;
        ctx.fillStyle = this.rgba('ink', 0.55);
        ctx.fillRect(x0, y0 + H - 4, 1.5, 4);
        ctx.font = '600 10.5px "IBM Plex Mono", monospace';
        const label = g.name.toUpperCase();
        const tw = ctx.measureText(label).width;
        const lx = clamp(Math.max(x0, 0) + 8, x0 + 6, x1 - tw - 8);
        if (x1 - x0 > tw + 14) { ctx.fillStyle = this.rgba('ink', 0.7); ctx.fillText(label, lx, y0 + H / 2); }
      }
      return;
    }
    // vidas: pessoas com datas conhecidas e acontecimentos no trecho
    const score = new Map();
    store.inRange(uL, uR, (e) => { for (const p of e.people) score.set(p, (score.get(p) || 0) + e.weight); });
    const people = [...score.entries()].map(([id, sc]) => ({ p: store.personById.get(id), sc }))
      .filter((x) => x.p && (x.p.b || x.p.d)).sort((a, b) => b.sc - a.sc).slice(0, this.lod === 1 ? 8 : 14);
    const rows = [[], []];
    ctx.font = '500 10.5px "IBM Plex Sans Condensed", sans-serif';
    const focusP = this.focus?.type === 'pessoa' ? this.focus.id : null;
    for (const { p } of people) {
      const b = p.b?.y ?? (p.d.y - 60), d = p.d?.y ?? Math.min(new Date().getFullYear(), b + 90);
      const x0 = this.x(yearToU(b)), x1 = this.x(yearToU(d));
      const label = p.name;
      const tw = ctx.measureText(label).width;
      const lx = clamp(x0, 4, Math.max(4, x1 - tw));
      const a = Math.min(x0, lx), z = Math.max(x1, lx + tw) + 10;
      const r = rows.findIndex((row) => row.every(([p0, p1]) => z < p0 || a > p1));
      if (r < 0) continue;
      rows[r].push([a, z]);
      const yy = y0 + 4 + r * 13;
      const on = focusP === p.id || this.hoverPerson === p.id;
      ctx.fillStyle = this.rgba('accent', on ? 0.9 : 0.45);
      ctx.fillRect(x0, yy + 9, Math.max(2, x1 - x0), on ? 2.5 : 1.5);
      if (!p.b) { ctx.fillStyle = this.rgba('paper2', 1); ctx.fillRect(x0, yy + 8, 12, 4); }
      ctx.fillStyle = this.rgba('ink', on ? 1 : 0.72);
      ctx.fillText(label, lx, yy + 3);
      this.lifeHits.push({ p, x0: a, x1: z, y0: yy - 3, y1: yy + 12 });
    }
  }

  /** de perto, as relações entre os acontecimentos visíveis aparecem discretamente */
  #drawAmbientLinks(placed) {
    if (this.lod < 2 || this.focus || this.hover) return;
    const pos = new Map(placed.map((p) => [p.ev.id, p]));
    const { ctx } = this;
    ctx.save();
    ctx.strokeStyle = this.rgba('accent', 0.16); ctx.lineWidth = 1; ctx.setLineDash([2, 3]);
    for (const p of placed) {
      for (const ed of store.edgesFrom(p.ev.id)) {
        if (ed.type !== 'causa') continue;
        const q = pos.get(ed.to);
        if (!q) continue;
        const x1 = p.ev.isRange ? p.lx + 6 : p.x0, x2 = q.ev.isRange ? q.lx + 6 : q.x0;
        const cx = (x1 + x2) / 2, cy = Math.min(p.y, q.y) - Math.min(90, 16 + Math.abs(x2 - x1) * 0.18);
        ctx.beginPath(); ctx.moveTo(x1, p.y); ctx.quadraticCurveTo(cx, cy, x2, q.y); ctx.stroke();
      }
    }
    ctx.restore();
  }

  #drawLanes() {
    const { ctx, W } = this;
    this.lanes.forEach((l, i) => {
      if (i > 0 && !l.world) { ctx.fillStyle = this.rgba('ink', 0.09); ctx.fillRect(0, Math.round(l.y0), W, 1); }
    });
    const wl = this.lanes[this.lanes.length - 1];
    ctx.fillStyle = this.rgba('accent2', 0.05);
    ctx.fillRect(0, wl.y0, W, wl.h);
  }

  #drawAxis(uL, uR) {
    const { ctx, geo, W } = this;
    const y = geo.axisY;
    ctx.fillStyle = this.rgba('paper2', 0.92);
    ctx.fillRect(0, y, W, geo.axisH);
    ctx.fillStyle = this.rgba('ink', 0.9);
    ctx.fillRect(0, y, W, 1.5);
    ctx.fillRect(0, y + geo.axisH - 1, W, 1);

    // marcas por segmento de escala
    let lastRight = -Infinity;
    for (const s of SEGMENTS) {
      if (s.u1 < uL || s.u0 > uR) continue;
      const y0 = Math.max(s.a, uToYear(uL)), y1 = Math.min(s.b, uToYear(uR));
      const ppy = this.k * s.f;
      if (s.f < 1) {
        // segmento comprimido: hachura discreta na régua
        const x0 = Math.max(0, this.x(s.u0)), x1 = Math.min(W, this.x(s.u1));
        ctx.save(); ctx.beginPath(); ctx.rect(x0, y + 2, x1 - x0, geo.axisH - 3); ctx.clip();
        ctx.strokeStyle = this.rgba('ink', 0.07); ctx.lineWidth = 1;
        for (let hx = x0 - geo.axisH; hx < x1; hx += 7) { ctx.beginPath(); ctx.moveTo(hx, y + geo.axisH); ctx.lineTo(hx + geo.axisH, y); ctx.stroke(); }
        ctx.restore();
      }
      for (const t of ticksFor(y0, y1, ppy)) {
        const x = Math.round(this.x(yearToU(t.t))) + 0.5;
        if (x < -40 || x > W + 40) continue;
        const len = t.rank >= 3 ? 12 : t.rank >= 1 ? 8 : 4;
        ctx.strokeStyle = this.rgba('ink', t.rank >= 3 ? 0.9 : t.rank ? 0.6 : 0.3);
        ctx.lineWidth = t.rank >= 3 ? 1.5 : 1;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + len); ctx.stroke();
        if (t.rank >= 1) {
          // linhas-guia atravessando o território
          ctx.strokeStyle = this.rgba('ink', t.rank >= 3 ? 0.12 : 0.05);
          ctx.beginPath(); ctx.moveTo(x, geo.bandH); ctx.lineTo(x, y); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(x, geo.worldTop); ctx.lineTo(x, geo.H); ctx.stroke();
        }
        if (t.label) {
          ctx.font = `${t.rank >= 3 ? 600 : 500} ${t.rank >= 3 ? 12 : 11}px "IBM Plex Mono", monospace`;
          const tw = ctx.measureText(t.label).width;
          if (x - tw / 2 < lastRight + 10) continue;
          lastRight = x + tw / 2;
          ctx.fillStyle = this.rgba('ink', t.rank >= 3 ? 1 : 0.75);
          ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
          ctx.fillText(t.label, x, y + geo.axisH - 9);
          ctx.textAlign = 'left';
        }
      }
    }
    // quebras de escala
    let lastBreak = -Infinity;
    for (const s of SEGMENTS.slice(1)) {
      const x = this.x(s.u0);
      if (x < -20 || x > W + 20) continue;
      const crowded = x - lastBreak < 200;
      lastBreak = x;
      const prev = SEGMENTS[SEGMENTS.indexOf(s) - 1];
      ctx.strokeStyle = this.rgba('accent', 0.85); ctx.lineWidth = 1.2;
      ctx.beginPath();
      for (let i = 0; i <= 8; i++) ctx.lineTo(x + (i % 2 ? 3 : -3), y + (i / 8) * geo.axisH);
      ctx.stroke();
      if (!this.compact && !crowded) {
        // aviso de compressão, logo acima da régua
        const ratio = Math.round(s.f / prev.f);
        const txt = `← escala ${ratio}× mais comprimida`;
        ctx.font = '500 9.5px "IBM Plex Mono", monospace';
        const tw = ctx.measureText(txt).width;
        ctx.fillStyle = this.rgba('paper', 0.85);
        ctx.fillRect(x - tw - 10, y - 15, tw + 6, 13);
        ctx.fillStyle = this.rgba('accent', 0.95);
        ctx.textBaseline = 'top';
        ctx.fillText(txt, x - tw - 7, y - 13);
      }
    }
    // hoje
    const now = new Date();
    const tNow = now.getFullYear() + (now.getMonth() + now.getDate() / 31) / 12;
    const xn = this.x(yearToU(tNow));
    if (xn > 0 && xn < W) {
      ctx.strokeStyle = this.rgba('accent', 0.9); ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(xn, geo.bandH); ctx.lineTo(xn, geo.H); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = this.rgba('accent', 1);
      ctx.font = '600 10px "IBM Plex Mono", monospace'; ctx.textBaseline = 'top';
      ctx.fillText('HOJE', xn + 4, geo.bandH + 4);
    }
  }

  /** destaque do tempo de vida de uma pessoa */
  #drawSpan() {
    if (!this.span) return;
    const { ctx, geo } = this;
    const x0 = this.x(yearToU(this.span[0])), x1 = this.x(yearToU(this.span[1]));
    ctx.fillStyle = this.rgba('accent', 0.08);
    ctx.fillRect(x0, geo.bandH, x1 - x0, geo.axisY - geo.bandH);
    ctx.fillStyle = this.rgba('accent', 0.85);
    ctx.fillRect(x0, geo.axisY - 3, x1 - x0, 3);
  }

  #visible(e) {
    const f = this.app.state.filters;
    if (f.region !== 'all' && e.region !== f.region) return false;
    if (f.cats.size && !e.categories.some((c) => f.cats.has(c))) return false;
    return true;
  }

  #width(e) {
    const study = this.app.state.study && e.hasStudy;
    const key = e.id + (this.dateStyle || '') + (study ? 's' : '') + (e.weight >= 4 ? currentEra?.id : '');
    let w = this.widths.get(key);
    if (w) return w;
    const m = this.measure;
    m.font = FONT_DATE; const dw = m.measureText(this.#dateText(e)).width;
    m.font = e.weight >= 4 ? (currentEra?.mk || FONT_BIG) : FONT_TITLE; const tw = m.measureText(e.title).width;
    w = 16 + dw + 7 + tw + 8 + (e.debated ? 14 : 0) + (study ? 16 : 0);
    this.widths.set(key, w);
    return w;
  }

  #dateText(e) {
    if (this.dateStyle === 'fine') return e.label.replace(/^c\. /, 'c.');
    if (e.isRange) {
      const a = e.s.y, b = e.e.y;
      if (a < 0) return e.circa ? `c. ${yearLabel(a, { short: true })}` : yearLabel(a, { short: true });
      const c = e.circa ? 'c. ' : '';
      if (a === b) return c + yearLabel(a, { short: true });
      if (b < 0 || a < 1000) return `${c}${a < 0 ? yearLabel(a, { short: true }) : a}–${yearLabel(b, { short: true })}`;
      return `${c}${a}–${String(b).slice(String(a).slice(0, 2) === String(b).slice(0, 2) ? 2 : 0)}`;
    }
    return (e.circa ? 'c. ' : '') + yearLabel(e.s.y, { short: true });
  }

  #layout(uL, uR) {
    const margin = (uR - uL) * 0.35;
    const byLane = new Map(this.lanes.map((l) => [l.id, []]));
    const f = this.focus?.id;
    const related = this.relatedSet;
    // filtros enfatizam (o resto vira contexto discreto) ou, se pedido, ocultam
    const fl = this.app.state.filters;
    const filtering = fl.cats.size > 0 || fl.region !== 'all';
    this.emphasis = filtering ? new Set() : null;
    store.inRange(uL - margin, uR + margin, (e) => {
      const match = this.#visible(e);
      if (!match && e.id !== f && fl.mode === 'ocultar') return;
      if (filtering && match) this.emphasis.add(e.id);
      byLane.get(this.laneOf(e))?.push(e);
    });
    this.dateStyle = this.lod >= 3 ? 'fine' : '';
    const card = this.lod >= 3;
    const minW = LOD_MIN_WEIGHT[this.lod];
    const placed = [];
    this.collapsed = [];
    for (const lane of this.lanes) {
      const list = byLane.get(lane.id);
      const prio = (e) => (e.id === f ? 100 : 0) + (related?.has(e.id) ? 20 : 0) + (this.highlight?.has(e.id) || this.preview?.has(e.id) ? 15 : 0) + e.weight * 2 + (e.isRange ? 0.5 : 0);
      list.sort((a, b) => prio(b) - prio(a) || a.u0 - b.u0);
      const rows = Array.from({ length: card ? lane.cardRows : lane.rows }, () => []);
      for (const e of list) {
        const x0 = this.x(e.u0), x1 = this.x(e.u1);
        // nível de detalhe: de longe, só os grandes marcos ganham rótulo
        const vip = e.id === f || related?.has(e.id) || this.highlight?.has(e.id) || this.emphasis?.has(e.id) || this.preview?.has(e.id);
        const outOfFilter = this.emphasis && !this.emphasis.has(e.id) && e.id !== f;
        if ((e.weight < minW && !vip) || outOfFilter) {
          const cx = e.isRange ? clamp(this.x((e.u0 + e.u1) / 2), x0, x1) : x0;
          if (cx > -10 && cx < this.W + 10) this.collapsed.push({ ev: e, x: cx, y: lane.y0 + lane.h - 6, lane, minor: true });
          continue;
        }
        const full = card ? clamp(this.#width(e) + 24, 230, 330) : this.#width(e);
        const lx = e.isRange ? clamp(x0, Math.min(8, x1 - full), Math.max(x0, x1 - full)) : x0 - (card ? 12 : 6);
        const a = Math.min(x0, lx) - 4;
        // procura a faixa com espaço; se preciso, o rótulo é abreviado
        let row = -1, w = full, best = 0;
        for (let r = 0; r < rows.length; r++) {
          let limit = Infinity, blocked = false;
          for (const [p, q] of rows[r]) {
            if (p <= a && q >= a) { blocked = true; break; }
            if (p > a) limit = Math.min(limit, p);
          }
          if (blocked) continue;
          const room = limit - lx - 8;
          const need = e.isRange ? Math.max(x1 - lx, 0) : 0;
          if (room >= full && room >= need) { row = r; w = full; break; }
          if (room > best && room >= need && room >= Math.min(full, 96)) { best = room; row = r; w = room; }
        }
        const cx = e.isRange ? Math.max(x0, Math.min(x1, lx + 6)) : x0;
        if (row < 0) {
          if (cx > -10 && cx < this.W + 10) this.collapsed.push({ ev: e, x: cx, y: lane.y0 + lane.h - 6, lane });
          continue;
        }
        rows[row].push([a, Math.max(x1, lx + w) + 8]);
        const y = card ? lane.y0 + lane.cardTop + row * this.cardH + this.cardH / 2 : lane.y0 + lane.rowTop + row * this.rowH + this.rowH / 2;
        placed.push({ ev: e, x0, x1, lx, y, w, lane, card });
      }
    }
    return placed;
  }

  #drawRanges(placed) {
    const { ctx } = this;
    for (const p of placed) {
      if (!p.ev.isRange) continue;
      const x0 = Math.max(p.x0, -4), x1 = Math.min(p.x1, this.W + 4);
      if (x1 < 0 || x0 > this.W) continue;
      const tone = p.lane.world ? 'accent2' : 'accent';
      const dim = this.#dimmed(p.ev);
      ctx.fillStyle = this.rgba(tone, dim ? 0.04 : p.ev.circa ? 0.09 : 0.13);
      const hgt = (p.card ? this.cardH : this.rowH) - 7;
      ctx.fillRect(x0, p.y - hgt / 2, Math.max(2, x1 - x0), hgt);
      ctx.fillStyle = this.rgba(tone, dim ? 0.2 : 0.8);
      if (p.x0 >= -2) ctx.fillRect(p.x0, p.y - hgt / 2, 2, hgt);
      if (p.x1 <= this.W + 2) ctx.fillRect(p.x1 - 1, p.y - hgt / 2, 1, hgt);
    }
  }

  #drawCollapsed() {
    const { ctx } = this;
    for (const c of this.collapsed) {
      const dim = this.#dimmed(c.ev);
      ctx.fillStyle = this.rgba(c.lane.world ? 'accent2' : 'ink', dim ? 0.15 : c.minor ? 0.35 : 0.55);
      ctx.beginPath(); ctx.arc(c.x, c.y, c.ev === this.hover ? 3.6 : c.minor ? 1.7 : 2.2, 0, Math.PI * 2); ctx.fill();
    }
  }

  #dimmed(e) {
    if (this.personLit) return !this.personLit.has(e.id);
    if (this.preview) return !this.preview.has(e.id);
    if (this.focus && this.relatedSet) return !this.relatedSet.has(e.id) && e.id !== this.focus.id;
    if (this.highlight) return !this.highlight.has(e.id);
    if (this.emphasis) return !this.emphasis.has(e.id);
    return false;
  }

  /** linha temática: costura os eventos de um tema no território */
  #drawThread(placed) {
    if (!this.thread) return;
    const { ctx } = this;
    const pos = new Map(placed.map((p) => [p.ev.id, p]));
    const pts = this.thread.map((id) => {
      const p = pos.get(id); if (p) return [p.ev.isRange ? p.lx + 6 : p.x0, p.y];
      const e = store.byId.get(id); const c = this.collapsed.find((q) => q.ev.id === id);
      return c ? [c.x, c.y] : [this.x(e.u0), this.geo.axisY - 4];
    });
    ctx.strokeStyle = this.rgba('accent', 0.38); ctx.lineWidth = 1.4; ctx.setLineDash([]); ctx.lineJoin = 'round';
    ctx.beginPath();
    // curvas suaves: a tangente em cada ponto segue a direção geral do fio
    pts.forEach(([x, y], i) => {
      if (!i) return ctx.moveTo(x, y);
      const [px, py] = pts[i - 1];
      const dx = (x - px) * 0.4;
      ctx.bezierCurveTo(px + dx, py, x - dx, y, x, y);
    });
    ctx.stroke();
  }

  /** o caminho que o usuário percorreu pela rede, como um rastro no mapa */
  #drawTrail(placed) {
    const ids = this.app.trail.filter((t) => t.key.startsWith('evento/')).slice(-7).map((t) => t.key.slice(7));
    if (ids.length < 2) return;
    const pts = ids.map((id) => store.byId.get(id)).filter(Boolean).map((e) => this.#posOf(e, placed));
    const { ctx } = this;
    ctx.save();
    ctx.strokeStyle = this.rgba('ink', 0.28); ctx.lineWidth = 1.2; ctx.setLineDash([1, 4]); ctx.lineCap = 'round';
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y + 9) : ctx.moveTo(x, y + 9)));
    ctx.stroke();
    ctx.restore();
  }

  #drawArcs(placed) {
    const src = this.focus?.type === 'evento' ? store.byId.get(this.focus.id) : null;
    const hov = this.hover && this.hover !== src ? this.hover : null;
    const offscreen = { left: [], right: [] };
    for (const [ev, full] of [[src, true], [hov, false]]) {
      if (!ev) continue;
      const pos = this.#posOf(ev, placed);
      if (!pos) continue;
      for (const n of store.neighbors(ev.id)) {
        const q = this.#posOf(n.event, placed);
        const st = EDGE_STYLE[n.edge.type];
        const alpha = full ? 0.9 : 0.45;
        if (!q || q[0] < -30 || q[0] > this.W + 30) {
          if (full) (this.x(n.event.u0) < this.x(ev.u0) ? offscreen.left : offscreen.right).push(n);
          continue;
        }
        this.#arc(pos, q, st, alpha, full ? this.arcT : 1, n.dir === 'out');
      }
    }
    this.#syncEdges(offscreen);
  }

  #drawPeek(placed) {
    if (!this.peekId) return;
    const ev = store.byId.get(this.peekId);
    if (!ev) return;
    const [x, y] = this.#posOf(ev, placed);
    const { ctx } = this;
    ctx.save();
    ctx.strokeStyle = this.rgba('accent', 0.9); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(clamp(x, 8, this.W - this.inset.right - 8), y, 13, 0, Math.PI * 2); ctx.stroke();
    if (x < 0 || x > this.W - this.inset.right) {
      // fora da tela: seta na borda indicando a direção
      const ex = x < 0 ? 14 : this.W - this.inset.right - 14;
      ctx.fillStyle = this.rgba('accent', 0.95);
      ctx.font = '600 11px "IBM Plex Mono", monospace'; ctx.textBaseline = 'middle';
      ctx.textAlign = x < 0 ? 'left' : 'right';
      ctx.fillText(x < 0 ? `← ${yearLabel(ev.s.y)}` : `${yearLabel(ev.s.y)} →`, x < 0 ? 30 : ex - 16, y);
    }
    ctx.restore();
  }

  #posOf(e, placed) {
    const p = placed.find((q) => q.ev.id === e.id);
    if (p) return [p.ev.isRange ? p.lx + 6 : p.x0, p.y];
    const c = this.collapsed.find((q) => q.ev.id === e.id);
    if (c) return [c.x, c.y];
    const x = this.x(e.u0);
    const lane = this.lanes.find((l) => l.id === this.laneOf(e));
    return [x, lane.y0 + lane.h / 2];
  }

  #arc([x1, y1], [x2, y2], st, alpha, t, forward) {
    const { ctx } = this;
    const dx = Math.abs(x2 - x1);
    const lift = Math.min(160, 24 + dx * 0.22);
    const cx = (x1 + x2) / 2, cy = Math.min(y1, y2) - lift;
    ctx.save();
    ctx.strokeStyle = this.rgba(st.color, alpha);
    ctx.lineWidth = st.width;
    ctx.setLineDash(st.dash);
    ctx.beginPath();
    // desenho progressivo: a conexão "nasce" do evento aberto
    const N = 28, end = Math.max(1, Math.round(N * t));
    for (let i = 0; i <= end; i++) {
      const s = i / N;
      const x = (1 - s) * (1 - s) * x1 + 2 * (1 - s) * s * cx + s * s * x2;
      const y = (1 - s) * (1 - s) * y1 + 2 * (1 - s) * s * cy + s * s * y2;
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
    if (t >= 1) {
      // seta indicando o sentido (causa → efeito)
      const [ax, ay, bx, by] = forward ? [cx, cy, x2, y2] : [cx, cy, x1, y1];
      const ang = Math.atan2(by - ay, bx - ax);
      const tx = forward ? x2 : x1, ty = forward ? y2 : y1;
      ctx.setLineDash([]);
      ctx.fillStyle = this.rgba(st.color, alpha);
      ctx.beginPath();
      ctx.moveTo(tx - Math.cos(ang) * 6, ty - Math.sin(ang) * 6 - 2);
      ctx.lineTo(tx - Math.cos(ang) * 6 - Math.cos(ang - 0.5) * 7, ty - Math.sin(ang) * 6 - Math.sin(ang - 0.5) * 7 - 2);
      ctx.lineTo(tx - Math.cos(ang) * 6 - Math.cos(ang + 0.5) * 7, ty - Math.sin(ang) * 6 - Math.sin(ang + 0.5) * 7 - 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /** conexões fora da tela viram atalhos nas bordas */
  #syncEdges(off) {
    const key = JSON.stringify([off.left.map((n) => n.event.id), off.right.map((n) => n.event.id), this.inset.right]);
    if (key === this.edgeKey) return;
    this.edgeKey = key;
    this.edges.replaceChildren();
    for (const side of ['left', 'right']) {
      const list = off[side].sort((a, b) => side === 'left' ? b.event.u0 - a.event.u0 : a.event.u0 - b.event.u0).slice(0, this.compact ? 2 : 4);
      if (!list.length) continue;
      const col = h(`div.tl-edgecol.is-${side}`, { style: side === 'right' ? { right: this.inset.right + 'px' } : {} });
      for (const n of list) {
        col.append(h('button.tl-edge', {
          onclick: () => this.app.open('evento', n.event.id),
          title: `${n.dir === 'in' ? 'Antecedente' : 'Desdobramento'}: ${n.event.title}`,
        }, side === 'left' ? '← ' : '', h('span.tl-edge-date', yearLabel(n.event.s.y, { short: true })), ' ', h('span.tl-edge-title', n.event.title), side === 'right' ? ' →' : ''));
      }
      this.edges.append(col);
    }
  }

  #syncMarkers(placed) {
    const seen = new Set();
    const f = this.focus?.id;
    const study = this.app.state.study;
    for (const p of placed) {
      if (p.lx + p.w < -20 || p.lx > this.W + 20) continue;
      const e = p.ev;
      seen.add(e.id);
      let el = this.pool.get(e.id);
      if (!el) {
        el = h('button.mk', {
          dataset: { id: e.id }, role: 'listitem', type: 'button',
          onclick: (ev) => { ev.stopPropagation(); this.app.portalFrom = el.getBoundingClientRect(); this.app.open('evento', e.id); },
          onfocus: () => this.#setHover(e, el),
          onblur: () => this.#setHover(null),
        }, h('span.mk-dot'), h('span.mk-date'), h('span.mk-title', e.title));
        el.classList.add(`w${e.weight}`);
        if (e.region === 'mundo') el.classList.add('is-world');
        if (e.isRange) el.classList.add('is-range');
        if (e.debated) el.classList.add('is-debated');
        el.setAttribute('aria-label', `${e.label}: ${e.title}`);
        this.pool.set(e.id, el);
        this.layer.append(el);
        el.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' });
      }
      const dt = this.#dateText(e);
      if (el.dataset.dt !== dt) { el.children[1].textContent = dt; el.dataset.dt = dt; }
      if (p.card && !el.querySelector('.mk-card')) el.append(cardBody(e));
      el.classList.toggle('is-card', !!p.card);
      el.style.transform = `translate3d(${Math.round(p.lx)}px, ${Math.round(p.y - (p.card ? 30 : 11))}px, 0)`;
      el.style.maxWidth = Math.round(p.w + (e.id === f ? 16 : 4)) + 'px';
      el.classList.toggle('is-focus', e.id === f);
      el.classList.toggle('is-related', !!this.relatedSet?.has(e.id) && e.id !== f);
      el.classList.toggle('is-dim', this.#dimmed(e));
      el.classList.toggle('is-lit', !!this.highlight?.has(e.id));
      el.classList.toggle('has-study', study && !!e.hasStudy);
      el.classList.toggle('is-visited', this.app.visited.has(e.id));
      el.classList.toggle('is-peek', this.peekId === e.id);
    }
    for (const [id, el] of this.pool) {
      if (!seen.has(id)) { el.remove(); this.pool.delete(id); }
    }
  }

  // ------------------------------------------------------------ estado

  /** destaque passageiro: aponta um acontecimento citado no painel */
  peek(id) {
    if (this.peekId === id) return;
    this.pool.get(this.peekId)?.classList.remove('is-peek');
    this.peekId = id;
    this.pool.get(id)?.classList.add('is-peek');
    this.requestRender();
  }

  setFocus(focus) {
    this.focus = focus;
    this.relatedSet = null;
    this.span = null; this.thread = null; this.highlight = null;
    if (focus?.type === 'evento') {
      this.relatedSet = new Set(store.neighbors(focus.id).map((n) => n.event.id));
      this.animateArcs();
    } else if (focus?.type === 'pessoa') {
      const p = store.personById.get(focus.id);
      const evs = store.eventsOfPerson(focus.id);
      this.highlight = new Set(evs.map((e) => e.id));
      this.thread = evs.map((e) => e.id); // a trajetória costurada no território
      const a = p.b?.y ?? (evs[0] ? evs[0].s.y - 30 : null), b = p.d?.y ?? (p.b ? Math.min(new Date().getFullYear(), p.b.y + 80) : evs.at(-1)?.s.y);
      if (a != null && b != null) this.span = [a, b + 1];
    } else if (focus?.type === 'lugar') {
      this.highlight = new Set(store.eventsOfPlace(focus.id).map((e) => e.id));
    } else if (focus?.type === 'tema') {
      const evs = store.eventsOfTheme(focus.id);
      this.highlight = new Set(evs.map((e) => e.id));
      this.thread = evs.map((e) => e.id);
    } else if (focus?.type === 'periodo') {
      const p = store.period(focus.id);
      this.highlight = new Set(store.events.filter((e) => e.period === p.id).map((e) => e.id));
    }
    this.root.classList.toggle('has-focus', !!focus);
    this.edgeKey = null;
    this.requestRender();
  }
}

/** conteúdo extra do marcador no zoom máximo: resumo e indícios de documentos */
function cardBody(e) {
  const badges = [];
  if (e.nSources) badges.push(`§ ${e.nSources} fonte${e.nSources > 1 ? 's' : ''}`);
  if (e.hasExcerpt) badges.push('❝ documento da época');
  if (e.mediaTypes?.length) badges.push('▣ imagem');
  if (e.hasMap || e.places.length) badges.push('◎ mapa');
  if (e.hasStudy) badges.push('✎ estudo');
  return h('span.mk-card', h('span.mk-sum', e.summary), badges.length ? h('span.mk-badges', badges.join('  ·  ')) : null);
}

// espaçamento de versaletes para o rótulo dos períodos
function spaced(s) { return s.split('').join(' '); }
