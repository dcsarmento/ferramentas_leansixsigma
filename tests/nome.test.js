// Novo nome da ferramenta: Enki (ADR 12). Critérios NOM-01 e NOM-02 de docs/ESPECIFICACAO.md.
const { test, before, after, describe } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { startServer, launch, openPage } = require('./helpers');

let srv, browser, URL;
before(async () => { srv = await startServer(); browser = await launch(); URL = srv.url + 'gestao.html'; });
after(async () => { await browser.close(); srv.server.close(); });

// Todo o texto da página, inclusive telas ocultas, sem o código dos <script>.
const textoDaPagina = page => page.evaluate(() => {
  const b = document.body.cloneNode(true);
  b.querySelectorAll('script').forEach(s => s.remove());
  return document.title + '\n' + b.textContent;
});

describe('Nome Enki', () => {
  test('[NOM-01] interface mostra Enki e nenhum texto visível diz Atlas', async () => {
    const { page, context, errors } = await openPage(browser, URL);
    assert.match(await page.title(), /^Enki · /);
    assert.equal((await page.textContent('.logo-text')).trim(), 'ENKI');
    assert.doesNotMatch(await textoDaPagina(page), /atlas/i, 'portfólio vazio');
    await page.click('#page-painel >> text=Carregar exemplo');
    assert.match(await page.$eval('#project-select', s => s.options[s.selectedIndex].text), /Projeto Enki/);
    assert.doesNotMatch(await textoDaPagina(page), /atlas/i, 'com o projeto de exemplo');
    assert.deepEqual(errors, []);
    await context.close();

    const cep = await openPage(browser, srv.url + 'index.html');
    const atalho = cep.page.locator(".nav-item[onclick*=\"gestao.html\"] .nav-icon");
    assert.equal((await atalho.textContent()).trim(), 'ENKI');
    assert.doesNotMatch(await textoDaPagina(cep.page), /atlas/i);
    await cep.context.close();
  });

  test('[NOM-02] dados salvos e backups do tempo do Atlas continuam valendo', async () => {
    const antigo = JSON.stringify({ version: 1, projects: { p1: { id: 'p1', nome: 'Salvo antes do Enki' } }, meta: { current: 'p1' } });
    const { page, context, errors } = await openPage(browser, URL, { seed: { atlas_db_v1: antigo } });
    assert.deepEqual(await page.evaluate(() => Object.values(db.projects).map(p => p.nome)), ['Salvo antes do Enki']);

    await page.evaluate(() => { cur().nome = 'Editado no Enki'; persist(); });
    const chaves = await page.evaluate(() => Object.keys(localStorage).sort());
    assert.deepEqual(chaves, ['atlas_db_v1'], 'grava na mesma chave, sem criar outra');
    assert.match(await page.evaluate(() => localStorage.getItem('atlas_db_v1')), /Editado no Enki/);

    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('text=⬇ Backup JSON')]);
    assert.match(dl.suggestedFilename(), /^enki-backup-\d{4}-\d{2}-\d{2}\.json$/);
    const file = path.join(os.tmpdir(), `nom-${Date.now()}.json`);
    await dl.saveAs(file);
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    assert.equal(data.app, 'atlas', 'formato do backup inalterado');
    assert.ok(data.atlas.projects.p1);

    const velho = path.join(os.tmpdir(), `nom-velho-${Date.now()}.json`);
    fs.writeFileSync(velho, JSON.stringify({ app: 'atlas', version: 1, exportedAt: new Date().toISOString(), atlas: JSON.parse(antigo) }));
    await page.setInputFiles('input[type=file]', velho);
    await page.waitForFunction(() => Object.values(db.projects).some(p => p.nome === 'Salvo antes do Enki'));
    assert.deepEqual(errors, []);
    fs.unlinkSync(file); fs.unlinkSync(velho);
    await context.close();
  });
});
