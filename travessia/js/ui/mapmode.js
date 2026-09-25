// Modo mapa: a mesma janela de tempo, vista no espaço.
//
// Linha do tempo ⇄ Mapa. O mapa mostra os lugares dos acontecimentos do
// trecho visível; rolar, arrastar a régua geral ou usar ← → continua
// movendo o tempo — o mapa acompanha. Um acontecimento aberto leva suas
// rotas e linhas históricas para o mapa.

import { h, clamp } from '../core/dom.js';
import { store } from '../core/store.js';
import { yearLabel, uToYear } from '../core/time.js';
import { renderMap } from './map.js';

const K = Math.cos((15 * Math.PI) / 180);

export class MapMode {
  constructor(app, stage) {
    this.app = app;
    this.box = h('div.mm-map');
    this.title = h('p.mm-title');
    this.list = h('div.mm-list', { 'aria-live': 'polite' });
    this.el = h('section.mm', { hidden: true, 'aria-label': 'Mapa do trecho de tempo visível' },
      h('header.mm-head', this.title, h('p.mm-hint', 'Role, arraste a régua ou use ← → para mover o tempo; o mapa acompanha.')),
      this.box, this.list);
    stage.append(this.el);
    // rolar sobre o mapa continua atravessando o tempo
    this.el.addEventListener('wheel', (e) => {
      e.preventDefault();
      const tl = app.timeline;
      if (e.ctrlKey || e.metaKey) tl.zoomBy(Math.exp(-clamp(e.deltaY, -120, 120) * 0.0085));
      else tl.panBy(Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY);
    }, { passive: false });
  }

  get on() { return !this.el.hidden; }

