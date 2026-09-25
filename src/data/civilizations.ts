import type { Civilization } from '@/types/content';

export const CIVILIZATIONS: Civilization[] = [
  {
    id: 'mesopotamia',
    name: 'Mesopotâmia',
    region: 'Vale dos rios Tigre e Eufrates (atual Iraque)',
    location: { lat: 32.5, lon: 44.4, label: 'Babilônia' },
    activeStart: -3400,
    activeEnd: -500,
    description:
      'Sumérios, acádios e babilônios desenvolveram um sistema de numeração posicional sexagesimal (base 60) e uma tradição de tábuas de argila usadas para ensino, administração e astronomia.',
    highlights: [
      'Numeração posicional em base 60 (ainda usada hoje em horas, minutos e graus)',
      'Tábuas de multiplicação, raízes quadradas e tabelas trigonométricas (Plimpton 322)',
      'Resolução geométrica de problemas equivalentes a equações quadráticas',
    ],
    sources: ['src-neugebauer-1969', 'src-robson-2008'],
  },
  {
    id: 'egypt',
    name: 'Egito Antigo',
    region: 'Vale do Nilo',
    location: { lat: 26.1, lon: 31.2, label: 'Tebas' },
    activeStart: -3000,
    activeEnd: -30,
    description:
      'A matemática egípcia era voltada à administração, construção e agrimensura, registrada em papiros com um sistema de frações unitárias muito particular.',
    highlights: [
      'Sistema numérico decimal não-posicional',
      'Frações unitárias (todas as frações escritas como soma de 1/n)',
      'Papiro de Rhind e Papiro de Moscou: coleções de problemas resolvidos',
    ],
    sources: ['src-clagett-1999', 'src-imhausen-2016'],
  },
  {
    id: 'greece',
    name: 'Grécia Antiga',
    region: 'Mar Egeu, Magna Grécia e Mediterrâneo oriental',
    location: { lat: 37.98, lon: 23.73, label: 'Atenas' },
    activeStart: -600,
    activeEnd: 500,
    description:
      'A tradição grega transformou a matemática em um sistema dedutivo baseado em axiomas e demonstrações, com Alexandria como grande centro de produção matemática no período helenístico.',
    highlights: [
      'Demonstração dedutiva como padrão de verdade matemática',
      'Os Elementos de Euclides: geometria axiomática',
      'Trabalhos de Arquimedes sobre áreas, volumes e métodos infinitesimais',
    ],
    sources: ['src-heath-1921', 'src-netz-2004'],
  },
  {
    id: 'india',
    name: 'Subcontinente Indiano',
    region: 'Índia',
    location: { lat: 23.2, lon: 77.4, label: 'Ujjain' },
    activeStart: -800,
    activeEnd: 1700,
    description:
      'Tradição matemática ligada à astronomia e à métrica védica, responsável pelo desenvolvimento do sistema decimal posicional com zero e por avanços fundamentais em álgebra e trigonometria.',
    highlights: [
      'Sistema decimal posicional com um símbolo para zero',
      'Regras algébricas para equações e para números negativos',
      'Escola de Kerala: séries infinitas para funções trigonométricas (séculos XIV–XVI)',
    ],
    sources: ['src-plofker-2009', 'src-datta-singh-1935'],
  },
  {
    id: 'china',
    name: 'China Antiga e Imperial',
    region: 'China',
    location: { lat: 34.3, lon: 108.9, label: "Chang'an" },
    activeStart: -1000,
    activeEnd: 1700,
    description:
      'A matemática chinesa se desenvolveu em torno de métodos algorítmicos práticos, organizados em capítulos de problemas resolvidos e aperfeiçoados por comentaristas ao longo de séculos.',
    highlights: [
      'Os Nove Capítulos sobre a Arte Matemática: coletânea de métodos algorítmicos',
      'Uso de varetas de contagem e de um método matricial para sistemas lineares',
      'Triângulo aritmético (hoje "de Pascal") descrito por Yang Hui no século XIII',
    ],
    sources: ['src-shen-crossley-lun-1999', 'src-martzloff-2006'],
  },
  {
    id: 'islamic-world',
    name: 'Mundo Islâmico Medieval',
    region: 'De Bagdá a Córdoba',
    location: { lat: 33.3, lon: 44.4, label: 'Bagdá — Casa da Sabedoria' },
    activeStart: 700,
    activeEnd: 1450,
    description:
      'Estudiosos do califado abássida e além traduziram, sintetizaram e expandiram a matemática grega, indiana e persa, criando a álgebra como disciplina autônoma e desenvolvendo trigonometria e algoritmos.',
    highlights: [
      'Al-jabr de al-Khwarizmi: sistematização da resolução de equações',
      'Trigonometria esférica aplicada à astronomia e à determinação da qibla',
      'Preservação e comentário das obras de Euclides, Arquimedes e Apolônio',
    ],
    sources: ['src-rashed-1994', 'src-berggren-2003'],
  },
  {
    id: 'mesoamerica',
    name: 'Mesoamérica',
    region: 'Civilização Maia',
    location: { lat: 17.2, lon: -89.6, label: 'Tikal' },
    activeStart: -400,
    activeEnd: 1500,
    description:
      'Os maias desenvolveram, de forma independente das tradições afro-eurasiáticas, um sistema de numeração posicional em base 20 com um símbolo para zero, usado sobretudo em cálculos calendáricos e astronômicos.',
    highlights: [
      'Sistema posicional vigesimal com símbolo de zero',
      'Calendários de alta precisão baseados em ciclos astronômicos',
      'Desenvolvimento independente do conceito de zero posicional',
    ],
    sources: ['src-closs-1986'],
  },
  {
    id: 'europe',
    name: 'Europa',
    region: 'Europa medieval, renascentista e moderna',
    location: { lat: 48.8, lon: 2.3, label: 'Paris' },
    activeStart: 500,
    activeEnd: 2026,
    description:
      'Da recepção da aritmética indo-arábica pelas universidades medievais à explosão da análise nos séculos XVII–XIX, a tradição europeia absorveu, traduziu e expandiu conhecimentos de outras civilizações antes de se tornar o centro de gravidade da matemática entre os séculos XVII e XX.',
    highlights: [
      'Fibonacci e a introdução dos algarismos indo-arábicos ao comércio europeu',
      'A álgebra simbólica do Renascimento e a geometria analítica de Descartes',
      'O cálculo infinitesimal e sua formalização rigorosa no século XIX',
    ],
    sources: ['src-katz-2009'],
  },
  {
    id: 'global',
    name: 'Comunidade matemática global',
    region: 'Internacional',
    activeStart: 1900,
    activeEnd: 2026,
    description:
      'A partir do século XX, a produção matemática deixa de ter um centro geográfico único: colaborações internacionais, congressos e, mais tarde, a internet, tornam a matemática uma empreitada verdadeiramente global.',
    highlights: [
      'Congressos Internacionais de Matemáticos e prêmios como a Medalha Fields',
      'Colaboração matemática mediada por computadores e redes',
      'Diversificação geográfica dos grandes centros de pesquisa',
    ],
    sources: ['src-katz-2009'],
  },
];

export const CIVILIZATION_BY_ID = new Map(CIVILIZATIONS.map((c) => [c.id, c]));
