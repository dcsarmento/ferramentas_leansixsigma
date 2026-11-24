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
