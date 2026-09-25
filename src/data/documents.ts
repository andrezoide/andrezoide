import type { HistoricalDocument } from '@/types/content';

/**
 * Documentos e manuscritos históricos. Nenhuma transcrição é inventada:
 * quando não há uma transcrição de fonte confiável disponível para incluir
 * diretamente, o campo `transcription` é omitido e o contexto explica isso.
 */
export const DOCUMENTS: HistoricalDocument[] = [
  {
    id: 'doc-plimpton-322',
    title: 'Plimpton 322',
    kind: 'tablet',
    periodId: 'p-babylon-old',
    civilizationId: 'mesopotamia',
    context: 'Tábua de argila babilônica (c. 1800 a.C.), hoje na Coleção Plimpton da Universidade de Columbia. Contém quatro colunas de números em notação sexagesimal que formam quinze linhas de triplas relacionadas ao teorema de Pitágoras — sua finalidade exata (pedagógica? um registro de "problemas prontos"? uma tabela trigonométrica?) é debatida entre historiadores.',
    status: { status: 'disputed', note: 'A interpretação de Plimpton 322 como uma "tabela trigonométrica" antecipando a trigonometria grega, proposta em 2017, é contestada por boa parte da comunidade de historiadores da matemática, que prefere lê-la como uma lista de triplas pitagóricas para uso pedagógico.' },
    sources: ['src-neugebauer-1969', 'src-robson-2008'],
  },
  {
    id: 'doc-ybc-7289',
    title: 'YBC 7289',
    kind: 'tablet',
    periodId: 'p-babylon-old',
    civilizationId: 'mesopotamia',
    context: 'Pequena tábua de argila babilônica (Coleção Babilônica de Yale) mostrando um quadrado com suas diagonais, com valores sexagesimais inscritos que correspondem a uma aproximação de √2 precisa até a sexta casa decimal — evidência de um método iterativo de aproximação de raízes.',
    status: { status: 'documented' },
    sources: ['src-neugebauer-1969'],
  },
  {
    id: 'doc-rhind-papyrus',
    title: 'Papiro de Rhind',
    kind: 'papyrus',
    periodId: 'p-egypt-kingdoms',
    civilizationId: 'egypt',
    context: 'Copiado pelo escriba Ahmes por volta de 1650 a.C. a partir de um texto ainda mais antigo, é uma das principais fontes primárras sobre matemática egípcia, com 84 problemas resolvidos cobrindo aritmética, frações, geometria e medidas. Hoje está no Museu Britânico.',
    status: { status: 'documented' },
    sources: ['src-clagett-1999', 'src-imhausen-2016'],
  },
  {
    id: 'doc-nine-chapters',
    title: 'Os Nove Capítulos sobre a Arte Matemática',
    kind: 'book',
    periodId: 'p-china-classical',
    civilizationId: 'china',
    context: 'Compilação de métodos matemáticos chineses reunida ao longo de vários séculos (forma final provavelmente entre os séculos I a.C. e I d.C.), organizada em nove capítulos temáticos cobrindo agrimensura, proporções, geometria e sistemas de equações lineares.',
    status: { status: 'interpretation', note: 'A autoria e a data exata de compilação são incertas; trata-se de um texto formado por acréscimos sucessivos, não de uma obra de autor único.' },
    sources: ['src-shen-crossley-lun-1999', 'src-martzloff-2006'],
  },
  {
    id: 'doc-al-jabr-manuscript',
    title: 'Al-Kitab al-mukhtasar fi hisab al-jabr wal-muqabala',
    kind: 'manuscript',
    periodId: 'p-islamic-golden-age',
    civilizationId: 'islamic-world',
    context: 'Tratado de al-Khwarizmi (c. 820 d.C.) escrito na Casa da Sabedoria em Bagdá, sistematizando métodos de solução de equações lineares e quadráticas em prosa, com demonstrações geométricas para justificar os procedimentos algébricos.',
    status: { status: 'documented' },
    sources: ['src-rashed-1994', 'src-berggren-2003'],
  },
  {
    id: 'doc-aryabhatiya',
    title: 'Aryabhatiya',
    kind: 'book',
    periodId: 'p-india-classical',
    civilizationId: 'india',
    context: 'Tratado de astronomia e matemática de Aryabhata, composto em 499 d.C. em versos sânscritos concisos, cobrindo aritmética, álgebra, trigonometria plana e um modelo astronômico do movimento planetário.',
    status: { status: 'documented' },
    sources: ['src-plofker-2009', 'src-datta-singh-1935'],
  },
];

export const DOCUMENT_BY_ID = new Map(DOCUMENTS.map((d) => [d.id, d]));
