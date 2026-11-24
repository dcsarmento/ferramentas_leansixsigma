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
| PRC-03 | Processo abre um projeto DMAIC no portfólio, vinculado por `processoId` (ficha do processo → "+ Projeto DMAIC", que grava a ficha, cria o projeto e abre a TAP); a TAP mostra e edita o "Processo melhorado"; a ficha lista os projetos de melhoria do processo |
| MAT-01 | Nível geral = menor nível das 5 dimensões da avaliação mais recente; sem avaliação = "não avaliado" |
| MAT-02 | Dimensão acima de 2 sem evidência é recusada com mensagem |
| MAT-03 | Nova avaliação entra no histórico sem apagar as anteriores; tendência compara com a penúltima |
| MAT-04 | Painel conta processos por nível e destaca processo de criticidade Alta em nível ≤ 2 e avaliação com mais de 180 dias |
| DAD-04 | Backup exporta e restaura `processes`; backup antigo sem `processes` abre com `{}`; DAD-03 segue verde |
| SEG-01 | Textos de processo e evidência passam por `esc()` (teste de XSS estendido) |

### Diagnóstico de negócio (fatia R3-A5, extensão do ADR 7, ADR 16)
**Situação.** Pedido do dono em 23/11/2026, dentro da exceção do Diagnóstico de Processos (ADR 7).
**Problema.** A ficha do processo diz quem é o dono e o que se mede, mas não diz por que o processo existe nem que regras o governam. Sem isso, a avaliação de maturidade julga um processo sem saber o que ele deveria entregar.
**Objetivo.** Cada processo ganha **Propósito** (2 a 3 linhas: o que entrega, para quem, por que importa) e **Regras de negócio** principais, agrupados na ficha sob "Diagnóstico de negócio", identificado como **etapa 1** do diagnóstico; a maturidade passa a aparecer como **etapa 2**.
**Resultado esperado.** Abrir um processo mostra primeiro o diagnóstico de negócio e depois a maturidade; o painel aponta quantos processos ainda não têm propósito, como já aponta os sem dono e sem indicador.

**Regras.**
- `proposito` é texto livre; o limite de 2 a 3 linhas é orientação na tela, não bloqueio (texto já digitado nunca é recusado).
- `regras` é uma lista de textos: a tela edita uma regra por linha; linhas vazias e espaços nas pontas saem ao salvar (`parseRules`).
- Propósito e regras não entram no nível de maturidade (ADR 8 não muda); "sem propósito" é alerta, não bloqueio, e não impede avaliar.
- Processo desativado fica fora do alerta, como nos demais alertas do painel.
- Dados existentes não mudam: processo antigo abre com `proposito: ''` e `regras: []`, todos os outros campos e avaliações intactos; `regras` gravada como texto vira lista; valor inválido vira `[]`. Chave `atlas_db_v1` e formato do backup mantidos.

| Código | Critério |
| --- | --- |
| NEG-01 | A ficha do processo tem a etapa "Diagnóstico · etapa 1 · Diagnóstico de negócio" com Propósito e Regras de negócio (uma por linha), antes da maturidade ("etapa 2"); salvar persiste após recarregar e as regras são gravadas como lista sem linhas vazias |
| NEG-02 | Processo e backup antigos abrem com `proposito: ''` e `regras: []`, sem alterar nenhum outro campo nem as avaliações; `regras` em texto vira lista; `parseRules` ignora o que não é texto; DAD-03 verde |
| NEG-03 | `diagnosticSummary` devolve `semProposito` (não desativados com propósito vazio ou só espaços); o painel mostra o indicador "Sem propósito" e o inventário marca "sem propósito" no processo |
| NEG-04 | Propósito e regras passam por `esc()` (teste de XSS estendido) |

Fora desta fatia: SIPOC, entradas e saídas, fornecedores (R3-B, atrás do gate); regras com código, tipo ou fonte; vínculo de regra com etapa do fluxo.

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

## 12. Importação do Microsoft Planner e lista de verificação (fatias CHK e PLN, exceção ao gate, ADR 14)
**Situação.** Exceção ao gate aprovada pelo dono em 23/11/2026 (ADR 14), no molde do ADR 7.

**Problema.** Os projetos reais do dono (o BI Frota, por exemplo) estão no Microsoft Planner. Recadastrar tarefa por tarefa no Enki é trabalho repetido, e o cartão do Enki não tem a lista de verificação que o Planner tem (subitens com círculo de marcar e contador "0/13" no cartão). Sem os projetos reais, o gate da R1 (30 dias, 3 projetos) não anda.
**Objetivo.** (1) Cada item do Kanban ganha uma lista de verificação. (2) O Kanban importa o arquivo que o Planner gera em "Exportar plano para Excel" (.xlsx), criando os itens no projeto aberto.
**Resultado esperado.** Um plano real do Planner vira um quadro do Enki em menos de um minuto, com título, descrição, responsável, prazo, coluna pelo progresso, rótulos e lista de verificação; o cartão mostra "feitos/total".

