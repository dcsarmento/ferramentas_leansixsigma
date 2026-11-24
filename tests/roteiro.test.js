// Roteiro do projeto (GUI-01 a GUI-03, ADR 21): guia por abordagem no Enki e "Como começar esta fase" no DMAIC.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startServer, launch, openPage } = require('./helpers');

let srv, browser;
before(async () => { srv = await startServer(); browser = await launch(); });
after(async () => { await browser.close(); srv.server.close(); });

const seedWith = projects => ({ atlas_db_v1: JSON.stringify({ version: 1, meta: { current: Object.keys(projects)[0], lastBackup: null }, projects, processes: {} }) });

test('GUI-01 projectRoadmap segue a ordem da abordagem, aponta o próximo passo e marca etapas puladas', async () => {
  const { page, context } = await openPage(browser, srv.url + 'gestao.html');
  const r = await page.evaluate(() => {
    const scrum = makeProject({ abordagem: 'Scrum', patrocinador: 'Dir', tap: { justificativa: 'x', objetivo: 'y', dentro: '', fora: '' } });
    scrum.riscos.push({ id: 'r', desc: 'risco' });
    const a = projectRoadmap(scrum, {}, {});
    const dm = makeProject({ abordagem: 'DMAIC', dmaicId: 'D1', processoId: 'P1' });
    const b = projectRoadmap(dm, { P1: { sipoc: { s: ['F'], i: [], p: [], o: [], c: [] } } }, { D1: { define: { status: 'done' }, measure: { status: 'wip' } } });
    const kan = projectRoadmap(makeProject({ abordagem: 'Kanban' }), {}, {});
    return { a: a.etapas.map(x => x.k), atualA: a.atual.k, puladasA: a.puladas.map(x => x.k),
      b: b.etapas.map(x => `${x.k}:${x.done ? 1 : 0}`), kan: kan.etapas.map(x => x.k) };
  });
  assert.deepEqual(r.a, ['tap', 'escopo', 'partes', 'riscos', 'backlog', 'sprint', 'licoes']);
  assert.equal(r.atualA, 'escopo');
  assert.deepEqual(r.puladasA, ['escopo', 'partes'], 'riscos feito antes de escopo e partes');
  assert.ok(r.b.includes('processo:1') && r.b.includes('dmaic:1') && r.b.includes('dmaic-define:1') && r.b.includes('dmaic-measure:0'));
  assert.ok(!r.b.some(x => x.startsWith('entregas')), 'DMAIC não pede entregas no Kanban');
  assert.deepEqual(r.kan, ['tap', 'escopo', 'partes', 'riscos', 'quadro', 'wip', 'licoes']);
  await context.close();
});

test('GUI-02 a barra mostra o próximo passo nas telas do projeto, leva até ele e acompanha o preenchimento', async () => {
  const proj = { id: 'prj_g', nome: 'Projeto guia', abordagem: 'Híbrida' };
  const { page, context, errors } = await openPage(browser, srv.url + 'gestao.html', { seed: seedWith({ prj_g: proj }) });
  assert.equal(await page.innerText('#guia-bar'), '', 'sem barra no painel do portfólio');
  await page.click('.nav-item[data-page="kanban"]');
  assert.match(await page.innerText('#guia-atual'), /TAP: justificativa/);
  await page.click('#guia-ir');
  assert.ok(await page.isVisible('#page-tap'));
  await page.evaluate(() => { const p = cur(); p.tap.justificativa = 'Retrabalho 20%'; p.tap.objetivo = 'Cair a 5% até 03/2027'; p.patrocinador = 'Diretoria'; persist(); });
  assert.match(await page.innerText('#guia-atual'), /Escopo/);
  await page.click('#guia-toggle');
  assert.equal(await page.locator('#guia-list li').count(), 7);
  assert.ok(await page.locator('#guia-list li[data-etapa="tap"].done').count());
  assert.match(await page.getAttribute('#guia-list li[data-etapa="riscos"]', 'title'), /probabilidade, impacto/);
  await page.click('#guia-list li[data-etapa="riscos"]');
  assert.ok(await page.isVisible('#page-riscos'));
  assert.deepEqual(errors, []);
  await context.close();
});

test('GUI-03 cada fase do DMAIC abre com "Como começar esta fase" (entrada, primeira ação, ferramentas, saída, critério)', async () => {
  const { page, context, errors } = await openPage(browser, srv.url + 'dmaic.html');
  for (const f of ['define', 'measure', 'analyse', 'improve', 'control']) {
    const t = await page.locator('#guia-' + f).textContent();
    for (const k of ['Como começar esta fase', 'Entrada:', 'Primeira ação:', 'Ferramentas:', 'Saída:', 'Passa quando:']) assert.ok(t.includes(k), `${f}: falta ${k}`);
  }
  assert.match(await page.locator('#guia-define').textContent(), /SIPOC, VOC/);
  assert.deepEqual(errors, []);
  await context.close();
});
