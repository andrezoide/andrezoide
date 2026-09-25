import type { Area } from '@/types/content';

export const AREAS: Area[] = [
  {
    id: 'aritmetica',
    name: 'Aritmética',
    description:
      'A arte de contar, registrar e operar com quantidades — a camada mais antiga e mais fundamental da matemática, presente em toda civilização que já registrou números.',
    color: '#c98a4b',
    evolutionLine: [
      { conceptId: 'counting-tally', note: 'Marcas de contagem: um símbolo para cada unidade.' },
      { conceptId: 'sexagesimal-positional', note: 'Um sistema posicional permite representar qualquer quantidade com poucos símbolos.' },
      { conceptId: 'zero-decimal-positional', note: 'O zero como algarismo torna o sistema posicional plenamente eficiente.' },
      { conceptId: 'negative-numbers', note: 'Números além da contagem: dívidas, direções, ausência.' },
    ],
  },
  {
    id: 'teoria-dos-numeros',
    name: 'Teoria dos Números',
    description:
      'O estudo das propriedades dos próprios números inteiros — primos, divisibilidade, e mais tarde os números que não são nem inteiros nem razões de inteiros.',
    color: '#7c5cad',
    evolutionLine: [
      { conceptId: 'number-theory-primes', note: 'Euclides demonstra que os primos nunca se esgotam.' },
      { conceptId: 'irrational-numbers', note: 'A descoberta de que nem toda razão é uma fração abala a matemática grega.' },
      { conceptId: 'imaginary-complex-numbers', note: 'Números que resolvem equações sem solução real.' },
      { conceptId: 'cryptography-modern', note: 'Propriedades de números primos protegem informação digital.' },
    ],
  },
  {
    id: 'algebra',
    name: 'Álgebra',
    description:
      'A arte de resolver equações — inicialmente descrita em palavras, depois em símbolos, e finalmente generalizada ao estudo de estruturas abstratas.',
    color: '#3f7cac',
    evolutionLine: [
      { conceptId: 'algebra-equations', note: 'Al-Khwarizmi sistematiza métodos para "restaurar" e "equilibrar" equações.' },
      { conceptId: 'algebraic-notation', note: 'Viète e Descartes substituem palavras por símbolos.' },
      { conceptId: 'imaginary-complex-numbers', note: 'A álgebra exige números além da reta real.' },
      { conceptId: 'group-theory-abstract-algebra', note: 'Galois estuda simetrias das próprias equações.' },
    ],
  },
  {
    id: 'geometria',
    name: 'Geometria',
    description:
      'O estudo do espaço, da forma e da medida — da geometria prática de agrimensores à axiomática grega e às geometrias curvas do século XIX.',
    color: '#c7b299',
    evolutionLine: [
      { conceptId: 'euclidean-axioms', note: 'Toda verdade geométrica deve ser demonstrada a partir de axiomas explícitos.' },
      { conceptId: 'pythagorean-theorem', note: 'Um dos teoremas mais reencontrados de forma independente na história.' },
      { conceptId: 'non-euclidean-geometry', note: 'Negar o postulado das paralelas gera geometrias igualmente consistentes.' },
    ],
  },
  {
    id: 'trigonometria',
    name: 'Trigonometria',
    description:
      'Nascida da astronomia, relaciona ângulos e comprimentos — ponte entre a geometria clássica e as funções que mais tarde alimentariam o cálculo.',
    color: '#2f9e8f',
    evolutionLine: [
      { conceptId: 'trigonometry', note: 'Tabelas de cordas e senos permitem calcular posições astronômicas.' },
      { conceptId: 'analytic-geometry', note: 'Curvas trigonométricas ganham coordenadas.' },
      { conceptId: 'calculus-derivative', note: 'A taxa de variação do seno leva diretamente ao cosseno.' },
    ],
  },
  {
    id: 'calculo-analise',
    name: 'Cálculo e Análise',
    description:
      'O estudo matemático da mudança contínua — taxas de variação, acumulação e o comportamento de processos infinitos, tratados com rigor crescente.',
    color: '#4fb0ac',
    evolutionLine: [
      { conceptId: 'calculus-derivative', note: 'Qual é a velocidade instantânea de algo que está mudando?' },
      { conceptId: 'calculus-integral', note: 'Somar infinitas fatias infinitesimais para obter uma área ou volume exatos.' },
      { conceptId: 'series-sequences', note: 'Somas com infinitos termos podem convergir para um valor finito.' },
    ],
  },
  {
    id: 'probabilidade-estatistica',
    name: 'Probabilidade e Estatística',
    description:
      'Nascida de perguntas sobre jogos de azar, tornou-se a linguagem matemática da incerteza — hoje essencial para ciência, economia e tomada de decisão.',
    color: '#c65b4e',
    evolutionLine: [
      { conceptId: 'combinatoria-binomio', note: 'Contar o número de combinações possíveis é o primeiro passo para medir chances.' },
      { conceptId: 'probability', note: 'Pascal e Fermat formalizam o valor esperado de um jogo interrompido.' },
    ],
  },
  {
    id: 'logica-fundamentos',
    name: 'Lógica e Fundamentos',
    description:
      'A investigação sobre o que torna uma demonstração válida e sobre os alicerces sobre os quais toda a matemática repousa.',
    color: '#9aa4ad',
    evolutionLine: [
      { conceptId: 'euclidean-axioms', note: 'O método axiomático nasce como padrão de rigor.' },
      { conceptId: 'set-theory-infinity', note: 'Cantor tenta fundamentar toda a matemática na noção de conjunto.' },
      { conceptId: 'mathematical-logic-foundations', note: 'Gödel mostra que todo sistema suficientemente rico é incompleto ou inconsistente.' },
    ],
  },
  {
    id: 'algebra-abstrata',
    name: 'Álgebra Abstrata',
    description:
      'Em vez de estudar números, estuda estruturas — grupos, anéis, corpos — que capturam padrões comuns a muitos sistemas matemáticos diferentes.',
    color: '#7c5cad',
    evolutionLine: [
      { conceptId: 'algebra-equations', note: 'Por que algumas equações não têm solução por radicais?' },
      { conceptId: 'group-theory-abstract-algebra', note: 'Galois associa a cada equação um grupo de simetrias.' },
    ],
  },
  {
    id: 'topologia',
    name: 'Topologia',
    description:
      'O estudo das propriedades que sobrevivem a deformações contínuas — "geometria de borracha". Emergiu da análise e da geometria não euclidiana no fim do século XIX.',
    color: '#5b7a8c',
    evolutionLine: [
      { conceptId: 'non-euclidean-geometry', note: 'Espaços curvos preparam o terreno para pensar em espaços mais gerais.' },
      { conceptId: 'set-theory-infinity', note: 'A teoria dos conjuntos fornece a linguagem para definir espaços abstratos com rigor.' },
    ],
  },
  {
    id: 'matematica-discreta-grafos',
    name: 'Matemática Discreta e Teoria dos Grafos',
    description:
      'O estudo de estruturas formadas por partes distintas e conexões entre elas — de um problema recreativo do século XVIII às redes que hoje sustentam a internet.',
    color: '#c1543c',
    evolutionLine: [
      { conceptId: 'graph-theory', note: 'Euler resolve o problema das pontes de Königsberg criando um novo tipo de objeto matemático.' },
      { conceptId: 'combinatoria-binomio', note: 'Contar caminhos, arranjos e combinações é o núcleo do pensamento discreto.' },
    ],
  },
  {
    id: 'computacao-criptografia',
    name: 'Computação e Criptografia',
    description:
      'A matemática que descreve o que pode ser calculado, e a matemática que protege o que é calculado — dois campos que nasceram juntos no século XX.',
    color: '#5ad1c4',
    evolutionLine: [
      { conceptId: 'algorithm-computability', note: 'Turing formaliza precisamente o que significa "calcular algo".' },
      { conceptId: 'cryptography-modern', note: 'A dificuldade de fatorar números grandes protege comunicações digitais.' },
    ],
  },
];

export const AREA_BY_ID = new Map(AREAS.map((a) => [a.id, a]));
