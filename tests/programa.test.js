// Programa (PRG-01 a PRG-03, ADR 22): projetos agrupados num programa, com visão somada na TAP do programa.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startServer, launch, openPage } = require('./helpers');

let srv, browser;
before(async () => { srv = await startServer(); browser = await launch(); });
after(async () => { await browser.close(); srv.server.close(); });

const seedWith = (projects, current) => ({ atlas_db_v1: JSON.stringify({ version: 1, meta: { current: current || Object.keys(projects)[0], lastBackup: null }, projects, processes: {} }) });

test('PRG-01 programa soma os projetos ligados: componentes, progresso médio e sem programa dentro de programa', async () => {
  const { page, context } = await openPage(browser, srv.url + 'gestao.html');
  const r = await page.evaluate(() => {
    const prog = makeProject({ id: 'G', nome: 'Governança', abordagem: 'Programa' });
    const a = makeProject({ id: 'A', nome: 'BI Corporativo', abordagem: 'Preditiva', programaId: 'G' });
    const done = a.cols.find(c => c.tipo === 'done').id, back = a.cols[0].id;
    a.items = [{ id: 'i1', titulo: 'x', col: done }, { id: 'i2', titulo: 'y', col: back }];   // 50%
    const b = makeProject({ id: 'B', nome: 'Melhoria', abordagem: 'Híbrida', programaId: 'G' });
    const outro = makeProject({ id: 'G2', nome: 'Outro programa', abordagem: 'Programa', programaId: 'G' });
    db.projects = { G: prog, A: a, B: b, G2: outro };
    const comps = programComponents(db, 'G').map(x => x.id).sort();
    const pa = progress(a), pb = progress(b), pg = progress(prog);
    const vazio = progress(outro);
    const temCampo = 'programaId' in makeProject({}) && makeProject({}).programaId === '';
    return { comps, pa, pb, pg, vazio, temCampo, abord: ABORDAGENS.includes('Programa') };
  });
  assert.deepEqual(r.comps, ['A', 'B'], 'programa dentro de programa fica de fora');
  const vals = [r.pa, r.pb].filter(v => v != null);
  assert.ok(vals.length > 0, 'ao menos um componente com progresso');
  assert.equal(r.pa, 0.5);
  assert.equal(r.pb, null, 'sem itens não entra na média');
  assert.equal(r.pg, 0.5);
  assert.equal(r.vazio, null, 'programa sem projetos não inventa progresso');
  assert.ok(r.temCampo && r.abord);
  await context.close();
});

test('PRG-02 TAP liga o projeto ao programa e a TAP do programa lista os projetos e cria um novo já ligado', async () => {
  const projects = {
    G: { id: 'G', nome: 'Governança corporativa', abordagem: 'Programa', patrocinador: 'Diretoria' },
    A: { id: 'A', nome: 'BI Corporativo', abordagem: 'Preditiva' }
  };
  const { page, context, errors } = await openPage(browser, srv.url + 'gestao.html', { seed: seedWith(projects, 'A') });
  await page.click('.nav-item[data-page="tap"]');
  assert.equal(await page.locator('#tap-programa option').count(), 2, 'nenhum + o programa');
  await page.selectOption('#tap-programa', 'G');
  assert.equal(await page.evaluate(() => db.projects.A.programaId), 'G');
  await page.evaluate(() => { selectProject('G'); showPage('tap'); });
  assert.equal(await page.locator('#tap-programa').count(), 0, 'programa não escolhe programa');
  assert.equal(await page.locator('#tap-processo, #tap-dmaic, #btn-criar-dmaic').count(), 0, 'programa não melhora processo nem abre DMAIC');
  assert.equal(await page.innerText('#prg-qtd'), '1');
  assert.match(await page.innerText('#programa-box'), /BI Corporativo/);
  await page.evaluate(() => { window.prompt = () => 'Desmobilização e venda'; });
  await page.click('#btn-novo-componente');
  const novo = await page.evaluate(() => { const p = cur(); return { nome: p.nome, programaId: p.programaId, patrocinador: p.patrocinador }; });
  assert.deepEqual(novo, { nome: 'Desmobilização e venda', programaId: 'G', patrocinador: 'Diretoria' });
  await page.evaluate(() => { selectProject('G'); showPage('tap'); });
  assert.equal(await page.innerText('#prg-qtd'), '2');
  await page.click('.nav-item[data-page="painel"]');
  assert.match(await page.innerText('#page-painel'), /programa: Governança corporativa/);
  assert.deepEqual(errors, []);
  await context.close();
});

test('PRG-03 excluir o programa solta os projetos e o roteiro do programa pede os projetos', async () => {
  const { page, context } = await openPage(browser, srv.url + 'gestao.html');
  const r = await page.evaluate(() => {
    const prog = makeProject({ id: 'G', nome: 'Gov', abordagem: 'Programa' });
    const a = makeProject({ id: 'A', nome: 'BI', programaId: 'G' });
    db.projects = { G: prog, A: a };
    const antes = projectRoadmap(prog, {}, {}).etapas.find(x => x.k === 'componentes');
    const semEntregas = !projectRoadmap(prog, {}, {}).etapas.some(x => x.k === 'entregas');
    window.confirm = () => true;
    db.meta.current = 'G';
    deleteProject();
    return { feito: antes && antes.done, semEntregas, existe: !!db.projects.G, solto: db.projects.A.programaId };
  });
  assert.equal(r.feito, true);
  assert.ok(r.semEntregas, 'programa não pede entregas no Kanban');
  assert.equal(r.existe, false);
  assert.equal(r.solto, '');
  await context.close();
});
