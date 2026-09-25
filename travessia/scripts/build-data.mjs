#!/usr/bin/env node
// Valida os dados históricos e gera o índice leve consumido pela interface.
//
//   node scripts/build-data.mjs
//
// Entrada:  data/*.json + data/events/*.json (um arquivo por bloco)
// Saída:    data/build/index.json
//
// O índice carrega apenas o necessário para desenhar a linha do tempo,
// buscar e navegar pela rede. O conteúdo completo de cada evento continua
// no seu bloco e é carregado sob demanda.

import { readFileSync, writeFileSync, readdirSync, mkdirSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'data');
const read = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));

const errors = [];
const warn = [];
const fail = (msg) => errors.push(msg);

const periods = read('periods.json');
const categories = read('categories.json');
const themes = read('themes.json');
const people = read('people.json');
const places = read('places.json');
const sources = read('sources.json');
const relationships = read('relationships.json');

const ids = (arr, kind) => {
  const s = new Set();
  for (const x of arr) {
    if (!x.id) fail(`${kind} sem id: ${JSON.stringify(x).slice(0, 80)}`);
    if (s.has(x.id)) fail(`${kind} com id duplicado: ${x.id}`);
    s.add(x.id);
  }
  return s;
};
const P = ids(periods, 'período'), C = ids(categories, 'categoria'), T = ids(themes, 'tema');
const PE = ids(people, 'pessoa'), PL = ids(places, 'lugar'), S = ids(sources, 'fonte');

const STATUS = new Set(['fato', 'interpretacao', 'controversia', 'hipotese', 'limitada', 'estimativa']);
const EDGE = new Set(['causa', 'sucessao', 'reacao', 'contexto', 'relacionado']);
const DATE = /^-?\d+(-\d{2}(-\d{2})?)?$/;
const num = (d) => { const [y, m = '06', dd = '15'] = d.replace(/^-/, 'N').split('-'); return (y.startsWith('N') ? -1 : 1) * +y.replace('N', '') + (+m - 1) / 12 + (+dd - 1) / 365; };

const events = [];
const chunkFiles = readdirSync(join(root, 'events')).filter((f) => f.endsWith('.json')).sort();
for (const file of chunkFiles) {
  const chunk = basename(file, '.json');
  for (const e of read(`events/${file}`)) events.push({ ...e, chunk });
}
const E = ids(events, 'evento');

const check = (list, set, ctx, kind) => (list || []).forEach((id) => set.has(id) || fail(`${ctx}: ${kind} desconhecido(a) "${id}"`));

for (const e of events) {
  const ctx = `evento ${e.id}`;
  if (!e.title) fail(`${ctx}: sem título`);
  if (!e.summary) fail(`${ctx}: sem resumo`);
  if (!DATE.test(e.start || '')) fail(`${ctx}: data inicial inválida "${e.start}"`);
  if (e.end && !DATE.test(e.end)) fail(`${ctx}: data final inválida "${e.end}"`);
  if (e.end && num(e.end) < num(e.start)) fail(`${ctx}: termina antes de começar`);
  if (!P.has(e.period)) fail(`${ctx}: período desconhecido "${e.period}"`);
  if (!['brasil', 'mundo'].includes(e.region)) fail(`${ctx}: região deve ser brasil|mundo`);
  if (!(e.weight >= 1 && e.weight <= 5)) fail(`${ctx}: peso deve estar entre 1 e 5`);
  if (!e.categories?.length) fail(`${ctx}: sem categorias`);
  check(e.categories, C, ctx, 'categoria');
  check(e.themes, T, ctx, 'tema');
  check(e.people, PE, ctx, 'pessoa');
  check(e.places, PL, ctx, 'lugar');
  check(e.sources, S, ctx, 'fonte');
  for (const c of e.claims || []) {
    if (!STATUS.has(c.status)) fail(`${ctx}: status epistemológico inválido "${c.status}"`);
    check(c.sources, S, ctx, 'fonte (afirmação)');
  }
  for (const x of e.excerpts || []) if (!S.has(x.source)) fail(`${ctx}: trecho sem fonte válida`);
  if (!e.sources?.length && e.weight >= 3) warn.push(`${ctx}: evento de peso ${e.weight} sem fontes cadastradas`);
}
for (const p of people) for (const r of p.relations || []) if (!PE.has(r.person)) fail(`pessoa ${p.id}: relação com desconhecido "${r.person}"`);

const seenEdge = new Set();
for (const r of relationships) {
  const ctx = `relação ${r.from} → ${r.to}`;
  if (!E.has(r.from)) fail(`${ctx}: origem desconhecida`);
  if (!E.has(r.to)) fail(`${ctx}: destino desconhecido`);
  if (!EDGE.has(r.type)) fail(`${ctx}: tipo inválido "${r.type}"`);
  if (r.status && !STATUS.has(r.status)) fail(`${ctx}: status inválido`);
  const k = `${r.from}|${r.to}`;
  if (seenEdge.has(k)) fail(`${ctx}: duplicada`);
  seenEdge.add(k);
}

if (errors.length) {
  console.error(`✗ ${errors.length} erro(s):\n  ` + errors.join('\n  '));
  process.exit(1);
}

const light = events.map((e) => {
  const o = {
    id: e.id, title: e.title, start: e.start, period: e.period, region: e.region,
    categories: e.categories, themes: e.themes || [], weight: e.weight,
    people: e.people || [], places: e.places || [], summary: e.summary, chunk: e.chunk,
  };
  if (e.end) o.end = e.end;
  if (e.circa) o.circa = true;
  if (e.dateLabel) o.dateLabel = e.dateLabel;
  if (e.study) o.hasStudy = true;
  if (e.map) o.hasMap = true;
  if (e.claims?.some((c) => c.status === 'controversia')) o.debated = true;
  return o;
});
const edges = relationships.map((r) => ({ from: r.from, to: r.to, type: r.type, ...(r.note && { note: r.note }), status: r.status || (r.type === 'causa' ? 'interpretacao' : 'fato') }));

mkdirSync(join(root, 'build'), { recursive: true });
writeFileSync(join(root, 'build', 'index.json'), JSON.stringify({ version: 1, events: light, edges }));

const orphans = light.filter((e) => !relationships.some((r) => r.from === e.id || r.to === e.id));
if (orphans.length) warn.push(`${orphans.length} evento(s) sem relações: ${orphans.map((o) => o.id).join(', ')}`);
warn.forEach((w) => console.warn('! ' + w));
console.log(`✓ ${light.length} eventos, ${edges.length} relações, ${people.length} pessoas, ${places.length} lugares, ${sources.length} fontes, ${chunkFiles.length} blocos`);
