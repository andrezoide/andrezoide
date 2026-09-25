import type { AtlasNode } from '@/types/atlas';
import type { LensMode } from '@/store/atlasStore';
import { CIVILIZATIONS } from '@/data/civilizations';
import { AREAS } from '@/data/areas';
import type { NodeKind } from '@/types/content';

export const RIBBON_HEIGHT = 46;
export const LANE_HEIGHT = 58;
export const LANE_GAP_TOP = 18;

const CIV_INDEX = new Map(CIVILIZATIONS.map((c, i) => [c.id, i]));
const AREA_INDEX = new Map(AREAS.map((a, i) => [a.id, i]));

/** Ordem das raias no modo "chronology" (neutro, organizado por tipo de conteúdo). */
const KIND_LANE_ORDER: NodeKind[] = ['period', 'civilization', 'concept', 'person', 'formula', 'problem', 'document'];

export function laneCountFor(lens: LensMode): number {
  if (lens === 'civilization') return CIVILIZATIONS.length + 1;
  if (lens === 'area') return AREAS.length + 1;
  return KIND_LANE_ORDER.length;
}

export function laneLabelsFor(lens: LensMode): string[] {
  if (lens === 'civilization') return [...CIVILIZATIONS.map((c) => c.name), 'Transversal / global'];
  if (lens === 'area') return [...AREAS.map((a) => a.name), 'Outros'];
  return ['Períodos', 'Civilizações', 'Conceitos', 'Pessoas', 'Fórmulas', 'Problemas', 'Documentos'];
}

export function laneFor(node: AtlasNode, lens: LensMode): number {
  if (lens === 'civilization') {
    const idx = node.civilizationId ? CIV_INDEX.get(node.civilizationId) : undefined;
    return idx !== undefined ? idx : CIVILIZATIONS.length;
  }
  if (lens === 'area') {
    const areaId = node.areaIds[0];
    const idx = areaId ? AREA_INDEX.get(areaId) : undefined;
    return idx !== undefined ? idx : AREAS.length;
  }
  const idx = KIND_LANE_ORDER.indexOf(node.kind);
  return idx === -1 ? KIND_LANE_ORDER.length : idx;
}

export function laneY(lane: number): number {
  return RIBBON_HEIGHT + LANE_GAP_TOP + lane * LANE_HEIGHT;
}

/** Se um nó deve aparecer no lens atual (alguns nós não fazem sentido em certos modos). */
export function visibleInLens(node: AtlasNode, lens: LensMode): boolean {
  if (lens === 'civilization') {
    // fórmulas e documentos ficam agrupados junto ao seu conceito nesse modo;
    // civilizações são desenhadas como faixas (CivilizationBands), não como cartões-ponto
    if (node.kind === 'formula' || node.kind === 'document' || node.kind === 'civilization') return false;
  }
  return true;
}
