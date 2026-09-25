// Blocos reutilizáveis dos painéis. Todos são gerados a partir dos dados.

import { h, s, clamp } from '../core/dom.js';
import { store, STATUS, EDGE_TYPES } from '../core/store.js';
import { yearLabel } from '../core/time.js';
import { LANES } from '../timeline/timeline.js';

export const link = (app, type, id, ...content) => h('a.xlink', {
  href: `#/${type}/${id}`,
  onclick: (e) => { e.preventDefault(); app.open(type, id); },
}, ...content);

export function section(title, ...content) {
  const body = content.flat().filter(Boolean);
  if (!body.length) return null;
  return h('section.pv-sec', h('h3.pv-h', title), ...body);
}

export function statusBadge(status) {
  const st = STATUS[status];
  return h(`span.st.st-${status}`, { title: st.label }, h('span.st-g', st.glyph), ' ', st.label);
}

/** data curta para listas: intervalos só com anos */
export const chipDate = (ev) => ev.isRange
  ? (ev.s.y === ev.e.y ? yearLabel(ev.s.y) : `${ev.circa ? 'c. ' : ''}${yearLabel(ev.s.y, { short: true })}–${yearLabel(ev.e.y, { short: true })}`)
  : ev.label;

export function eventChip(app, ev, extra) {
  return h('a.evchip', {
    href: `#/evento/${ev.id}`,
    onclick: (e) => { e.preventDefault(); app.open('evento', ev.id); },
  }, h('span.evchip-date', chipDate(ev)), h('span.evchip-title', ev.title), extra ? h('span.evchip-note', extra) : null);
}

export function personChip(app, p, note) {
  const dates = p.b || p.d ? `${p.b ? yearLabel(p.b.y) : '?'}–${p.d ? yearLabel(p.d.y) : ''}` : '';
  return h('a.pchip', { href: `#/pessoa/${p.id}`, onclick: (e) => { e.preventDefault(); app.open('pessoa', p.id); } },
    h('span.pchip-mono', initials(p.name)),
    h('span.pchip-body', h('span.pchip-name', p.name), h('span.pchip-meta', [p.roles?.[0], dates].filter(Boolean).join(' · ') + (note ? ` · ${note}` : ''))));
}

const initials = (n) => n.replace(/^(D\.|Dom|Frei|Barão de|Duque de|Princesa)\s+/, '').split(/\s+/).filter((w) => w.length > 2).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

// -------------------------------------------------------- cadeia causal

/** ANTECEDENTES → CAUSAS → ACONTECIMENTO → CONSEQUÊNCIAS → EFEITOS FUTUROS */
export function causalChain(app, ev, detail) {
  const before = store.causes(ev.id, 2);
  const after = store.consequences(ev.id, 2);
  const ctx = store.edgesTo(ev.id).filter((e) => e.type === 'contexto').map((e) => ({ event: store.byId.get(e.from), edge: e }));
  const node = (n) => h('li.ch-node', eventChip(app, n.event, n.edge.note), n.edge.status && n.edge.status !== 'fato' ? h('span.ch-st', { title: STATUS[n.edge.status].label }, STATUS[n.edge.status].glyph) : null);
  const step = (label, list, cls, hint) => list?.length ? h(`li.ch-step.${cls}`, h('span.ch-label', label), hint ? h('span.ch-hint', hint) : null, h('ul.ch-list', list.map(node))) : null;
  const chain = h('ol.chain',
    step('Antecedentes', before[1], 'is-far', 'o que veio antes das causas'),
    step('O que levou a isso', before[0], 'is-near'),
    ctx.length || detail?.context ? h('li.ch-step.is-context', h('span.ch-label', 'Contexto'), detail?.context ? h('p.ch-context', detail.context) : null, ctx.length ? h('ul.ch-list', ctx.map(node)) : null) : null,
    h('li.ch-step.is-self', h('span.ch-label', 'O acontecimento'), h('div.ch-self', h('span.evchip-date', chipDate(ev)), h('strong', ev.title))),
    step('O que aconteceu depois', after[0], 'is-near'),
    step('Efeitos futuros', after[1], 'is-far', 'desdobramentos de longo prazo'),
  );
  if (!before.length && !after.length && !ctx.length) return null;
  return section('Causa → acontecimento → consequência', chain,
    h('p.pv-note', '◐ Relações causais são interpretações históricas; setas indicam influência, não inevitabilidade.'));
}

// -------------------------------------------------------- enquanto isso

