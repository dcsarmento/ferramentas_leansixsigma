# Backlog incremental — Enki

Cada tarefa cabe em **uma sessão / um prompt**, mexe no mínimo de código possível e só é dada como pronta com teste novo verde e suíte inteira verde.
A R2 só começa depois do gate da R1: 30 dias de uso real com 3 projetos (ver ESPECIFICACAO.md).

## Release 1 — concluída em 18/11/2026
Critérios POR, KAN, SCR, RSK, STK, SEG, DAD, LSS e SMK — todos com teste.

## Release 2 — Preditivo (aguardando gate)
| # | Tarefa | Critério de aceite | Teste |
| --- | --- | --- | --- |
| R2-01 | Modelo de dados da EAP: campo `eap` (árvore de pacotes com código 1, 1.1, 1.1.1) em `makeProject` e `normalize` | Projeto antigo abre com `eap: []`; DAD-03 verde | EAP-01 |
| R2-02 | Tela EAP: adicionar, renomear, recuar/avançar e remover pacotes; numeração automática | Numeração recalculada após cada operação | EAP-02 |
| R2-03 | Vincular item do Kanban a um pacote da EAP | Pacote mostra % concluído dos itens vinculados | EAP-03 |
| R2-04 | Cronograma: datas de início/fim e predecessoras (término→início) nos pacotes | Ciclo de dependência é recusado com mensagem | CRO-01 |
| R2-05 | Gantt em SVG com barras, marcos e linha de hoje | Barra posicionada pela data; pacote atrasado em vermelho | CRO-02 |
| R2-06 | Valor agregado: orçamento por pacote (VP planejado no tempo), VA = % concluído × orçamento, CR informado | IDC = VA/CR e IDP = VA/VP conferidos contra exemplo calculado à mão | EVM-01 |
| R2-07 | Curva S (VP, VA, CR) e farol de IDC/IDP no portfólio | IDC < 0,9 ou IDP < 0,9 deixa a saúde sugerida em vermelho | EVM-02 |
| R2-08 | Diagrama de fluxo cumulativo (CFD) no Kanban a partir de `hist` | Faixas somam o total de itens em cada dia | KAN-07 |

## Release 3-A — Diagnóstico de Processos (exceção ao gate, ADR 7)
Critérios na seção 6 da ESPECIFICACAO.md. Uma fatia por PR, nesta ordem. ✓ = entregue.
| # | Tarefa | Critério de aceite | Teste |
| --- | --- | --- | --- |
| R3-A0 | Documentação: especificação, escala, modelo de dados, ADR 7 e 8, backlog | Docs revisados pelo dono | — |
| R3-A1 ✓ | Menu reorganizado (Portfólio, Projetos, Processos, Melhoria contínua) + barra por contexto + cadastro de processos + `processes` em `normalize` e no backup | Ver PRC-01, PRC-02, DAD-04 | PRC-01, PRC-02, DAD-04 |
| R3-A2 ✓ | Avaliação de maturidade: formulário com os descritores da escala, `maturity`, regra da evidência, histórico | Ver MAT-01 a MAT-03 | MAT-01, MAT-02, MAT-03, SEG-01 |
| R3-A3 ✓ | Painel do diagnóstico: distribuição por nível, alertas, tendência | Ver MAT-04 | MAT-04 |
| R3-A4 | Ponte com melhoria: abrir projeto DMAIC a partir do processo (`processoId`) | Ver PRC-03 | PRC-03 |

## Projetos por domínio (aprovada em 18/11/2026, ADR 9)
Só navegação, com as telas da R1; vem depois do merge do PR #1 e da R3-A1, porque mexe no mesmo menu.
| # | Tarefa | Critério de aceite | Teste |
| --- | --- | --- | --- |
| P-00 | Documentação: especificação seção 7, ADR 9, backlog | Docs revisados pelo dono | — |
| P-01 | Sub-menu de Projetos agrupado pelos 7 domínios do PMBOK 8, lista `DOMAINS` no bloco Domínio, previstos desabilitados, `meta.lastPage` por projeto | Ver NAV-01 a NAV-07 | NAV-01 a NAV-07 (`tests/navegacao.test.js`), DAD-03 |

## Publicação (ADR 10)
| # | Tarefa | Critério de aceite | Teste |
| --- | --- | --- | --- |
| PUB-01 | `vercel.json`, script `build` e `tools/build.js`; docs atualizados para o Vercel | Ver PUB-01 a PUB-03 | PUB-01, PUB-02, PUB-03 |

