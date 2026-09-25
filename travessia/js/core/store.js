// Camada de dados: carrega o índice leve, mantém índices em memória e
// responde consultas sobre a rede histórica. Nenhum componente de UI lê
// JSON diretamente — tudo passa por aqui.

import { parseDate, yearToU, formatRange } from './time.js';

const BASE = new URL('../../data/', import.meta.url);
const json = (p) => fetch(new URL(p, BASE)).then((r) => {
  if (!r.ok) throw new Error(`Falha ao carregar ${p}: ${r.status}`);
  return r.json();
});

export const EDGE_TYPES = {
  causa: { label: 'contribuiu para', inverse: 'teve como causa' },
  sucessao: { label: 'foi seguido por', inverse: 'sucedeu' },
  reacao: { label: 'provocou reação em', inverse: 'foi reação a' },
  contexto: { label: 'serve de contexto para', inverse: 'ocorreu no contexto de' },
  relacionado: { label: 'relaciona-se com', inverse: 'relaciona-se com' },
};

export const STATUS = {
  fato: { label: 'Fato documentado', glyph: '●' },
  interpretacao: { label: 'Interpretação historiográfica', glyph: '◐' },
  controversia: { label: 'Controvérsia', glyph: '◑' },
  hipotese: { label: 'Hipótese', glyph: '○' },
  limitada: { label: 'Evidência limitada', glyph: '◌' },
  estimativa: { label: 'Estimativa', glyph: '≈' },
};

class Store {
  async load() {
    const [index, periods, categories, themes, people, places, sources, groups] = await Promise.all([
      json('build/index.json'), json('periods.json'), json('categories.json'), json('themes.json'),
      json('people.json'), json('places.json'), json('sources.json'), json('groups.json'),
    ]);
    this.groups = groups;
    this.groupById = new Map(groups.map((g) => [g.id, g]));
    this.periods = periods.map((p) => ({ ...p, u0: yearToU(p.start), u1: yearToU(p.end) }));
    this.categories = categories;
    this.catById = new Map(categories.map((c) => [c.id, c]));
    this.themes = themes;
    this.themeById = new Map(themes.map((t) => [t.id, t]));
    this.people = people.map((p) => ({ ...p, b: p.born ? parseDate(p.born) : null, d: p.died ? parseDate(p.died) : null }));
    this.personById = new Map(this.people.map((p) => [p.id, p]));
    this.places = places;
    this.placeById = new Map(places.map((p) => [p.id, p]));
    this.sources = sources;
    this.sourceById = new Map(sources.map((s) => [s.id, s]));
    this.chunks = new Map();

    this.events = index.events.map((e) => {
      const s = parseDate(e.start), en = e.end ? parseDate(e.end) : null;
      const t0 = en ? s.y + (s.precision === 'year' ? 0 : s.t - s.y) : s.t;
      const t1 = en ? (en.precision === 'year' ? en.y + 1 : en.t) : s.t;
      return {
        ...e, s, e: en, t0, t1, t: en ? t0 : s.t,
        u0: yearToU(t0), u1: yearToU(t1),
        label: e.dateLabel || formatRange(s, en, e.circa),
        isRange: !!en,
      };
    });
    this.events.sort((a, b) => a.u0 - b.u0);
    this.byId = new Map(this.events.map((e) => [e.id, e]));
    this.maxSpanU = Math.max(0, ...this.events.map((e) => e.u1 - e.u0));

    this.out = new Map(); this.in = new Map();
    for (const ed of index.edges) {
      push(this.out, ed.from, ed); push(this.in, ed.to, ed);
    }
    this.byPerson = new Map(); this.byPlace = new Map(); this.byTheme = new Map();
    for (const e of this.events) {
      e.people?.forEach((p) => push(this.byPerson, p, e));
      e.places?.forEach((p) => push(this.byPlace, p, e));
      e.themes?.forEach((t) => push(this.byTheme, t, e));
    }
    return this;
  }

  period(id) { return this.periods.find((p) => p.id === id); }
  periodAt(year) {
    let best = null;
    for (const p of this.periods) if (year >= p.start && year < p.end) best = p;
    return best || (year < this.periods[0].start ? this.periods[0] : this.periods[this.periods.length - 1]);
  }

