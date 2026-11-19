// P-01 · Projetos organizados pelos domínios de desempenho do PMBOK 8 (docs/ESPECIFICACAO.md, seção 7).
const { test, before, after, describe } = require('node:test');
const assert = require('node:assert/strict');
const { startServer, launch, openPage } = require('./helpers');

let srv, browser, URL;
before(async () => { srv = await startServer(); browser = await launch(); URL = srv.url + 'gestao.html'; });
after(async () => { await browser.close(); srv.server.close(); });

const novoProjeto = (page, nome) => page.evaluate(n => {
  const p = makeProject({ nome: n }); db.projects[p.id] = p; db.meta.current = p.id; persist(); rerender(); return p.id;
}, nome);
const grupo = id => `#nav-projetos .nav-group[data-domain="${id}"]`;
const ativa = page => page.$eval('.page.active', e => e.id);

describe('Navegação por domínio', () => {
  test('[NAV-01] cada tela atual está no seu domínio e abre a mesma tela; Kanban e Scrum também como atalho', async () => {
    const { page, context, errors } = await openPage(browser, URL);
    await novoProjeto(page, 'A');
    const mapa = [['governanca', 'tap'], ['governanca', 'licoes'], ['escopo', 'scrum'], ['cronograma', 'kanban'], ['cronograma', 'scrum'],
                  ['partes', 'partes'], ['riscos', 'riscos'], ['atalhos', 'kanban'], ['atalhos', 'scrum']];
    for (const [dom, pg] of mapa) {
      await page.click(`${grupo(dom)} .nav-item[data-page="${pg}"]`);
      assert.equal(await ativa(page), 'page-' + pg, `${dom} → ${pg}`);
    }
    const dominios = await page.$$eval('#nav-projetos .nav-group-label', els => els.map(e => e.firstChild.textContent.trim()));
    assert.deepEqual(dominios, ['Uso diário', 'Governança', 'Escopo', 'Cronograma', 'Finanças', 'Partes interessadas', 'Recursos', 'Riscos']);
    assert.deepEqual(errors, []);
    await context.close();
  });

  test('[NAV-02] itens previstos mostram a release, ficam desabilitados e o clique não muda a tela', async () => {
    const { page, context, errors } = await openPage(browser, URL);
    await novoProjeto(page, 'A');
    await page.evaluate(() => showPage('riscos'));
    const previstos = await page.$$eval('#nav-projetos .nav-item.planned', els => els.map(e => [e.dataset.page, e.querySelector('.nav-release').textContent, e.getAttribute('aria-disabled')]));
    assert.deepEqual(previstos, [[undefined, 'R2', 'true'], [undefined, 'R2', 'true'], [undefined, 'R2', 'true'], [undefined, 'R2', 'true'], [undefined, 'R3-B', 'true']]);
    await page.click(`${grupo('cronograma')} .nav-item.planned >> text=Gantt e Timeline`);
    assert.equal(await ativa(page), 'page-riscos');
    assert.deepEqual(errors, []);
    await context.close();
  });

  test('[NAV-03] cada grupo mostra a área de conhecimento clássica como legenda quando o nome difere', async () => {
    const { page, context } = await openPage(browser, URL);
    const legenda = id => page.$eval(`${grupo(id)} .nav-group-label`, e => (e.querySelector('.nav-legend') || {}).textContent || '');
    assert.equal(await legenda('governanca'), 'Integração');
    assert.equal(await legenda('cronograma'), 'Tempo');
    assert.equal(await legenda('financas'), 'Custos');
    assert.equal(await legenda('partes'), 'Comunicações');
    assert.equal(await legenda('riscos'), '');
    await context.close();
  });

  test('[NAV-04] a última tela é lembrada por projeto e restaurada ao trocar; dado antigo sem lastPage abre', async () => {
    const antigo = JSON.stringify({ version: 1, projects: { p1: { id: 'p1', nome: 'Antigo' } }, meta: { current: 'p1' } });
    const { page, context, errors } = await openPage(browser, URL, { seed: { atlas_db_v1: antigo } });
    assert.deepEqual(await page.evaluate(() => db.meta.lastPage), {});
    const a = 'p1';
    await page.evaluate(() => showPage('riscos'));
    const b = await novoProjeto(page, 'B');
    await page.evaluate(() => showPage('partes'));
    await page.selectOption('#project-select', a);
    assert.equal(await ativa(page), 'page-riscos');
    await page.selectOption('#project-select', b);
    assert.equal(await ativa(page), 'page-partes');
    await page.reload();
    assert.deepEqual(await page.evaluate(() => db.meta.lastPage), { p1: 'riscos', [b]: 'partes' });
    assert.deepEqual(errors, []);
    await context.close();
  });

  test('[NAV-06] no celular cada tela aparece uma vez e os itens previstos somem', async () => {
    const context = await browser.newContext({ viewport: { width: 390, height: 800 } });
    await context.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ status: 200, body: '' }));
    const page = await context.newPage();
    await page.goto(URL);
    const visiveis = await page.$$eval('#nav-projetos .nav-item', els => els.filter(e => e.offsetParent !== null).map(e => e.dataset.page));
    assert.deepEqual(visiveis.sort(), ['kanban', 'licoes', 'partes', 'riscos', 'scrum', 'tap']);
    await context.close();
  });
});

describe('Navegação por domínio · menu', () => {
  test('[NAV-07] em tela baixa o menu rola e a seção Processos continua alcançável', async () => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 600 } });
    await context.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ status: 200, body: '' }));
    const page = await context.newPage();
    await page.goto(URL);
    await page.click('.nav-item[data-page="processos"]');
    assert.equal(await page.$eval('.page.active', e => e.id), 'page-processos');
    await context.close();
  });
});
