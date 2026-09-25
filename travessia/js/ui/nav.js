// Orientação e navegação: "você está aqui", controles de escala no palco
// e "viajar para". O usuário nunca depende de uma única forma de navegar.

import { h } from '../core/dom.js';
import { store } from '../core/store.js';
import { yearLabel, monthName, SCALE_LEVELS, SCALE_TARGETS, segmentAtYear, U_MAX } from '../core/time.js';

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI'];

/** nível de detalhe (LOD) derivado da escala */
export const LOD = [
  { id: 0, label: 'grandes marcos' },
  { id: 1, label: 'acontecimentos importantes e personagens' },
  { id: 2, label: 'todos os acontecimentos e relações' },
  { id: 3, label: 'datas, documentos e detalhes' },
];
export function lodOf(ppy) { return ppy < 5 ? 0 : ppy < 45 ? 1 : ppy < 700 ? 2 : 3; }

/**
 * O meio pelo qual cada época registrou a si mesma. Aparece discretamente
 * na interface: a forma de registrar a história também mudou.
 */
const MEDIA = [
  [-Infinity, 'arqueologia', 'vestígios arqueológicos e memória oral'],
  [1500, 'manuscrito', 'cartas, crônicas e cartografia'],
  [1808, 'imprensa', 'imprensa e documentos oficiais'],
  [1840, 'fotografia', 'imprensa e fotografia'],
  [1922, 'radio', 'rádio, imprensa e fotografia'],
  [1950, 'televisao', 'televisão, rádio e imprensa'],
  [1995, 'internet', 'internet'],
  [2010, 'digital', 'redes e mídia digital'],
];
export function mediaOf(year) {
  let m = MEDIA[0];
  for (const x of MEDIA) if (year >= x[0]) m = x;
  return { id: m[1], label: m[2] };
}

// ------------------------------------------------------------ você está aqui

export class WhereAmI {
  constructor(app, root) {
    this.app = app;
    this.crumbs = h('ol.wa-crumbs', { 'aria-label': 'Você está aqui' });
    this.meta = h('p.wa-meta');
    this.el = h('nav.wa', h('span.wa-k', 'Você está aqui'), h('div.wa-body', this.crumbs, this.meta));
    root.append(this.el);
  }

  update(v) {
    const y = v.year;
    const period = store.periodAt(y);
    const group = store.groupById.get(period.group);
    const tl = this.app.timeline;
    const items = [{ label: 'Brasil', title: 'Visão geral de toda a história', go: () => this.app.goOverview() }];
    if (tl.k < tl.kMin * 1.25) {
      items.push({ label: 'toda a história', title: 'Você está vendo tudo, do tempo profundo a hoje', go: () => this.app.goOverview() });
      return this.#render(items, v, y);
    }
    items.push({ label: group.name, title: `Enquadrar ${group.name}`, go: () => tl.frameYears(Math.max(group.start, -12000), Math.min(group.end, new Date().getFullYear() + 1), 0.04) });
    if (store.periods.filter((p) => p.group === group.id).length > 1) {
      items.push({ label: period.short, title: `Abrir o período: ${period.name}`, go: () => this.app.open('periodo', period.id) });
    }
    items.push(this.#timeCrumb(y, v.level.id));
    const f = this.app.focus;
    if (f?.type === 'evento') {
      const ev = store.byId.get(f.id);
      items.push({ label: ev.title, title: 'Voltar ao acontecimento', go: () => tl.frameEvent(ev), here: true });
    }
    this.#render(items, v, y);
  }

  #render(items, v, y) {
    const key = items.map((i) => i.label).join('›');
    if (key !== this.key) {
      this.key = key;
      this.crumbs.replaceChildren(...items.map((it, i) => h('li', { class: it.here || i === items.length - 1 ? 'is-here' : '' },
        h('button.wa-c', { type: 'button', title: it.title, onclick: it.go, 'aria-current': i === items.length - 1 ? 'location' : null }, it.label))));
    }
    const m = mediaOf(y);
    document.documentElement.dataset.media = m.id;
    const meta = `escala: ${v.level.label.toLowerCase()} · mostrando ${LOD[lodOf(v.ppy)].label} · registro da época: ${m.label}`;
    if (meta !== this.meta.textContent) this.meta.textContent = meta;
  }

