// Integração DMAIC ← Enki (INT): botão "Puxar do Enki" no dmaic.html.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startServer, launch, openPage } = require('./helpers');

let srv, browser;
before(async () => { srv = await startServer(); browser = await launch(); });
after(async () => { await browser.close(); srv.server.close(); });

const enki = {
  version: 1, meta: { current: 'prj_1', lastBackup: null },
  projects: {
    prj_1: {
      id: 'prj_1', nome: 'Reduzir retrabalho na frota', abordagem: 'DMAIC', patrocinador: 'Diretoria', gerente: 'Sarmento',
      inicio: '2026-11-01', fim: '2027-03-31', dmaicId: 'proj_A',
      tap: { justificativa: 'Retrabalho alto', objetivo: 'Cair 30%', dentro: 'Oficina', fora: 'Compras', premissas: 'Dados do ERP', restricoes: 'Sem verba nova', orcamento: '', criterios: '' },
      riscos: [{ id: 'r1', desc: 'Falta de dados' }, { id: 'r2', desc: 'Resistência da equipe' }],
      marcos: [], cols: [], items: [], sprints: [], partes: [], licoes: []
    }
  },
  processes: { prc_1: { id: 'prc_1', nome: 'Manutenção corretiva', cliente: 'Operação de frota', avaliacoes: [], regras: [] } }
};
const dmaic = {
  proj_A: { id: 'proj_A', define: { nome: 'Projeto A', processo: 'manutenção CORRETIVA', objetivos: 'Meu texto', sipoc: { s: [], i: [], p: [], o: [], c: [] } },
            measure: {}, analyse: {}, improve: {}, control: {} },
  proj_B: { id: 'proj_B', define: { nome: 'Projeto B', sipoc: { s: [], i: [], p: [], o: [], c: [] } }, measure: {}, analyse: {}, improve: {}, control: {} }
};
const seed = { atlas_db_v1: JSON.stringify(enki), dmaic_projects: JSON.stringify(dmaic), dmaic_last: 'proj_A' };

test('INT-01 mergeFromEnki preenche só os vazios, junta os riscos e casa o processo pelo nome', async () => {
  const { page, context } = await openPage(browser, srv.url + 'dmaic.html');
  const r = await page.evaluate(([e, d]) => mergeFromEnki(d.proj_A.define, e.projects.prj_1, e.processes), [enki, dmaic]);
  assert.equal(r.define.nome, 'Projeto A', 'nome já preenchido é mantido');
  assert.equal(r.define.objetivos, 'Meu texto', 'texto do DMAIC não é sobrescrito');
  assert.equal(r.define.contexto, 'Retrabalho alto');
  assert.equal(r.define.lider, 'Sarmento');
  assert.equal(r.define.escopoOut, 'Compras');
  assert.equal(r.define.pressupostos, 'Dados do ERP');
  assert.equal(r.define.riscos, 'Falta de dados\nResistência da equipe');
  assert.equal(r.define.inicio, '2026-11-01');
  assert.deepEqual(r.define.sipoc.c, ['Operação de frota']);
  assert.equal(r.processo, 'Manutenção corretiva');
  assert.ok(!r.filled.includes('nome') && !r.filled.includes('objetivos'));
  const again = await page.evaluate(([e, d]) => mergeFromEnki(d, e.projects.prj_1, e.processes).filled, [enki, r.define]);
  assert.deepEqual(again, [], 'segunda vez não muda nada');
  await context.close();
});

test('INT-02 botão "Puxar do Enki" preenche a fase Define e grava no projeto DMAIC', async () => {
  const { page, context, errors, dialogLog } = await openPage(browser, srv.url + 'dmaic.html', { seed });
  await page.click('#nav-define');
  await page.click('#btn-puxar-enki');
  assert.equal(await page.inputValue('#d-contexto'), 'Retrabalho alto');
  assert.equal(await page.inputValue('#d-objetivos'), 'Meu texto');
  assert.equal(await page.inputValue('#d-patrocinador'), 'Diretoria');
  assert.equal(await page.inputValue('#sipoc-c input'), 'Operação de frota');
  assert.match(dialogLog.at(-1), /Puxado do Enki/);
  await page.reload();
  await page.click('#nav-define');
  assert.equal(await page.inputValue('#d-escopo-in'), 'Oficina');
  assert.deepEqual(errors, []);
  await context.close();
});

