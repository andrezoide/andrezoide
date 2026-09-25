// Busca global: pessoas, acontecimentos, lugares, temas, períodos e datas.
// "1964" posiciona a linha do tempo; "escravidão" percorre vários períodos.

import { h, norm, clamp } from '../core/dom.js';
import { store } from '../core/store.js';
import { yearLabel } from '../core/time.js';

const ROMAN = { i: 1, ii: 2, iii: 3, iv: 4, v: 5, vi: 6, vii: 7, viii: 8, ix: 9, x: 10, xi: 11, xii: 12, xiii: 13, xiv: 14, xv: 15, xvi: 16, xvii: 17, xviii: 18, xix: 19, xx: 20, xxi: 21 };

/** interpreta consultas temporais: ano, década, século, a.C. */
export function parseTime(q) {
  const t = norm(q).trim();
  let m;
  if ((m = /^(\d{1,5})\s*(a\.?\s?c\.?)$/.exec(t))) return { kind: 'ano', y: -+m[1], label: `${(+m[1]).toLocaleString('pt-BR')} a.C.` };
  if ((m = /^(?:decada de |anos )?(\d{3})0s?$/.exec(t)) && /decada|anos|s$/.test(t)) return { kind: 'decada', y0: +m[1] * 10, y1: +m[1] * 10 + 10, label: `Década de ${m[1]}0` };
  if ((m = /^(?:decada de |anos )(\d0)$/.exec(t))) { const d = +m[1]; const y0 = (d >= 30 ? 1900 : 2000) + d; return { kind: 'decada', y0, y1: y0 + 10, label: `Anos ${m[1]} (${y0})` }; }
  if ((m = /^(?:seculo|sec\.?)\s*([ivxl]+|\d{1,2})$/.exec(t))) {
    const n = ROMAN[m[1]] || +m[1];
    if (n >= 1 && n <= 21) return { kind: 'seculo', y0: (n - 1) * 100 + 1, y1: n * 100 + 1, label: `Século ${m[1].toUpperCase()}` };
  }
  if ((m = /^-?\d{1,4}$/.exec(t)) && +t <= new Date().getFullYear()) return { kind: 'ano', y: +t, label: yearLabel(+t) };
  return null;
}

export class Search {
  constructor(app) {
    this.app = app;
    this.items = [
      ...store.events.map((e) => ({ type: 'evento', id: e.id, title: e.title, meta: e.label, w: e.weight, text: norm([e.title, e.summary, e.label, ...e.people.map((p) => store.personById.get(p)?.name), ...e.places.map((p) => store.placeById.get(p)?.name), ...e.themes.map((t) => store.themeById.get(t)?.name), ...e.themes.flatMap((t) => store.themeById.get(t)?.keywords || [])].join(' ')) })),
      ...store.people.map((p) => ({ type: 'pessoa', id: p.id, title: p.name, meta: [p.roles?.[0], p.b ? yearLabel(p.b.y) + (p.d ? '–' + yearLabel(p.d.y) : '') : ''].filter(Boolean).join(' · '), w: 4, text: norm([p.name, p.fullName, p.summary, ...(p.roles || [])].join(' ')) })),
      ...store.places.map((p) => ({ type: 'lugar', id: p.id, title: p.name, meta: p.admin, w: 3, text: norm([p.name, p.admin, p.kind].join(' ')) })),
      ...store.themes.map((t) => ({ type: 'tema', id: t.id, title: t.name, meta: 'linha temática', w: 5, text: norm([t.name, t.summary, ...t.keywords].join(' ')) })),
      ...store.periods.map((p) => ({ type: 'periodo', id: p.id, title: p.name, meta: `${yearLabel(p.start)} – ${p.end > 2025 ? 'hoje' : p.end}`, w: 5, text: norm([p.name, p.short, p.summary].join(' ')) })),
    ];
    for (const it of this.items) it.ntitle = norm(it.title);
    this.#build();
  }

