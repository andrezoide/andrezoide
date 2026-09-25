import type { Proof } from '@/types/content';

export const PROOFS: Proof[] = [
  {
    id: 'proof-pythagorean-rearrangement',
    title: 'Demonstração do teorema de Pitágoras por rearranjo',
    formulaId: 'f-pythagorean',
    status: { status: 'reconstruction', note: 'Esta é uma das muitas demonstrações possíveis (existem centenas catalogadas); o rearranjo geométrico aqui apresentado segue o espírito das demonstrações chinesas e de Bhaskara, adaptado para clareza didática.' },
    steps: [
      { latex: '\\text{Tome um quadrado de lado } (a+b)', narration: 'Comece com um quadrado grande cujo lado mede a soma dos dois catetos.' },
      { latex: '\\text{Área total} = (a+b)^2', narration: 'A área desse quadrado grande é (a+b)², que podemos expandir depois.' },
      { latex: '\\text{Encaixe 4 triângulos retângulos (catetos } a, b\\text{) nas bordas}', narration: 'Dentro do quadrado grande, posicione quatro cópias do triângulo retângulo original, cada uma com catetos a e b.' },
      { latex: '\\text{A região central é um quadrado de lado } c', narration: 'O espaço que sobra no meio, delimitado pelas hipotenusas dos quatro triângulos, é exatamente um quadrado de lado c.' },
      { latex: '(a+b)^2 = 4\\left(\\frac{ab}{2}\\right) + c^2', narration: 'A área total do quadrado grande é igual à soma das áreas dos 4 triângulos mais a área do quadrado central.' },
      { latex: 'a^2 + 2ab + b^2 = 2ab + c^2', narration: 'Expandindo o lado esquerdo e simplificando o direito.' },
      { latex: 'a^2 + b^2 = c^2', narration: 'Cancelando o termo 2ab de ambos os lados, obtemos exatamente o teorema de Pitágoras.' },
    ],
    sources: ['src-heath-1921', 'src-shen-crossley-lun-1999'],
  },
  {
    id: 'proof-euclid-infinite-primes',
    title: 'Demonstração de Euclides: existem infinitos primos',
    conceptId: 'number-theory-primes',
    status: { status: 'documented' },
    steps: [
      { latex: '\\text{Suponha, por absurdo, que existem apenas } n \\text{ primos: } p_1, \\dots, p_n', narration: 'A demonstração começa supondo o oposto do que queremos provar.' },
      { latex: 'N = p_1 \\cdot p_2 \\cdots p_n + 1', narration: 'Construa o número N: o produto de todos os primos supostamente existentes, mais 1.' },
      { latex: '\\text{Para todo } i, \\; N \\bmod p_i = 1', narration: 'Ao dividir N por qualquer um dos primos da lista, sobra sempre resto 1 — nenhum deles divide N exatamente.' },
      { latex: '\\text{Logo N é primo, ou tem um fator primo } q \\notin \\{p_1,\\dots,p_n\\}', narration: 'Como nenhum primo da lista divide N, ou N é ele mesmo primo, ou algum de seus fatores primos não estava na lista original.' },
      { latex: '\\text{Em ambos os casos, existe um primo fora da lista — contradição}', narration: 'Isso contradiz a suposição de que a lista continha todos os primos existentes, então essa suposição é falsa: os primos são infinitos.' },
    ],
    sources: ['src-heath-1921', 'src-euclid-elements-heiberg'],
  },
  {
    id: 'proof-sqrt2-irrational',
    title: 'Demonstração: √2 é irracional',
    conceptId: 'irrational-numbers',
    status: { status: 'reconstruction', note: 'A demonstração por redução ao absurdo apresentada aqui é a forma clássica atribuída à tradição pitagórica, reconstruída na linguagem algébrica moderna (que não existia na época original).' },
    steps: [
      { latex: '\\text{Suponha, por absurdo, que } \\sqrt{2} = \\frac{p}{q}, \\; \\gcd(p,q)=1', narration: 'Suponha o oposto: que √2 pode ser escrito como fração irredutível.' },
      { latex: '2 = \\frac{p^2}{q^2} \\;\\Rightarrow\\; p^2 = 2q^2', narration: 'Elevando ambos os lados ao quadrado e isolando p².' },
      { latex: '\\text{Logo } p^2 \\text{ é par} \\;\\Rightarrow\\; p \\text{ é par}', narration: 'Se p² é par, p também precisa ser par (o quadrado de um número ímpar é sempre ímpar).' },
      { latex: 'p = 2k \\;\\Rightarrow\\; (2k)^2 = 2q^2 \\;\\Rightarrow\\; q^2 = 2k^2', narration: 'Escrevendo p como 2k e substituindo, chegamos a uma equação semelhante para q.' },
      { latex: '\\text{Logo } q \\text{ também é par}', narration: 'Pelo mesmo argumento, q também precisa ser par.' },
      { latex: '\\text{Mas } p \\text{ e } q \\text{ pares contradiz } \\gcd(p,q)=1', narration: 'Isso contradiz a suposição inicial de que p/q já estava em sua forma mais simples — logo, √2 não pode ser uma fração.' },
    ],
    sources: ['src-heath-1921'],
  },
  {
    id: 'proof-cantor-diagonal',
    title: 'O argumento diagonal de Cantor',
    conceptId: 'set-theory-infinity',
    status: { status: 'documented' },
    steps: [
      { latex: '\\text{Suponha, por absurdo, que existe uma lista } r_1, r_2, r_3, \\dots \\text{ com todos os reais em } (0,1)', narration: 'Suponha o oposto: que é possível enumerar todos os números reais entre 0 e 1, um por um.' },
      { latex: '\\text{Escreva cada } r_n \\text{ em expansão decimal: } r_n = 0{,}d_{n1}d_{n2}d_{n3}\\dots', narration: 'Cada número da lista tem uma expansão decimal infinita.' },
      { latex: '\\text{Construa } d = 0{,}e_1e_2e_3\\dots \\text{ onde } e_n \\neq d_{nn}', narration: 'Construa um novo número d escolhendo, para cada posição n, um dígito diferente do n-ésimo dígito do n-ésimo número da lista.' },
      { latex: 'd \\neq r_n \\text{ para todo } n, \\text{ pois difere no } n\\text{-ésimo dígito}', narration: 'Esse novo número d é diferente de todo número da lista — ele difere de r₁ no primeiro dígito, de r₂ no segundo, e assim por diante.' },
      { latex: '\\text{Mas } d \\in (0,1) \\text{ e não está na lista — contradição}', narration: 'Isso contradiz a suposição de que a lista continha todos os reais entre 0 e 1: portanto, tal lista não pode existir, e os reais não são enumeráveis.' },
    ],
    sources: ['src-dauben-1979'],
  },
];

export const PROOF_BY_ID = new Map(PROOFS.map((p) => [p.id, p]));
