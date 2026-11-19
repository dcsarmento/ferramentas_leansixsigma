// Testes de regressão do Enki (gestao.html).
// Cada teste corresponde a um critério de aceite de docs/ESPECIFICACAO.md (código entre colchetes).
const { test, before, after, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { startServer, launch, openPage, ago } = require('./helpers');

let srv, browser, URL;
before(async () => { srv = await startServer(); browser = await launch(); URL = srv.url + 'gestao.html'; });
after(async () => { await browser.close(); srv.server.close(); });

// Cria um projeto via API interna da página e devolve o id.
const novoProjeto = (page, extra = {}) => page.evaluate(e => {
  const p = makeProject(Object.assign({ nome: 'Projeto teste' }, e));
  db.projects[p.id] = p; db.meta.current = p.id; persist(); rerender(); return p.id;
}, extra);

describe('Portfólio', () => {
  test('[POR-01] portfólio vazio oferece criar projeto e carregar exemplo', async () => {
    const { page, context, errors } = await openPage(browser, URL);
    assert.ok(await page.isVisible('text=Portfólio vazio'));
    assert.equal(await page.locator('#page-painel >> text=Carregar exemplo').count(), 1);
    assert.deepEqual(errors, []);
    await context.close();
  });

  test('[POR-02] carregar exemplo seleciona o projeto e preenche o painel', async () => {
    const { page, context, errors } = await openPage(browser, URL);
    await page.click('#page-painel >> text=Carregar exemplo');
    const sel = await page.$eval('#project-select', s => s.options[s.selectedIndex].text);
    assert.match(sel, /Projeto Enki/);
    assert.equal(await page.locator('#painel-body tbody tr').count(), 1);
    assert.match(await page.textContent('#painel-body .kpis'), /Riscos altos abertos\s*2/);
    assert.deepEqual(errors, []);
    await context.close();
  });

  test('[POR-03] criar projeto pelo formulário exige nome e persiste após recarregar', async () => {
    const { page, context, dialogLog } = await openPage(browser, URL);
    await page.click('.project-bar >> text=+ Novo projeto');
    await page.click('#modal-save');
    assert.match(dialogLog.at(-1), /Informe o nome/);
    await page.fill('#np-nome', 'Reduzir lead time de preparação');
    await page.selectOption('#np-abord', 'Kanban');
    await page.click('#modal-save');
    await page.reload();
    const nomes = await page.evaluate(() => Object.values(db.projects).map(p => `${p.nome}|${p.abordagem}`));
    assert.deepEqual(nomes, ['Reduzir lead time de preparação|Kanban']);
    await context.close();
  });

  test('[POR-04] prazo vencido conta apenas projetos ativos', async () => {
    const { page, context } = await openPage(browser, URL);
    await novoProjeto(page, { nome: 'Atrasado', status: 'Em execução', fim: '2020-01-01' });
    await novoProjeto(page, { nome: 'Concluído antigo', status: 'Concluído', fim: '2020-01-01' });
    await page.evaluate(() => showPage('painel'));
    assert.match(await page.textContent('#painel-body .kpis'), /Prazo vencido\s*1/);
    await context.close();
  });
});

describe('Kanban', () => {
  test('[KAN-01] mover item registra compromisso, início e entrega; sair de Concluído limpa a entrega', async () => {
    const { page, context } = await openPage(browser, URL);
    await novoProjeto(page);
    const r = await page.evaluate(() => {
      const p = cur();
      const it = { id: 'x', titulo: 'T', col: 'c_backlog', pontos: 1, hist: [], criado: nowISO() };
      p.items.push(it);
      const s = [];
      moveItem(p, it, 'c_todo'); s.push([!!it.commit, !!it.inicio, !!it.fim]);
      moveItem(p, it, 'c_doing'); s.push([!!it.commit, !!it.inicio, !!it.fim]);
      moveItem(p, it, 'c_done'); s.push([!!it.commit, !!it.inicio, !!it.fim]);
      moveItem(p, it, 'c_review'); s.push([!!it.commit, !!it.inicio, !!it.fim]);
      return { s, hist: it.hist.length };
    });
    assert.deepEqual(r.s, [[true, false, false], [true, true, false], [true, true, true], [true, true, false]]);
    assert.equal(r.hist, 4);
    await context.close();
  });

  test('[KAN-02] item que vai direto para Concluído recebe compromisso e início', async () => {
    const { page, context } = await openPage(browser, URL);
    await novoProjeto(page);
    const ok = await page.evaluate(() => {
      const p = cur(); const it = { id: 'y', titulo: 'T', col: 'c_backlog', hist: [] }; p.items.push(it);
      moveItem(p, it, 'c_done'); return !!(it.commit && it.inicio && it.fim);
    });
    assert.ok(ok);
    await context.close();
  });

  test('[KAN-03] limite de WIP: recusar a confirmação bloqueia o movimento', async () => {
    const { page, context, dialogLog } = await openPage(browser, URL, { dialogs: 'dismiss' });
    await novoProjeto(page);
    await page.evaluate(() => {
      const p = cur(); colOf(p, 'c_review').wip = 1;
      p.items.push({ id: 'a', titulo: 'A', col: 'c_review', hist: [] }, { id: 'b', titulo: 'Cartão B', col: 'c_todo', hist: [] });
      persist(); showPage('kanban');
    });
    await page.dragAndDrop('.kcard >> text=Cartão B', '.col:nth-child(4) .col-body');
    assert.match(dialogLog.at(-1), /limite de WIP/);
    assert.equal(await page.evaluate(() => cur().items.find(i => i.id === 'b').col), 'c_todo');
    await context.close();
  });

  test('[KAN-04] coluna acima do WIP fica marcada', async () => {
    const { page, context } = await openPage(browser, URL);
    await novoProjeto(page);
    await page.evaluate(() => {
      const p = cur();
      for (let i = 0; i < 4; i++) p.items.push({ id: 'd' + i, titulo: 'D' + i, col: 'c_doing', hist: [], inicio: nowISO() });
      persist(); showPage('kanban');
    });
    assert.equal(await page.locator('.col.over-wip').count(), 1);
    await context.close();
  });

  test('[KAN-05] métricas de fluxo: lead time, cycle time e vazão', async () => {
    const { page, context } = await openPage(browser, URL);
    await novoProjeto(page);
    const m = await page.evaluate(([a10, a6, a2, a12, a8, a4]) => {
      const p = cur();
      p.items.push(
        { id: '1', col: 'c_done', commit: a10, inicio: a6, fim: a2 },   // lead 8, cycle 4
        { id: '2', col: 'c_done', commit: a12, inicio: a8, fim: a4 }    // lead 8, cycle 4
      );
      const r = flowMetrics(p, p.items); return { lead: r.lead, cycle: r.cycle, thr4: r.thr4, wip: r.wip };
    }, [ago(10), ago(6), ago(2), ago(12), ago(8), ago(4)]);
    assert.ok(Math.abs(m.lead - 8) < 0.01, `lead ${m.lead}`);
    assert.ok(Math.abs(m.cycle - 4) < 0.01, `cycle ${m.cycle}`);
    assert.equal(m.thr4, 0.5);
    assert.equal(m.wip, 0);
    await context.close();
  });

  test('[KAN-06] não é possível remover coluna com itens nem ficar sem coluna Concluído', async () => {
    const { page, context, dialogLog } = await openPage(browser, URL);
    await novoProjeto(page);
    await page.evaluate(() => { cur().items.push({ id: 'z', titulo: 'Z', col: 'c_todo', hist: [] }); persist(); showPage('kanban'); });
    await page.click('text=Configurar colunas');
    await page.evaluate(() => window._colDel(1));
    assert.match(dialogLog.at(-1), /Esvazie a coluna/);
    await page.evaluate(() => window._colDel(4));
    await page.click('#modal-save');
    assert.match(dialogLog.at(-1), /Concluído/);
    assert.equal(await page.evaluate(() => cur().cols.length), 5);
    await context.close();
  });
});

describe('Scrum', () => {
  test('[SCR-01] iniciar sprint grava o compromisso; concluir devolve pendentes e registra velocidade', async () => {
    const { page, context } = await openPage(browser, URL);
    await novoProjeto(page);
    const r = await page.evaluate(() => {
      const p = cur();
      p.sprints.push({ id: 's1', nome: 'Sprint 1', status: 'planejada', inicio: today(), fim: today(), retro: {} });
      p.items.push({ id: 'i1', titulo: 'A', pontos: 3, col: 'c_done', sprint: 's1', fim: nowISO() },
                   { id: 'i2', titulo: 'B', pontos: 5, col: 'c_doing', sprint: 's1' });
      persist(); showPage('scrum');
      startSprint('s1');
      const comp = p.sprints[0].compromisso;
      closeSprint('s1');
      return { comp, vel: p.sprints[0].velocidade, st: p.sprints[0].status, i2: p.items.find(i => i.id === 'i2').sprint, i1: p.items.find(i => i.id === 'i1').sprint };
    });
    assert.deepEqual(r, { comp: 8, vel: 3, st: 'concluída', i2: null, i1: 's1' });
    await context.close();
  });

  test('[SCR-02] só pode existir uma sprint ativa', async () => {
    const { page, context, dialogLog } = await openPage(browser, URL);
    await novoProjeto(page);
    await page.evaluate(() => {
      const p = cur();
      p.sprints.push({ id: 's1', nome: 'S1', status: 'ativa', inicio: today(), fim: today() }, { id: 's2', nome: 'S2', status: 'planejada', inicio: today(), fim: today() });
      startSprint('s2');
    });
    assert.match(dialogLog.at(-1), /Já existe uma sprint ativa/);
    assert.equal(await page.evaluate(() => cur().sprints.filter(s => s.status === 'ativa').length), 1);
    await context.close();
  });

  test('[SCR-03] reordenar o backlog troca a prioridade', async () => {
    const { page, context } = await openPage(browser, URL);
    await novoProjeto(page);
    const ordem = await page.evaluate(() => {
      const p = cur();
      p.items.push({ id: 'a', titulo: 'A', col: 'c_backlog', ordem: 0 }, { id: 'b', titulo: 'B', col: 'c_backlog', ordem: 1 });
      reorder('b', -1);
      return backlogItems(p).map(i => i.id).join('');
    });
    assert.equal(ordem, 'ba');
    await context.close();
  });

  test('[SCR-04] burndown da sprint ativa é desenhado', async () => {
    const { page, context, errors } = await openPage(browser, URL);
    await novoProjeto(page);
    await page.evaluate(() => {
      const p = cur();
      p.sprints.push({ id: 's1', nome: 'S1', status: 'ativa', inicio: today(), fim: today(), compromisso: 3, retro: {} });
      p.items.push({ id: 'i', titulo: 'I', pontos: 3, col: 'c_todo', sprint: 's1' });
      persist(); showPage('scrum');
    });
    assert.equal(await page.locator('#scrum-body svg line[stroke-dasharray]').count(), 1);
    assert.deepEqual(errors, []);
    await context.close();
  });
});

describe('Riscos e partes interessadas', () => {
  test('[RSK-01] faixas de pontuação: ≥15 alto, 6–14 médio, <6 baixo', async () => {
    const { page, context } = await openPage(browser, URL);
    const r = await page.evaluate(() => [15, 14, 6, 5].map(s => riskLevel(s)[0]));
    assert.deepEqual(r, ['Alto', 'Médio', 'Médio', 'Baixo']);
    await context.close();
  });

  test('[RSK-02] risco alto sem dono gera alerta; encerrado sai da matriz', async () => {
    const { page, context } = await openPage(browser, URL);
    await novoProjeto(page);
    await page.evaluate(() => {
      cur().riscos.push({ id: 'r1', desc: 'Alto sem dono', prob: 5, imp: 4, status: 'Aberto' }, { id: 'r2', desc: 'Encerrado', prob: 5, imp: 5, status: 'Encerrado' });
      persist(); showPage('riscos');
    });
    assert.ok(await page.isVisible('text=sem dono ou sem ação'));
    assert.equal((await page.textContent('.mcell[title^="P5 × I4"]')).trim(), 'R1');
    assert.equal((await page.textContent('.mcell[title^="P5 × I5"]')).trim(), ''); // encerrado não aparece
    await context.close();
  });

  test('[STK-01] quadrantes poder × interesse e alerta de resistência', async () => {
    const { page, context } = await openPage(browser, URL);
    await novoProjeto(page);
    const q = await page.evaluate(() => [[5, 5], [5, 1], [1, 5], [1, 1], [3, 3]].map(([poder, interesse]) => quadrant({ poder, interesse })));
    assert.deepEqual(q, ['gerenciar', 'satisfeito', 'informado', 'monitorar', 'gerenciar']);
    await page.evaluate(() => { cur().partes.push({ id: 's', nome: 'Diretor X', poder: 5, interesse: 5, atitude: 'Resiste' }); persist(); showPage('partes'); });
    assert.ok(await page.isVisible('text=alto poder, alto interesse e resistência'));
    await context.close();
  });
});

describe('Segurança e dados', () => {
  test('[SEG-01] texto do usuário é escapado (sem execução de HTML)', async () => {
    const { page, context } = await openPage(browser, URL);
    await novoProjeto(page, { nome: '<img src=x onerror="window.__xss=1">' });
    await page.evaluate(() => { cur().items.push({ id: 'h', titulo: '<b onmouseover=alert(1)>x</b>', col: 'c_todo', hist: [] }); persist(); showPage('kanban'); showPage('painel'); });
    assert.equal(await page.evaluate(() => window.__xss), undefined);
    assert.equal(await page.locator('#painel-body img').count(), 0);
    await context.close();
  });

  test('[DAD-01] backup JSON exporta, e restaurar recupera os dados e marca a data do backup', async () => {
    const { page, context } = await openPage(browser, URL);
    await page.click('#page-painel >> text=Carregar exemplo');
    assert.ok(await page.isVisible('#backup-banner'));
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('text=⬇ Backup JSON')]);
    const file = path.join(os.tmpdir(), `atlas-${Date.now()}.json`);
    await dl.saveAs(file);
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    assert.equal(data.app, 'atlas');
    assert.equal(Object.keys(data.atlas.projects).length, 1);
    assert.ok(!(await page.isVisible('#backup-banner')));
    await page.evaluate(() => localStorage.removeItem('atlas_db_v1'));
    await page.reload();
    await page.setInputFiles('input[type=file]', file);
    await page.waitForFunction(() => Object.keys(db.projects).length === 1);
    assert.match(await page.textContent('#backup-chip'), /hoje/);
    fs.unlinkSync(file);
    await context.close();
  });

  test('[DAD-02] arquivo que não é backup do Enki é recusado sem apagar dados', async () => {
    const { page, context, dialogLog } = await openPage(browser, URL);
    await novoProjeto(page);
    const file = path.join(os.tmpdir(), `nao-atlas-${Date.now()}.json`);
    fs.writeFileSync(file, JSON.stringify({ foo: 1 }));
    await page.setInputFiles('input[type=file]', file);
    await page.waitForTimeout(200);
    assert.match(dialogLog.at(-1), /não é um backup do Enki/);
    assert.equal(await page.evaluate(() => Object.keys(db.projects).length), 1);
    fs.unlinkSync(file);
    await context.close();
  });

  test('[DAD-03] projeto de versão antiga sem campos é normalizado ao abrir', async () => {
    const antigo = JSON.stringify({ version: 1, projects: { p1: { id: 'p1', nome: 'Antigo' } }, meta: { current: 'p1' } });
    const { page, context, errors } = await openPage(browser, URL, { seed: { atlas_db_v1: antigo } });
    for (const pg of ['tap', 'kanban', 'scrum', 'riscos', 'partes', 'licoes']) await page.evaluate(x => showPage(x), pg);
    assert.equal(await page.evaluate(() => cur().cols.length), 5);
    assert.deepEqual(errors, []);
    await context.close();
  });
});

