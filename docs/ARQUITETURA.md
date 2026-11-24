# Arquitetura — Enki

## Visão geral
Três páginas estáticas publicadas no Vercel (ADR 10), mesma origem (o domínio de produção do projeto no Vercel), logo o mesmo `localStorage`:

| Página | Lê | Grava |
| --- | --- | --- |
| `index.html` (CEP) | — | — |
| `dmaic.html` | `dmaic_projects`, `dmaic_last`, `atlas_db_v1` (só leitura, botão "Puxar do Enki", INT-01) | `dmaic_projects`, `dmaic_last` |
| `gestao.html` (Enki) | `atlas_db_v1`, `dmaic_projects` | `atlas_db_v1`, `dmaic_last` (só para abrir um projeto no DMAIC) |

O Enki **nunca grava** em `dmaic_projects`, exceto quando o usuário restaura um backup e confirma. O DMAIC **nunca grava** em `atlas_db_v1`: só lê, sob comando, para preencher campos vazios (ADR 17). O vínculo nasce dos dois lados sem quebrar essa regra (ADR 18): o DMAIC grava `define.enkiId` no próprio projeto e o Enki completa o seu `dmaicId` (`autoLinkDmaic`, na abertura e no evento `storage`).

Nome técnico (ADR 12): a ferramenta se chamava Atlas. A chave `atlas_db_v1`, os campos `app: 'atlas'` e `atlas` do backup e o nome dos testes temporários continuam como estão: são identificadores, não texto de tela. Trocar exigiria migração e quebraria a restauração de backups já feitos. Só o nome do arquivo baixado mudou (`enki-backup-AAAA-MM-DD.json`).

## Publicação (ADR 10)
- O projeto no Vercel se chama **enki** (importado como atlas e renomeado no ADR 12; o repositório continua `ferramentas_leansixsigma`). Domínio de produção: `enkipro.vercel.app` (o Enki fica em `/gestao.html`). Ligado ao repositório, gera uma prévia por pull request e publica a `main` em produção.
- `vercel.json` roda `npm run build` (`tools/build.js`), que copia só as três páginas para `dist/` e falha se faltar alguma.
- Os testes rodam no GitHub Actions (`testes.yml`).
- Merge automático (ADR 11): `merge-automatico.yml` dispara no fim de **Testes**; `tools/merge-automatico.js` decide (`podeMesclar`) e faz merge, redireciona os empilhados para a `main`, reexecuta os testes deles e apaga a branch. Rascunho ou rótulo `segurar` impedem o merge.
- Cada domínio tem seu próprio `localStorage`: prévia, produção e o antigo `github.io` não compartilham dados.

## Organização do `gestao.html`
Arquivo único, dividido em blocos comentados, nesta ordem:
1. **Camada de dados** — objeto `Store` (`load`, `save`, `dmaic`). Único ponto que toca o `localStorage`. Migrar para Firebase = reescrever só o `Store`.
2. **Utilitários** — `esc` (escape de HTML, obrigatório em toda saída de texto do usuário), datas, formatação.
3. **Domínio** — listas de valores, `makeProject`, `normalize`, regras puras (`moveItem`, `riskScore`, `riskLevel`, `quadrant`, `flowMetrics`, `progress`).
4. **Navegação e modal** — `showPage`, `RENDER`, `openModal`.
5. **Uma seção por tela** — `render<Tela>` + diálogos da tela (a seção PROCESSOS tem `renderProcessos` e `processDialog`; `PROCESS_PAGES` lista as telas em que a barra superior mostra os controles de processo).
6. **Backup** — exportar, restaurar, aviso.

Regra: lógica de negócio fica em funções puras do bloco Domínio, para ser testável sem clicar na tela.

