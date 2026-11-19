# Especificação — Enki

Versão 1.1 · 18/11/2026 · Dono: Diego Sarmento

## 1. Problema
As ferramentas do repositório resolvem partes isoladas: o CEP (`index.html`) analisa estabilidade de processo e o DMAIC (`dmaic.html`) conduz projetos de melhoria. Não existe lugar para ver todos os projetos, gerir o fluxo de trabalho, acompanhar riscos e partes interessadas, nem tocar projetos que não são DMAIC.

## 2. Objetivo
Ter, no mesmo repositório e sem custo de hospedagem, uma ferramenta pessoal que gerencie projetos preditivos, ágeis e de melhoria de ponta a ponta, integrada ao DMAIC e ao CEP.

## 3. Resultado esperado
- Usada por 30 dias seguidos para gerir pelo menos 3 projetos reais.
- Nenhum backup com mais de 7 dias.
- Zero regressão no CEP e no DMAIC (garantido pelos testes de smoke).

## 4. Fora do escopo
Multiusuário, login, integrações externas (Jira, Teams, Google), gestão de horas por recurso, app nativo.

## 5. Critérios de aceite da Release 1
O código entre colchetes é o mesmo do teste automatizado em `tests/`. Critério sem teste não está pronto.

| Código | Critério |
| --- | --- |
| POR-01 | Portfólio vazio oferece criar projeto e carregar exemplo |
| POR-02 | Carregar exemplo seleciona o projeto e preenche o painel |
| POR-03 | Criar projeto exige nome e persiste após recarregar a página |
| POR-04 | "Prazo vencido" conta só projetos ativos (Planejamento, Em execução) |
| KAN-01 | Mover item registra compromisso (saída do backlog), início (1ª coluna de trabalho) e entrega; sair de Concluído limpa a entrega |
| KAN-02 | Item que vai direto para Concluído recebe compromisso e início |
| KAN-03 | Mover para coluna no limite de WIP pede confirmação; recusar bloqueia |
| KAN-04 | Coluna acima do WIP fica destacada |
| KAN-05 | Lead time = compromisso → entrega; cycle time = início → entrega; vazão = média semanal das últimas 4 semanas |
| KAN-06 | Não se remove coluna com itens; sempre há uma coluna do tipo Concluído |
| SCR-01 | Iniciar sprint grava o compromisso em pontos; concluir devolve pendentes ao backlog e registra a velocidade |
| SCR-02 | Só uma sprint ativa por projeto |
| SCR-03 | Reordenar o backlog altera a prioridade |
| SCR-04 | Burndown com linha ideal e real para a sprint ativa |
| RSK-01 | P × I ≥ 15 é alto; 6 a 14 médio; abaixo de 6 baixo |
| RSK-02 | Risco alto sem dono ou sem ação gera alerta; risco encerrado sai da matriz |
| STK-01 | Quadrante pela matriz poder × interesse (corte em 3); alerta para alto poder + alto interesse + resistência |
| SEG-01 | Todo texto digitado é escapado; nenhum HTML do usuário é executado |
| DAD-01 | Backup JSON exporta tudo (Enki + DMAIC); restaurar recupera os dados; data do backup atualizada |
| DAD-02 | Arquivo que não é backup do Enki é recusado sem apagar dados |
| DAD-03 | Dados de versão antiga ou incompletos são normalizados sem erro |
| LSS-01 | Projetos do `dmaic.html` aparecem no portfólio; importar cria projeto DMAIC vinculado; progresso = fases concluídas ÷ 5 |
| LSS-02 | "Abrir no DMAIC" abre o projeto certo |
| LSS-03 | Dados do DMAIC corrompidos não quebram o Enki |
| SMK | `index.html`, `dmaic.html` e `gestao.html` abrem sem erro de script; o CEP mantém os links para DMAIC e Enki |

## 6. Release 3-A — Diagnóstico de Processos (exceção ao gate, ADR 7)

**Problema.** Não há onde registrar os processos nem saber qual está mais frágil.
**Objetivo.** Ter o inventário dos processos com o nível de maturidade de cada um e a evolução no tempo.
**Resultado esperado.** Em 30 dias, ao menos 5 processos reais avaliados e um deles com ação definida para subir de nível.

### Escala de maturidade
Cinco níveis (nomes alinhados ao BPMM da OMG e ao CMMI) avaliados em cinco dimensões (inspiradas no PEMM de Hammer).
**Nível geral = menor nível entre as dimensões** da avaliação mais recente (regra do elo mais fraco).
Dimensão acima do nível 2 exige evidência escrita.

