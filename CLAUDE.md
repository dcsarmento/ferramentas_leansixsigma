# Regras de trabalho neste repositório

Valem para qualquer sessão de IA (Claude, Claude Code ou outra) que altere este repositório.
Dono e decisor final: Diego Sarmento. Mesmas práticas do projeto BI Frota.

## As três leis
1. **Cirurgia.** Mudar só o que está no escopo da tarefa. Nenhum arquivo, função ou estilo fora dele. Se houver risco de efeito colateral, avisar **antes** de alterar.
2. **Investigar antes de codar.** Ler os arquivos envolvidos antes de propor mudança. Se a ideia conflitar com boa governança ou boas práticas, alertar de imediato e esperar decisão.
3. **Avaliação crítica proativa.** Antes de implementar, avaliar se a ideia está alinhada às boas práticas (PMBOK 8, Kanban, Scrum, Lean Six Sigma). Havendo risco, inconsistência ou alternativa melhor, apresentar o argumento com fundamento, mesmo sem ser pedido.

## O ciclo de cada mudança
1. **Especificação.** Problema, objetivo e resultado esperado da tarefa, com critério de aceite com código (ex.: `EAP-02`) em `docs/ESPECIFICACAO.md` ou na tarefa do `docs/BACKLOG.md`.
2. **Planejamento e arquitetura.** Dizer quais arquivos e funções mudam e por quê, conferindo `docs/ARQUITETURA.md`. Mudança no modelo de dados atualiza o modelo documentado. Decisão estrutural vira uma linha no registro de decisões (ADR).
3. **Implementação incremental.** Uma tarefa do backlog por vez. Nada de "já que estou aqui".
4. **Testes automatizados.** Todo critério novo ganha teste em `tests/`, com o código do critério no nome. A suíte inteira precisa ficar verde (`npm test`) antes do commit.
5. **Entrega.** Commit com mensagem descritiva (`feat:`, `fix:`, `test:`, `docs:`, `refactor:`) e push numa branch, com pull request para a `main`. Nunca commit direto na `main`: o Vercel publica a `main` em produção (ADR 10). Cada PR ganha uma prévia no Vercel. Com a suíte **Testes** verde, o PR para a `main` é mesclado automaticamente (ADR 11); para revisar antes, abra como rascunho ou ponha o rótulo `segurar`. Este passo nunca é omitido.

## Padrões técnicos
- Páginas HTML autocontidas, cores só em tokens CSS. O Enki usa o tema claro do ADR 13 (DM Sans; DM Mono só em números); `index.html` e `dmaic.html` seguem escuros até a fatia LAY-04 do backlog.
- No Enki, todo acesso ao `localStorage` passa pelo objeto `Store`.
- Todo texto do usuário exibido na tela passa por `esc()`.
- Regras de negócio em funções puras no bloco Domínio, para poderem ser testadas.
- Campo novo no modelo: padrão em `makeProject` + tratamento em `normalize` + teste DAD-03 verde.
- O Enki não grava em `dmaic_projects` (só em restauração de backup confirmada).
- Gate de release: R2 só começa após 30 dias de uso real da R1 com 3 projetos. Pedido de R2 antes disso deve ser questionado.

## Rodar os testes
```
npm install
npx playwright install chromium
npm test
```
O GitHub Actions (`.github/workflows/testes.yml`) roda a mesma suíte em todo pull request. PR com teste vermelho não recebe merge.
