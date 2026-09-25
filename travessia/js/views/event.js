// O acontecimento como portal: o leitor atravessa o evento na ordem do tempo,
// em camadas que ele escolhe aprofundar.
//
//   1 O que aconteceu   2 Contexto   3 Causas   4 O acontecimento
//   5 Consequências     6 Longo prazo   7 Relações   8 Fontes

import { h } from '../core/dom.js';
import { store, STATUS } from '../core/store.js';
import { yearLabel } from '../core/time.js';
import { placesMap } from '../ui/map.js';
import { mediaOf } from '../ui/nav.js';
import {
  link, eventChip, personChip, simultaneity, constellation, claims, excerpts, sources,
  studySheet, whileElsewhere, media, chipDate,
} from './widgets.js';
import { checkpoint } from './study.js';

export const LAYERS = [
  { id: 'l1', n: 1, short: 'Resumo', title: 'O que aconteceu?' },
  { id: 'l2', n: 2, short: 'Contexto', title: 'Contexto: o que acontecia antes' },
  { id: 'l3', n: 3, short: 'Causas', title: 'Causas: por que aconteceu' },
  { id: 'l4', n: 4, short: 'O fato', title: 'O acontecimento' },
  { id: 'l5', n: 5, short: 'Consequências', title: 'Consequências: o que mudou' },
  { id: 'l6', n: 6, short: 'Longo prazo', title: 'Longo prazo: o que permaneceu' },
  { id: 'l7', n: 7, short: 'Relações', title: 'Relações: pessoas, lugares e simultaneidades' },
  { id: 'l8', n: 8, short: 'Fontes', title: 'Fontes: de onde vem a informação' },
];

const catNames = (ids) => ids.map((id) => store.catById.get(id)?.name).filter(Boolean);

function layer(def, ...content) {
  const body = content.flat().filter(Boolean);
  return h(`section.lyr#${def.id}`, { 'aria-labelledby': def.id + '-h', dataset: { n: def.n } },
    h('h3.lyr-h', { id: def.id + '-h' }, h('span.lyr-n', String(def.n)), def.title),
    body.length ? body : h('p.lyr-empty', 'Ainda não há conexões cadastradas nesta camada.'));
}

/** cadeia de eventos com a marca de interpretação quando for o caso */
function chainList(app, items, noteDir) {
  if (!items?.length) return null;
  return h('ul.ch-list', items.map((n) => h('li.ch-node',
    eventChip(app, n.event, n.edge.note || (noteDir && n.via && n.via !== n.event.id ? `${noteDir} ${store.byId.get(n.via)?.title}` : null)),
    n.edge.status && n.edge.status !== 'fato' ? h('span.ch-st', { title: STATUS[n.edge.status].label, 'aria-label': STATUS[n.edge.status].label }, STATUS[n.edge.status].glyph) : null)));
}