| Dimensão | 1 · Inicial | 2 · Repetível | 3 · Padronizado | 4 · Medido | 5 · Otimizado |
| --- | --- | --- | --- | --- | --- |
| Desenho e documentação (`desenho`) | Na cabeça das pessoas | Passos principais escritos | Fluxo mapeado (BPMN/SIPOC) e procedimento aprovado | Documento revisado com base nos dados | Revisão periódica com ciclo de melhoria |
| Dono e governança (`dono`) | Ninguém responde | Alguém cuida informalmente | Dono nomeado, com autoridade | Dono acompanha indicadores e responde por eles | Dono lidera melhoria entre áreas |
| Executores e capacitação (`executores`) | Cada um faz do seu jeito | Quem faz conhece a rotina | Treinamento no padrão | Desempenho individual acompanhado | Executores propõem melhorias |
| Indicadores e medição (`indicadores`) | Nenhum | Medido de vez em quando | Indicador definido, com meta e frequência | Medido com estabilidade conhecida (CEP) | Capacidade (Cp/Cpk) no alvo e comparada |
| Controle e melhoria (`controle`) | Só corrige quando quebra | Correções repetem os mesmos erros | Desvios tratados com causa raiz | Plano de controle ativo | Melhoria contínua (DMAIC/PDSA) rodando |

### Critérios de aceite
| Código | Critério |
| --- | --- |
| PRC-01 | Criar processo exige nome; persiste após recarregar; edição e exclusão (com confirmação) funcionam |
| PRC-02 | Menu tem a seção Processos; nela a barra esconde o seletor, "Novo projeto" e "Excluir" de projeto |
| PRC-03 | Processo abre um projeto DMAIC no portfólio, vinculado por `processoId` |
| MAT-01 | Nível geral = menor nível das 5 dimensões da avaliação mais recente; sem avaliação = "não avaliado" |
| MAT-02 | Dimensão acima de 2 sem evidência é recusada com mensagem |
| MAT-03 | Nova avaliação entra no histórico sem apagar as anteriores; tendência compara com a penúltima |
| MAT-04 | Painel conta processos por nível e destaca processo de criticidade Alta em nível ≤ 2 e avaliação com mais de 180 dias |
| DAD-04 | Backup exporta e restaura `processes`; backup antigo sem `processes` abre com `{}`; DAD-03 segue verde |
| SEG-01 | Textos de processo e evidência passam por `esc()` (teste de XSS estendido) |

## 7. Projetos por domínio de desempenho (fatia P-01, ADR 9)
**Problema.** O menu de Projetos é uma lista plana de 6 telas, sem relação visível com o PMBOK 8. O dono quer cada ferramenta na sua área.
**Objetivo.** Agrupar as telas de Projetos pelos 7 domínios do PMBOK 8 (Governança, Escopo, Cronograma, Finanças, Partes interessadas, Recursos, Riscos), com a área de conhecimento clássica como legenda.
**Resultado esperado.** Só navegação: nenhuma tela muda por dentro; ferramentas da R2 e R3-B aparecem como "previsto", desabilitadas. Não antecipa o gate.

| Domínio (legenda clássica) | Telas |
| --- | --- |
| Atalhos | Kanban · Scrum |
| Governança (Integração) | TAP e marcos · Lições aprendidas |
| Escopo | Backlog (abre o Scrum) · EAP *(R2)* |
| Cronograma (Tempo) | Kanban · Scrum · Gantt e Timeline *(R2)* · CFD *(R2)* |
| Finanças (Custos) | Valor agregado *(R2)* |
| Partes interessadas (Comunicações) | Matriz de partes |
| Recursos | RACI *(R3-B)* |
| Riscos | Registro e matriz |

Regras: um só conjunto de dados com várias visões (ADR 4); a Timeline sai do mesmo cronograma do Gantt na R2-05, sem cadastro próprio. Ponto a conferir no texto oficial do PMBOK 8: domínio de Qualidade e Aquisições na legenda.

### Critérios de aceite
| Código | Critério |
| --- | --- |
| NAV-01 | As 6 telas atuais aparecem no seu domínio e abrem a mesma tela de hoje; Kanban e Scrum também como atalho |
| NAV-02 | Itens previstos mostram o rótulo da release, ficam desabilitados e o clique não muda a tela |
| NAV-03 | Cada grupo mostra a área de conhecimento clássica como legenda quando o nome difere (Governança → Integração, Cronograma → Tempo, Finanças → Custos, Partes interessadas → Comunicações) |
| NAV-04 | A última tela aberta é lembrada por projeto (`meta.lastPage`) e restaurada ao trocar de projeto; backup sem `meta.lastPage` abre normalmente e DAD-03 segue verde |
| NAV-05 | Os testes da R1 e da R3-A1 continuam verdes sem alteração |
| NAV-06 | No celular cada tela de Projetos aparece uma vez (sem repetições nem previstos) |
| NAV-07 | Em tela baixa o menu lateral rola e a seção Processos continua alcançável |

