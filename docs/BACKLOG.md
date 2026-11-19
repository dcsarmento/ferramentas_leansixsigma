# Backlog incremental — Atlas

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
| R3-A3 | Painel do diagnóstico: distribuição por nível, alertas, tendência | Ver MAT-04 | MAT-04 |
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
