import type { NodeRef, Relationship, RelationType } from '@/types/content';
import { CONCEPTS } from './concepts';
import { FORMULAS } from './formulas';
import { PROBLEMS } from './problems';
import { PROOFS } from './proofs';
import { AREAS } from './areas';

/**
 * O grafo de conhecimento é, na maior parte, DERIVADO automaticamente dos
 * dados já existentes (relatedConceptIds, peopleIds, formulaIds...) — assim
 * o grafo cresce sozinho conforme o acervo cresce, sem exigir manutenção
 * duplicada. Um pequeno conjunto de arestas é curado manualmente para
 * capturar relações que não vivem em nenhum campo estruturado (como a
 * circulação de conhecimento entre civilizações).
 */

let counter = 0;
function edge(source: NodeRef, target: NodeRef, type: RelationType, note?: string): Relationship {
  counter += 1;
  return { id: `rel-${counter}`, source, target, type, note };
}

function deriveRelationships(): Relationship[] {
  const rels: Relationship[] = [];

  for (const concept of CONCEPTS) {
    for (const relatedId of concept.relatedConceptIds) {
      rels.push(edge({ kind: 'concept', id: concept.id }, { kind: 'concept', id: relatedId }, 'relatedTo'));
    }
    for (const personId of concept.peopleIds) {
      rels.push(edge({ kind: 'person', id: personId }, { kind: 'concept', id: concept.id }, 'developed'));
    }
    for (const formulaId of concept.formulaIds) {
      rels.push(edge({ kind: 'concept', id: concept.id }, { kind: 'formula', id: formulaId }, 'used'));
    }
    for (const problemId of concept.problemIds) {
      rels.push(edge({ kind: 'problem', id: problemId }, { kind: 'concept', id: concept.id }, 'relatedTo'));
    }
    for (const areaId of concept.areaIds) {
      rels.push(edge({ kind: 'concept', id: concept.id }, { kind: 'area', id: areaId }, 'relatedTo'));
    }
  }

  for (const formula of FORMULAS) {
    rels.push(edge({ kind: 'formula', id: formula.id }, { kind: 'concept', id: formula.conceptId }, 'dependsOn'));
  }

  for (const problem of PROBLEMS) {
    for (const conceptId of problem.conceptIds) {
      rels.push(edge({ kind: 'problem', id: problem.id }, { kind: 'concept', id: conceptId }, 'emergedFrom'));
    }
  }

  for (const proof of PROOFS) {
    if (proof.conceptId) {
      rels.push(edge({ kind: 'concept', id: proof.conceptId }, { kind: 'concept', id: proof.conceptId }, 'relatedTo', 'demonstração associada'));
    }
  }

  for (const area of AREAS) {
    for (let i = 0; i < area.evolutionLine.length - 1; i++) {
      const from = area.evolutionLine[i];
      const to = area.evolutionLine[i + 1];
      rels.push(edge({ kind: 'concept', id: from.conceptId }, { kind: 'concept', id: to.conceptId }, 'generalized', to.note));
    }
  }

  return rels;
}

/** Arestas curadas manualmente — circulação de conhecimento entre civilizações
 * e casos notáveis de desenvolvimento convergente/independente (item 33 e 45
 * do briefing: nunca forçar uma relação histórica sem base). */
const CURATED: Relationship[] = [
  edge({ kind: 'civilization', id: 'mesopotamia' }, { kind: 'civilization', id: 'greece' }, 'influenced', 'Astronomia e aritmética mesopotâmicas circulam pelo Mediterrâneo oriental antes e durante o período helenístico.'),
  edge({ kind: 'civilization', id: 'greece' }, { kind: 'civilization', id: 'islamic-world' }, 'influenced', 'Tradução sistemática de textos gregos (Euclides, Arquimedes, Apolônio, Ptolomeu) para o árabe entre os séculos VIII e X.'),
  edge({ kind: 'civilization', id: 'india' }, { kind: 'civilization', id: 'islamic-world' }, 'influenced', 'O sistema decimal posicional indiano é adotado e descrito por al-Khwarizmi.'),
  edge({ kind: 'civilization', id: 'islamic-world' }, { kind: 'civilization', id: 'europe' }, 'influenced', 'Traduções do árabe para o latim (Toledo, séc. XII) reintroduzem e expandem o conhecimento grego e indiano na Europa.'),
  edge({ kind: 'civilization', id: 'mesopotamia' }, { kind: 'civilization', id: 'egypt' }, 'contemporaryOf', 'Tradições matemáticas paralelas, com pouca evidência de influência direta mútua nos métodos.'),
  edge({ kind: 'civilization', id: 'china' }, { kind: 'civilization', id: 'india' }, 'contemporaryOf', 'Desenvolvimento amplamente paralelo, com contato via rotas comerciais e budistas, mas tradições matemáticas distintas.'),
  edge({ kind: 'civilization', id: 'mesoamerica' }, { kind: 'civilization', id: 'mesopotamia' }, 'contemporaryOf', 'Desenvolvimento do zero posicional inteiramente independente — nenhum contato conhecido entre as duas tradições.'),
  edge({ kind: 'concept', id: 'pythagorean-theorem' }, { kind: 'concept', id: 'geometria-medida-pratica' }, 'emergedFrom', 'A relação numérica já era usada em problemas práticos de medição antes de qualquer demonstração geral.'),
  edge({ kind: 'concept', id: 'combinatoria-binomio' }, { kind: 'concept', id: 'probability' }, 'dependsOn', 'Contar combinações possíveis é pré-requisito para calcular probabilidades clássicas.'),
  edge({ kind: 'concept', id: 'algorithm-computability' }, { kind: 'concept', id: 'cryptography-modern' }, 'appliedIn', 'A noção de dificuldade computacional é o que torna a criptografia de chave pública segura.'),
  edge({ kind: 'concept', id: 'non-euclidean-geometry' }, { kind: 'concept', id: 'set-theory-infinity' }, 'contemporaryOf', 'Ambas as rupturas no rigor matemático do século XIX se desenvolvem em décadas próximas e se influenciam mutuamente.'),
  edge({ kind: 'concept', id: 'mathematical-logic-foundations' }, { kind: 'concept', id: 'algorithm-computability' }, 'emergedFrom', 'O Entscheidungsproblem de Hilbert é o que leva diretamente Turing a formalizar a computação.'),
  edge({ kind: 'concept', id: 'zero-decimal-positional' }, { kind: 'concept', id: 'algebra-equations' }, 'dependsOn', 'A álgebra indiana e islâmica depende do sistema decimal posicional com zero para seus algoritmos de cálculo.'),
];

export const RELATIONSHIPS: Relationship[] = [...deriveRelationships(), ...CURATED];

export function relationshipsFor(node: NodeRef): Relationship[] {
  return RELATIONSHIPS.filter(
    (r) =>
      (r.source.kind === node.kind && r.source.id === node.id) ||
      (r.target.kind === node.kind && r.target.id === node.id),
  );
}