describe('Integração Lean Six Sigma', () => {
  const dmaic = JSON.stringify({ proj_1: { id: 'proj_1', define: { nome: 'Reduzir tempo de lavagem', status: 'done', objetivos: 'De 40 para 25 min' }, measure: { status: 'done' }, analyse: { status: 'wip' }, improve: { status: 'todo' }, control: { status: 'todo' } } });

  test('[LSS-01] projetos do dmaic.html aparecem no portfólio e podem ser importados', async () => {
    const { page, context } = await openPage(browser, URL, { seed: { dmaic_projects: dmaic } });
    assert.ok(await page.isVisible('text=Reduzir tempo de lavagem'));
    await page.click('text=+ Portfólio');
    const p = await page.evaluate(() => { const p = cur(); return { ab: p.abordagem, link: p.dmaicId, obj: p.tap.objetivo, prog: progress(p) }; });
    assert.deepEqual(p, { ab: 'DMAIC', link: 'proj_1', obj: 'De 40 para 25 min', prog: 0.4 });
    assert.ok(await page.isVisible('#painel-body >> text=vinculado'));
    await context.close();
  });

  test('[LSS-02] abrir no DMAIC posiciona o projeto certo', async () => {
    const { page, context } = await openPage(browser, URL, { seed: { dmaic_projects: dmaic } });
    const [popup] = await Promise.all([context.waitForEvent('page'), page.click('text=Abrir no DMAIC ↗')]);
    await popup.waitForLoadState();
    assert.equal(await popup.evaluate(() => localStorage.getItem('dmaic_last')), 'proj_1');
    await context.close();
  });

  test('[LSS-03] dmaic_projects corrompido não quebra o Enki', async () => {
    const { page, context, errors } = await openPage(browser, URL, { seed: { dmaic_projects: '{quebrado' } });
    assert.ok(await page.isVisible('text=Portfólio vazio'));
    assert.deepEqual(errors, []);
    await context.close();
  });
});