export async function eventView(app, id) {
  const ev = store.byId.get(id);
  if (!ev) return null;
  const d = await store.detail(id);
  const period = store.period(ev.period);
  const people = ev.people.map((p) => store.personById.get(p)).filter(Boolean);
  const study = app.state.study;
  const causes = store.causes(id, 2);
  const cons = store.consequences(id, 2);
  const context = store.edgesTo(id).filter((e) => e.type === 'contexto').map((e) => ({ event: store.byId.get(e.from), edge: e }));
  const related = store.neighbors(id).filter((n) => n.edge.type === 'relacionado');
  const farRelated = related.filter((n) => n.event.t - ev.t > 40);
  const nearRelated = related.filter((n) => !(n.event.t - ev.t > 40));
  // o que acontecia pouco antes, no Brasil, fora das causas diretas
  const causeIds = new Set([...causes.flat(), ...context].map((n) => n.event.id));
  const before = store.events.filter((o) => o.region === 'brasil' && o.id !== id && !causeIds.has(o.id) && o.t < ev.t0 && ev.t0 - o.t < (ev.t < 1500 ? 800 : 25))
    .sort((a, b) => b.t - a.t).slice(0, 3);
  const geo = ev.places.length || d.map;
  const map = geo ? await placesMap(ev.places, { routes: d.map?.routes, lines: d.map?.lines, onPick: (p) => app.open('lugar', p.id) }) : null;
  const rec = mediaOf(ev.t);

  const nav = h('nav.lyr-nav', { 'aria-label': 'Camadas do acontecimento' },
    h('ol', LAYERS.map((l) => h('li', h('a.lyr-go', { href: '#' + l.id, dataset: { target: l.id }, onclick: (e) => { e.preventDefault(); app.panel.scrollTo('#' + l.id); } },
      h('span.lyr-go-n', String(l.n)), h('span.lyr-go-t', l.short))))));

  const node = h('article.pv.pv-event.is-layered',
    h('header.pv-head.is-portal',
      h('p.pv-kicker', h('span.pv-date', d.label), ' · ', link(app, 'periodo', period.id, period.short), ev.region === 'mundo' ? ' · contexto mundial' : ''),
      h('h2.pv-title', ev.title),
      h('p.pv-record', { title: 'Como esta época registrava a si mesma' }, h('span', { 'aria-hidden': 'true' }, '◇ '), `Registro da época: ${rec.label}`),
      h('ul.pv-tags', catNames(ev.categories).map((c) => h('li', c)), ev.themes.map((t) => h('li.is-theme', link(app, 'tema', t, '↝ ' + store.themeById.get(t).name))))),
    nav,
    h('div.lyr-rail',
      layer(LAYERS[0],
        h('p.pv-lead', ev.summary),
        h('dl.facts',
          h('div', h('dt', 'Quando'), h('dd', d.label)),
          ev.places.length ? h('div', h('dt', 'Onde'), h('dd', ev.places.map((pid, i) => [i ? ', ' : '', link(app, 'lugar', pid, store.placeById.get(pid)?.name)]))) : null,
          people.length ? h('div', h('dt', 'Quem'), h('dd', people.slice(0, 4).map((p, i) => [i ? ', ' : '', link(app, 'pessoa', p.id, p.name)]))) : null,
          h('div', h('dt', 'Conexões'), h('dd', `${store.neighbors(id).length} acontecimentos ligados`))),
        study ? studySheet(app, ev, d, true) : null,
        h('button.lyr-deeper', { type: 'button', onclick: () => app.panel.scrollTo('#l2') }, 'Aprofundar: o contexto ↓')),
      layer(LAYERS[1],
        d.context ? h('p.lyr-context', d.context) : null,
        context.length ? h('div', h('h4.lyr-sub', 'Em um cenário maior'), chainList(app, context)) : null,
        before.length ? h('div', h('h4.lyr-sub', 'Pouco antes, no Brasil'), h('div.evchips', before.map((o) => eventChip(app, o)))) : null),
      layer(LAYERS[2],
        causes[0]?.length ? h('div', h('h4.lyr-sub', 'Causas diretas'), chainList(app, causes[0])) : null,
        causes[1]?.length ? h('div', h('h4.lyr-sub.is-far', 'Antecedentes — o que veio antes das causas'), chainList(app, causes[1], 'levou a')) : null,
        causes.length ? h('p.pv-note', '◐ Relações causais são interpretações históricas: indicam influência, não inevitabilidade.') : null),
      layer(LAYERS[3],
        h('div.lyr-self', h('span.evchip-date', chipDate(ev)), h('strong', ev.title)),
        d.narrative?.length ? h('div.pv-body', d.narrative.map((p) => h('p', p))) : h('p.pv-lead.is-small', ev.summary),
        media(d.media),
        excerpts(d.excerpts),
        map ? h('div.lyr-map', map, h('button.pv-action.is-ghost', { type: 'button', onclick: () => app.showMap(ev.id) }, '◎ Ver na linha do tempo como mapa')) : null),
      layer(LAYERS[4],
        cons[0]?.length ? chainList(app, cons[0]) : null),
      layer(LAYERS[5],
        cons[1]?.length ? h('div', h('h4.lyr-sub', 'Desdobramentos das consequências'), chainList(app, cons[1], 'via')) : null,
        farRelated.length ? h('div', h('h4.lyr-sub', 'Ecos distantes no tempo'), chainList(app, farRelated)) : null),
      layer(LAYERS[6],
        constellation(app, ev),
        h('div.lyr-block', h('h4.lyr-sub', 'Enquanto isso…'), simultaneity(app, ev), whileElsewhere(app, ev)),
        people.length ? h('div.lyr-block', h('h4.lyr-sub', 'Pessoas'), h('div.pchips', people.map((p) => personChip(app, p)))) : null,
        nearRelated.length ? h('div.lyr-block', h('h4.lyr-sub', 'Outras conexões'), h('div.evchips', nearRelated.map((n) => eventChip(app, n.event, n.edge.note)))) : null),
      layer(LAYERS[7],
        claims(d.claims, app),
        sources(ev.sources ?? d.sources)),
    ),
    checkpoint(app, ev),
    study ? null : studySheet(app, ev, d, false),
  );

  // a camada visível fica marcada na navegação
  queueMicrotask(() => watchLayers(app, node, nav));
  return { kind: 'Acontecimento', title: ev.title, node, year: ev.t };
}

function watchLayers(app, node, nav) {
  const root = app.panel.body;
  const links = new Map([...nav.querySelectorAll('.lyr-go')].map((a) => [a.dataset.target, a]));
  app.layerObserver?.disconnect();
  const io = new IntersectionObserver((entries) => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      links.forEach((a, key) => a.classList.toggle('is-on', key === en.target.id));
    }
  }, { root, rootMargin: '-15% 0px -70% 0px' });
  node.querySelectorAll('.lyr').forEach((s) => io.observe(s));
  app.layerObserver = io;
}

export { yearLabel };