  /** eventos com u0 ≤ uR e u1 ≥ uL (busca binária + janela do maior intervalo) */
  inRange(uL, uR, fn) {
    const ev = this.events;
    let lo = 0, hi = ev.length;
    const from = uL - this.maxSpanU;
    while (lo < hi) { const m = (lo + hi) >> 1; if (ev[m].u0 < from) lo = m + 1; else hi = m; }
    for (let i = lo; i < ev.length && ev[i].u0 <= uR; i++) if (ev[i].u1 >= uL) fn(ev[i]);
  }

  edgesFrom(id) { return this.out.get(id) || []; }
  edgesTo(id) { return this.in.get(id) || []; }

  /** antecedentes: percorre arestas causais para trás */
  causes(id, depth = 2) { return this.#walk(id, depth, 'in'); }
  consequences(id, depth = 2) { return this.#walk(id, depth, 'out'); }

  #walk(id, depth, dir) {
    const seen = new Set([id]); const levels = [];
    let frontier = [id];
    for (let d = 0; d < depth; d++) {
      const next = [];
      for (const cur of frontier) {
        const edges = dir === 'in' ? this.edgesTo(cur) : this.edgesFrom(cur);
        for (const ed of edges) {
          if (!['causa', 'reacao', 'sucessao'].includes(ed.type)) continue;
          const other = dir === 'in' ? ed.from : ed.to;
          if (seen.has(other)) continue;
          seen.add(other);
          next.push({ event: this.byId.get(other), edge: ed, via: cur });
        }
      }
      if (!next.length) break;
      next.sort((a, b) => a.event.t - b.event.t);
      levels.push(next); frontier = next.map((n) => n.event.id);
    }
    return levels;
  }

  /** todos os vizinhos diretos, com direção */
  neighbors(id) {
    const out = [];
    for (const ed of this.edgesFrom(id)) out.push({ event: this.byId.get(ed.to), edge: ed, dir: 'out' });
    for (const ed of this.edgesTo(id)) out.push({ event: this.byId.get(ed.from), edge: ed, dir: 'in' });
    return out.filter((n) => n.event);
  }

  /** eventos simultâneos numa janela (anos) em torno do evento */
  simultaneous(ev, win) {
    const a = ev.t0 - win, b = ev.t1 + win;
    return this.events.filter((o) => o.id !== ev.id && o.t1 >= a && o.t0 <= b);
  }

  eventsOfPerson(pid) { return (this.byPerson.get(pid) || []).slice().sort((a, b) => a.t - b.t); }
  eventsOfPlace(id) { return (this.byPlace.get(id) || []).slice().sort((a, b) => a.t - b.t); }
  eventsOfTheme(id) { return (this.byTheme.get(id) || []).slice().sort((a, b) => a.t - b.t); }

  /** pessoas conectadas: relações explícitas + coocorrência em eventos */
  peopleAround(pid) {
    const score = new Map();
    const person = this.personById.get(pid);
    for (const r of person?.relations || []) score.set(r.person, { n: 10, rel: r.type });
    for (const other of this.people) for (const r of other.relations || []) {
      if (r.person === pid && !score.has(other.id)) score.set(other.id, { n: 10, rel: r.type });
    }
    for (const e of this.eventsOfPerson(pid)) for (const p of e.people) {
      if (p === pid) continue;
      const s = score.get(p) || { n: 0 };
      s.n += 1; score.set(p, s);
    }
    return [...score.entries()].map(([id, s]) => ({ person: this.personById.get(id), ...s }))
      .filter((x) => x.person).sort((a, b) => b.n - a.n);
  }

  /** detalhe completo de um evento (carregado sob demanda, por bloco) */
  async detail(id) {
    const ev = this.byId.get(id);
    if (!ev) return null;
    if (!this.chunks.has(ev.chunk)) {
      this.chunks.set(ev.chunk, json(`events/${ev.chunk}.json`).then((arr) => new Map(arr.map((x) => [x.id, x]))));
    }
    const chunk = await this.chunks.get(ev.chunk);
    return { ...chunk.get(id), ...ev };
  }
}

function push(map, k, v) { const a = map.get(k); if (a) a.push(v); else map.set(k, [v]); }

export const store = new Store();