  #timeCrumb(y, level) {
    const tl = this.app.timeline;
    const Y = Math.floor(y);
    if (level === 'milenios' || level === 'seculos') {
      if (y < 0) {
        const n = level === 'milenios' ? Math.round(-y / 1000) * 1000 : Math.round(-y / 100) * 100;
        return { label: `c. ${yearLabel(-n, { short: true })}`, title: 'Aproximar', go: () => tl.zoomBy(3) };
      }
      const c = Math.floor((Y - 1) / 100) + 1;
      return { label: `século ${ROMAN[c] || c}`, title: `Enquadrar o século ${ROMAN[c]}`, go: () => tl.frameYears((c - 1) * 100 + 1, c * 100 + 1, 0.04) };
    }
    if (level === 'decadas') {
      const d = Math.floor(Y / 10) * 10;
      return { label: `década de ${d}`, title: `Enquadrar a década de ${d}`, go: () => tl.frameYears(d, d + 10, 0.05) };
    }
    if (level === 'anos') return { label: String(Y), title: `O que acontecia em ${Y}`, go: () => this.app.open('ano', Y) };
    const m = Math.floor((y - Y) * 12);
    return { label: `${monthName(m, true)} de ${Y}`, title: `O que acontecia em ${Y}`, go: () => this.app.open('ano', Y) };
  }
}

// ------------------------------------------------------------ controles de escala

export class ZoomControls {
  constructor(app, stage) {
    this.app = app;
    const tl = app.timeline;
    const btn = (cls, label, text, fn) => h(`button.zc-b.${cls}`, { type: 'button', 'aria-label': label, title: label, onclick: fn }, text);
    this.levels = h('div.zc-levels', { role: 'group', 'aria-label': 'Escala do tempo' },
      SCALE_LEVELS.filter((l) => l.id !== 'dias').map((l) => h('button.zc-l', {
        type: 'button', dataset: { lvl: l.id }, title: `Escala: ${l.label}`, 'aria-pressed': 'false',
        onclick: () => this.goLevel(l.id),
      }, l.label)));
    this.el = h('div.tl-ctrl.zc', { role: 'toolbar', 'aria-label': 'Controles de navegação no tempo' },
      btn('zc-out', 'Afastar (menos detalhe)', '−', () => tl.zoomBy(1 / 2.2)),
      this.levels,
      btn('zc-in', 'Aproximar (mais detalhe)', '+', () => tl.zoomBy(2.2)),
      btn('zc-all', 'Visão geral de toda a história', '⤢', () => app.goOverview()),
      btn('zc-list', 'Ver o trecho visível como lista', '≣', () => app.openList()));
    stage.append(this.el);
  }

  goLevel(id) {
    const tl = this.app.timeline;
    const y = tl.u(tl.viewCenterX);
    const f = segmentAtYear(tl.year).f;
    tl.flyTo(y, SCALE_TARGETS[id] / f, { duration: 600 });
  }

  update(v) {
    const lvl = v.level.id === 'dias' ? 'meses' : v.level.id;
    if (lvl === this.lvl) return;
    this.lvl = lvl;
    this.levels.querySelectorAll('.zc-l').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.lvl === lvl)));
  }
}

// ------------------------------------------------------------ viajar para

const STOPS = [
  { label: 'Antes de 1500', range: [-12000, 1500] },
  { y: 1500 }, { y: 1808 }, { y: 1822 }, { y: 1889 }, { y: 1930 }, { y: 1964 }, { y: 1985 }, { y: 2000 },
  { label: 'Hoje', y: new Date().getFullYear() },
];

export class TravelBar {
  constructor(app, root) {
    this.app = app;
    this.el = h('nav.tv', { 'aria-label': 'Viajar para' },
      h('span.tv-k', 'Viajar para'),
      h('ol.tv-list', STOPS.map((s) => h('li', h('button.tv-b', {
        type: 'button',
        title: s.range ? 'Os milhares de anos antes da chegada europeia' : `Ir para ${s.y}`,
        onclick: () => this.go(s),
      }, s.label || String(s.y))))));
    root.append(this.el);
  }

  go(s) {
    const tl = this.app.timeline;
    if (s.range) tl.frameYears(s.range[0], s.range[1], 0.03);
    else tl.frameYears(s.y - 5, s.y + 6, 0.02);
    this.app.emit('interact');
  }
}

export { U_MAX };
