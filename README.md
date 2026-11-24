# Ferramentas Lean Six Sigma · Enki

O nome Enki, deus sumério da sabedoria e dos ofícios, substituiu o nome provisório Atlas em 19/11/2026.

Ferramentas web estáticas, publicadas no Vercel (produção a partir da `main`, prévia em cada pull request). No Vercel, o projeto se chama **enki** (o repositório continua `ferramentas_leansixsigma`).

**Produção:** https://enkipro.vercel.app (CEP) · Enki: https://enkipro.vercel.app/gestao.html · DMAIC: https://enkipro.vercel.app/dmaic.html

Os dados ficam no navegador e pertencem ao endereço: quem usava o DMAIC em `dcsarmento.github.io` deve exportar os projetos lá e importar no endereço do Vercel.

| Arquivo | O que faz |
| --- | --- |
| `index.html` | CEP: I-MR, X̄-S, tendência, dispersão, ANOVA, Box-Cox, capacidade (Cp/Cpk) |
| `dmaic.html` | Roteiro DMAIC: SIPOC, VOC, Pareto, Ishikawa, 5 porquês, GUT, 5W2H, PDSA, plano de controle |
| `gestao.html` | **Enki** — portfólio, TAP (PMBOK 8), Kanban com WIP e métricas de fluxo, Scrum, riscos, partes interessadas, lições aprendidas; seção Processos com o diagnóstico de processos. As telas de Projetos ficam agrupadas pelos 7 domínios do PMBOK 8 |

## Enki — Release 1

- **Portfólio:** projetos por abordagem (Preditiva, Scrum, Kanban, DMAIC, Híbrida), saúde, prioridade, progresso, riscos altos e próximo marco.
- **TAP:** justificativa, objetivo SMART, escopo dentro/fora, premissas, restrições, orçamento, critérios de sucesso e marcos. Imprime em PDF.
- **Kanban:** colunas configuráveis com limite de WIP, classes de serviço, lead time, cycle time, vazão semanal, itens envelhecendo e estimativa pela Lei de Little. Cada item pode ter lista de verificação e repetir (diária, semanal, mensal ou anual): ao concluir, nasce a próxima ocorrência com a lista desmarcada.
- **Scrum:** backlog ordenado, sprints com meta, burndown, velocidade e retrospectiva. Os itens são os mesmos do Kanban.
- **Riscos:** P × I, matriz 5×5, alerta para risco alto sem dono ou sem ação.
- **Partes interessadas:** matriz poder × interesse com atitude (apoia/neutro/resiste).
- **Integração LSS:** lê os projetos do `dmaic.html` (mesmo navegador), traz para o portfólio e acompanha as fases D-M-A-I-C. No DMAIC vinculado, "⇣ Puxar do Enki" (fase Define) preenche os campos vazios com a TAP e o cliente do processo.

## Enki — Seção Processos (R3-A, em construção)

- **Diagnóstico de processos:** inventário dos processos contínuos com macroprocesso, dono, cliente, objetivo, indicador, meta, criticidade e status; alerta de processo sem dono ou sem indicador. A barra superior troca os controles de projeto por "+ Novo processo". Os processos entram no backup JSON.
- **Diagnóstico de negócio (etapa 1):** na ficha de cada processo, propósito (o que entrega, para quem, por que importa) e regras de negócio principais, uma por linha. O painel alerta processo sem propósito. A maturidade aparece em seguida, como etapa 2.
- **Avaliação de maturidade:** botão "Avaliar" em cada processo; 5 dimensões (desenho, dono, executores, indicadores, controle) × 5 níveis (Inicial, Repetível, Padronizado, Medido, Otimizado), cada nível com seu descritor. Nível geral = menor dimensão (elo fraco destacado); acima do nível 2 a dimensão exige evidência. Histórico de avaliações com tendência (↑ ↓ =) em relação à anterior.
- **Painel do diagnóstico:** distribuição dos processos por nível (1 a 5 e não avaliado), alerta de "crítico frágil" (criticidade Alta em nível ≤ 2) e de "reavaliar" (última avaliação há mais de 180 dias). Processos desativados ficam fora da conta.
- **Roteiro do projeto:** nas telas de projeto, "Próximo passo" diz qual etapa preencher na ordem da metodologia da abordagem (TAP → escopo → partes → riscos → marcos → execução → DMAIC → lições), com dica e botão "Ir"; "Ver roteiro" mostra tudo e avisa etapa pulada. No DMAIC, cada fase abre com "Como começar esta fase".
- **SIPOC do processo:** cinco colunas na ficha do processo (uma linha por item). O DMAIC puxa daqui; "⇣ Trazer do DMAIC" traz de volta o que foi descoberto no projeto. Sempre só colunas vazias.
- **Ponte com o DMAIC:** na ficha do processo, "+ Projeto DMAIC" cria o projeto de melhoria já vinculado (`processoId`); na TAP, "Criar no DMAIC ↗" abre o dmaic.html com o projeto criado, preenchido com a TAP e o processo, e o vínculo se fecha sozinho.

## Dados e backup

Tudo fica no `localStorage` do navegador (chave `atlas_db_v1`, nome técnico mantido da época do Atlas para não perder dados; ver ADR 12). Limpar o cache apaga os dados.
O arquivo de backup se chama `enki-backup-AAAA-MM-DD.json`; backups antigos (`atlas-backup-…`) continuam restaurando.
Use **⬇ Backup JSON** pelo menos uma vez por semana; o arquivo inclui também os projetos DMAIC.
O aviso no topo aparece quando o último backup tem mais de 7 dias.

No celular o quadro não aceita arrastar: abra o cartão e troque a coluna no campo **Coluna**.

## Publicação e merge
- Todo PR para a `main` é mesclado automaticamente quando os testes passam; o Vercel publica a `main` em seguida.
- Para segurar um PR: rascunho ou rótulo `segurar`.

## Como o projeto é desenvolvido
- `CLAUDE.md` — regras de trabalho (três leis e ciclo especificação → arquitetura → tarefa → teste → PR)
- `docs/ESPECIFICACAO.md` — problema, objetivo, resultado esperado e critérios de aceite com código
- `docs/ARQUITETURA.md` — estrutura, modelo de dados e registro de decisões
- `docs/BACKLOG.md` — próximas releases fatiadas em tarefas pequenas
- `tests/` — testes automatizados (`npm test`), rodando no GitHub Actions a cada pull request

## Próximas releases

- **R2:** EAP, cronograma Gantt, valor agregado (VP, VA, CR, IDC, IDP), diagrama de fluxo cumulativo.
- **R3:** autoavaliação de maturidade (OPM3), cadastro de processos com SIPOC e VSM, RACI.