## Merge automático (ADR 11)
| # | Tarefa | Critério de aceite | Teste |
| --- | --- | --- | --- |
| AUT-01 | `merge-automatico.yml` + `tools/merge-automatico.js`; `workflow_dispatch` em `testes.yml`; docs | Ver AUT-01 a AUT-04 | AUT-01 a AUT-04 |

## Novo nome: Enki (ADR 12)
| # | Tarefa | Critério de aceite | Teste |
| --- | --- | --- | --- |
| NOM-01 ✓ | Atlas → Enki na tela (título, logotipo, atalho do CEP, exemplo, mensagens, arquivo de backup) e nos docs; chave e formato do backup mantidos | Ver NOM-01 e NOM-02 | NOM-01, NOM-02 (`tests/nome.test.js`) |

## Visual de software de gestão (ADR 13)
Fora do gate: muda só a aparência, sem função nova. Uma fatia por PR, cada uma com prévia no Vercel para o dono aprovar.
| # | Tarefa | Critério de aceite | Teste |
| --- | --- | --- | --- |
| LAY-01 ✓ | Tema claro no `gestao.html`: tokens, tipografia DM Sans, componentes e ícones SVG no menu (`NAV_ICONS`, `hydrateNavIcons`) | Ver LAY-01 a LAY-04 | LAY-01 a LAY-04 (`tests/layout.test.js`) |
| LAY-02 | Cabeçalho do projeto: nome, status, saúde, progresso e próximo marco no topo das telas de projeto; backup e restauração num menu compacto; "Excluir projeto" sai da barra para a TAP | A definir na especificação da fatia | — |
| LAY-03 | Modo escuro opcional: botão na barra (auto → claro → escuro), `db.meta.tema` gravado pelo `Store`, padrão segue o sistema (`TEMAS`, `nextTheme`, `applyTheme`, `cycleTheme`) | Ver LAY-05 e LAY-06 | LAY-05, LAY-06 (`tests/layout.test.js`) |
| LAY-04 | Mesmo visual no `dmaic.html` e no `index.html` (CEP), para a regra "mesmo visual nas três páginas" voltar a valer | A definir | — |

## Planner e lista de verificação (proposta, aguardando decisão do gate)
Especificação na seção 12 da ESPECIFICACAO.md. Só começa se o dono aprovar a exceção (ADR 14). Uma fatia por PR, nesta ordem.
| # | Tarefa | Critério de aceite | Teste |
| --- | --- | --- | --- |
| PLN-00 | Documentação: especificação seção 12, backlog, arquitetura | Docs revisados pelo dono | — |
| CHK-01 | Lista de verificação no item: campo `checklist`, `rotulos`, `bucket`, `origem` em `normalize`; diálogo; contador no cartão (`checklistProgress`) | Ver CHK-01 a CHK-03 | CHK-01 a CHK-03 (`tests/planner.test.js`), DAD-03, SEG-01 |
| PLN-01 | Leitor de .xlsx sem biblioteca (`readXlsx`) | Ver PLN-01 | PLN-01 |
| PLN-02 | Conversão do Planner (`plannerRows`) com arquivo real do dono como molde (dados sensíveis trocados) | Ver PLN-02 | PLN-02 |
| PLN-03 | Botão "Importar do Planner" no Kanban, prévia, gravação e reimportação sem duplicar | Ver PLN-03 a PLN-05 | PLN-03 a PLN-05 |

## Release 3-B — Ferramentas de processo (aguardando gate)
| # | Tarefa | Critério de aceite | Teste |
| --- | --- | --- | --- |
| R3-B1 | SIPOC por processo, reaproveitando o padrão do `dmaic.html` | Cinco colunas salvas e restauradas | PRC-04 |
| R3-B2 | VSM simplificado: etapas com tempo de ciclo e espera; eficiência do fluxo | Eficiência = Σ tempo de valor ÷ lead time total | PRC-05 |
| R3-B3 | Matriz RACI por projeto | Alerta quando uma atividade tem 0 ou mais de 1 "A" | RAC-01 |

A autoavaliação OPM3 (antiga R3-05) saiu do roadmap (ADR 8); volta só se houver uso organizacional.

## Dívida técnica monitorada
- `gestao.html` passa de ~150 KB → separar CSS e JS em arquivos próprios (tarefa dedicada, sem mudar comportamento, suíte inteira verde).
- Arrastar cartões no celular (eventos de toque) — hoje o fallback é trocar a coluna pelo cartão.
