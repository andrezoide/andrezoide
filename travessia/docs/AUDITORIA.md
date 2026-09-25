# Auditoria — etapa 2

Registro do estado do projeto antes da segunda etapa de evolução e do que foi decidido a partir dele.

## Como o sistema funciona hoje

| Parte | Onde | Papel |
| --- | --- | --- |
| Dados | `data/*.json`, `data/events/<bloco>.json` | Entidades separadas; `scripts/build-data.mjs` valida e gera `data/build/index.json` (índice leve + arestas). |
| Store | `js/core/store.js` | Carrega índice, monta índices por pessoa/lugar/tema, consulta o grafo (causas, consequências, vizinhos, simultâneos) e carrega blocos sob demanda. |
| Tempo | `js/core/time.js` | Escala deformada por segmentos, datas, réguas adaptativas, níveis de escala. |
| Timeline | `js/timeline/timeline.js` | Câmera (`cu`, `k`), entrada (roda, arraste, pinça, duplo clique), canvas para régua/faixas/arcos e DOM só para marcadores visíveis. |
| Atmosfera | `js/timeline/atmosphere.js` | Interpola 6 cores por era e desenha texturas em parallax. |
| Painéis | `js/views/*` | Evento, pessoa, lugar, tema, período, ano. |
| Interface | `js/ui/*` | Painel/folha, placa de posição, pistas, filtros, atlas, busca, mapa SVG. |

**Pontos de entrada de um evento:** clique no marcador ou num ponto agrupado → `app.open('evento', id)` → hash `#/evento/id` → `route()` → `VIEWS.evento` → `panel.show` + `timeline.setFocus` + `frameEvent`. Busca, pistas, bordas, cadeia causal, constelação e mapa usam o mesmo caminho.

## Desempenho (medido)

- Com os 164 eventos reais: **~1,3 ms por quadro** (atmosfera 0,1–0,4 ms). Com 5.164 eventos sintéticos: 4–9 ms.
- O DOM só contém marcadores visíveis (40–120), reciclados por id. Mais virtualização **não é necessária** agora.
- Gargalo real percebido: a roda do mouse move a câmera em degraus (≈100 px por evento), o que dá sensação de "câmera pulando". Resolvido com câmera suavizada por alvo (ver abaixo), não com otimização de renderização.
- Pequenos custos evitáveis: `createPattern` a cada quadro na atmosfera; busca linear em `#posOf` para cada arco; seções pesadas do painel renderizadas fora da tela.

## Problemas de UX encontrados

1. **Orientação**: a placa mostra período e ano, mas não a hierarquia (Brasil › República › Era Vargas › 1937 › evento). Não há "sair para a visão geral" nem saltos rápidos para datas-chave.
2. **Dependência da roda**: zoom só com Ctrl + roda, teclado ou botões de escala; não há controles de zoom visíveis no palco.
3. **Nível de detalhe implícito**: o que aparece depende só de colisão de rótulos. De longe, eventos menores competem com os grandes; de perto, não surge nada além do título.
4. **Evento como página longa**: o painel é uma rolagem única sem camadas; não há sensação de "entrar" no acontecimento nem escolha de profundidade.
5. **Filtros apagam o contexto**: categorias não marcadas somem da linha do tempo.
6. **"Enquanto isso"** é um diagrama único; não separa mundo, cultura, ciência, cotidiano.
7. **Pessoas**: destaque dos eventos e do período de vida, mas sem trajetória estruturada nem pessoas visíveis na linha do tempo.
8. **Mapa**: atlas flutuante pequeno; não há alternância Linha do tempo ↔ Mapa.
9. **Estudo**: ficha de estudo, mas sem checkpoints de compreensão.
10. **Descoberta**: pistas só no rodapé, fáceis de ignorar.
11. **Tema por época**: muda cor e textura; tipografia dos marcadores e linguagem dos componentes quase não mudam; o meio de registro da época não aparece.
12. **Acessibilidade**: não há alternativa em lista para quem não usa o canvas; controles de zoom só pelo teclado.
13. **Multimídia**: o modelo de dados não prevê imagens, vídeos ou áudios.
14. **Celular**: filtros como caixa flutuante; sem navegação temporal compacta.

## Decisões

- Manter arquitetura (canvas + DOM virtualizado, índice + blocos, rotas por hash).
- Câmera suavizada por alvo para roda e teclado; arraste e pinça continuam diretos (controle do usuário); `prefers-reduced-motion` desliga interpolações.
- LOD semântico por nível de escala, e não só por colisão.
- Evento em 8 camadas com navegação própria; transição de "portal" do marcador ao painel.
- Filtros enfatizam em vez de apagar (com opção de ocultar).
- Tokens de design e temas por época em `css/tokens.css`.
- Mídia com carregamento sob demanda (vídeo/áudio só ao clicar).

## Avaliação depois da etapa 2

| Critério | Resultado | Como foi verificado |
| --- | --- | --- |
| **Navegação** — o usuário sabe onde está? | Trilha "Você está aqui" (Brasil › era › período › década/ano › evento), clicável em cada nível; "toda a história" na visão geral. | Capturas em todas as escalas. |
| **Orientação** — sabe em que período está? | Faixa de períodos fixa, eras na faixa superior, nível de detalhe e meio de registro da época sob a trilha. | Idem. |
| **Descoberta** — descobre algo sem pesquisar? | Notas "Você sabia?" / "Documento da época" / "Descubra uma conexão" após alguns segundos parado; pistas no rodapé; relações discretas de perto; rastro do percurso. | Teste com espera de 8 s. |
| **Compreensão** — entende as relações? | Evento em 8 camadas (antes → fato → depois), arcos animados, constelação com pessoas, lugares e documentos, destaque na linha do tempo ao passar o cursor numa conexão. | Navegação completa pela Independência e pela Lei Áurea. |
| **Estudo** — um estudante aprende algo? | Modo estudo com ficha, checkpoint de escolha (causas) ou de ordem cronológica, gerado das conexões cadastradas; estado salvo localmente. | Checkpoints abertos em eventos com e sem causas. |
| **Controle** — quem controla? | Roda e teclado deslizam até o destino (sem travar); arraste e pinça são diretos; voos longos com no máximo ~1,1 s e interrompíveis; `prefers-reduced-motion` desliga interpolações. | Teste com `reducedMotion: 'reduce'`. |
| **Desempenho** | 0,5–2 ms/quadro com os dados reais; 1–7,4 ms com 5.164 eventos; ≤ ~120 marcadores no DOM. | `perf2` (60 quadros por escala). |
| **Celular** | Trilha compacta, controles no palco, Viajar para rolável, folha inferior com camadas, filtros em gaveta, mapa. | Capturas a 390 × 844. |
| **Acessibilidade** | Atalho para a lista (1º Tab), marcadores focáveis, Enter abre e leva o foco ao painel, controles com `aria-label`, imagens com `alt`, versão em lista. | Script de teclado: 0 botões sem rótulo, 0 imagens sem `alt`. |

### Limitações conhecidas

- Faixas "Enquanto isso na ciência" e "no cotidiano" ficam vazias em muitas épocas: faltam registros cadastrados, e a interface diz isso em vez de preencher.
- As imagens vêm do Wikimedia Commons (licenças conferidas na API); dependem de rede. Não há vídeos cadastrados — o componente existe e só carrega ao clique.
- Sons não foram adicionados: nada no conteúdo atual justificava áudio.
