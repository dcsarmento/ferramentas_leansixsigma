// Smoke: as três páginas abrem sem erro de script.
// Protege CEP e DMAIC de regressões causadas por mudanças no Atlas.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { startServer, launch, openPage } = require('./helpers');

let srv, browser;
before(async () => { srv = await startServer(); browser = await launch(); });
after(async () => { await browser.close(); srv.server.close(); });

for (const [file, title] of [['index.html', 'Gráficos de Controle'], ['dmaic.html', 'DMAIC'], ['gestao.html', 'Atlas']]) {
  test(`${file} abre sem erros de script`, async () => {
    const { page, context, errors } = await openPage(browser, srv.url + file);
    assert.match(await page.title(), new RegExp(title));
    await page.waitForTimeout(300);
    assert.deepEqual(errors, []);
    await context.close();
  });
}

test('index.html tem link para o Atlas e para o DMAIC', async () => {
  const { page, context } = await openPage(browser, srv.url + 'index.html');
  const html = await page.content();
  assert.ok(html.includes("window.open('gestao.html'"), 'link para gestao.html ausente');
  assert.ok(html.includes("window.open('dmaic.html'"), 'link para dmaic.html ausente');
  await context.close();
});