  toggle(on = !this.on, { from } = {}) {
    if (on === this.on) return;
    const stage = this.app.stage;
    stage.classList.toggle('is-map', on);
    this.app.emit('mode', on ? 'mapa' : 'linha');
    if (on) {
      this.el.hidden = false;
      this.key = null;
      this.update(this.app.lastView, true);
      // do evento ao lugar: o mapa nasce do ponto de onde se partiu
      if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
        const r = stage.getBoundingClientRect();
        const origin = from ? `${from.left + from.width / 2 - r.left}px ${from.top - r.top}px` : '50% 50%';
        this.el.animate([{ opacity: 0, transform: 'scale(.94)', transformOrigin: origin }, { opacity: 1, transform: 'none', transformOrigin: origin }], { duration: 380, easing: 'cubic-bezier(.2,.7,.2,1)' });
      }
    } else {
      this.el.hidden = true;
    }
  }

  /** abre o mapa centrado nos lugares de um acontecimento */
  show(eventId) {
    const mk = this.app.timeline.pool.get(eventId);
    this.focusId = eventId;
    this.toggle(true, { from: mk?.getBoundingClientRect() });
    this.key = null;
    this.update(this.app.lastView, true);
  }

  update(v, now) {
    if (!this.on || !v) return;
    const tl = this.app.timeline;
    const y0 = uToYear(tl.u(0)), y1 = uToYear(tl.u(tl.W - tl.inset.right));
    const evs = [];
    store.inRange(tl.u(0), tl.u(tl.W - tl.inset.right), (e) => evs.push(e));
    const focus = this.app.focus?.type === 'evento' ? store.byId.get(this.app.focus.id) : (this.focusId ? store.byId.get(this.focusId) : null);
    const key = `${Math.round(y0)}|${Math.round(y1)}|${evs.length}|${focus?.id}|${this.el.clientWidth}`;
    if (key === this.key) return;
    this.key = key;
    clearTimeout(this.t);
    this.t = setTimeout(() => this.#draw(evs, focus, y0, y1), now ? 0 : 140);
  }

  async #draw(evs, focus, y0, y1) {
    const agg = new Map();
    for (const e of evs) for (const pid of e.places) {
      const pl = store.placeById.get(pid);
      if (!pl || pl.world) continue;
      const a = agg.get(pid) || { id: pid, lat: pl.lat, lon: pl.lon, label: pl.name, weight: 0, evs: [] };
      a.weight += e.weight * 0.6; a.evs.push(e); agg.set(pid, a);
    }
    const active = focus ? new Set(focus.places) : null;
    const points = [...agg.values()].sort((a, b) => b.weight - a.weight).map((p, i) => ({ ...p, rank: i, weight: Math.min(p.weight, 6), active: active ? active.has(p.id) : true }));
    if (focus) for (const pid of focus.places) {
      const pl = store.placeById.get(pid);
      if (pl && !pl.world && !agg.has(pid)) points.push({ id: pid, lat: pl.lat, lon: pl.lon, label: pl.name, weight: 3, active: true, rank: 0, evs: [focus] });
    }
    const detail = focus?.hasMap ? (await store.detail(focus.id)).map : null;
    const svg = await renderMap({
      points, routes: detail?.routes, lines: detail?.lines,
      bbox: this.#bbox(focus, points, detail),
      labels: 'top', maxLabels: focus ? 12 : 9,
      pxWidth: this.box.clientWidth,
      ariaLabel: `Mapa de ${points.length} lugares entre ${yearLabel(Math.round(y0))} e ${yearLabel(Math.round(y1))}`,
      onPick: (p) => this.app.open('lugar', p.id),
      onHover: (p) => {
        this.app.timeline.highlight = p ? new Set(p.evs.map((e) => e.id)) : null;
        this.app.timeline.requestRender();
        this.#listFor(p, focus);
      },
    });
    this.box.replaceChildren(svg);
    this.title.replaceChildren(
      h('strong', `${yearLabel(Math.round(y0))} – ${yearLabel(Math.round(y1))}`),
      ` · ${points.length} lugar${points.length === 1 ? '' : 'es'}`,
      ...(focus ? [h('span.mm-focus', ` · em destaque: ${focus.title}`)] : []));
    this.#listFor(null, focus);
  }

  #listFor(p, focus) {
    if (p) {
      this.list.replaceChildren(h('p.mm-list-h', p.label), h('ul', p.evs.slice(0, 6).map((e) => h('li', h('button.mm-ev', { type: 'button', onclick: () => this.app.open('evento', e.id) }, h('span', yearLabel(e.s.y)), ' ', e.title)))));
    } else if (focus) {
      this.list.replaceChildren(h('p.mm-list-h', focus.title), h('p.mm-list-p', focus.places.length ? focus.places.map((id) => store.placeById.get(id)?.name).join(' · ') : 'Sem lugar cadastrado.'));
    } else {
      this.list.replaceChildren(h('p.mm-list-p', 'Passe o cursor por um lugar para ver o que aconteceu ali.'));
    }
  }

  /** enquadramento: os lugares do acontecimento em foco, ou o Brasil inteiro */
  #bbox(focus, points, detail) {
    const box = this.box.getBoundingClientRect();
    const aspect = box.width / Math.max(box.height, 1) || 1.3;
    let pts = [];
    if (focus) {
      pts = focus.places.map((id) => store.placeById.get(id)).filter((p) => p && !p.world).map((p) => [p.lon, p.lat]);
      for (const r of [...(detail?.routes || []), ...(detail?.lines || [])]) for (const [la, lo] of r.points) pts.push([lo, la]);
    }
    let [x0, y0, x1, y1] = [-76, -35, -32, 7];
    if (pts.length) {
      x0 = Math.min(...pts.map((p) => p[0])); x1 = Math.max(...pts.map((p) => p[0]));
      y0 = Math.min(...pts.map((p) => p[1])); y1 = Math.max(...pts.map((p) => p[1]));
      // contexto mínimo ao redor
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      const w = Math.max(x1 - x0 + 8, 16), hh = Math.max(y1 - y0 + 8, 14);
      [x0, x1, y0, y1] = [cx - w / 2, cx + w / 2, cy - hh / 2, cy + hh / 2];
    }
    // ajusta à proporção da caixa, sem distorcer
    const w = (x1 - x0) * K, hh = y1 - y0;
    if (w / hh < aspect) { const d = (hh * aspect / K - (x1 - x0)) / 2; x0 -= d; x1 += d; }
    else { const d = ((x1 - x0) * K / aspect - hh) / 2; y0 -= d; y1 += d; }
    return [x0, y0, x1, y1];
  }
}
