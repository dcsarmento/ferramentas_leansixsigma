# Arquitetura — Atlas

## Visão geral
Três páginas estáticas no GitHub Pages, mesma origem (`dcsarmento.github.io`), logo o mesmo `localStorage`:

| Página | Lê | Grava |
| --- | --- | --- |
| `index.html` (CEP) | — | — |
| `dmaic.html` | `dmaic_projects`, `dmaic_last` | `dmaic_projects`, `dmaic_last` |
| `gestao.html` (Atlas) | `atlas_db_v1`, `dmaic_projects` | `atlas_db_v1`, `dmaic_last` (só para abrir um projeto no DMAIC) |

O Atlas **nunca grava** em `dmaic_projects`, exceto quando o usuário restaura um backup e confirma.

## Organização do `gestao.html`
Arquivo único, dividido em blocos comentados, nesta ordem:
1. **Camada de dados** — objeto `Store` (`load`, `save`, `dmaic`). Único ponto que toca o `localStorage`. Migrar para Firebase = reescrever só o `Store`.
2. **Utilitários** — `esc` (escape de HTML, obrigatório em toda saída de texto do usuário), datas, formatação.
3. **Domínio** — listas de valores, `makeProject`, `normalize`, regras puras (`moveItem`, `riskScore`, `riskLevel`, `quadrant`, `flowMetrics`, `progress`).
4. **Navegação e modal** — `showPage`, `RENDER`, `openModal`.
5. **Uma seção por tela** — `render<Tela>` + diálogos da tela.
6. **Backup** — exportar, restaurar, aviso.

Regra: lógica de negócio fica em funções puras do bloco Domínio, para ser testável sem clicar na tela.

## Modelo de dados (`atlas_db_v1`)
```
{
  version: 1,
  meta: { current, lastBackup, updatedAt },
  projects: {
    <id>: {
      id, nome, abordagem, status, saude, prioridade, gerente, patrocinador,
      inicio, fim, alinhamento, dmaicId, createdAt, updatedAt,
      tap:    { justificativa, objetivo, dentro, fora, premissas, restricoes, orcamento, criterios },
      marcos: [ { id, nome, data, feito } ],
      cols:   [ { id, nome, tipo: backlog|todo|doing|done, wip } ],
      items:  [ { id, titulo, desc, tipo, classe, pontos, resp, prazo, col, sprint, ordem,
                  criado, commit, inicio, fim, hist: [ { col, ts } ] } ],
      sprints:[ { id, nome, meta, status: planejada|ativa|concluída, inicio, fim,
                  compromisso, velocidade, retro: { bom, melhorar, acoes } } ],
      riscos: [ { id, desc, categoria, prob, imp, resposta, acao, dono, status } ],
      partes: [ { id, nome, papel, poder, interesse, atitude, obs } ],
      licoes: [ { id, data, tipo, categoria, oque, rec } ]
    }
  }
}
```
Campo novo exige: valor padrão em `makeProject`, tratamento em `normalize` (backups antigos) e teste DAD-03 continuando verde.

## Registro de decisões (ADR)
| # | Data | Decisão | Motivo | Alternativa rejeitada |
| --- | --- | --- | --- | --- |
| 1 | 18/11/2026 | Página estática + localStorage + backup JSON | Uso pessoal, custo zero, sem configuração | Firebase (adiado para R4); backend Node como o Pulsar (manutenção alta) |
| 2 | 18/11/2026 | PMBOK 8ª ed. como referência | Padrão vigente desde nov/2025 | 49 processos da 6ª ed. |
| 3 | 18/11/2026 | OPM3 só como autoavaliação na R3 | Modelo de maturidade organizacional, pouco útil para uso individual | Módulo central de maturidade |
| 4 | 18/11/2026 | Kanban e Scrum compartilham os mesmos itens | Uma fonte de verdade; sprint é um filtro do quadro | Backlogs separados |
| 5 | 18/11/2026 | Testes com `node:test` + Playwright, rodando no GitHub Actions | Sem framework extra; testa a página real no navegador | Extrair a lógica para JS separado só para teste unitário (mudança de estrutura sem ganho agora) |
| 6 | 18/11/2026 | Entrega por branch + pull request, merge só com testes verdes | O Pages publica a `main`; o PR é o portão de qualidade | Commit direto na `main` |
