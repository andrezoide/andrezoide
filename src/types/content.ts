/**
 * Atlas da Matemática — modelo de dados
 *
 * Todo o conteúdo histórico vive em /src/data como objetos tipados.
 * Nada de conteúdo é embutido diretamente em componentes React: os
 * componentes apenas leem e renderizam essas estruturas. Isso permite que o
 * acervo cresça de dezenas para milhares de itens sem tocar na camada visual.
 */

/** Ano astronômico: negativo = a.C. (ano 1 a.C. = 0, 2 a.C. = -1, etc). */
export type Year = number;

export type EpistemicStatus =
  | 'documented' // fato bem documentado por fontes primárias
  | 'interpretation' // leitura historiográfica aceita, não um fato bruto
  | 'reconstruction' // reconstrução didática de um método/procedimento
  | 'simplification' // simplificação pedagógica deliberada
  | 'hypothesis' // hipótese historiográfica
  | 'disputed'; // origem/atribuição disputada entre historiadores

export type EducationLevel =
  | 'curioso'
  | 'fundamental'
  | 'medio'
  | 'universidade'
  | 'avancado';

export const EDUCATION_LEVELS: EducationLevel[] = [
  'curioso',
  'fundamental',
  'medio',
  'universidade',
  'avancado',
];

export interface Source {
  id: string;
  author?: string;
  work?: string;
  year?: string;
  institution?: string;
  url?: string;
  citation: string; // referência formatada pronta para exibição
  note?: string; // ex: "tradução consultada", "fonte secundária"
}

export interface ClaimStatus {
  status: EpistemicStatus;
  note?: string; // ex: "a atribuição a Pitágoras é disputada; ver fontes"
}

/** Um grande arco cronológico (Antiguidade, Medieval, Renascimento...). */
export interface Era {
  id: string;
  name: string;
  startYear: Year;
  endYear: Year;
  description: string;
  themeId: ChronotopeThemeId;
}

/** Um período mais específico dentro de uma Era (ex: "Século XVII"). */
export interface Period {
  id: string;
  eraId: string;
  name: string;
  startYear: Year;
  endYear: Year;
  summary: string;
  civilizationIds: string[];
  themeId: ChronotopeThemeId;
  status?: ClaimStatus;
}

export interface GeoLocation {
  lat: number;
  lon: number;
  label: string;
}

export interface Civilization {
  id: string;
  name: string;
  region: string;
  location?: GeoLocation;
  activeStart: Year;
  activeEnd: Year;
  description: string;
  highlights: string[];
  sources: string[]; // Source ids
}

export interface Person {
  id: string;
  name: string;
  alternateNames?: string[];
  birthYear?: Year;
  deathYear?: Year;
  approxDates?: boolean;
  civilizationId?: string;
  periodIds: string[];
  bio: string;
  contributions: string[];
  conceptIds: string[];
  status?: ClaimStatus;
  sources: string[];
}

export type AreaId = string;

export interface Area {
  id: AreaId;
  name: string;
  description: string;
  color: string; // token usado no grafo e nas trilhas de evolução
  evolutionLine: EvolutionStep[];
}

export interface EvolutionStep {
  conceptId: string;
  note: string;
}

/** A cadeia narrativa "por que isso existe?" exigida pelo projeto. */
export interface WhyChainStep {
  label: string; // ex: "PROBLEMA", "OBSERVAÇÃO", "IDEIA", "FORMALIZAÇÃO"
  text: string;
}

export interface LayeredExplanation {
  intuition: string; // camada 1
  example: string; // camada 2
  formulaLatex?: string; // camada 3
  derivation?: string; // camada 4
  formal?: string; // camada 5
}

export interface ConceptExample {
  id: string;
  title: string;
  latexSteps: string[]; // usado pelo Mathematical Paper
  narration?: string[]; // texto opcional acompanhando cada passo
}

export interface Concept {
  id: string;
  title: string;
  shortTitle?: string;
  areaIds: AreaId[];
  periodIds: string[];
  civilizationIds: string[];
  level: EducationLevel;
  status?: ClaimStatus;
  whyChain: WhyChainStep[];
  layers: LayeredExplanation;
  examples: ConceptExample[];
  formulaIds: string[];
  problemIds: string[];
  peopleIds: string[];
  relatedConceptIds: string[];
  applications: string[];
  notationEvolution?: NotationStage[];
  interactive?: InteractiveSpec;
  sources: string[];
}

