import type { Period } from '@/types/content';

export const PERIODS: Period[] = [
  {
    id: 'p-tally',
    eraId: 'origins',
    name: 'Primeiras contagens',
    startYear: -20000,
    endYear: -8000,
    summary:
      'Ossos com marcas de contagem (como o osso de Lebombo e o osso de Ishango) sugerem que registrar quantidades por meio de entalhes é uma das práticas simbólicas mais antigas da humanidade.',
    civilizationIds: [],
    themeId: 'prehistoric',
    status: { status: 'interpretation', note: 'A função exata dessas marcas (contagem, calendário lunar, jogo) é debatida entre arqueólogos.' },
  },
  {
    id: 'p-neolithic',
    eraId: 'origins',
    name: 'Agricultura, comércio e os primeiros símbolos numéricos',
    startYear: -8000,
    endYear: -3000,
    summary:
      'Com a agricultura e o comércio, surgem fichas de argila (tokens) usadas para representar quantidades de bens — um precursor direto da escrita numérica na Mesopotâmia.',
    civilizationIds: ['mesopotamia'],
    themeId: 'prehistoric',
    status: { status: 'interpretation', note: 'A hipótese dos "tokens" como origem da escrita cuneiforme, proposta por Denise Schmandt-Besserat, é amplamente discutida mas não consensual em todos os detalhes.' },
  },
  {
    id: 'p-mesopotamia-early',
    eraId: 'antiquity',
    name: 'Suméria e Acádia: nascimento da numeração posicional',
    startYear: -3000,
    endYear: -1800,
    summary:
      'A escrita cuneiforme registra números em base 60 posicional — o mesmo princípio que hoje usamos para horas e minutos.',
    civilizationIds: ['mesopotamia'],
    themeId: 'mesopotamia',
  },
  {
    id: 'p-babylon-old',
    eraId: 'antiquity',
    name: 'Período Babilônico Antigo: tábuas e problemas',
    startYear: -1800,
    endYear: -1500,
    summary:
      'Escribas babilônicos produzem tábuas de multiplicação, de raízes quadradas e coleções de problemas resolvidos geometricamente — equivalentes a equações quadráticas modernas.',
    civilizationIds: ['mesopotamia'],
    themeId: 'mesopotamia',
  },
  {
    id: 'p-egypt-kingdoms',
    eraId: 'antiquity',
    name: 'Egito: administração, construção e papiros matemáticos',
    startYear: -2700,
    endYear: -30,
    summary:
      'Do Reino Antigo ao período ptolomaico, escribas egípcios usam aritmética de frações unitárias para resolver problemas de terras, construção, salários e distribuição de pão e cerveja.',
    civilizationIds: ['egypt'],
    themeId: 'egypt',
  },
  {
    id: 'p-greece-archaic',
    eraId: 'antiquity',
    name: 'Grécia arcaica e clássica: da observação à demonstração',
    startYear: -600,
    endYear: -400,
    summary:
      'Tales e a escola pitagórica deslocam a matemática de um conjunto de receitas práticas para um sistema de afirmações que exigem justificativa lógica.',
    civilizationIds: ['greece'],
    themeId: 'classical',
  },
  {
    id: 'p-greece-hellenistic',
    eraId: 'antiquity',
    name: 'Alexandria e o período helenístico',
    startYear: -400,
    endYear: -100,
    summary:
      'Euclides sistematiza a geometria em Os Elementos; Arquimedes desenvolve métodos infinitesimais; Apolônio estuda cônicas; Eratóstenes estima a circunferência da Terra.',
    civilizationIds: ['greece'],
    themeId: 'classical',
  },
  {
    id: 'p-greece-late',
    eraId: 'antiquity',
    name: 'Antiguidade tardia: álgebra e os últimos matemáticos de Alexandria',
    startYear: 100,
    endYear: 500,
    summary:
      'Diofanto trata problemas em termos de incógnitas em sua Arithmetica; Hypatia e Pappus continuam a tradição matemática alexandrina até o fim da Antiguidade.',
    civilizationIds: ['greece'],
    themeId: 'classical',
  },
  {
    id: 'p-india-classical',
    eraId: 'antiquity',
    name: 'Índia clássica: astronomia, zero e trigonometria',
    startYear: -800,
    endYear: 700,
    summary:
      'Dos Sulba Sutras (geometria ritual) a Aryabhata e Brahmagupta, a matemática indiana se desenvolve fortemente ligada à astronomia, produzindo o sistema decimal posicional com zero.',
    civilizationIds: ['india'],
    themeId: 'india-china',
  },
  {
    id: 'p-china-classical',
    eraId: 'antiquity',
    name: 'China clássica: Os Nove Capítulos',
    startYear: -1000,
    endYear: 500,
    summary:
      'A tradição chinesa consolida métodos algorítmicos de resolução de problemas, reunidos em Os Nove Capítulos sobre a Arte Matemática, com comentários posteriores de Liu Hui.',
    civilizationIds: ['china'],
    themeId: 'india-china',
  },
  {
    id: 'p-islamic-golden-age',
    eraId: 'medieval',
    name: 'Idade de Ouro Islâmica: a álgebra como disciplina',
    startYear: 750,
    endYear: 1250,
    summary:
      'Na Casa da Sabedoria em Bagdá e em outros centros, estudiosos traduzem obras gregas e indianas e desenvolvem a álgebra, a trigonometria esférica e algoritmos sistemáticos.',
    civilizationIds: ['islamic-world'],
    themeId: 'islamic',
  },
  {
    id: 'p-india-medieval',
    eraId: 'medieval',
    name: 'Índia medieval e a Escola de Kerala',
    startYear: 700,
    endYear: 1600,
    summary:
      'Bhaskara II sistematiza a álgebra indiana; séculos depois, a Escola de Kerala descobre séries infinitas para funções trigonométricas, antecipando resultados do cálculo europeu.',
    civilizationIds: ['india'],
    themeId: 'india-china',
  },
  {
    id: 'p-china-medieval',
    eraId: 'medieval',
    name: 'China medieval: a era de ouro da álgebra chinesa',
    startYear: 1000,
    endYear: 1400,
    summary:
      'Matemáticos da dinastia Song e Yuan, como Qin Jiushao e Zhu Shijie, aperfeiçoam métodos para resolver sistemas de equações e desenvolvem o triângulo aritmético.',
    civilizationIds: ['china'],
    themeId: 'india-china',
  },
  {
    id: 'p-medieval-europe',
    eraId: 'medieval',
    name: 'Europa medieval: universidades e aritmética comercial',
    startYear: 1100,
    endYear: 1400,
    summary:
      'A tradução de textos árabes para o latim e a obra de Fibonacci introduzem os algarismos indo-arábicos ao comércio e à vida acadêmica europeia.',
    civilizationIds: ['europe'],
    themeId: 'medieval',
  },
  {
    id: 'p-mesoamerica-classic',
    eraId: 'medieval',
    name: 'Mesoamérica: calendários e o zero maia',
    startYear: -400,
    endYear: 1200,
    summary:
      'De forma independente das tradições afro-eurasiáticas, os maias desenvolvem um sistema posicional em base 20 com um símbolo para zero, aplicado a cálculos calendáricos.',
    civilizationIds: ['mesoamerica'],
    themeId: 'india-china',
  },
  {
    id: 'p-renaissance',
    eraId: 'renaissance',
    name: 'Renascimento: a álgebra ganha símbolos',
    startYear: 1400,
    endYear: 1600,
    summary:
      'A resolução de equações cúbicas e quárticas na Itália e a álgebra simbólica de Viète transformam a maneira de escrever e pensar a matemática.',
    civilizationIds: ['europe'],
    themeId: 'renaissance',
  },
  {
    id: 'p-1600s',
    eraId: 'scientific-revolution',
    name: 'Século XVII: geometria, probabilidade e cálculo',
    startYear: 1600,
    endYear: 1700,
    summary:
      'Descartes une álgebra e geometria; Fermat e Pascal lançam as bases da probabilidade; Newton e Leibniz desenvolvem, de forma independente, o cálculo infinitesimal.',
    civilizationIds: ['europe'],
    themeId: 'scientific-revolution',
  },
  {
    id: 'p-1700s',
    eraId: 'enlightenment',
    name: 'Século XVIII: a era de Euler',
    startYear: 1700,
    endYear: 1800,
    summary:
      'Euler e a família Bernoulli aplicam o cálculo a quase todos os campos da ciência, enquanto a análise, a teoria dos números e as equações diferenciais se expandem rapidamente.',
    civilizationIds: ['europe'],
    themeId: 'enlightenment',
  },
  {
    id: 'p-1800-1850',
    eraId: 'nineteenth',
    name: 'Início do século XIX: rigor e novas geometrias',
    startYear: 1800,
    endYear: 1850,
    summary:
      'Gauss domina quase todos os campos da matemática; Cauchy formaliza a análise; Galois e Abel resolvem, cada um a seu modo, o problema da resolubilidade de equações por radicais; Lobachevsky e Bolyai descobrem geometrias não euclidianas.',
    civilizationIds: ['europe'],
    themeId: 'nineteenth',
  },
  {
    id: 'p-1850-1900',
    eraId: 'nineteenth',
    name: 'Fim do século XIX: conjuntos, infinito e lógica',
    startYear: 1850,
    endYear: 1900,
    summary:
      'Riemann generaliza a geometria e a análise; Cantor cria a teoria dos conjuntos e mede diferentes tamanhos de infinito; Boole formaliza a lógica em termos algébricos.',
    civilizationIds: ['europe'],
    themeId: 'nineteenth',
  },
  {
    id: 'p-1900-1950',
    eraId: 'modern',
    name: 'Crise dos fundamentos e nascimento da computação teórica',
    startYear: 1900,
    endYear: 1950,
    summary:
      'Paradoxos na teoria dos conjuntos levam Hilbert e Russell a buscar fundamentos seguros; Gödel demonstra limites internos a esse projeto; Turing formaliza o conceito de algoritmo.',
    civilizationIds: ['europe', 'global'],
    themeId: 'modern',
  },
  {
    id: 'p-1950-2000',
    eraId: 'modern',
    name: 'Segunda metade do século XX: computadores e nova matemática aplicada',
    startYear: 1950,
    endYear: 2000,
    summary:
      'A teoria da informação, a criptografia de chave pública e a ascensão dos computadores criam novos campos de aplicação para ideias matemáticas antigas e novas.',
    civilizationIds: ['global'],
    themeId: 'modern',
  },
  {
    id: 'p-2000-now',
    eraId: 'contemporary',
    name: 'Matemática do século XXI',
    startYear: 2000,
    endYear: 2026,
    summary:
      'Ciência de dados, aprendizado de máquina, otimização em larga escala e criptografia continuam a demandar (e produzir) matemática nova, enquanto problemas centenários permanecem em aberto.',
    civilizationIds: ['global'],
    themeId: 'contemporary',
  },
];

export const PERIOD_BY_ID = new Map(PERIODS.map((p) => [p.id, p]));