## 8. Publicação no Vercel (fatia PUB-01, ADR 10)
**Problema.** O Enki não está no ar. O plano previa o GitHub Pages, mas o dono quer o mesmo molde do BI Frota: Vercel ligado ao GitHub, com prévia em cada pull request e produção a partir da `main`.
**Objetivo.** Publicar as três páginas (CEP, DMAIC, Enki) no Vercel sem mudar nenhuma tela.
**Resultado esperado.** Cada PR ganha uma URL de prévia; o merge na `main` atualiza a produção. Só as páginas vão ao ar: `docs/`, `tests/`, `CLAUDE.md` e `package.json` ficam fora.

Diferença em relação ao BI Frota: lá o Vercel roda `npm test && npm run build`. Aqui a suíte usa Playwright com Chromium, que não roda de forma confiável na imagem de build do Vercel. O portão de qualidade fica no GitHub Actions (obrigatório no PR) e o build do Vercel só monta `dist/`, recusando publicação incompleta.

**Atenção à origem dos dados.** O `localStorage` pertence ao domínio. O que estiver salvo em `dcsarmento.github.io` (projetos DMAIC) não aparece no endereço do Vercel: exporte no endereço antigo e importe no novo. As prévias de PR também têm domínio próprio, logo dados próprios; uso real só na produção.

### Critérios de aceite
| Código | Critério |
| --- | --- |
| PUB-01 | `npm run build` gera `dist/` com `index.html`, `dmaic.html` e `gestao.html`, idênticos aos da raiz, e nada mais |
| PUB-02 | `vercel.json` publica `dist/` via `npm run build`; nenhuma página tem link absoluto para `github.io` |
| PUB-03 | Faltando uma página, o build sai com erro e não cria `dist/` |

## 9. Merge automático (fatia AUT-01, ADR 11)
**Problema.** Cada PR verde ainda depende de um merge manual, de apagar a branch e, nos PRs empilhados, de trocar a base e reexecutar os testes. O dono quer isso automático, como no BI Frota.
**Objetivo.** PR para a `main` com a suíte **Testes** verde no último commit é mesclado sem intervenção. A publicação no Vercel segue sozinha a partir da `main` (ADR 10).
**Resultado esperado.** O workflow `merge-automatico.yml` mescla (merge commit, que preserva a pilha), redireciona os PRs empilhados para a `main`, reexecuta os testes deles e apaga a branch mesclada. A pilha desce sozinha, um PR por vez, cada um com seus testes.

Diferença em relação ao BI Frota: lá o merge acontece segundos depois de abrir o PR, antes do CI terminar. Aqui o merge só acontece depois do check **Testes** verde, como manda o ADR 6.

**Como segurar um PR.** Abrir como rascunho ou pôr o rótulo `segurar`. Tirando o rótulo, basta reexecutar os testes (aba Actions, "Run workflow" na branch) para o merge acontecer.

### Critérios de aceite
| Código | Critério |
| --- | --- |
| AUT-01 | PR aberto, do próprio repositório, com base `main`, sem conflito e com testes verdes no commit atual é mesclado |
| AUT-02 | Não mescla rascunho, PR com rótulo `segurar`, PR de fork, PR empilhado (base diferente da `main`), PR com commit posterior aos testes, PR com conflito nem execução com testes vermelhos |
| AUT-03 | Depois do merge, os PRs empilhados passam a ter base `main` e têm os testes reexecutados antes de a branch ser apagada; execução manual dos testes acha o PR pela branch e pelo commit |
| AUT-04 | O workflow dispara no fim de **Testes**, só age em sucesso, roda o código da `main` (nunca o do PR) e pede só `contents`, `pull-requests` e `actions` |

## 10. Novo nome: Enki (fatia NOM-01, ADR 12)
**Problema.** O nome Atlas era provisório. O dono escolheu Enki, deus sumério da sabedoria e dos ofícios.
**Objetivo.** Trocar o nome em tudo que o usuário vê (título da aba, logotipo, atalho no CEP, projeto de exemplo, mensagens, nome do arquivo de backup) e na documentação.
**Resultado esperado.** Nenhum texto de tela diz Atlas. Os dados já salvos no navegador e os backups antigos continuam abrindo, porque a chave `atlas_db_v1` e o formato do backup (`app: 'atlas'`) não mudam: são identificadores internos, e trocá-los exigiria migração sem ganho para o usuário.