test('INT-03 projeto sem vínculo avisa; o DMAIC nunca grava em atlas_db_v1; sem projeto o botão fica bloqueado', async () => {
  const { page, context, dialogLog } = await openPage(browser, srv.url + 'dmaic.html', { seed: { ...seed, dmaic_last: 'proj_B' } });
  await page.click('#nav-define');
  await page.click('#btn-puxar-enki');
  assert.match(dialogLog.at(-1), /não está vinculado/);
  assert.equal(await page.inputValue('#d-contexto'), '');
  await page.selectOption('#project-select', 'proj_A');
  await page.click('#btn-puxar-enki');
  assert.equal(await page.evaluate(() => localStorage.getItem('atlas_db_v1')), JSON.stringify(enki));
  await page.evaluate(() => deleteProject());
  assert.ok(await page.locator('#btn-puxar-enki').isDisabled());
  await context.close();
});

// R3-A4 · ponte processo → projeto DMAIC
const enkiProc = {
  version: 1, meta: { current: null, lastBackup: null },
  projects: {},
  processes: { prc_9: { id: 'prc_9', nome: 'Preparação de veículos', dono: 'Ana', cliente: 'Locação', objetivo: 'Veículo pronto em 4 h', indicador: 'Lead time (h)', meta: '≤ 4', avaliacoes: [], regras: [] } }
};

test('PRC-03 processo abre um projeto DMAIC no portfólio, vinculado por processoId, e a TAP mostra o processo', async () => {
  const { page, context, errors } = await openPage(browser, srv.url + 'gestao.html', { seed: { atlas_db_v1: JSON.stringify(enkiProc) } });
  await page.click('.nav-item[data-page="processos"]');
  await page.click('#processos-body tbody tr');
  assert.match(await page.innerText('#melhoria-box'), /Nenhum projeto de melhoria/);
  await page.click('#btn-nova-melhoria');
  const p = await page.evaluate(() => cur());
  assert.equal(p.processoId, 'prc_9');
  assert.equal(p.abordagem, 'DMAIC');
  assert.equal(p.nome, 'Melhoria · Preparação de veículos');
  assert.match(p.tap.justificativa, /Veículo pronto em 4 h/);
  assert.equal(await page.inputValue('#tap-processo'), 'prc_9');
  assert.ok(await page.isVisible('#btn-criar-dmaic'));
  await page.reload();
  await page.click('.nav-item[data-page="processos"]');
  await page.click('#processos-body tbody tr');
  assert.match(await page.innerText('#melhoria-box'), /Melhoria · Preparação de veículos/);
  assert.equal(await page.evaluate(() => Object.values(db.projects)[0].cols.length), 5, 'DAD-03 segue valendo');
  assert.deepEqual(errors, []);
  await context.close();
});

test('INT-04 "Criar no DMAIC" cria o projeto DMAIC uma única vez, já preenchido com TAP e processo vinculado', async () => {
  const proj = { id: 'prj_7', nome: 'Melhoria · Preparação de veículos', abordagem: 'DMAIC', processoId: 'prc_9', patrocinador: 'Diretoria', dmaicId: '',
    tap: { justificativa: 'Atrasos na entrega', objetivo: 'Lead time ≤ 4 h' } };
  const seedDb = { ...enkiProc, meta: { current: 'prj_7', lastBackup: null }, projects: { prj_7: proj } };
  const { page, context, errors } = await openPage(browser, srv.url + 'dmaic.html?enki=prj_7', { seed: { atlas_db_v1: JSON.stringify(seedDb) } });
  const dm = await page.evaluate(() => Object.values(projects));
  assert.equal(dm.length, 1);
  assert.equal(dm[0].define.enkiId, 'prj_7');
  assert.equal(dm[0].define.processo, 'Preparação de veículos', 'processo vem do processoId, não do nome');
  assert.deepEqual(dm[0].define.sipoc.c, ['Locação']);
  assert.equal(await page.inputValue('#d-contexto'), 'Atrasos na entrega');
  assert.ok(await page.locator('#page-define').isVisible());
  await page.goto(srv.url + 'dmaic.html?enki=prj_7');
  assert.equal(await page.evaluate(() => Object.keys(projects).length), 1, 'abrir de novo não duplica');
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('atlas_db_v1')).projects.prj_7.dmaicId), '', 'DMAIC não grava no Enki');
  assert.deepEqual(errors, []);
  await context.close();
});

