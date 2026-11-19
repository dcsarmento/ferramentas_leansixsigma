# Ferramentas Lean Six Sigma · Atlas

Ferramentas web estáticas, publicadas no GitHub Pages em `https://dcsarmento.github.io/ferramentas_leansixsigma/`.

| Arquivo | O que faz |
| --- | --- |
| `index.html` | CEP: I-MR, X̄-S, tendência, dispersão, ANOVA, Box-Cox, capacidade (Cp/Cpk) |
| `dmaic.html` | Roteiro DMAIC: SIPOC, VOC, Pareto, Ishikawa, 5 porquês, GUT, 5W2H, PDSA, plano de controle |
| `gestao.html` | **Atlas** — portfólio, TAP (PMBOK 8), Kanban com WIP e métricas de fluxo, Scrum, riscos, partes interessadas, lições aprendidas |

## Atlas — Release 1

- **Portfólio:** projetos por abordagem (Preditiva, Scrum, Kanban, DMAIC, Híbrida), saúde, prioridade, progresso, riscos altos e próximo marco.
- **TAP:** justificativa, objetivo SMART, escopo dentro/fora, premissas, restrições, orçamento, critérios de sucesso e marcos. Imprime em PDF.
- **Kanban:** colunas configuráveis com limite de WIP, classes de serviço, lead time, cycle time, vazão semanal, itens envelhecendo e estimativa pela Lei de Little.
- **Scrum:** backlog ordenado, sprints com meta, burndown, velocidade e retrospectiva. Os itens são os mesmos do Kanban.
- **Riscos:** P × I, matriz 5×5, alerta para risco alto sem dono ou sem ação.
- **Partes interessadas:** matriz poder × interesse com atitude (apoia/neutro/resiste).
- **Integração LSS:** lê os projetos do `dmaic.html` (mesmo navegador), traz para o portfólio e acompanha as fases D-M-A-I-C.

## Dados e backup

Tudo fica no `localStorage` do navegador (chave `atlas_db_v1`). Limpar o cache apaga os dados.
Use **⬇ Backup JSON** pelo menos uma vez por semana; o arquivo inclui também os projetos DMAIC.
O aviso no topo aparece quando o último backup tem mais de 7 dias.

No celular o quadro não aceita arrastar: abra o cartão e troque a coluna no campo **Coluna**.

## Como o projeto é desenvolvido
- `CLAUDE.md` — regras de trabalho (três leis e ciclo especificação → arquitetura → tarefa → teste → PR)
- `docs/ESPECIFICACAO.md` — problema, objetivo, resultado esperado e critérios de aceite com código
- `docs/ARQUITETURA.md` — estrutura, modelo de dados e registro de decisões
- `docs/BACKLOG.md` — próximas releases fatiadas em tarefas pequenas
- `tests/` — testes automatizados (`npm test`), rodando no GitHub Actions a cada pull request

## Próximas releases

- **R2:** EAP, cronograma Gantt, valor agregado (VP, VA, CR, IDC, IDP), diagrama de fluxo cumulativo.
- **R3:** autoavaliação de maturidade (OPM3), cadastro de processos com SIPOC e VSM, RACI.
