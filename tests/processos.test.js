// Testes da seção Processos do Atlas (R3-A1).
// Cada teste corresponde a um critério de aceite de docs/ESPECIFICACAO.md, seção 6.
const { test, before, after, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { startServer, launch, openPage } = require('./helpers');

let srv, browser, URL;
before(async () => { srv = await startServer(); browser = await launch(); URL = srv.url + 'gestao.html'; });
after(async () => { await browser.close(); srv.server.close(); });

const abrirProcessos = page => page.click('.nav-item[data-page="processos"]');

describe('Processos', () => {
  test('[PRC-01] criar processo exige nome, persiste após recarregar, edita e exclui com confirmação', async () => {
    const { page, context, dialogLog, errors } = await openPage(browser, URL);
    await abrirProcessos(page);
    assert.ok(await page.isVisible('text=Nenhum processo cadastrado'));
    await page.click('.project-bar >> text=+ Novo processo');
    await page.click('#modal-save');
    assert.match(dialogLog.at(-1), /Informe o nome do processo/);
    await page.fill('#pr-nome', 'Preparação de veículos');
    await page.fill('#pr-macro', 'Operações');
    await page.fill('#pr-dono', 'Ana');
    await page.selectOption('#pr-crit', 'Alta');
    await page.click('#modal-save');
    await page.reload();
    await abrirProcessos(page);
    const salvo = await page.evaluate(() => Object.values(db.processes).map(p => `${p.nome}|${p.macroprocesso}|${p.dono}|${p.criticidade}|${p.status}`));
    assert.deepEqual(salvo, ['Preparação de veículos|Operações|Ana|Alta|Ativo']);
    assert.equal(await page.locator('#processos-body tbody tr').count(), 1);

    await page.click('#processos-body tbody tr');
    await page.fill('#pr-nome', 'Preparação de veículos para locação');
    await page.click('#modal-save');
    assert.deepEqual(await page.evaluate(() => Object.values(db.processes).map(p => p.nome)), ['Preparação de veículos para locação']);

    page._dialogMode = 'dismiss';
    await page.click('#processos-body tbody tr');
    await page.click('#modal-del');
    assert.equal(await page.evaluate(() => Object.keys(db.processes).length), 1, 'recusar a confirmação não exclui');
    page._dialogMode = 'accept';
    await page.click('#modal-del');
    assert.equal(await page.evaluate(() => Object.keys(db.processes).length), 0);
    assert.ok(await page.isVisible('text=Nenhum processo cadastrado'));
    assert.deepEqual(errors, []);
    await context.close();
  });

  test('[PRC-02] menu tem a seção Processos e a barra troca os controles de projeto', async () => {
    const { page, context, errors } = await openPage(browser, URL);
    const secoes = await page.$$eval('#sidebar .sidebar-section-label', els => els.map(e => e.textContent.trim()));
    assert.deepEqual(secoes, ['Portfólio', 'Projetos', 'Processos', 'Melhoria contínua']);
    assert.ok(await page.isVisible('#project-select'));
    assert.ok(!(await page.isVisible('#bar-processo')));
    await abrirProcessos(page);
    assert.ok(!(await page.isVisible('#project-select')));
    assert.ok(!(await page.isVisible('.project-bar >> text=+ Novo projeto')));
    assert.ok(!(await page.isVisible('.project-bar >> button.danger')));
    assert.ok(await page.isVisible('.project-bar >> text=+ Novo processo'));
    assert.ok(await page.isVisible('.project-bar >> text=⬇ Backup JSON'), 'backup sempre visível');
    await page.click('.nav-item[data-page="painel"]');
    assert.ok(await page.isVisible('#project-select'));
    assert.ok(!(await page.isVisible('#bar-processo')));
    assert.deepEqual(errors, []);
    await context.close();
  });

  test('[DAD-04] backup exporta e restaura processos; dados antigos sem processes abrem com {}', async () => {
    const antigo = JSON.stringify({ version: 1, projects: { p1: { id: 'p1', nome: 'Antigo' } }, meta: { current: 'p1' } });
    const { page, context, errors } = await openPage(browser, URL, { seed: { atlas_db_v1: antigo } });
    assert.deepEqual(await page.evaluate(() => db.processes), {});
    await abrirProcessos(page);
    assert.equal(await page.evaluate(() => cur().cols.length), 5, 'DAD-03 segue valendo');

    await page.evaluate(() => { const p = makeProcess({ nome: 'Faturamento' }); db.processes[p.id] = p; persist(); renderProcessos(); });
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('text=⬇ Backup JSON')]);
    const file = path.join(os.tmpdir(), `atlas-prc-${Date.now()}.json`);
    await dl.saveAs(file);
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    assert.deepEqual(Object.values(data.atlas.processes).map(p => p.nome), ['Faturamento']);

    await page.evaluate(() => { db.processes = {}; persist(); });
    await page.setInputFiles('input[type=file]', file);
    await page.waitForFunction(() => Object.keys(db.processes).length === 1);

    const semProc = path.join(os.tmpdir(), `atlas-old-${Date.now()}.json`);
    fs.writeFileSync(semProc, JSON.stringify({ app: 'atlas', version: 1, exportedAt: new Date().toISOString(), atlas: JSON.parse(antigo) }));
    await page.setInputFiles('input[type=file]', semProc);
    await page.waitForFunction(() => db.processes && Object.keys(db.processes).length === 0);
    await page.evaluate(() => showPage('processos'));
    assert.ok(await page.isVisible('text=Nenhum processo cadastrado'));
    assert.deepEqual(errors, []);
    fs.unlinkSync(file); fs.unlinkSync(semProc);
    await context.close();
  });

  test('[SEG-01] textos de processo são escapados (sem execução de HTML)', async () => {
    const { page, context } = await openPage(browser, URL);
    await page.evaluate(() => {
      const p = makeProcess({ id: "x');window.__xss=2;('", nome: '<img src=x onerror="window.__xss=1">', dono: '<b>d</b>', indicador: '<i>i</i>' });
      db.processes[p.id] = p; persist(); showPage('processos');
    });
    await page.click('#processos-body tbody tr');
    assert.equal(await page.evaluate(() => window.__xss), undefined);
    assert.equal(await page.locator('#processos-body img, #processos-body b, #processos-body i').count(), 0);
    assert.equal(await page.inputValue('#pr-nome'), '<img src=x onerror="window.__xss=1">');
    await page.evaluate(() => {
      const p = Object.values(db.processes)[0];
      p.avaliacoes.push({ id: "q');window.__xss=3;('", data: '2026-11-19', avaliador: '<u>a</u>', niveis: { desenho: 3, dono: 1, executores: 1, indicadores: 1, controle: 1 }, evidencias: { desenho: '<img src=y onerror="window.__xss=4">' } });
      persist(); closeModal(); renderProcessos();
    });
    await page.click('#processos-body tbody tr');
    assert.equal(await page.evaluate(() => window.__xss), undefined);
    assert.equal(await page.locator('#mat-box img, #mat-box u').count(), 0);
    await context.close();
  });
});