test('INT-05 o Enki completa o dmaicId sozinho a partir do enkiId gravado pelo DMAIC (ao abrir e com a aba aberta)', async () => {
  const proj = { id: 'prj_7', nome: 'Melhoria X', abordagem: 'DMAIC', processoId: 'prc_9', dmaicId: '' };
  const seedDb = { ...enkiProc, meta: { current: 'prj_7', lastBackup: null }, projects: { prj_7: proj } };
  const { page, context, errors } = await openPage(browser, srv.url + 'gestao.html', { seed: { atlas_db_v1: JSON.stringify(seedDb) } });
  assert.equal(await page.evaluate(() => cur().dmaicId), '');
  const dmPage = await context.newPage();
  await dmPage.goto(srv.url + 'dmaic.html?enki=prj_7');
  const dmId = await dmPage.evaluate(() => Object.keys(projects)[0]);
  await page.waitForFunction(id => cur().dmaicId === id, dmId);
  await page.reload();
  assert.equal(await page.evaluate(() => cur().dmaicId), dmId, 'vínculo gravado no Enki');
  const n = await page.evaluate(() => autoLinkDmaic({ projects: { a: { id: 'a', dmaicId: '' }, b: { id: 'b', dmaicId: 'x' } } }, { x: { id: 'x', define: { enkiId: 'a' } } }));
  assert.equal(n, 0, 'projeto DMAIC já vinculado a outro não é reaproveitado');
  assert.deepEqual(errors, []);
  await context.close();
});

test('INT-06 projeto de qualquer abordagem pode ter frente DMAIC sem mudar o progresso nem os demais dados', async () => {
  const proj = { id: 'prj_h', nome: 'Projeto híbrido', abordagem: 'Híbrida', dmaicId: '',
    items: [{ id: 'i1', titulo: 'Feito', col: 'c_done' }, { id: 'i2', titulo: 'Aberto', col: 'c_backlog' }] };
  const seedDb = { ...enkiProc, meta: { current: 'prj_h', lastBackup: null }, projects: { prj_h: proj } };
  const { page, context, errors } = await openPage(browser, srv.url + 'gestao.html', { seed: { atlas_db_v1: JSON.stringify(seedDb) } });
  await page.click('.nav-item[data-page="tap"]');
  assert.ok(await page.isVisible('#btn-criar-dmaic'), 'Criar no DMAIC aparece em projeto híbrido');
  assert.match(await page.innerText('#tap-dmaic-hint'), /itens do Kanban/);
  const antes = await page.evaluate(() => progress(cur()));
  const dmPage = await context.newPage();
  await dmPage.goto(srv.url + 'dmaic.html?enki=prj_h');
  const dmId = await dmPage.evaluate(() => Object.keys(projects)[0]);
  await page.waitForFunction(id => cur().dmaicId === id, dmId);
  const depois = await page.evaluate(() => ({ prog: progress(cur()), ab: cur().abordagem, itens: cur().items.length }));
  assert.deepEqual(depois, { prog: antes, ab: 'Híbrida', itens: 2 }, 'abordagem, itens e progresso intactos');
  assert.deepEqual(errors, []);
  await context.close();
});