  #build() {
    this.input = h('input.sr-input', { type: 'search', placeholder: 'Pessoas, acontecimentos, lugares, temas, anos…', 'aria-label': 'Buscar', autocomplete: 'off', spellcheck: false });
    this.list = h('ul.sr-list', { role: 'listbox' });
    this.hint = h('p.sr-hint', 'Experimente: ', ['Getúlio Vargas', 'escravidão', '1964', 'século XVIII', 'Salvador', 'anos 60'].map((q, i) => [i ? ' · ' : '', h('button.sr-try', { type: 'button', onclick: () => { this.input.value = q; this.run(); this.input.focus(); } }, q)]));
    this.el = h('div.sr', { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Busca', hidden: true },
      h('div.sr-scrim', { onclick: () => this.close() }),
      h('div.sr-box', h('div.sr-field', h('span.sr-ic', { 'aria-hidden': 'true' }, '⌕'), this.input, h('kbd', 'esc')), this.hint, this.list));
    document.body.append(this.el);
    this.input.addEventListener('input', () => this.run());
    this.input.addEventListener('keydown', (e) => {
      const n = this.results?.length || 0;
      if (e.key === 'ArrowDown') { this.sel = clamp((this.sel ?? -1) + 1, 0, n - 1); this.#mark(); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { this.sel = clamp((this.sel ?? 0) - 1, 0, n - 1); this.#mark(); e.preventDefault(); }
      else if (e.key === 'Enter' && n) { this.results[this.sel ?? 0].go(); }
      else if (e.key === 'Escape') this.close();
    });
  }

  open(q = '') {
    this.el.hidden = false;
    this.input.value = q;
    this.run();
    requestAnimationFrame(() => this.input.focus());
  }
  close() { this.el.hidden = true; this.#preview(null); this.app.stage.focus?.(); }

  /** enquanto se digita, a linha do tempo mostra onde estão os resultados */
  #preview(ids) {
    const tl = this.app.timeline;
    tl.preview = ids?.size ? ids : null;
    tl.requestRender();
  }

  query(q) {
    const nq = norm(q).trim();
    if (!nq) return [];
    const words = nq.split(/\s+/).filter(Boolean);
    const out = [];
    const time = parseTime(q);
    if (time) {
      const go = () => {
        this.close();
        if (time.kind === 'ano') this.app.open('ano', time.y);
        else { this.app.close(); this.app.timeline.frameYears(time.y0, time.y1, 0.04); }
      };
      out.push({ type: 'tempo', title: `Ir para ${time.label}`, meta: time.kind === 'ano' ? 'posicionar a linha do tempo' : 'enquadrar o intervalo', score: 1000, go });
      const [a, b] = time.kind === 'ano' ? [time.y, time.y + 1] : [time.y0, time.y1];
      store.events.filter((e) => e.t0 < b && e.t1 >= a).sort((x, y) => y.weight - x.weight).slice(0, 8)
        .forEach((e) => out.push({ type: 'evento', id: e.id, title: e.title, meta: e.label, score: 500 + e.weight }));
    }
    for (const it of this.items) {
      let score = 0;
      if (it.ntitle === nq) score += 120;
      else if (it.ntitle.startsWith(nq)) score += 80;
      else if (it.ntitle.includes(nq)) score += 50;
      let all = true;
      for (const w of words) {
        if (it.ntitle.includes(w)) score += 14;
        else if (it.text.includes(w)) score += w.length > 3 ? 6 : 2;
        else all = false;
      }
      if (!all && score < 50) continue;
      if (score) out.push({ ...it, score: score + it.w * 1.5 + ({ tema: 6, pessoa: 8 }[it.type] || 0) });
    }
    const seen = new Set();
    return out.sort((a, b) => b.score - a.score).filter((r) => {
      const k = r.type + r.id + r.title;
      if (seen.has(k)) return false; seen.add(k); return true;
    }).slice(0, 24).map((r) => ({ ...r, go: r.go || (() => { this.close(); this.app.open(r.type, r.id, { pulse: r.type === 'evento' }); }) }));
  }

  run() {
    const q = this.input.value;
    const flat = this.query(q);
    // agrupa por tipo, na ordem do melhor resultado de cada grupo
    const GROUP = { tempo: 'Ir para', pessoa: 'Pessoas — trajetória na linha do tempo', tema: 'Temas — linhas que atravessam períodos', evento: 'Acontecimentos', periodo: 'Períodos', lugar: 'Lugares' };
    const groups = new Map();
    for (const r of flat) { if (!groups.has(r.type)) groups.set(r.type, []); groups.get(r.type).push(r); }
    this.results = [...groups.values()].flatMap((g) => g.slice(0, g[0].type === 'evento' ? 10 : 5));
    this.sel = this.results.length ? 0 : null;
    this.hint.hidden = !!q.trim();
    const LABEL = { evento: 'acontecimento', pessoa: 'pessoa', lugar: 'lugar', tema: 'tema', periodo: 'período', tempo: 'tempo' };
    let i = -1;
    this.list.replaceChildren(...[...groups.entries()].map(([type, list]) => h('li.sr-group', { role: 'presentation' },
      h('p.sr-group-h', GROUP[type]),
      h('ul', { role: 'group' }, list.slice(0, type === 'evento' ? 10 : 5).map((r) => { const idx = ++i; return h('li', { role: 'option' },
        h('button.sr-item', { type: 'button', onclick: r.go, onmouseenter: () => { this.sel = idx; this.#mark(); } },
          h(`span.sr-type.t-${r.type}`, LABEL[r.type]), h('span.sr-title', r.title), h('span.sr-meta', r.meta || ''))); })))));
    // prévia: acontecimentos encontrados, trajetória da pessoa ou linha do tema
    const ids = new Set();
    for (const r of this.results.slice(0, 12)) {
      if (r.type === 'evento') ids.add(r.id);
      else if (r.type === 'pessoa') store.eventsOfPerson(r.id).forEach((e) => ids.add(e.id));
      else if (r.type === 'tema') store.eventsOfTheme(r.id).forEach((e) => ids.add(e.id));
    }
    this.#preview(q.trim() ? ids : null);
    if (q.trim() && !this.results.length) this.list.append(h('li.sr-empty', 'Nada encontrado. Tente outro nome, um ano ou um tema.'));
    this.#mark();
  }

  #mark() {
    [...this.list.querySelectorAll('.sr-item')].forEach((b, i) => {
      b.classList.toggle('is-sel', i === this.sel);
      if (i === this.sel) {
        const l = this.list, top = b.offsetTop, bot = top + b.offsetHeight;
        if (top < l.scrollTop) l.scrollTop = top - 6; else if (bot > l.scrollTop + l.clientHeight) l.scrollTop = bot - l.clientHeight + 6;
      }
    });
  }
}
