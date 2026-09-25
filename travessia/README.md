# Travessia — atlas navegável da história do Brasil

> Não mostre a história. Faça o usuário atravessá-la.

Uma experiência web para **atravessar** a história do Brasil — dos povos que habitavam o território
milhares de anos antes de 1500 até hoje — mistura de linha do tempo, atlas, arquivo documental e
rede de conhecimento (knowledge graph).

## Como rodar

**No Windows:** dê dois cliques em `iniciar.bat`. Ele usa Node.js (ou, na falta dele, Python), sobe um servidor local e abre o navegador.

Não há build de interface nem dependências. Basta servir a pasta por HTTP (módulos ES e `fetch`
não funcionam via `file://`):

```bash
cd travessia
npx http-server . -p 8080 -c-1      # ou: python3 -m http.server 8080
# abra http://localhost:8080
```

Depois de editar qualquer arquivo em `data/`, regenere e valide o índice:

```bash
node scripts/build-data.mjs         # ou: npm run data
```

O script falha se houver referência quebrada (pessoa, lugar, fonte, período, relação), data
inválida ou status epistemológico desconhecido, e avisa sobre eventos importantes sem fonte.

## O que dá para fazer

| Interação | Desktop | Celular |
| --- | --- | --- |
| Avançar/voltar no tempo | rolar a roda, arrastar, ← → | arrastar (horizontal **ou** vertical) |
| Mudar a escala (milênios → dias) | Ctrl/⌘ + roda, pinça no trackpad, duplo clique, + / −, botões de escala | pinça, botões de escala |
| Abrir um acontecimento | clique no marcador (ou nos pontos de eventos agrupados) | toque; abre uma folha inferior arrastável |
| Buscar | `/` ou ⌘K — pessoas, eventos, lugares, temas, **anos** (`1964`), **décadas** (`anos 60`), **séculos** (`século XVIII`), `9500 a.C.` | ícone ⌕ |

Ao abrir um acontecimento:

- **Arcos na própria linha do tempo** ligam o evento às suas causas, consequências e relações; as que
  estão fora da tela viram atalhos nas bordas.
- **Causa → acontecimento → consequência**: antecedentes (2 níveis), contexto, consequências e efeitos futuros.
- **Enquanto isso**: diagrama de simultaneidade por faixa (poder, território, sociedade, economia,
  cultura, mundo) numa janela de tempo proporcional à época.
- **Constelação**: a rede local (eventos antes/depois, pessoas, lugares).
- **Pessoas, lugares (mapa), “o que sabemos e como sabemos”, palavras da época e fontes.**
- **Ficha de estudo**: resumo, conceitos-chave, personagens, datas, causas, consequências,
  relações e perguntas com pistas. No **Modo estudo** ela abre primeiro.

Outras entradas na rede: **pessoa** (linha da vida, pessoas conectadas), **lugar**, **tema** (uma
“linha” costurada no território), **período** e **ano**. O rodapé traz **pistas** geradas a partir
do trecho visível e o **percurso** de navegação fica registrado no painel. O **Atlas** mostra, em
mapa, os lugares dos acontecimentos visíveis e acompanha o deslocamento no tempo.

A própria interface atravessa os séculos: paleta, textura (curvas de nível → linhas de rumo das
cartas náuticas → gravura → colunas de jornal → retícula fotográfica → grade de dados) e a
tipografia do painel mudam **gradualmente** conforme a posição no tempo.

## Arquitetura

```
travessia/
├── index.html
├── css/            base (tokens), timeline, panel, chrome
├── js/
│   ├── main.js             app, rotas (#/evento/<id>, #/pessoa/<id>, …), orquestração
│   ├── core/
│   │   ├── time.js         escala deformada, datas, réguas adaptativas
│   │   ├── store.js        carregamento, índices em memória, consultas ao grafo
│   │   └── dom.js          helper h()/s(), armazenamento local seguro
│   ├── timeline/
│   │   ├── timeline.js     câmera, entrada, layout, canvas + DOM virtualizado
│   │   ├── atmosphere.js   eras: tokens de cor e texturas interpoladas
│   │   └── overview.js     régua geral com densidade
│   ├── views/              painéis (evento, pessoa, lugar, tema, período, ano) e widgets
│   └── ui/                 busca, mapa (SVG), painel, pistas, filtros, atlas, abertura
├── data/
│   ├── periods.json  categories.json  themes.json
│   ├── people.json   places.json      sources.json
│   ├── relationships.json               arestas tipadas do grafo
│   ├── events/<bloco>.json              conteúdo completo, um arquivo por bloco
│   ├── geo/south-america.json           contornos (Natural Earth, domínio público)
│   └── build/index.json                 GERADO: índice leve + arestas
└── scripts/build-data.mjs               validação + geração do índice
```