## Modelo de dados (`atlas_db_v1`)
```
{
  version: 1,
  meta: { current, lastBackup, updatedAt, lastPage: { <projectId>: <pageId> },   // lastPage a partir da P-01
          tema: auto|claro|escuro },                                             // LAY-03; normalizeMeta põe 'auto'
  projects: {
    <id>: {
      id, nome, abordagem, status, saude, prioridade, gerente, patrocinador,
      inicio, fim, alinhamento, dmaicId, processoId, createdAt, updatedAt,   // processoId: R3-A4 ('' sem vínculo)
      tap:    { justificativa, objetivo, dentro, fora, premissas, restricoes, orcamento, criterios },
      marcos: [ { id, nome, data, feito } ],
      cols:   [ { id, nome, tipo: backlog|todo|doing|done, wip } ],
      items:  [ { id, titulo, desc, tipo, classe, pontos, resp, prazo, col, sprint, ordem,
                  criado, commit, inicio, fim, hist: [ { col, ts } ],
                  checklist: [ { id, texto, feito } ], rotulos, bucket, origem,     // CHK/PLN, ADR 14
                  recorrencia: null | { freq: diaria|semanal|mensal|anual, dia, proxima } } ],   // REC, ADR 15
      sprints:[ { id, nome, meta, status: planejada|ativa|concluída, inicio, fim,
                  compromisso, velocidade, retro: { bom, melhorar, acoes } } ],
      riscos: [ { id, desc, categoria, prob, imp, resposta, acao, dono, status } ],
      partes: [ { id, nome, papel, poder, interesse, atitude, obs } ],
      licoes: [ { id, data, tipo, categoria, oque, rec } ]
    }
  },
  processes: {                       // R3-A · fora dos projetos: processo é trabalho contínuo
    <id>: {
      id, nome, macroprocesso, dono, cliente, objetivo, indicador, meta,
      proposito, regras: [ texto ],  // diagnóstico de negócio (R3-A5, ADR 16)
      criticidade: Alta|Média|Baixa, status: Ativo|Em revisão|Desativado,
      avaliacoes: [ { id, data, avaliador,
                      niveis:     { desenho, dono, executores, indicadores, controle },  // 1..5
                      evidencias: { desenho, dono, executores, indicadores, controle },
                      observacao } ],
      createdAt, updatedAt
    }
  }
}
```
Campo novo exige: valor padrão em `makeProject`, tratamento em `normalize` (backups antigos) e teste DAD-03 continuando verde.

Itens do Kanban (ADR 14): `normalizeItem(it)`, chamada por `normalize`, garante `checklist` (só objetos, com `id`, `texto`, `feito` booleano), `rotulos: []`, `bucket: ''` e `origem: null`. `checklistProgress(it)` devolve `{ feitos, total }` ou `null` sem lista. O diálogo do item edita uma cópia da lista e só grava ao salvar; no cartão, `toggleCheckList` abre a lista (estado em `openChecks`, não gravado) e `toggleCheckItem` marca e grava na hora.

Recorrência (ADR 15): `normalizeRecurrence` (chamada por `normalizeItem`) devolve `null` para ausente ou inválido. `moveItem`, ao levar um item recorrente para uma coluna `done`, chama `spawnRecurrence(p, it)`, que cria uma única ocorrência (`nextOccurrence`, com a data de `nextDue`) na primeira coluna `todo` e grava o id dela em `recorrencia.proxima` do item concluído. `recorrencia.dia` guarda o dia de referência do mensal e do anual (31/01 → 28/02 → 31/03).

Processos seguem a mesma regra com `makeProcess` e `normalizeProcess`; `normalizeProcesses(db)` roda na abertura e na restauração de backup e transforma `db.processes` ausente ou inválido em `{}` (DAD-04). O backup não muda de formato: `processes` vai dentro de `atlas`. O nível de maturidade **nunca é gravado**: a função pura `maturity(proc)` calcula da avaliação mais recente, para não haver duas verdades. Funções puras da maturidade no bloco Domínio: `MAT_NIVEIS`, `MAT_DIMS` (dimensões e descritores da escala), `assessmentsByDate` (mais recente primeiro: data desc, empate pela ordem de registro), `overallLevel` (mínimo das dimensões), `maturity`, `maturityTrend` (última × penúltima), `validateAssessment` (nível > `MAT_SEM_EVIDENCIA` exige evidência) e `diagnosticSummary(procs, hoje)` (MAT-04: distribuição por nível, críticos frágeis e avaliações com mais de `MAT_VALIDADE_DIAS`; NEG-03: `semProposito`; processos desativados ficam fora).

Diagnóstico de negócio (R3-A5, ADR 16): `normalizeProcess` garante `proposito` texto e passa `regras` por `parseRules` (texto com uma regra por linha ou lista → lista de textos sem vazios); `hasPurpose(pr)` diz se há propósito. Na ficha (`processDialog`), o bloco `#diag-negocio` ("Diagnóstico · etapa 1") vem antes do `maturityBox` ("etapa 2").