**Por que arquivo, e não integração.** O Planner só se lê por API (Microsoft Graph) com login Microsoft e registro de aplicativo no Entra ID, o que a seção 4 deixa fora do escopo e o ADR 1 (página estática, sem servidor) não comporta. A exportação para Excel não precisa de nada disso: é um retrato do plano no momento da exportação, feito pelo Planner na web. É importação de mão única: o que mudar depois no Planner não volta sozinho.

**Formato do arquivo (a confirmar com um arquivo real do dono antes da PLN-02).** Pela documentação da Microsoft e por relatos de usuários: uma planilha com o cabeçalho do plano (nome, ID, data de exportação) acima da tabela de tarefas, uma linha por tarefa, com ID, nome, bucket, progresso, prioridade, atribuído a, datas de criação, início, conclusão e término, recorrência, atraso, rótulos, descrição e duas colunas da lista de verificação: os itens numa célula só, separados por ";", e a contagem de concluídos. **Limitação conhecida:** a exportação não diz *qual* subitem está marcado, só quantos. Na importação os subitens entram desmarcados, exceto quando a tarefa está concluída (todos marcados) ou quando a contagem é igual ao total. Item com ";" no texto se parte em dois. O leitor aceita cabeçalhos em português e em inglês e acha a linha do cabeçalho em vez de supor a posição.

**Leitura do .xlsx sem biblioteca.** O .xlsx é um ZIP de XML. O navegador já descompacta (`DecompressionStream('deflate-raw')`) e lê XML (`DOMParser`); um leitor mínimo da primeira planilha e das strings compartilhadas cabe em poucas dezenas de linhas. Evita carregar a SheetJS (a versão do npm está parada e a da CDN própria seria dependência externa em tempo de execução, contra a página autocontida). Plano B, se o leitor falhar com algum arquivo real: aceitar o mesmo plano salvo como CSV pelo Excel.

**Mapeamento.**
| Planner | Enki |
| --- | --- |
| Nome da tarefa | `titulo` |
| Descrição | `desc` |
| Progresso: Não iniciado / Em andamento / Concluída | primeira coluna do tipo `todo` (ou `backlog`) / primeira `doing` / primeira `done`, com `moveItem` (datas de fluxo coerentes) |
| Bucket | rótulo `bucket` guardado no item e mostrado como etiqueta (bucket no Planner é agrupamento livre, não estado) |
| Prioridade: Urgente / Importante / Média / Baixa | classe de serviço: `expedite` / `padrao` / `padrao` / `intangivel` |
| Atribuído a | `resp` (nomes separados por ";" viram texto com vírgula) |
| Data de conclusão (término) | `prazo` |
| Rótulos | `rotulos` (lista), mostrados como etiquetas |
| Itens da lista de verificação | `checklist` |
| ID da tarefa | `origem: { sistema: 'planner', id }`, para reimportar sem duplicar |

**Modelo de dados.** Item ganha `checklist: [ { id, texto, feito } ]`, `rotulos: []`, `bucket: ''` e `origem: null`, com padrão em `normalize` dos itens (backups antigos abrem com lista vazia; DAD-03 verde). O backup não muda de formato.

### Critérios de aceite
| Código | Critério |
| --- | --- |
| CHK-01 | No diálogo do item é possível adicionar, renomear, marcar/desmarcar e remover subitens; tudo persiste após recarregar |
| CHK-02 | Cartão com lista de verificação mostra "feitos/total"; sem lista, não mostra nada; `checklistProgress(it)` é função pura no bloco Domínio |
| CHK-04 | No cartão, o contador abre e recolhe a lista; o círculo marca ou desmarca o subitem ali mesmo, sem abrir o diálogo, e grava na hora (a "marcação" do Planner) |
| CHK-03 | Item de backup antigo, sem `checklist`, `rotulos`, `bucket` ou `origem`, abre normalizado; DAD-03 verde; textos dos subitens passam por `esc()` (SEG-01 estendido) |
| PLN-01 | `readXlsx(arrayBuffer)` lê a primeira planilha de um .xlsx (strings compartilhadas e inline, células vazias no meio) e devolve linhas; arquivo que não é .xlsx é recusado com mensagem, sem alterar dados |
| PLN-02 | `plannerRows(linhas)` acha o cabeçalho (pt ou en) e converte cada tarefa conforme o mapeamento; testado com um arquivo de exemplo no formato real |
| PLN-03 | Importar mostra a prévia (quantas tarefas, buckets e subitens) e só grava após confirmar; cancelar não muda nada |
| PLN-04 | Reimportar o mesmo arquivo atualiza os itens já importados (mesma `origem.id`) em vez de duplicar; subitens marcados no Enki não são desmarcados |
| PLN-05 | Tarefa concluída no Planner entra em Concluído com todos os subitens marcados e datas de fluxo preenchidas; coluna no limite de WIP não bloqueia a importação, mas o destaque KAN-04 aparece |