export function simultaneity(app, ev) {
  const y = ev.t;
  const win = y < 0 ? 1500 : y < 1500 ? 80 : y < 1800 ? 15 : y < 1950 ? 5 : 3;
  const others = store.simultaneous(ev, win);
  if (!others.length) return null;
  const a = ev.t0 - win, b = ev.t1 + win;
  const W = 600, rowH = 30, top = 30, left = 96, right = 12;
  const rows = LANES.map((l) => ({ ...l, items: [] }));
  const laneOf = (e) => e.region === 'mundo' ? 'mundo' : store.catById.get(e.categories[0])?.lane;
  for (const o of [ev, ...others]) rows.find((r) => r.id === laneOf(o))?.items.push(o);
  const used = rows.filter((r) => r.items.length);
  const Hh = top + used.length * rowH + 8;
  const X = (t) => left + ((clamp(t, a, b) - a) / (b - a)) * (W - left - right);
  const svg = s('svg', { viewBox: `0 0 ${W} ${Hh}`, class: 'sim', role: 'img', 'aria-label': `Acontecimentos simultâneos a ${ev.title}` });
  // régua
  const step = niceStep((b - a) / 5);
  for (let t = Math.ceil(a / step) * step; t <= b; t += step) {
    svg.append(s('line', { x1: X(t), x2: X(t), y1: top - 6, y2: Hh - 4, class: 'sim-grid' }));
    svg.append(s('text', { x: X(t), y: top - 12, class: 'sim-tick', 'text-anchor': 'middle' }, yearLabel(t, { short: true })));
  }
  // o acontecimento como eixo vertical
  svg.append(s('rect', { x: X(ev.t0) - 1, width: Math.max(2, X(ev.t1) - X(ev.t0) + 2), y: top - 6, height: Hh - top + 2, class: 'sim-now' }));
  used.forEach((r, i) => {
    const yy = top + i * rowH + rowH / 2;
    svg.append(s('line', { x1: left, x2: W - right, y1: yy, y2: yy, class: 'sim-row' + (r.world ? ' is-world' : '') }));
    svg.append(s('text', { x: 0, y: yy + 4, class: 'sim-lane' + (r.world ? ' is-world' : '') }, r.short.toUpperCase()));
    const taken = [];
    r.items.sort((p, q) => q.weight - p.weight).forEach((o) => {
      const x = X(o.t0), x2 = X(o.t1);
      const g = s('g', { class: 'sim-ev' + (o.id === ev.id ? ' is-self' : ''), tabindex: 0, role: 'link', 'aria-label': `${o.label}: ${o.title}` });
      if (o.isRange) g.append(s('rect', { x, y: yy - 4, width: Math.max(3, x2 - x), height: 8, rx: 1 }));
      else g.append(s('circle', { cx: x, cy: yy, r: 3 + o.weight * 0.6 }));
      g.append(s('title', {}, `${o.label} — ${o.title}`));
      const tw = Math.min(o.title.length, 26) * 5.6;
      const lx = o.isRange ? Math.max(x, left) + 4 : x + 7;
      if (!taken.some(([p, q]) => lx < q && lx + tw > p) && lx + tw < W) {
        taken.push([lx - 4, lx + tw + 6]);
        g.append(s('text', { x: lx, y: yy - 7, class: 'sim-label' }, o.title.length > 26 ? o.title.slice(0, 25) + '…' : o.title));
      }
      if (o.id !== ev.id) {
        const go = () => app.open('evento', o.id);
        g.addEventListener('click', go);
        g.addEventListener('keydown', (e) => e.key === 'Enter' && go());
      }
      svg.append(g);
    });
  });
  const world = others.filter((o) => o.region === 'mundo').sort((p, q) => q.weight - p.weight).slice(0, 4);
  return section(`Enquanto isso (${yearLabel(Math.round(a))} – ${yearLabel(Math.round(b))})`,
    h('div.sim-wrap', svg),
    world.length ? h('div.sim-world', h('span.sim-world-h', 'No mundo:'), world.map((o) => eventChip(app, o))) : null,
  );
}

function niceStep(x) {
  const p = Math.pow(10, Math.floor(Math.log10(x)));
  const n = x / p;
  return (n < 1.5 ? 1 : n < 3.5 ? 2 : n < 7.5 ? 5 : 10) * p;
}

// -------------------------------------------------------- constelação