## Visual (ADR 13)
Cores, sombras e raios ficam em tokens no `:root` do `gestao.html` (`--bg`, `--surface`, `--accent`, `--accent-soft`, `--danger-soft` etc.); nenhum componente usa cor fixa, o que faz do modo escuro (LAY-03) só uma troca de tokens: `:root[data-theme="dark"]` e, no automático, `@media (prefers-color-scheme: dark)` sobre `:root:not([data-theme])`. `applyTheme()` traduz `db.meta.tema` para `data-theme` no `<html>` (ausente no automático); `cycleTheme()` usa a função pura `nextTheme` e grava pelo `Store`. Os ícones do menu vêm de `NAV_ICONS` (bloco Navegação): `hydrateNavIcons()` troca o código curto de cada `.nav-icon` (o campo `icon` de `DOMAINS` ou o texto do HTML) pelo SVG e guarda o código em `data-icon`.

## Menu (a partir da R3-A)
Portfólio · Projetos (TAP, Kanban, Scrum, Riscos, Partes interessadas, Lições) · **Processos** (Diagnóstico) · Melhoria contínua (DMAIC e CEP, links externos).
Dentro de Projetos, a partir da P-01, as telas ficam agrupadas pelos 7 domínios do PMBOK 8, com a área clássica como legenda e Kanban/Scrum como atalhos (ESPECIFICACAO seção 7). A lista `DOMAINS` no bloco Domínio é a fonte do menu: `renderProjectNav()` monta `#nav-projetos`, item sem `page` é previsto (desabilitado) e a segunda aparição de uma tela leva `nav-dup` (some no celular). `PROJECT_PAGES` lista as telas cujo acesso grava `meta.lastPage`; `normalizeMeta` cria `lastPage: {}` em dados antigos. O menu lateral tem altura da janela e rola.
Nas telas de Processos a barra superior troca seletor/novo/excluir projeto por "+ Novo processo"; backup e restauração ficam sempre visíveis.