### Fora desta proposta
Sincronização contínua com o Planner, exportar de volta para o Planner, comentários e anexos das tarefas, tarefas recorrentes (entram como item único).

## 13. Cartões recorrentes no Kanban (fatia REC-01, extensão da exceção do ADR 14, ADR 15)
**Situação.** Pedido explícito do dono em 23/11/2026, ciente do gate; registrado como extensão da exceção do ADR 14 (ADR 15).

**Problema.** Parte do trabalho real se repete: no projeto BI, o cartão "Importação" volta todo mês com a mesma lista de verificação de ~13 relatórios. Hoje é preciso recriar o cartão e a lista à mão a cada ciclo, como no Planner sem a opção "Repetir".
**Objetivo.** O item do Kanban ganha a opção "Repetir" (diária, semanal, mensal, anual). Ao concluir o item, o Enki cria a próxima ocorrência, como o Planner faz.
**Resultado esperado.** Concluir "Importação" de novembro faz surgir "Importação" com prazo em dezembro, na primeira coluna de compromisso ("A fazer"), com a mesma lista desmarcada; o cartão de novembro fica em Concluído, intacto, e entra nas métricas de fluxo como qualquer entrega.

**Regras.**
- Gatilho: entrada do item numa coluna do tipo `done` (arrastar ou trocar a coluna no diálogo). Não há gerador por calendário: sem conclusão, não nasce ocorrência nova, o que mantém o WIP honesto (a ocorrência atrasada aparece como atrasada, em vez de empilhar cópias).
- Uma ocorrência por item: o item concluído guarda `recorrencia.proxima` (id do item criado). Reabrir e concluir de novo não duplica. Reabrir não apaga a ocorrência criada (nenhum dado é apagado sozinho).
- Data: a próxima data limite parte da data limite do item; sem data limite, parte de hoje. Mensal e anual mantêm o dia de referência (`recorrencia.dia`): 31/01 → 28/02 → 31/03.
- Copia: título, descrição, tipo, classe de serviço, pontos, responsável, rótulos, bucket e lista de verificação (desmarcada, ids novos). Não copia: sprint (a sprint é um timebox, a ocorrência nova entra no backlog do quadro), datas de fluxo, histórico e `origem`.
- O limite de WIP da coluna de destino não bloqueia a criação; a coluna estourada fica destacada (KAN-04), como na importação.
- Item sem recorrência e dados antigos não mudam: `recorrencia` ausente ou inválida vira `null`; o backup não muda de formato.

### Critérios de aceite
| Código | Critério |
| --- | --- |
| REC-01 | `nextDue(data, freq, dia)` é função pura: diária +1 dia, semanal +7, mensal e anual preservam o dia de referência e param no último dia do mês quando ele não existe; data vazia ou frequência desconhecida devolvem `null` |
| REC-02 | O diálogo do item tem "Repetir" (não se repete, diária, semanal, mensal, anual); a escolha persiste após recarregar e o cartão mostra a etiqueta "↻ Mensal" etc.; "Não se repete" remove a recorrência |
| REC-03 | Concluir um item recorrente (arrastando ou pelo diálogo) cria uma única próxima ocorrência na primeira coluna `todo`, com a próxima data, a lista desmarcada, os mesmos campos e sem sprint; o item concluído não muda; reabrir e concluir de novo não duplica |
| REC-04 | Item de dados antigos ou com `recorrencia` inválida abre com `recorrencia: null`, sem etiqueta, e concluir não cria nada; DAD-03 e CHK-03 verdes |

### Fora desta fatia
Intervalo personalizado ("a cada 2 semanas"), dias da semana específicos, "último dia útil do mês", data de término da série, geração por calendário sem concluir, editar a série inteira de uma vez e importar a recorrência do Planner (a PLN segue trazendo a tarefa recorrente como item único).

## 14. DMAIC sem projeto selecionado (fatia DMA-01, correção)
Correção pedida pelo dono em 24/11/2026, fora do gate (conserta comportamento existente do `dmaic.html`, sem função nova).

