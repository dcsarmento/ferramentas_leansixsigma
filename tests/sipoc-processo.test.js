// SIPOC do processo (R3-B1, exceção ao gate, ADR 20).
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startServer, launch, openPage } = require('./helpers');

let srv, browser;
before(async () => { srv = await startServer(); browser = await launch(); });
after(async () => { await browser.close(); srv.server.close(); });

const proc = { id: 'prc_d', nome: 'Desmobilização e venda', cliente: 'Comprador', avaliacoes: [], regras: [] };   // sem sipoc: dado antigo
const base = { version: 1, meta: { current: null, lastBackup: null }, projects: {}, processes: { prc_d: proc } };

test('PRC-04 a ficha do processo grava as cinco colunas do SIPOC e restaura após recarregar; processo antigo abre vazio', async () => {
  const { page, context, errors } = await openPage(browser, srv.url + 'gestao.html', { seed: { atlas_db_v1: JSON.stringify(base) } });
  assert.deepEqual(await page.evaluate(() => db.processes.prc_d.sipoc), { s: [], i: [], p: [], o: [], c: [] });
  await page.click('.nav-item[data-page="processos"]');
  await page.click('#processos-body tbody tr');
  await page.fill('#pr-sipoc-s', 'Frota\nLeiloeiro');
  await page.fill('#pr-sipoc-i', 'Veículo desmobilizado\n\n');
  await page.fill('#pr-sipoc-p', 'Vistoria\nAvaliação\nAnúncio\nVenda');
  await page.fill('#pr-sipoc-o', 'Veículo vendido');
  await page.fill('#pr-sipoc-c', 'Comprador');
  await page.click('#modal-save');
  await page.reload();
  const s = await page.evaluate(() => db.processes.prc_d.sipoc);
  assert.deepEqual(s, { s: ['Frota', 'Leiloeiro'], i: ['Veículo desmobilizado'], p: ['Vistoria', 'Avaliação', 'Anúncio', 'Venda'], o: ['Veículo vendido'], c: ['Comprador'] });
  await page.click('.nav-item[data-page="processos"]');
  await page.click('#processos-body tbody tr');
  assert.equal(await page.inputValue('#pr-sipoc-p'), 'Vistoria\nAvaliação\nAnúncio\nVenda');
  assert.deepEqual(errors, []);
  await context.close();
});

test('SIP-01 o DMAIC puxa o SIPOC do processo vinculado só para as colunas vazias', async () => {
  const p2 = { ...proc, sipoc: { s: ['Frota'], i: ['Veículo'], p: ['Vistoria', 'Venda'], o: ['Veículo vendido'], c: ['Comprador'] } };
  const enki = { ...base, processes: { prc_d: p2 }, projects: { prj_m: { id: 'prj_m', nome: 'Melhoria · Desmobilização', abordagem: 'Híbrida', processoId: 'prc_d', dmaicId: '' } } };
  const { page, context, errors } = await openPage(browser, srv.url + 'dmaic.html?enki=prj_m', { seed: { atlas_db_v1: JSON.stringify(enki) } });
  const sp = await page.evaluate(() => projects[currentProject].define.sipoc);
  assert.deepEqual(sp, { s: ['Frota'], i: ['Veículo'], p: ['Vistoria', 'Venda'], o: ['Veículo vendido'], c: ['Comprador'] });
  const r = await page.evaluate(([e]) => mergeFromEnki({ sipoc: { s: ['Meu fornecedor'], i: [], p: [], o: [], c: [] } }, e.projects.prj_m, e.processes), [enki]);
  assert.deepEqual(r.define.sipoc.s, ['Meu fornecedor'], 'coluna já preenchida no DMAIC é mantida');
  assert.deepEqual(r.define.sipoc.p, ['Vistoria', 'Venda']);
  assert.deepEqual(errors, []);
  await context.close();
});

test('SIP-02 a ficha traz do DMAIC as colunas que estão vazias no processo, e só grava ao salvar', async () => {
  const enki = { ...base, projects: { prj_m: { id: 'prj_m', nome: 'Melhoria', abordagem: 'DMAIC', processoId: 'prc_d', dmaicId: 'proj_X' } },
    processes: { prc_d: { ...proc, sipoc: { s: [], i: [], p: [], o: [], c: ['Comprador PF'] } } } };
  const dm = { proj_X: { id: 'proj_X', define: { nome: 'X', sipoc: { s: ['Frota'], i: ['Laudo'], p: ['Leilão'], o: ['Nota fiscal'], c: ['Comprador PJ'] } } } };
  const { page, context, dialogLog, errors } = await openPage(browser, srv.url + 'gestao.html', { seed: { atlas_db_v1: JSON.stringify(enki), dmaic_projects: JSON.stringify(dm) } });
  await page.click('.nav-item[data-page="processos"]');
  await page.click('#processos-body tbody tr');
  await page.click('#btn-sipoc-dmaic');
  assert.match(dialogLog.at(-1), /Trazido do DMAIC/);
  assert.equal(await page.inputValue('#pr-sipoc-s'), 'Frota');
  assert.equal(await page.inputValue('#pr-sipoc-c'), 'Comprador PF', 'coluna já preenchida no processo é mantida');
  assert.deepEqual(await page.evaluate(() => db.processes.prc_d.sipoc.s), [], 'ainda não gravou');
  await page.click('#modal-save');
  assert.deepEqual(await page.evaluate(() => db.processes.prc_d.sipoc), { s: ['Frota'], i: ['Laudo'], p: ['Leilão'], o: ['Nota fiscal'], c: ['Comprador PF'] });
  assert.equal(await page.evaluate(() => localStorage.getItem('dmaic_projects')), JSON.stringify(dm), 'Enki não grava no DMAIC');
  assert.deepEqual(await page.evaluate(() => mergeSipoc({ s: ['a'] }, { s: ['b'], i: ['c'] })), { sipoc: { s: ['a'], i: ['c'], p: [], o: [], c: [] }, cols: ['i'] });
  assert.deepEqual(errors, []);
  await context.close();
});