**Tecnologia.** HTML, CSS e JavaScript puros com módulos ES. Nenhuma biblioteca: o problema
central (zoom temporal contínuo com milhares de itens) é resolvido melhor com canvas + um DOM
mínimo do que com uma lib de timeline genérica. Mapas são SVG gerados a partir de GeoJSON
simplificado.

### Tempo e zoom

- O eixo usa uma **escala deformada por segmentos** (`SEGMENTS` em `time.js`): tempo profundo
  (50 mil–12 mil a.C.) ÷400, milênios ÷80, 1000–1500 ÷6 e 1500–hoje linear. Assim o período anterior
  a 1500 ocupa quase metade do território sem esmagar os últimos cinco séculos. Cada quebra de
  escala é sinalizada na régua.
- A câmera é `(centro, pixels por unidade)`. O zoom é contínuo; a **régua escolhe a granularidade**
  (milênios → séculos → décadas → anos → meses → dias) pela densidade de pixels por ano.
- Voos entre pontos distantes se afastam e reaproximam (como mapas), dando noção de distância.

### Desempenho

- `store.inRange()` encontra os eventos visíveis por busca binária sobre a posição ordenada.
- Só os eventos na janela (mais uma margem) entram no layout; rótulos que não cabem viram pontos
  no canvas (clicáveis), então a densidade é controlada pela própria tela.
- O DOM contém apenas os marcadores visíveis, reciclados por id. Teste com 5.164 eventos:
  4–9 ms por quadro, no máximo ~120 elementos de marcador.
- O índice (`build/index.json`) traz só o necessário para desenhar e buscar; o conteúdo completo
  de cada evento é carregado **sob demanda por bloco** e mantido em cache.

## Modelo de dados

### Evento (`data/events/*.json`)

```jsonc
{
  "id": "independencia",
  "title": "Independência do Brasil",
  "start": "1822-09-07",          // "AAAA", "AAAA-MM" ou "AAAA-MM-DD"; negativos = a.C.
  "end": "1823-07-02",            // opcional: transforma em intervalo
  "circa": true,                  // opcional: data aproximada
  "dateLabel": "c. 400 – 1400",   // opcional: rótulo exibido
  "period": "primeiro-reinado",
  "region": "brasil",             // "brasil" | "mundo"
  "categories": ["politica", "territorio"],   // a 1ª define a faixa na linha do tempo
  "themes": ["territorio"],
  "weight": 5,                    // 1–5: prioridade visual
  "people": [], "places": [], "sources": [],
  "summary": "…",
  "narrative": ["parágrafo", "…"],
  "context": "…",
  "claims": [{ "status": "interpretacao", "text": "…", "sources": ["…"] }],
  "excerpts": [{ "text": "…", "source": "…", "note": "…" }],
  "study": { "concepts": [{ "term": "…", "def": "…" }], "dates": [], "questions": [{ "q": "…", "hint": "…" }] },
  "map": { "routes": [{ "label": "…", "points": [[lat, lon], …] }], "lines": [] }
}
```

**Status epistemológico** (`claims[].status`): `fato`, `interpretacao`, `controversia`,
`hipotese`, `limitada` (evidência limitada), `estimativa`. Interpretações não são apresentadas
como fatos.

### Relações (`data/relationships.json`)

```json
{ "from": "dia-do-fico", "to": "independencia", "type": "causa", "note": "…", "status": "interpretacao" }
```

Tipos: `causa`, `reacao`, `sucessao`, `contexto`, `relacionado`. Causas e consequências de um
evento são **derivadas** do grafo (não duplicadas nos eventos); relações causais recebem por
padrão o status `interpretacao`.

### Fontes (`data/sources.json`)

`id, type, title, author, date, institution, url, reference`. **Nenhuma fonte foi inventada.** Os
DOIs dos artigos científicos foram conferidos no Crossref; referências bibliográficas são de obras
de referência amplamente citadas. Alguns links de legislação (planalto.gov.br) não puderam ser
verificados a partir do ambiente de desenvolvimento — vale conferi-los antes de publicar. Eventos sem
fonte cadastrada mostram isso explicitamente.

## Como acrescentar conteúdo

1. Escreva o evento no bloco adequado de `data/events/` (ou crie um novo arquivo — ele vira um bloco).
2. Cadastre pessoas, lugares e fontes novos nos arquivos correspondentes.
3. Ligue o evento à rede em `relationships.json`.
4. Rode `node scripts/build-data.mjs` e corrija o que ele apontar.

## Próximos passos possíveis

A arquitetura já comporta: divisão do índice por período para dezenas de milhares de eventos;
mapas históricos por período (camadas GeoJSON por data); imagens de acervo com créditos;
comparação de períodos; trilhas de aprendizagem (sequências de ids); favoritos e anotações
(o estado local já é isolado em `storage`); quizzes a partir de `study.questions`; contas e
recomendações a partir do percurso de navegação.
