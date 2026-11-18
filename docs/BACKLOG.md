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

## Release 3 — Processos e maturidade (aguardando gate da R2)
| # | Tarefa | Critério de aceite | Teste |
| --- | --- | --- | --- |
| R3-01 | Cadastro de processos (dono, cliente, indicador, meta) | Processo listado e editável | PRC-01 |
| R3-02 | SIPOC por processo, reaproveitando o padrão do `dmaic.html` | Cinco colunas salvas e restauradas | PRC-02 |
| R3-03 | VSM simplificado: etapas com tempo de ciclo e espera; eficiência do fluxo | Eficiência = Σ tempo de valor ÷ lead time total | PRC-03 |
| R3-04 | Matriz RACI por projeto | Alerta quando uma atividade tem 0 ou mais de 1 "A" | RAC-01 |
| R3-05 | Autoavaliação de maturidade (padronizar, medir, controlar, melhorar × projeto/programa/portfólio) | Nota por dimensão e histórico de avaliações | MAT-01 |

## Dívida técnica monitorada
- `gestao.html` passa de ~150 KB → separar CSS e JS em arquivos próprios (tarefa dedicada, sem mudar comportamento, suíte inteira verde).
- Arrastar cartões no celular (eventos de toque) — hoje o fallback é trocar a coluna pelo cartão.
