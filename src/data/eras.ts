import type { Era } from '@/types/content';

/**
 * Os grandes arcos cronológicos usados no LOD 1 (visão macro).
 * Datas em anos astronômicos (negativo = a.C.).
 */
export const ERAS: Era[] = [
  {
    id: 'origins',
    name: 'Primeiras formas de matemática',
    startYear: -20000,
    endYear: -3000,
    description:
      'Antes de qualquer fórmula: contar, medir, comparar, agrupar e registrar quantidades. As primeiras marcas de contagem e os primeiros calendários lunares nascem da necessidade prática, não da abstração.',
    themeId: 'prehistoric',
  },
  {
    id: 'antiquity',
    name: 'Antiguidade',
    startYear: -3000,
    endYear: 500,
    description:
      'Mesopotâmia, Egito, Grécia e os primeiros textos matemáticos da Índia e da China. A matemática se torna escrita, sistemática e, na Grécia, demonstrativa.',
    themeId: 'classical',
  },
  {
    id: 'medieval',
    name: 'Idade Média',
    startYear: 500,
    endYear: 1400,
    description:
      'O mundo islâmico traduz, preserva e expande o conhecimento grego, indiano e persa, criando a álgebra como disciplina. Na Europa, universidades e o comércio disseminam a aritmética indo-arábica.',
    themeId: 'islamic',
  },
  {
    id: 'renaissance',
    name: 'Renascimento',
    startYear: 1400,
    endYear: 1600,
    description:
      'A álgebra ganha símbolos, a perspectiva geométrica transforma a arte, e a imprensa acelera a circulação do conhecimento matemático pela Europa.',
    themeId: 'renaissance',
  },
  {
    id: 'scientific-revolution',
    name: 'Revolução Científica',
    startYear: 1600,
    endYear: 1700,
    description:
      'Descartes une álgebra e geometria; Fermat, Pascal, Newton e Leibniz constroem as bases do cálculo e da probabilidade a partir de problemas de movimento e de jogos de azar.',
    themeId: 'scientific-revolution',
  },
  {
    id: 'enlightenment',
    name: 'Século XVIII',
    startYear: 1700,
    endYear: 1800,
    description:
      'Euler e os Bernoulli expandem a análise a um ritmo vertiginoso, aplicando o cálculo a quase todos os ramos da ciência.',
    themeId: 'enlightenment',
  },
  {
    id: 'nineteenth',
    name: 'Século XIX',
    startYear: 1800,
    endYear: 1900,
    description:
      'A era do rigor: Gauss, Cauchy, Riemann, Galois e Cantor reconstroem a matemática sobre fundamentos mais sólidos e descobrem geometrias e infinitos inteiramente novos.',
    themeId: 'nineteenth',
  },
  {
    id: 'modern',
    name: 'Século XX',
    startYear: 1900,
    endYear: 2000,
    description:
      'Crises de fundamentos, álgebra abstrata, topologia, e o nascimento da computação transformam radicalmente o que significa "fazer matemática".',
    themeId: 'modern',
  },
  {
    id: 'contemporary',
    name: 'Matemática Contemporânea',
    startYear: 2000,
    endYear: 2026,
    description:
      'Um capítulo em aberto: ciência de dados, criptografia, otimização, aprendizado de máquina e problemas ainda não resolvidos continuam a expandir a fronteira do pensamento matemático.',
    themeId: 'contemporary',
  },
];

export const ERA_BY_ID = new Map(ERAS.map((e) => [e.id, e]));

export const TIMELINE_START = ERAS[0].startYear;
export const TIMELINE_END = ERAS[ERAS.length - 1].endYear;
