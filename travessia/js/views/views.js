// Painéis de cada tipo de entidade da rede: acontecimento, pessoa, lugar,
// tema, período e ano. Todos são costurados pelas mesmas conexões.

import { h, s } from '../core/dom.js';
import { store } from '../core/store.js';
import { yearLabel, formatDate, yearToU } from '../core/time.js';
import { placesMap } from '../ui/map.js';
import {
  section, link, eventChip, personChip, causalChain, simultaneity, constellation,
  claims, excerpts, sources, studySheet, statusBadge,
} from './widgets.js';

const catNames = (ids) => ids.map((id) => store.catById.get(id)?.name).filter(Boolean);

export async function eventView(app, id) {
  const ev = store.byId.get(id);
  if (!ev) return null;
  const d = await store.detail(id);
  const period = store.period(ev.period);
  const people = ev.people.map((p) => store.personById.get(p)).filter(Boolean);
  const study = app.state.study;
  const related = store.neighbors(id).filter((n) => n.edge.type === 'relacionado');
  const map = ev.places.length || d.map ? await placesMap(ev.places, { routes: d.map?.routes, lines: d.map?.lines, onPick: (p) => app.open('lugar', p.id) }) : null;

  const node = h('article.pv.pv-event',
    h('header.pv-head',
      h('p.pv-kicker', h('span.pv-date', d.label), ' · ', link(app, 'periodo', period.id, period.short), ev.region === 'mundo' ? ' · contexto mundial' : ''),
      h('h2.pv-title', ev.title),
      h('ul.pv-tags', catNames(ev.categories).map((c) => h('li', c)), ev.themes.map((t) => h('li.is-theme', link(app, 'tema', t, '↝ ' + store.themeById.get(t).name))))),
    h('p.pv-lead', ev.summary),
    study ? studySheet(app, ev, d, true) : null,
    d.narrative?.length ? h('div.pv-body', d.narrative.map((p) => h('p', p))) : null,
    causalChain(app, ev, d),
    simultaneity(app, ev),
    constellation(app, ev),
    section('Pessoas', people.length ? h('div.pchips', people.map((p) => personChip(app, p))) : null),
    section('Lugares', map, ev.places.length ? h('p.pv-places', ev.places.map((pid, i) => [i ? ', ' : '', link(app, 'lugar', pid, store.placeById.get(pid)?.name)])) : null),
    claims(d.claims, app),
    excerpts(d.excerpts),
    sources(ev.sources ?? d.sources),
    related.length ? section('Outras conexões', h('div.evchips', related.map((n) => eventChip(app, n.event, n.edge.note)))) : null,
    study ? null : studySheet(app, ev, d, false),
  );
  return { kind: 'Acontecimento', title: ev.title, node, year: ev.t };
}

export async function personView(app, id) {
  const p = store.personById.get(id);
  if (!p) return null;
  const evs = store.eventsOfPerson(id);
  const around = store.peopleAround(id).slice(0, 8);
  const placeIds = [...new Set(evs.flatMap((e) => e.places))];
  const map = placeIds.length ? await placesMap(placeIds, { onPick: (pl) => app.open('lugar', pl.id) }) : null;
  const life = p.b || p.d ? `${p.b ? formatDate(p.b, { long: true }) : '?'} — ${p.d ? formatDate(p.d, { long: true }) : ''}` : '';
  const periods = [...new Set(evs.map((e) => e.period))].map((pid) => store.period(pid));
  const node = h('article.pv.pv-person',
    h('header.pv-head',
      h('p.pv-kicker', 'Pessoa', p.roles?.length ? ` · ${p.roles.join(', ')}` : ''),
      h('h2.pv-title', p.name),
      p.fullName ? h('p.pv-sub', p.fullName) : null,
      life ? h('p.pv-date', (p.circa ? 'c. ' : '') + life) : p.b ? null : null),
    h('p.pv-lead', p.summary),
    lifeline(app, p, evs),
    section('Na história', h('ol.pv-timeline', evs.map((e) => h('li', eventChip(app, e))))),
    section('Pessoas conectadas', around.length ? h('div.pchips', around.map((a) => personChip(app, a.person, a.rel || (a.n > 1 ? `${a.n} acontecimentos em comum` : 'acontecimento em comum')))) : null),
    section('Lugares', map),
    section('Períodos', h('ul.pv-tags', periods.map((pe) => h('li', link(app, 'periodo', pe.id, pe.short))))),
    h('p.pv-note', 'A pessoa aparece aqui pelo que fez e viveu dentro dos acontecimentos — não como biografia isolada.'),
  );
  return { kind: 'Pessoa', title: p.name, node, year: p.b?.y ?? evs[0]?.t };
}

