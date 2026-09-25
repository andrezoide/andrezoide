import type { OpenProblem } from '@/types/content';

/**
 * Problemas genuinamente em aberto. Nunca apresentados como resolvidos —
 * o campo "currentState" deve sempre deixar claro o que ainda não se sabe.
 */
export const OPEN_PROBLEMS: OpenProblem[] = [
  {
    id: 'op-riemann-hypothesis',
    title: 'A Hipótese de Riemann',
    originYear: 1859,
    statement: 'Todos os zeros não triviais da função zeta de Riemann ζ(s) têm parte real igual a 1/2.',
    context: 'Bernhard Riemann propôs essa hipótese em um artigo de 1859 sobre a distribuição dos números primos, ligando o comportamento da função zeta — definida para números complexos — à frequência com que primos aparecem entre os inteiros.',
    whatWeKnow: 'Bilhões de zeros não triviais já foram calculados computacionalmente, e todos, sem exceção, têm parte real 1/2. A hipótese também foi demonstrada para faixas específicas e sob certas condições adicionais, mas nenhuma demonstração geral existe.',
    whyHard: 'A função zeta conecta análise complexa, teoria dos números e (mais recentemente) física teórica de formas profundas e ainda mal compreendidas; nenhuma das técnicas conhecidas foi capaz de provar a hipótese para todos os infinitos zeros possíveis.',
    currentState: 'Em aberto. É um dos sete "Problemas do Milênio" listados pelo Clay Mathematics Institute em 2000, com um prêmio de US$ 1 milhão para uma demonstração (ou refutação) completa.',
    conceptIds: ['number-theory-primes'],
    sources: ['src-clay-riemann'],
  },
  {
    id: 'op-p-vs-np',
    title: 'P vs NP',
    originYear: 1971,
    statement: 'Todo problema cuja solução pode ser verificada rapidamente por um computador também pode ser resolvida rapidamente por um computador?',
    context: 'Formalizado na teoria da complexidade computacional dos anos 1970 (Stephen Cook, Leonid Levin, Richard Karp), pergunta se as classes de problemas "P" (resolvíveis rapidamente) e "NP" (verificáveis rapidamente) são, na verdade, a mesma classe.',
    whatWeKnow: 'Sabe-se que P ⊆ NP (todo problema resolvível rapidamente também é verificável rapidamente). O que não se sabe é se a inclusão é estrita. Milhares de problemas práticos importantes (logística, criptografia, biologia computacional) são "NP-completos" — se um deles tiver uma solução rápida, todos terão.',
    whyHard: 'Provar que P ≠ NP exigiria demonstrar que nenhum algoritmo eficiente pode existir para uma classe inteira de problemas — um tipo de afirmação universal negativa extremamente difícil de estabelecer com as técnicas atuais.',
    currentState: 'Em aberto. Também é um dos Problemas do Milênio do Clay Mathematics Institute. A maioria dos pesquisadores acredita que P ≠ NP, mas essa é uma conjectura, não um fato demonstrado.',
    conceptIds: ['algorithm-computability'],
    sources: ['src-clay-pvsnp'],
  },
  {
    id: 'op-goldbach',
    title: 'A Conjectura de Goldbach',
    originYear: 1742,
    statement: 'Todo número inteiro par maior que 2 pode ser escrito como a soma de dois números primos.',
    context: 'Proposta por Christian Goldbach em uma carta a Euler em 1742. Euler respondeu considerando-a provavelmente verdadeira, mas nem ele nem ninguém depois conseguiu demonstrá-la para todos os pares.',
    whatWeKnow: 'A conjectura foi verificada computacionalmente para todos os números pares até magnitudes extremamente grandes (da ordem de 4 × 10¹⁸), sem uma única exceção encontrada. Resultados parciais mais fracos (como todo número par ser soma de no máximo seis primos) já foram demonstrados.',
    whyHard: 'Não existe, até hoje, uma técnica capaz de garantir que a propriedade vale para todo número par, e não apenas para os que já foram testados — o problema pertence a uma classe de perguntas em teoria dos números aditiva que se mostraram historicamente muito resistentes.',
    currentState: 'Em aberto. Continua sendo um dos problemas não resolvidos mais antigos e mais simples de enunciar em toda a matemática.',
    conceptIds: ['number-theory-primes'],
    sources: ['src-oeis-goldbach'],
  },
];

export const OPEN_PROBLEM_BY_ID = new Map(OPEN_PROBLEMS.map((p) => [p.id, p]));