describe('Maturidade', () => {
  // Cria um processo com avaliações [{data, n: [desenho, dono, executores, indicadores, controle]}] e devolve o id.
  const processoAvaliado = (page, avs) => page.evaluate(avs => {
    const ks = MAT_DIMS.map(m => m.k);
    const p = makeProcess({ nome: 'Preparação', avaliacoes: avs.map((a, i) => ({ id: 'a' + i, data: a.data, avaliador: 'Ana',
      niveis: Object.fromEntries(ks.map((k, j) => [k, a.n[j]])), evidencias: Object.fromEntries(ks.map(k => [k, 'POP-1'])) })) });
    db.processes[p.id] = p; persist(); showPage('processos'); return p.id;
  }, avs);

  test('[MAT-01] nível geral = menor nível das 5 dimensões da avaliação mais recente; sem avaliação = não avaliado', async () => {
    const { page, context, errors } = await openPage(browser, URL);
    await page.evaluate(() => { const p = makeProcess({ nome: 'Sem avaliação' }); db.processes[p.id] = p; persist(); showPage('processos'); });
    assert.match(await page.textContent('#processos-body tbody'), /não avaliado/);
    assert.equal(await page.evaluate(() => maturity(Object.values(db.processes)[0])), null);
    const id = await processoAvaliado(page, [{ data: '2026-11-10', n: [3, 4, 2, 5, 3] }, { data: '2026-01-01', n: [5, 5, 5, 5, 5] }]);
    const m = await page.evaluate(id => { const r = maturity(db.processes[id]); return { nivel: r.nivel, nome: r.nome, fracas: r.fracas }; }, id);
    assert.deepEqual(m, { nivel: 2, nome: 'Repetível', fracas: ['executores'] }, 'usa a data mais recente, não a última cadastrada');
    assert.match(await page.textContent(`#processos-body tr[data-proc="${id}"]`), /2 · Repetível/);
    await page.click(`#processos-body tr[data-proc="${id}"]`);
    assert.match(await page.textContent('#mat-box'), /nível 2 · Repetível/);
    assert.match(await page.textContent('#mat-box'), /elo fraco/);
    assert.deepEqual(errors, []);
    await context.close();
  });

  test('[MAT-02] dimensão acima de 2 sem evidência é recusada com mensagem', async () => {
    const { page, context, dialogLog } = await openPage(browser, URL);
    await page.evaluate(() => { const p = makeProcess({ nome: 'Faturamento' }); db.processes[p.id] = p; persist(); showPage('processos'); });
    await page.click('#processos-body >> text=Avaliar');
    await page.selectOption('#av-n-desenho', '3');
    await page.click('#modal-save');
    assert.match(dialogLog.at(-1), /Desenho e documentação: nível 3 exige evidência/);
    assert.equal(await page.evaluate(() => Object.values(db.processes)[0].avaliacoes.length), 0);
    assert.ok(await page.isVisible('#modal-bg.show'), 'o formulário continua aberto');
    await page.fill('#av-e-desenho', 'POP-012 rev. 3');
    await page.click('#modal-save');
    const r = await page.evaluate(() => { const p = Object.values(db.processes)[0]; return { n: p.avaliacoes.length, nivel: maturity(p).nivel, ev: p.avaliacoes[0].evidencias.desenho }; });
    assert.deepEqual(r, { n: 1, nivel: 1, ev: 'POP-012 rev. 3' });
    assert.deepEqual(await page.evaluate(() => validateAssessment({ data: '2026-11-19', niveis: { desenho: 2, dono: 2, executores: 1, indicadores: 1, controle: 1 }, evidencias: {} })), [], 'nível ≤ 2 dispensa evidência');
    await context.close();
  });

  test('[MAT-03] nova avaliação entra no histórico sem apagar as anteriores; tendência compara com a penúltima', async () => {
    const { page, context } = await openPage(browser, URL);
    const id = await processoAvaliado(page, [{ data: '2026-10-01', n: [2, 2, 2, 2, 2] }]);
    assert.equal(await page.evaluate(id => maturityTrend(db.processes[id]), id), null, 'com uma avaliação não há tendência');
    await page.click(`#processos-body tr[data-proc="${id}"] >> text=Avaliar`);
    assert.equal(await page.inputValue('#av-n-dono'), '2', 'a avaliação anterior vem preenchida');
    for (const k of ['desenho', 'dono', 'executores', 'indicadores', 'controle']) await page.selectOption('#av-n-' + k, '3');
    await page.click('#modal-save');
    assert.equal(await page.evaluate(id => db.processes[id].avaliacoes.length, id), 2);
    assert.equal(await page.evaluate(id => maturityTrend(db.processes[id]), id), '↑');
    assert.match(await page.textContent(`#processos-body tr[data-proc="${id}"]`), /3 · Padronizado\s*↑/);
    await page.evaluate(id => { db.processes[id].avaliacoes.push({ id: 'z', data: '2099-01-01', niveis: { desenho: 1, dono: 3, executores: 3, indicadores: 3, controle: 3 }, evidencias: {} }); }, id);
    assert.equal(await page.evaluate(id => maturityTrend(db.processes[id]), id), '↓');
    await page.reload();
    assert.equal(await page.evaluate(id => db.processes[id].avaliacoes.length, id), 2, 'histórico persiste após recarregar');
    await page.evaluate(() => showPage('processos'));
    await page.click(`#processos-body tr[data-proc="${id}"]`);
    await page.click('#mat-box .mat-hist tbody tr:last-child button.danger');
    const restam = await page.evaluate(id => db.processes[id].avaliacoes.map(a => a.data), id);
    assert.equal(restam.length, 1, 'excluir apaga só a avaliação escolhida');
    assert.equal(await page.locator('#mat-box .mat-hist tbody tr').count(), 1);
    await context.close();
  });
});