/** linha da vida: nascimento, morte e acontecimentos numa régua própria */
function lifeline(app, p, evs) {
  if (!evs.length) return null;
  const a = Math.min(p.b?.y ?? evs[0].s.y, evs[0].s.y), b = Math.max(p.d?.y ?? evs.at(-1).s.y, evs.at(-1).s.y);
  const span = Math.max(1, b - a);
  const W = 600, X = (t) => 20 + ((t - a) / span) * (W - 40);
  const svg = s('svg', { viewBox: `0 0 ${W} 74`, class: 'life', role: 'img', 'aria-label': 'Linha da vida' });
  svg.append(s('line', { x1: X(p.b?.y ?? a), x2: X(p.d?.y ?? b), y1: 44, y2: 44, class: 'life-bar' }));
  if (p.b) svg.append(s('text', { x: X(p.b.y), y: 66, 'text-anchor': 'start', class: 'life-t' }, `n. ${yearLabel(p.b.y)}`));
  if (p.d) svg.append(s('text', { x: X(p.d.y), y: 66, 'text-anchor': 'end', class: 'life-t' }, `m. ${yearLabel(p.d.y)}`));
  evs.forEach((e, i) => {
    const g = s('g', { class: 'life-ev', tabindex: 0, role: 'link' });
    g.append(s('circle', { cx: X(e.t), cy: 44, r: 4 + e.weight * 0.6 }), s('title', {}, `${e.label} — ${e.title}`));
    if (evs.length <= 6 || e.weight >= 4) g.append(s('text', { x: X(e.t), y: i % 2 ? 22 : 12, 'text-anchor': 'middle', class: 'life-l' }, e.title.length > 24 ? e.title.slice(0, 23) + '…' : e.title));
    g.addEventListener('click', () => app.open('evento', e.id));
    svg.append(g);
  });
  return h('div.life-wrap', svg);
}

export async function placeView(app, id) {
  const pl = store.placeById.get(id);
  if (!pl) return null;
  const evs = store.eventsOfPlace(id);
  const people = [...new Set(evs.flatMap((e) => e.people))].map((pid) => store.personById.get(pid)).filter(Boolean);
  const map = await placesMap([id]);
  const node = h('article.pv.pv-place',
    h('header.pv-head', h('p.pv-kicker', 'Lugar', ` · ${pl.kind}`), h('h2.pv-title', pl.name), h('p.pv-sub', pl.admin)),
    map,
    section(`${evs.length} acontecimento${evs.length === 1 ? '' : 's'} aqui`, h('ol.pv-timeline', evs.map((e) => h('li', eventChip(app, e))))),
    section('Pessoas ligadas a este lugar', people.length ? h('div.pchips', people.slice(0, 10).map((p) => personChip(app, p))) : null),
  );
  return { kind: 'Lugar', title: pl.name, node, year: evs[0]?.t };
}

export async function themeView(app, id) {
  const th = store.themeById.get(id);
  if (!th) return null;
  const evs = store.eventsOfTheme(id);
  let lastPeriod = null;
  const list = h('ol.thread');
  for (const e of evs) {
    if (e.period !== lastPeriod) { lastPeriod = e.period; list.append(h('li.thread-period', store.period(e.period).short)); }
    list.append(h('li.thread-ev', eventChip(app, e)));
  }
  const people = new Map();
  evs.forEach((e) => e.people.forEach((p) => people.set(p, (people.get(p) || 0) + 1)));
  const top = [...people.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([p]) => store.personById.get(p));
  const node = h('article.pv.pv-theme',
    h('header.pv-head', h('p.pv-kicker', 'Linha temática · ', `${evs.length} acontecimentos`), h('h2.pv-title', th.name)),
    h('p.pv-lead', th.summary),
    h('button.pv-action', { onclick: () => evs.length && app.timeline.frameYears(evs[0].t0, evs.at(-1).t1, 0.06) }, 'Ver a linha inteira no tempo ⟷'),
    section('A linha, do começo ao fim', list),
    section('Pessoas nesta linha', top.length ? h('div.pchips', top.map((p) => personChip(app, p))) : null),
  );
  return { kind: 'Tema', title: th.name, node, year: evs[0]?.t, frame: evs.length ? [evs[0].t0, evs.at(-1).t1] : null };
}