/** rede local: o evento no centro; antes à esquerda, depois à direita */
export function constellation(app, ev) {
  const nb = store.neighbors(ev.id);
  const people = ev.people.map((id) => store.personById.get(id)).filter(Boolean);
  const places = ev.places.map((id) => store.placeById.get(id)).filter(Boolean);
  if (nb.length + people.length + places.length < 3) return null;
  const W = 600, H = 380, cx = W / 2, cy = H / 2;
  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'const', role: 'img', 'aria-label': `Rede de ${ev.title}` });
  const edges = s('g', { class: 'const-edges' }), nodes = s('g');
  svg.append(edges, nodes);
  const cut = (t, n) => (t.length > n ? t.slice(0, n - 1) + '…' : t);
  const addNode = (x, y, label, sub, cls, go, anchor, max) => {
    const g = s('g', { class: 'cn ' + cls, transform: `translate(${x},${y})`, tabindex: 0, role: 'link', 'aria-label': label });
    g.append(s('circle', { r: cls.startsWith('ev') ? 5 : 4.5 }));
    const dx = anchor === 'end' ? -10 : anchor === 'start' ? 10 : 0, dy = anchor === 'middle' ? (y < cy ? -12 : 18) : 4;
    g.append(s('text', { x: dx, y: dy, 'text-anchor': anchor, class: 'cn-l' }, cut(label, max)));
    if (sub) g.append(s('text', { x: dx, y: dy - 13, 'text-anchor': anchor, class: 'cn-s' }, sub));
    g.append(s('title', {}, label));
    g.addEventListener('click', go);
    g.addEventListener('keydown', (e) => e.key === 'Enter' && go());
    nodes.append(g);
  };
  // antes à esquerda, depois à direita — o tempo corre da esquerda para a direita
  const column = (list, x, anchor) => {
    const m = list.length, top = 92, bot = H - 92;
    list.forEach((n, i) => {
      const y = m === 1 ? cy : top + ((bot - top) * i) / (m - 1);
      edges.append(s('path', { d: `M${cx},${cy} C${(cx + x) / 2},${cy} ${(cx + x) / 2},${y} ${x},${y}`, class: 'ce t-' + n.edge.type }));
      addNode(x, y, n.event.title, yearLabel(n.event.s.y, { short: true }), 'ev t-' + n.edge.type, () => app.open('evento', n.event.id), anchor, 26);
    });
  };
  const before = nb.filter((n) => n.event.t < ev.t).sort((a, b) => a.event.t - b.event.t).slice(0, 7);
  const after = nb.filter((n) => n.event.t >= ev.t).sort((a, b) => a.event.t - b.event.t).slice(0, 7);
  column(before, 172, 'end'); column(after, W - 172, 'start');
  const row = (list, y, cls, go) => {
    const m = list.length;
    list.forEach((it, i) => {
      const x = m === 1 ? cx : 150 + (300 * i) / (m - 1);
      edges.append(s('line', { x1: cx, y1: cy, x2: x, y2: y, class: 'ce t-' + cls }));
      addNode(x, y, it.name, null, cls, () => go(it), 'middle', m > 3 ? 15 : 22);
    });
  };
  row(people.slice(0, 4), 40, 'person', (p) => app.open('pessoa', p.id));
  row(places.slice(0, 4), H - 40, 'place', (p) => app.open('lugar', p.id));
  const c = s('g', { class: 'cn is-center', transform: `translate(${cx},${cy})` });
  c.append(s('circle', { r: 11 }), s('text', { y: 30, 'text-anchor': 'middle', class: 'cn-l' }, ev.title.length > 30 ? ev.title.slice(0, 29) + '…' : ev.title));
  nodes.append(c);
  return section('Constelação',
    h('div.const-wrap', svg),
    h('ul.const-legend',
      h('li.t-causa', 'causa'), h('li.t-sucessao', 'sucessão'), h('li.t-reacao', 'reação'), h('li.t-contexto', 'contexto'), h('li.t-relacionado', 'relação'),
      h('li.t-person', 'pessoa'), h('li.t-place', 'lugar')));
}

// -------------------------------------------------------- evidências

export function claims(list, app) {
  if (!list?.length) return null;
  return section('O que sabemos — e como sabemos',
    h('ul.claims', list.map((c) => h(`li.claim.st-${c.status}`, statusBadge(c.status), h('p', c.text),
      c.sources?.length ? h('span.claim-src', 'fonte: ', c.sources.map((id) => store.sourceById.get(id)?.author?.split(/[;,]/)[0] || id).join('; ')) : null))),
    h('p.pv-note', 'Separamos fato documentado, interpretação, controvérsia, hipótese, estimativa e evidência limitada.'));
}

