import type { AtlasNode } from '@/types/atlas';
import { LOD } from '@/types/atlas';
import type { NodeKind } from '@/types/content';
import { ERAS, ERA_BY_ID } from './eras';
import { PERIODS, PERIOD_BY_ID } from './periods';
import { CIVILIZATIONS, CIVILIZATION_BY_ID } from './civilizations';
import { PEOPLE, PERSON_BY_ID } from './people';
import { CONCEPTS, CONCEPT_BY_ID } from './concepts';
import { FORMULAS, FORMULA_BY_ID } from './formulas';
import { PROBLEMS, PROBLEM_BY_ID } from './problems';
import { OPEN_PROBLEMS, OPEN_PROBLEM_BY_ID } from './openProblems';
import { DOCUMENTS, DOCUMENT_BY_ID } from './documents';
import { PROOFS, PROOF_BY_ID } from './proofs';
import { AREAS, AREA_BY_ID } from './areas';
import { SOURCES, SOURCE_BY_ID } from './sources';
import { RELATIONSHIPS, relationshipsFor } from './relationships';

export {
  ERAS,
  ERA_BY_ID,
  PERIODS,
  PERIOD_BY_ID,
  CIVILIZATIONS,
  CIVILIZATION_BY_ID,
  PEOPLE,
  PERSON_BY_ID,
  CONCEPTS,
  CONCEPT_BY_ID,
  FORMULAS,
  FORMULA_BY_ID,
  PROBLEMS,
  PROBLEM_BY_ID,
  OPEN_PROBLEMS,
  OPEN_PROBLEM_BY_ID,
  DOCUMENTS,
  DOCUMENT_BY_ID,
  PROOFS,
  PROOF_BY_ID,
  AREAS,
  AREA_BY_ID,
  SOURCES,
  SOURCE_BY_ID,
  RELATIONSHIPS,
  relationshipsFor,
};

/** Ano representativo de um período (ponto médio). */
export function periodYear(periodId: string): number {
  const p = PERIOD_BY_ID.get(periodId);
  if (!p) return 0;
  return Math.round((p.startYear + p.endYear) / 2);
}

/** Ano representativo de um conceito: início do período mais antigo em que aparece. */
export function conceptYear(conceptId: string): number {
  const c = CONCEPT_BY_ID.get(conceptId);
  if (!c || c.periodIds.length === 0) return 0;
  const years = c.periodIds.map((id) => PERIOD_BY_ID.get(id)?.startYear ?? 0);
  return Math.min(...years);
}

export function routeFor(kind: NodeKind, id: string): string {
  switch (kind) {
    case 'concept':
      return `/conceito/${id}`;
    case 'person':
      return `/pessoa/${id}`;
    case 'formula':
      return `/formula/${id}`;
    case 'problem':
      return `/problema/${id}`;
    case 'civilization':
      return `/civilizacao/${id}`;
    case 'period':
      return `/periodo/${id}`;
    case 'area':
      return `/area/${id}`;
    case 'document':
      return `/documento/${id}`;
    default:
      return '/';
  }
}

// ---------------------------------------------------------------------------
// Nós do Atlas (canvas ZUI) — cada entidade de conteúdo vira um AtlasNode
// posicionável no eixo do tempo. O eixo perpendicular ("lane") é resolvido
// pelo motor de layout do canvas, não aqui — a camada de dados não conhece
// detalhes de apresentação.
// ---------------------------------------------------------------------------

function buildAtlasNodes(): AtlasNode[] {
  const nodes: AtlasNode[] = [];

  for (const era of ERAS) {
    nodes.push({
      id: era.id,
      kind: 'period',
      title: era.name,
      summary: era.description,
      year: era.startYear,
      yearEnd: era.endYear,
      lane: 0,
      areaIds: [],
      level: LOD.MACRO,
    });
  }

  for (const period of PERIODS) {
    nodes.push({
      id: period.id,
      kind: 'period',
      title: period.name,
      summary: period.summary,
      year: period.startYear,
      yearEnd: period.endYear,
      lane: 0,
      areaIds: [],
      periodId: period.id,
      civilizationId: period.civilizationIds[0],
      level: LOD.PERIOD,
    });
  }

  for (const civ of CIVILIZATIONS) {
    nodes.push({
      id: civ.id,
      kind: 'civilization',
      title: civ.name,
      summary: civ.description,
      year: civ.activeStart,
      yearEnd: civ.activeEnd,
      lane: 0,
      areaIds: [],
      civilizationId: civ.id,
      level: LOD.PERIOD,
    });
  }

  for (const concept of CONCEPTS) {
    nodes.push({
      id: concept.id,
      kind: 'concept',
      title: concept.title,
      summary: concept.layers.intuition,
      year: conceptYear(concept.id),
      lane: 0,
      areaIds: concept.areaIds,
      periodId: concept.periodIds[0],
      civilizationId: concept.civilizationIds[0],
      level: LOD.CONCEPT,
      color: AREA_BY_ID.get(concept.areaIds[0])?.color,
      educationLevel: concept.level,
    });
  }

  for (const formula of FORMULAS) {
    const concept = CONCEPT_BY_ID.get(formula.conceptId);
    nodes.push({
      id: formula.id,
      kind: 'formula',
      title: formula.title,
      summary: formula.problemSolved,
      year: concept ? conceptYear(concept.id) : 0,
      lane: 0,
      areaIds: concept?.areaIds ?? [],
      level: LOD.DETAIL,
    });
  }

  for (const problem of PROBLEMS) {
    nodes.push({
      id: problem.id,
      kind: 'problem',
      title: problem.title,
      summary: problem.problemText,
      year: periodYear(problem.periodId),
      lane: 0,
      areaIds: problem.conceptIds.flatMap((id) => CONCEPT_BY_ID.get(id)?.areaIds ?? []),
      periodId: problem.periodId,
      civilizationId: problem.civilizationId,
      level: LOD.DETAIL,
    });
  }

  for (const person of PEOPLE) {
    nodes.push({
      id: person.id,
      kind: 'person',
      title: person.name,
      summary: person.bio,
      year: person.birthYear ?? periodYear(person.periodIds[0]),
      lane: 0,
      areaIds: person.conceptIds.flatMap((id) => CONCEPT_BY_ID.get(id)?.areaIds ?? []),
      periodId: person.periodIds[0],
      civilizationId: person.civilizationId,
      level: LOD.CONCEPT,
    });
  }

  for (const doc of DOCUMENTS) {
    nodes.push({
      id: doc.id,
      kind: 'document',
      title: doc.title,
      summary: doc.context,
      year: periodYear(doc.periodId),
      lane: 0,
      areaIds: [],
      periodId: doc.periodId,
      civilizationId: doc.civilizationId,
      level: LOD.DEEP,
    });
  }

  return nodes;
}