export async function periodView(app, id) {
  const p = store.period(id);
  if (!p) return null;
  const evs = store.events.filter((e) => e.period === id);
  const br = evs.filter((e) => e.region === 'brasil').sort((a, b) => b.weight - a.weight || a.t - b.t);
  const world = store.events.filter((e) => e.region === 'mundo' && e.t1 >= p.start && e.t0 <= p.end).sort((a, b) => a.t - b.t);
  const people = new Map();
  evs.forEach((e) => e.people.forEach((x) => people.set(x, (people.get(x) || 0) + e.weight)));
  const top = [...people.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([x]) => store.personById.get(x));
  const themes = new Map();
  evs.forEach((e) => e.themes.forEach((t) => themes.set(t, (themes.get(t) || 0) + 1)));
  const node = h('article.pv.pv-period',
    h('header.pv-head', h('p.pv-kicker', 'Período · ', `${yearLabel(p.start)} – ${p.end > 2025 ? 'hoje' : yearLabel(p.end)}`), h('h2.pv-title', p.name)),
    h('p.pv-lead', p.summary),
    section('Acontecimentos centrais', h('div.evchips', br.filter((e) => e.weight >= 3).sort((a, b) => a.t - b.t).map((e) => eventChip(app, e)))),
    section('Quem viveu este período', top.length ? h('div.pchips', top.map((x) => personChip(app, x))) : null),
    section('Enquanto isso, no mundo', world.length ? h('div.evchips', world.map((e) => eventChip(app, e))) : null),
    section('Linhas que atravessam o período', themes.size ? h('ul.pv-tags', [...themes.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => h('li.is-theme', link(app, 'tema', t, '↝ ' + store.themeById.get(t).name)))) : null),
  );
  return { kind: 'Período', title: p.name, node, frame: [Math.max(p.start, -12000), Math.min(p.end, new Date().getFullYear() + 1)] };
}

export async function yearView(app, id) {
  const y = +id;
  const evs = store.events.filter((e) => e.t0 < y + 1 && e.t1 >= y).sort((a, b) => b.weight - a.weight);
  const near = evs.length < 3 ? store.events.filter((e) => Math.abs(e.t - (y + 0.5)) < 6 && !evs.includes(e)).sort((a, b) => Math.abs(a.t - y) - Math.abs(b.t - y)).slice(0, 6) : [];
  const per = store.periodAt(y + 0.5);
  const groups = [
    ['Brasil', evs.filter((e) => e.region === 'brasil' && !e.isRange)],
    ['Em curso', evs.filter((e) => e.region === 'brasil' && e.isRange)],
    ['Mundo', evs.filter((e) => e.region === 'mundo')],
  ];
  const node = h('article.pv.pv-year',
    h('header.pv-head', h('p.pv-kicker', 'Ano · ', link(app, 'periodo', per.id, per.short)), h('h2.pv-title.is-year', yearLabel(y))),
    ...groups.map(([t, list]) => section(t, list.length ? h('div.evchips', list.map((e) => eventChip(app, e))) : null)),
    near.length ? section('Perto dali', h('div.evchips', near.map((e) => eventChip(app, e)))) : null,
    !evs.length && !near.length ? h('p.pv-empty', 'Ainda não há acontecimentos cadastrados neste ano. A linha do tempo mostra o que existe ao redor.') : null,
  );
  return { kind: 'Ano', title: yearLabel(y), node, frame: [y - 2, y + 3] };
}

export const VIEWS = { evento: eventView, pessoa: personView, lugar: placeView, tema: themeView, periodo: periodView, ano: yearView };
export { statusBadge, yearToU };