export function excerpts(list) {
  if (!list?.length) return null;
  return section('Palavras da época', list.map((x) => {
    const src = store.sourceById.get(x.source);
    return h('blockquote.excerpt', h('p', `“${x.text}”`), h('cite', src ? src.title : '', x.note ? ` — ${x.note}` : ''));
  }));
}

const TYPE_ICON = { livro: '▤', artigo: '▥', documento: '✎', carta: '✉', lei: '§', 'base de dados': '▦', obra: '◧', acervo: '▣', relatório: '▤', jornal: '▧' };

export function sources(ids) {
  const list = (ids || []).map((id) => store.sourceById.get(id)).filter(Boolean);
  return section('Documentos e fontes', list.length
    ? h('ul.sources', list.map((src) => h('li.src',
      h('span.src-ic', { 'aria-hidden': 'true' }, TYPE_ICON[src.type] || '◇'),
      h('div.src-body',
        h('span.src-type', src.type),
        h('strong.src-title', src.title),
        h('span.src-meta', [src.author, src.date?.slice(0, 4), src.institution].filter(Boolean).join(' · ')),
        h('span.src-ref', src.reference),
        src.url ? h('a.src-url', { href: src.url, target: '_blank', rel: 'noopener' }, 'abrir fonte ↗') : null))))
    : h('p.pv-empty', 'Nenhuma fonte cadastrada ainda para este registro. Contribuições com referências verificáveis são bem-vindas.'));
}

// -------------------------------------------------------- modo estudo

export function studySheet(app, ev, detail, open) {
  const st = detail.study || {};
  const causes = store.causes(ev.id, 1)[0] || [];
  const cons = store.consequences(ev.id, 1)[0] || [];
  const rel = store.neighbors(ev.id).filter((n) => ['relacionado', 'contexto'].includes(n.edge.type));
  const people = ev.people.map((id) => store.personById.get(id)).filter(Boolean);
  const qs = st.questions?.length ? st.questions : autoQuestions(ev, causes, cons);
  const block = (t, ...c) => { const b = c.flat().filter(Boolean); return b.length ? h('div.ss-block', h('h4', t), ...b) : null; };
  const sheet = h('div.ss',
    block('Resumo', h('p', ev.summary)),
    block('Conceitos-chave', st.concepts?.length ? h('dl', st.concepts.map((c) => [h('dt', c.term), h('dd', c.def)])) : null),
    block('Personagens', people.length ? h('ul.ss-inline', people.map((p) => h('li', link(app, 'pessoa', p.id, p.name)))) : null),
    block('Datas', h('ul.ss-dates', (st.dates?.length ? st.dates : [{ date: ev.label, label: ev.title }]).map((d) => h('li', h('span', d.date), ' ', d.label)))),
    block('Causas', causes.length ? h('ul', causes.map((c) => h('li', link(app, 'evento', c.event.id, c.event.title), c.edge.note ? ` — ${c.edge.note}` : ''))) : null),
    block('Consequências', cons.length ? h('ul', cons.map((c) => h('li', link(app, 'evento', c.event.id, c.event.title), c.edge.note ? ` — ${c.edge.note}` : ''))) : null),
    block('Relações', rel.length ? h('ul.ss-inline', rel.map((c) => h('li', link(app, 'evento', c.event.id, c.event.title)))) : null),
    block('Perguntas', h('ol.ss-q', qs.map((q) => h('li', h('p', q.q), q.hint ? h('details', h('summary', 'ver pista'), h('p', q.hint)) : null))),
      st.questions?.length ? null : h('p.pv-note', 'Perguntas geradas a partir das conexões do acontecimento.')),
  );
  if (open) return h('section.pv-sec.is-study', h('h3.pv-h', 'Ficha de estudo'), sheet);
  return h('details.pv-sec.study-fold', h('summary.pv-h', 'Ficha de estudo'), sheet);
}

function autoQuestions(ev, causes, cons) {
  const q = [];
  if (causes.length) q.push({ q: `Quais fatores contribuíram para “${ev.title}”?`, hint: causes.map((c) => c.event.title).join('; ') });
  if (cons.length) q.push({ q: `Que mudanças decorreram de “${ev.title}”?`, hint: cons.map((c) => c.event.title).join('; ') });
  q.push({ q: `O que acontecia no mundo na mesma época? Há relação com “${ev.title}”?`, hint: 'Veja o bloco “Enquanto isso”.' });
  return q;
}

export { EDGE_TYPES };