### Critérios de aceite
| Código | Critério |
| --- | --- |
| NOM-01 | `gestao.html` tem título começando por "Enki ·" e logotipo ENKI; o atalho do CEP mostra ENKI; nenhum texto da página (telas ocultas incluídas, vazia ou com o exemplo "Projeto Enki") contém "Atlas" |
| NOM-02 | Dados em `atlas_db_v1` abrem e continuam gravados na mesma chave, sem criar outra; o backup baixa como `enki-backup-AAAA-MM-DD.json` com `app: 'atlas'`; backup antigo restaura |

## 11. Visual de software de gestão (fatia LAY-01, ADR 13)
**Problema.** O Enki herdou o tema escuro e monoespaçado do CEP e do DMAIC. Rótulos em caixa-alta, fonte de terminal e códigos de texto no menu (PORT, KAN, SCR) davam "cara de DOS" e dificultavam a leitura no uso diário.
**Objetivo.** Aproximar o Enki do padrão das ferramentas de gestão de projetos que o dono conhece (Asana, Monday, ClickUp, Linear, Jira, MS Project): fundo claro, menu lateral limpo com ícones, cartões e tabelas legíveis, tipografia proporcional.
**Resultado esperado.** Mesmas telas, mesmos dados, mesmo comportamento; só muda a aparência. Fatia LAY-01 cobre tokens de cor, tipografia, componentes (botões, campos, tabelas, cartões, Kanban, modal) e ícones do menu. Cabeçalho com contexto do projeto, modo escuro opcional e o mesmo visual no DMAIC e no CEP ficam para fatias seguintes (BACKLOG).

### Critérios de aceite
| Código | Critério |
| --- | --- |
| LAY-01 | Fundo da página claro; os tokens de texto (`--text`, `--muted2`, `--muted`) e de estado (`--accent`, `--danger`, `--success`, `--warn`) têm contraste ≥ 4,5:1 (WCAG AA) sobre `--surface` e `--bg`; o texto do botão principal tem ≥ 4,5:1 sobre `--accent` |
| LAY-02 | Todo ícone do menu lateral é um desenho (SVG) e não mostra código de texto; o código continua em `data-icon` |
| LAY-03 | Títulos de tela e de cartão, rótulos de indicador e de campo, cabeçalhos de tabela, legendas do menu e botões não usam caixa-alta nem DM Mono (DM Mono só em números e códigos) |
| LAY-04 | Todas as telas de `RENDER` abrem sem erro de script com o projeto de exemplo, a 1400 px e a 390 px de largura, sem rolagem horizontal da página |

### Modo escuro opcional (fatia LAY-03)
**Problema.** O tema claro é o padrão, mas pessoas com sensibilidade à luz (fotofobia, enxaqueca) ou que trabalham à noite precisam de uma tela de brilho baixo. Pedido do dono em 19/11/2026.
**Objetivo.** Um botão na barra superior alterna entre automático (segue o sistema operacional), claro e escuro. A escolha fica em `db.meta.tema`, gravada pelo `Store`, e vai junto no backup.
**Resultado esperado.** O escuro novo usa os mesmos tokens, com cores dessaturadas (sem o ciano neon nem a fonte de terminal do visual antigo) e o mesmo contraste AA do claro.

| Código | Critério |
| --- | --- |
| LAY-05 | Padrão `auto` segue `prefers-color-scheme`; o botão `#theme-btn` alterna auto → claro → escuro → auto; claro e escuro fixos ignoram o sistema; a escolha está em `atlas_db_v1` (`meta.tema`) e sobrevive ao recarregar; no escuro, os mesmos tokens do LAY-01 têm contraste ≥ 4,5:1 |
| LAY-06 | Dados sem `meta.tema`, ou com valor fora de `auto`/`claro`/`escuro`, abrem no automático |

## 12. Referências
PMBOK Guide 8ª ed. (PMI, 2025) · Kanban Method (Anderson) · Scrum Guide 2020 · Mendelow (poder × interesse) · Lei de Little (lead time ≈ WIP ÷ vazão) · Microsoft Project, Primavera P6, Jira e Smartsheet (padrão "um conjunto de dados, várias visões") · Asana, Monday, ClickUp e Linear (padrão visual: tema claro, menu com ícones, cartões) · WCAG 2.2 (contraste mínimo 4,5:1) · OMG Business Process Maturity Model 1.0 (2008) · Hammer, "The Process Audit", HBR (2007) · CMMI (níveis de maturidade).