export const ATLAS_NODES: AtlasNode[] = buildAtlasNodes();

// ---------------------------------------------------------------------------
// Índice de busca global — leve, sem dependências externas.
// ---------------------------------------------------------------------------

export interface SearchEntry {
  id: string;
  kind: NodeKind;
  title: string;
  subtitle: string;
  year: number;
  route: string;
  keywords: string;
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

function buildSearchIndex(): SearchEntry[] {
  const entries: SearchEntry[] = [];

  for (const c of CONCEPTS) {
    entries.push({ id: c.id, kind: 'concept', title: c.title, subtitle: 'Conceito', year: conceptYear(c.id), route: routeFor('concept', c.id), keywords: normalize(`${c.title} ${c.shortTitle ?? ''} ${c.layers.intuition}`) });
  }
  for (const p of PEOPLE) {
    entries.push({ id: p.id, kind: 'person', title: p.name, subtitle: 'Pessoa', year: p.birthYear ?? 0, route: routeFor('person', p.id), keywords: normalize(`${p.name} ${p.bio}`) });
  }
  for (const f of FORMULAS) {
    entries.push({ id: f.id, kind: 'formula', title: f.title, subtitle: 'Fórmula', year: conceptYear(f.conceptId), route: routeFor('formula', f.id), keywords: normalize(`${f.title} ${f.problemSolved}`) });
  }
  for (const pr of PROBLEMS) {
    entries.push({ id: pr.id, kind: 'problem', title: pr.title, subtitle: 'Problema histórico', year: periodYear(pr.periodId), route: routeFor('problem', pr.id), keywords: normalize(`${pr.title} ${pr.problemText}`) });
  }
  for (const civ of CIVILIZATIONS) {
    entries.push({ id: civ.id, kind: 'civilization', title: civ.name, subtitle: 'Civilização', year: civ.activeStart, route: routeFor('civilization', civ.id), keywords: normalize(`${civ.name} ${civ.description}`) });
  }
  for (const period of PERIODS) {
    entries.push({ id: period.id, kind: 'period', title: period.name, subtitle: 'Período', year: period.startYear, route: routeFor('period', period.id), keywords: normalize(`${period.name} ${period.summary}`) });
  }
  for (const area of AREAS) {
    entries.push({ id: area.id, kind: 'area', title: area.name, subtitle: 'Área da matemática', year: 0, route: routeFor('area', area.id), keywords: normalize(`${area.name} ${area.description}`) });
  }
  for (const doc of DOCUMENTS) {
    entries.push({ id: doc.id, kind: 'document', title: doc.title, subtitle: 'Documento histórico', year: periodYear(doc.periodId), route: routeFor('document', doc.id), keywords: normalize(`${doc.title} ${doc.context}`) });
  }

  return entries;
}

export const SEARCH_INDEX: SearchEntry[] = buildSearchIndex();

export function search(query: string, limit = 20): SearchEntry[] {
  const q = normalize(query.trim());
  if (!q) return [];
  const terms = q.split(/\s+/).filter(Boolean);
  const scored = SEARCH_INDEX.map((entry) => {
    let score = 0;
    const titleNorm = normalize(entry.title);
    for (const term of terms) {
      if (titleNorm.startsWith(term)) score += 10;
      else if (titleNorm.includes(term)) score += 5;
      else if (entry.keywords.includes(term)) score += 1;
      else return { entry, score: -1 };
    }
    return { entry, score };
  });
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.entry);
}
