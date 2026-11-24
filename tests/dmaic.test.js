// DMAIC (dmaic.html): fase Define sem projeto selecionado e SIPOC.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startServer, launch, openPage } = require('./helpers');

let srv, browser;
before(async () => { srv = await startServer(); browser = await launch(); });
after(async () => { await browser.close(); srv.server.close(); });

test('DMA-01 sem projeto, a fase Define avisa e bloqueia os campos (nada é digitado e perdido)', async () => {
  const { page, context, errors } = await openPage(browser, srv.url + 'dmaic.html');
  await page.click('#nav-define');
  const banner = page.locator('#page-define .no-project-banner');
  assert.ok(await banner.isVisible(), 'aviso de projeto ausente');
  assert.match(await banner.innerText(), /Nenhum projeto selecionado/);
  for (const sel of ['#d-processo', '#sipoc-s + button', '#sipoc-c + button', '#define-status']) {
    assert.ok(await page.locator(sel).isDisabled(), `${sel} deveria estar bloqueado`);
  }
  assert.ok(await page.locator('#page-measure button[data-livre]').isEnabled(), 'Abrir CEP não depende de projeto');
  assert.deepEqual(errors, []);
  await context.close();
});

test('DMA-02 com projeto, as cinco colunas do SIPOC aceitam itens e persistem após recarregar', async () => {
  const { page, context, errors } = await openPage(browser, srv.url + 'dmaic.html');
  await page.evaluate(() => { window.prompt = () => 'Projeto SIPOC'; });
  await page.click('text=+ Novo');
  await page.click('#nav-define');
  assert.ok(!(await page.locator('#page-define .no-project-banner').isVisible()), 'aviso não deveria aparecer com projeto');
  assert.match(await page.locator('#sipoc-s').evaluate(el => getComputedStyle(el, '::before').content), /Adicionar/);
  for (const c of ['s', 'i', 'p', 'o', 'c']) {
    await page.click(`#sipoc-${c} + button`);
    await page.fill(`#sipoc-${c} input`, 'item ' + c);
  }
  await page.reload();
  await page.click('#nav-define');
  for (const c of ['s', 'i', 'p', 'o', 'c']) assert.equal(await page.inputValue(`#sipoc-${c} input`), 'item ' + c);
  assert.ok(await page.locator('#d-processo').isEnabled());
  assert.deepEqual(errors, []);
  await context.close();
});

test('DMA-03 excluir o projeto aberto volta a bloquear as fases', async () => {
  const { page, context } = await openPage(browser, srv.url + 'dmaic.html');
  await page.evaluate(() => { window.prompt = () => 'Temporário'; });
  await page.click('text=+ Novo');
  await page.evaluate(() => deleteProject());
  await page.click('#nav-define');
  assert.ok(await page.locator('#page-define .no-project-banner').isVisible());
  assert.ok(await page.locator('#sipoc-s + button').isDisabled());
  await context.close();
});
