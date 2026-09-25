import type { EducationLevel, NodeKind } from './content';

/**
 * Níveis de detalhe (LOD) do Atlas.
 * O zoom não amplia elementos — ele revela camadas de informação diferentes.
 */
export const LOD = {
  MACRO: 1, // grandes eras (Antiguidade, Medieval, Moderna...)
  PERIOD: 2, // séculos / períodos específicos
  AREA: 3, // áreas da matemática dentro do período
  CONCEPT: 4, // conceitos individuais
  DETAIL: 5, // fórmulas, problemas, demonstrações
  DEEP: 6, // documentos, manuscritos, exercícios, referências
} as const;

export type LodLevel = (typeof LOD)[keyof typeof LOD];

export interface Viewport {
  x: number; // translação em pixels
  y: number;
  k: number; // escala (zoom)
}

/** Um item posicionável no canvas do Atlas (independente do tipo de conteúdo). */
export interface AtlasNode {
  id: string;
  kind: NodeKind;
  title: string;
  summary: string;
  /** Ano representativo para posicionamento no eixo do tempo. */
  year: number;
  yearEnd?: number;
  /** Coordenada lógica no eixo perpendicular ao tempo (lanes por área/civilização). */
  lane: number;
  areaIds: string[];
  periodId?: string;
  civilizationId?: string;
  level: LodLevel;
  color?: string;
  /** Nível educacional (apenas conceitos) — usado pelo filtro de nível. */
  educationLevel?: EducationLevel;
}

export function lodForScale(k: number): LodLevel {
  if (k < 0.16) return LOD.MACRO;
  if (k < 0.6) return LOD.PERIOD;
  if (k < 2) return LOD.AREA;
  if (k < 6) return LOD.CONCEPT;
  if (k < 16) return LOD.DETAIL;
  return LOD.DEEP;
}