## Registro de decisões (ADR)
| # | Data | Decisão | Motivo | Alternativa rejeitada |
| --- | --- | --- | --- | --- |
| 1 | 18/11/2026 | Página estática + localStorage + backup JSON | Uso pessoal, custo zero, sem configuração | Firebase (adiado para R4); backend Node como o Pulsar (manutenção alta) |
| 2 | 18/11/2026 | PMBOK 8ª ed. como referência | Padrão vigente desde nov/2025 | 49 processos da 6ª ed. |
| 3 | 18/11/2026 | OPM3 só como autoavaliação na R3 | Modelo de maturidade organizacional, pouco útil para uso individual | Módulo central de maturidade |
| 4 | 18/11/2026 | Kanban e Scrum compartilham os mesmos itens | Uma fonte de verdade; sprint é um filtro do quadro | Backlogs separados |
| 5 | 18/11/2026 | Testes com `node:test` + Playwright, rodando no GitHub Actions | Sem framework extra; testa a página real no navegador | Extrair a lógica para JS separado só para teste unitário (mudança de estrutura sem ganho agora) |
| 6 | 18/11/2026 | Entrega por branch + pull request, merge só com testes verdes | O Pages publica a `main`; o PR é o portão de qualidade | Commit direto na `main` |
| 7 | 18/11/2026 | Exceção ao gate: Diagnóstico de Processos (R3-A) entra antes dos 30 dias de uso da R1, dentro do `gestao.html` | Cadastro de processos reais é uso real; menor corte da R3. Decidido pelo dono | Manter o gate; página `processos.html` separada (duplicaria `Store` e backup). SIPOC, VSM e RACI (R3-B) continuam atrás do gate |
| 8 | 18/11/2026 | Maturidade de processo em 5 níveis × 5 dimensões, nível geral = mínimo; OPM3 sai da R3 | Elo mais fraco (PEMM) não esconde lacunas; OPM3 mede gestão de projetos, não processos | Média das dimensões; nível único por processo; OPM3 como módulo de maturidade |
| 9 | 18/11/2026 | Telas de Projetos agrupadas pelos 7 domínios de desempenho do PMBOK 8, com a área de conhecimento clássica como legenda; itens da R2/R3-B visíveis e desabilitados | Coerente com o ADR 2; o dono quer cada ferramenta na sua área; mostra o mapa sem antecipar o gate | 10 áreas de conhecimento da 6ª ed.; construir Gantt e Timeline antes do gate |
| 10 | 18/11/2026 | Publicação no Vercel (Git integration: prévia por PR, produção na `main`), no molde do BI Frota; substitui o GitHub Pages do ADR 6 | Pedido do dono; mesmo fluxo do BI, prévia para revisar cada fatia antes do merge | Manter o GitHub Pages; rodar a suíte Playwright dentro do build do Vercel (Chromium instável na imagem de build) |
| 11 | 19/11/2026 | Merge automático por GitHub Actions quando **Testes** fica verde no último commit de um PR para a `main`; merge commit; empilhados redirecionados e retestados; branch apagada | Pedido do dono (mesmo fluxo do BI Frota, sem merge manual); o workflow não depende de configurar o repositório e só mescla depois do CI, ao contrário do BI | Auto-merge nativo do GitHub (exige ligar a opção e a proteção da `main` nas configurações); merge logo ao abrir o PR, como no BI (pula o CI); squash (quebra PRs empilhados) |
| 12 | 19/11/2026 | Nome da ferramenta passa de Atlas para Enki (deus sumério da sabedoria e dos ofícios) em tudo que aparece na tela e na documentação; chave `atlas_db_v1` e formato do backup (`app: 'atlas'`) mantidos | Pedido do dono; manter os identificadores preserva os dados salvos e os backups existentes sem código de migração | Renomear a chave para `enki_db_v1` com migração (risco de perder dados se falhar, sem ganho para o usuário); aceitar dois formatos de backup |
| 13 | 19/11/2026 | Enki em tema claro, com DM Sans no texto, DM Mono só em números e ícones SVG no menu; cores só em tokens do `:root`. DMAIC e CEP seguem escuros até a LAY-04 | Pedido do dono ("cara de DOS"); padrão das ferramentas de gestão de mercado; contraste AA testado (LAY-01) | Biblioteca de componentes ou framework CSS (quebra a página autocontida); trocar as três páginas de uma vez (PR grande demais para revisar); manter escuro e só trocar fontes |
| 14 | 23/11/2026 | Exceção ao gate: lista de verificação no item do Kanban e importação do arquivo Excel exportado pelo Microsoft Planner, lido no navegador sem biblioteca | Os projetos reais do dono estão no Planner; importar é o que traz uso real ao Enki e faz o gate andar. Decidido pelo dono | Manter o gate e recadastrar à mão; Microsoft Graph com login (fora do escopo, exige servidor e registro no Entra ID); SheetJS (npm parado; CDN seria dependência externa em tempo de execução) |
| 15 | 23/11/2026 | Extensão da exceção do ADR 14: cartões recorrentes no Kanban; a próxima ocorrência nasce ao concluir o item (como no Planner), uma por item, com a lista desmarcada | Pedido explícito do dono, ciente do gate; o trabalho recorrente real (BI, "Importação" mensal com 13 relatórios) é o mesmo que a exceção do ADR 14 quer trazer ao Enki | Gerar ocorrências pelo calendário mesmo sem concluir (empilha cópias e infla o WIP); modelo de série com ocorrências virtuais, estilo calendário (complexo para uso pessoal) |
| 16 | 23/11/2026 | Extensão da exceção do ADR 7: propósito e regras de negócio na ficha do processo, agrupados como etapa 1 do diagnóstico ("Diagnóstico de negócio"), antes da maturidade; regras como lista de textos | Pedido do dono; o propósito dá a referência que a avaliação de maturidade precisa e cabe no diagnóstico já aprovado | SIPOC completo agora (R3-B, atrás do gate); regras como objetos com código, tipo e fonte (estrutura sem uso ainda); propósito obrigatório ao salvar (bloquearia processos já cadastrados) |
| 17 | 24/11/2026 | DMAIC lê `atlas_db_v1` (só leitura) e, sob comando ("Puxar do Enki"), preenche os campos vazios da fase Define com a TAP do projeto vinculado por `dmaicId` e o cliente do processo de mesmo nome | Pedido do dono ("tudo integrado"); escolha dele entre três opções; não sobrescreve o que foi escrito no DMAIC e mantém cada página dona dos próprios dados | Campos espelhados só leitura (duas telas para a mesma informação, bloqueia ajuste no DMAIC); sincronização automática nos dois sentidos (conflito de versões sem servidor) |
| 18 | 24/11/2026 | Fatia R3-A4 (dentro da exceção do ADR 7): projeto ganha `processoId`; a ficha do processo cria o projeto DMAIC no portfólio; "Criar no DMAIC" abre `dmaic.html?enki=<id>`, que cria o projeto DMAIC com `define.enkiId`, e o Enki completa o `dmaicId` sozinho | Pedido do dono ("por que não faz logo isso?"); cada página só grava os próprios dados, então o vínculo é escrito pela metade em cada lado e fechado na leitura | Enki criar o projeto direto em `dmaic_projects` (quebra a regra de não gravar no DMAIC); vínculo só manual pelo seletor da TAP (era o atrito que o dono apontou) |
