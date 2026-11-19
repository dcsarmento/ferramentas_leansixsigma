# Especificação — Atlas

Versão 1.0 · 18/11/2026 · Dono: Diego Sarmento

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
| DAD-01 | Backup JSON exporta tudo (Atlas + DMAIC); restaurar recupera os dados; data do backup atualizada |
| DAD-02 | Arquivo que não é backup do Atlas é recusado sem apagar dados |
| DAD-03 | Dados de versão antiga ou incompletos são normalizados sem erro |
| LSS-01 | Projetos do `dmaic.html` aparecem no portfólio; importar cria projeto DMAIC vinculado; progresso = fases concluídas ÷ 5 |
| LSS-02 | "Abrir no DMAIC" abre o projeto certo |
| LSS-03 | Dados do DMAIC corrompidos não quebram o Atlas |
| SMK | `index.html`, `dmaic.html` e `gestao.html` abrem sem erro de script; o CEP mantém os links para DMAIC e Atlas |

## 6. Referências
PMBOK Guide 8ª ed. (PMI, 2025) · Kanban Method (Anderson) · Scrum Guide 2020 · Mendelow (poder × interesse) · Lei de Little (lead time ≈ WIP ÷ vazão).