export interface NotationStage {
  label: string; // "Representação antiga", "Notação medieval", "Notação moderna"
  display: string; // texto/latex representando a notação da época
  note?: string;
}

/** Descreve qual widget interativo acompanha o conceito, se houver. */
export type InteractiveSpec =
  | { kind: 'formula-explorer'; formulaId: string }
  | { kind: 'function-grapher'; initial: { a: number; b: number; c: number } }
  | { kind: 'geometry-triangle' }
  | { kind: 'unit-circle' }
  | { kind: 'none' };

export interface FormulaVariable {
  symbol: string;
  name: string;
  description: string;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
}

export interface Formula {
  id: string;
  title: string;
  latex: string;
  conceptId: string;
  problemSolved: string;
  history: string;
  variables: FormulaVariable[];
  example: {
    values: Record<string, number>;
    latexSteps: string[];
  };
  visualization?: 'circle-area' | 'pythagorean' | 'quadratic-graph' | 'none';
  sources: string[];
}

export interface ProofStep {
  latex: string;
  narration: string;
}

export interface Proof {
  id: string;
  title: string;
  conceptId?: string;
  formulaId?: string;
  status: ClaimStatus;
  steps: ProofStep[];
  sources: string[];
}

export interface TryItYourself {
  prompt: string;
  givens: string[];
  hints: string[];
  solutionStepsLatex: string[];
}

export interface HistoricalProblem {
  id: string;
  title: string;
  periodId: string;
  civilizationId: string;
  context: string;
  problemText: string;
  historicalApproach: string;
  modernSolutionLatexSteps: string[];
  conceptIds: string[];
  tryIt?: TryItYourself;
  status: ClaimStatus;
  sources: string[];
}

export type DocumentKind =
  | 'tablet'
  | 'papyrus'
  | 'manuscript'
  | 'book'
  | 'diagram';

export interface HistoricalDocument {
  id: string;
  title: string;
  kind: DocumentKind;
  periodId: string;
  civilizationId?: string;
  imageUrl?: string;
  transcription?: string;
  context: string;
  status: ClaimStatus;
  sources: string[];
}

export type RelationType =
  | 'influenced'
  | 'developed'
  | 'generalized'
  | 'used'
  | 'dependsOn'
  | 'emergedFrom'
  | 'appliedIn'
  | 'relatedTo'
  | 'contemporaryOf';

export type NodeKind =
  | 'person'
  | 'concept'
  | 'formula'
  | 'problem'
  | 'area'
  | 'document'
  | 'civilization'
  | 'period';

export interface NodeRef {
  kind: NodeKind;
  id: string;
}

export interface Relationship {
  id: string;
  source: NodeRef;
  target: NodeRef;
  type: RelationType;
  note?: string;
}

/** Um problema aberto — nunca deve ser apresentado como resolvido. */
export interface OpenProblem {
  id: string;
  title: string;
  originYear?: Year;
  statement: string;
  context: string;
  whatWeKnow: string;
  whyHard: string;
  currentState: string;
  conceptIds: string[];
  sources: string[];
}

// ---------------------------------------------------------------------------
// Tema cronotópico (identidade visual por período)
// ---------------------------------------------------------------------------

export type ChronotopeThemeId =
  | 'prehistoric'
  | 'mesopotamia'
  | 'egypt'
  | 'classical'
  | 'india-china'
  | 'islamic'
  | 'medieval'
  | 'renaissance'
  | 'scientific-revolution'
  | 'enlightenment'
  | 'nineteenth'
  | 'modern'
  | 'contemporary';

export interface ChronotopeTheme {
  id: ChronotopeThemeId;
  label: string;
  bg: string;
  bgAlt: string;
  surface: string;
  ink: string;
  inkDim: string;
  accent: string;
  accentAlt: string;
  border: string;
  texture?: string; // classe CSS opcional para textura de fundo
  fontDisplay: string;
}
