# Atlas da Matemática

Uma viagem interativa pela evolução do pensamento matemático — da primeira
contagem à matemática contemporânea. Não é uma timeline nem uma enciclopédia
de fórmulas: é um atlas navegável (zoom, pan, busca, filtros) que liga
períodos, civilizações, pessoas, conceitos, fórmulas, problemas históricos e
documentos em um único grafo explorável.

Este repositório contém a primeira exposição do projeto: uma arquitetura
pensada para crescer de dezenas para milhares de itens, populada por um
acervo inicial cuidadosamente produzido cobrindo todos os grandes períodos
da história da matemática.

## Rodando localmente

```bash
npm install
npm run dev       # servidor de desenvolvimento
npm run build     # build de produção (tsc -b && vite build)
```

## Stack

- **Vite + React 18 + TypeScript** — sem framework de meta-roteamento; SPA com `react-router-dom`.
- **d3-zoom / d3-selection / d3-force** — motor de pan/zoom do Atlas e o grafo de conhecimento.
- **KaTeX** — tipografia matemática (`src/components/math/TeX.tsx`).
- **Framer Motion** — microinterações e transições (respeita `prefers-reduced-motion` via `MotionConfig`).
- **Zustand** — estado global leve (lens ativo, filtros, tema em foco).
- CSS Modules puro para estilo — sem biblioteca de UI.

## Arquitetura

```
src/
  types/        modelo de dados do domínio (Concept, Person, Formula, Problem...)
                e do motor do Atlas (AtlasNode, LOD, Viewport)
  data/         todo o conteúdo histórico, como dados tipados — nunca embutido
                em componentes. Ver data/index.ts para os índices derivados
                (grafo de relações, índice de busca, nós do Atlas).
  engine/       lógica pura: escala não-linear do tempo (timeScale.ts),
                layout de raias (layout.ts), avaliação numérica de fórmulas
                (formulaMath.ts), escala de gráficos (plotScale.ts).
  theme/        temas cronotópicos (identidade visual por período) e o
                ThemeProvider que os aplica via CSS custom properties.
  store/        estado global (Zustand).
  components/   atlas/ (canvas ZUI), math/ (KaTeX, Mathematical Paper),
                interactive/ (widgets experimentáveis), detail/ (primitivas
                de página de conteúdo), search/, filters/, layout/.
  pages/        uma página por tipo de entidade, mais Landing, AtlasExplorer,
                GraphView e OpenProblemsPage.
```

### Crescendo o acervo

Adicionar conteúdo não exige tocar em nenhum componente: basta adicionar
objetos tipados aos arrays em `src/data/*.ts` (concepts, people, formulas,
problems, documents, proofs, openProblems...) seguindo as interfaces em
`src/types/content.ts`. O grafo de relações (`src/data/relationships.ts`),
o índice de busca e os nós do Atlas são todos derivados automaticamente
desses dados na inicialização — não há passo de build ou sincronização manual.

Todo conteúdo histórico carrega uma `status` epistêmica opcional
(`documented` | `interpretation` | `reconstruction` | `simplification` |
`hypothesis` | `disputed`) e uma lista de `sources` reais — sem fontes ou
datas inventadas.