**Problema.** Sem projeto selecionado, as fases do `dmaic.html` abriam normalmente: o "+ Adicionar" do SIPOC não fazia nada e os campos do contrato aceitavam digitação que não era gravada, sem aviso. Parecia que o SIPOC não aceitava registro.
**Objetivo.** Deixar claro que é preciso criar ou selecionar um projeto e impedir digitação que se perde.
**Resultado esperado.** Sem projeto, cada fase mostra um aviso com "+ Novo projeto" e os campos ficam bloqueados; com projeto, tudo funciona como antes. Coluna vazia do SIPOC indica o "+ Adicionar".

### Critérios de aceite
| Código | Critério |
| --- | --- |
| DMA-01 | Sem projeto, a fase Define mostra "Nenhum projeto selecionado" e os campos, botões do SIPOC e status ficam desabilitados; o botão "Abrir CEP" segue livre |
| DMA-02 | Com projeto, o aviso some, a coluna vazia do SIPOC mostra a dica do "+ Adicionar" e as cinco colunas aceitam itens que persistem após recarregar |
| DMA-03 | Excluir o projeto aberto volta a bloquear as fases |

## 15. DMAIC puxa dados do Enki (fatia INT-01, ADR 17)
Pedido do dono em 24/11/2026 ("a ideia é que tudo esteja integrado e que eles puxem as informações dos campos que já foram preenchidos"). Cabe na R1: "integração DMAIC/CEP" está no escopo da TAP original; não antecipa o gate.

**Problema.** A integração era de mão única: o Enki lê o DMAIC, mas o `dmaic.html` não lê nada do Enki, e o dono redigita TAP e processo no Contrato de Melhoria.
**Objetivo.** No projeto DMAIC vinculado a um projeto do Enki (`dmaicId`), um botão "⇣ Puxar do Enki" na fase Define preenche os campos **vazios** com dados do Enki. O que já foi escrito no DMAIC nunca é sobrescrito.
**Mapa.** Nome ← nome; Patrocinador ← patrocinador; Líder ← gerente; Início/Conclusão ← início/fim; Contexto ← justificativa; Objetivos ← objetivo; Dentro/Fora do escopo ← dentro/fora; Restrições ← restrições; Pressupostos ← premissas; Riscos ← descrições dos riscos, uma por linha. Se "Processo a ser impactado" tiver o mesmo nome de um processo cadastrado no Enki (sem diferença de maiúsculas), SIPOC · Clientes vazio ← cliente do processo.

### Critérios de aceite
| Código | Critério |
| --- | --- |
| INT-01 | `mergeFromEnki(define, projetoEnki, processos)` é função pura: preenche só vazios, mantém o texto do DMAIC, junta os riscos por linha, casa o processo pelo nome e põe o cliente no SIPOC vazio; rodar de novo não muda nada |
| INT-02 | O botão preenche a fase Define do projeto vinculado, avisa o que foi puxado e os dados persistem após recarregar |
| INT-03 | Projeto DMAIC sem vínculo recebe aviso explicando como vincular e nada muda; o DMAIC nunca grava em `atlas_db_v1`; sem projeto selecionado o botão fica bloqueado |
| INT-04 | (R3-A4, ADR 18) Na TAP de projeto DMAIC sem vínculo, "Criar no DMAIC ↗" abre `dmaic.html?enki=<id>`, que cria uma única vez o projeto DMAIC com `define.enkiId`, já preenchido pela regra da INT-01; o processo vem do `processoId` do projeto (nome casado só sem vínculo); abrir de novo não duplica |
| INT-05 | (R3-A4, ADR 18) O Enki completa o próprio `dmaicId` a partir do `define.enkiId` (`autoLinkDmaic`), ao abrir e com a aba aberta (evento `storage`); projeto DMAIC já vinculado a outro não é reaproveitado |

### Fora desta fatia
Sincronização automática ou campos espelhados; levar dados do DMAIC de volta ao Enki; SIPOC completo do processo (R3-B, atrás do gate).

## 16. Referências
PMBOK Guide 8ª ed. (PMI, 2025) · Kanban Method (Anderson) · Scrum Guide 2020 · Mendelow (poder × interesse) · Lei de Little (lead time ≈ WIP ÷ vazão) · Microsoft Project, Primavera P6, Jira e Smartsheet (padrão "um conjunto de dados, várias visões") · Microsoft Planner, "Exportar um plano para o Excel" (suporte Microsoft) · Asana, Monday, ClickUp e Linear (padrão visual: tema claro, menu com ícones, cartões) · WCAG 2.2 (contraste mínimo 4,5:1) · OMG Business Process Maturity Model 1.0 (2008) · Hammer, "The Process Audit", HBR (2007) · CMMI (níveis de maturidade).
