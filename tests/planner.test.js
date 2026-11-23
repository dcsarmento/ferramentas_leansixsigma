// Lista de verificação no item do Kanban (CHK) e, nas próximas fatias, importação do Planner (PLN).
// Critérios na seção 12 de docs/ESPECIFICACAO.md (ADR 14).
const { test, before, after, describe } = require('node:test');
const assert = require('node:assert/strict');
const { startServer, launch, openPage } = require('./helpers');

let srv, browser, URL;
before(async () => { srv = await startServer(); browser = await launch(); URL = srv.url + 'gestao.html'; });
after(async () => { await browser.close(); srv.server.close(); });

const novoProjeto = page => page.evaluate(() => {
  const p = makeProject({ nome: 'Projeto teste' });
  db.projects[p.id] = p; db.meta.current = p.id; persist(); rerender(); return p.id;
});
const comItem = (page, checklist) => page.evaluate(ck => {
  cur().items.push(normalizeItem({ id: 'it1', titulo: 'Relatórios BI', tipo: 'Tarefa', classe: 'padrao', col: 'c_todo', hist: [], checklist: ck }));
  persist(); showPage('kanban');
}, checklist);

describe('Lista de verificação', () => {
  test('[CHK-01] diálogo adiciona, renomeia, marca e remove subitens; persiste após recarregar', async () => {
    const { page, context, errors } = await openPage(browser, URL);
    await novoProjeto(page);
    await page.evaluate(() => showPage('kanban'));
    await page.click('#kanban-body .add-card');
    await page.fill('#it-titulo', 'Importação');
    for (const t of ['Rel. veículos vendidos', 'Rel. veículos furtados', 'Rel. financeiro']) {
      await page.fill('#ck-new', t);
      await page.press('#ck-new', 'Enter');
    }
    assert.equal(await page.locator('#ck-list .ck-row').count(), 3);
    await page.locator('#ck-list .ck-dot').nth(0).click();                 // marcar
    await page.locator('#ck-list input').nth(1).fill('Rel. veículos adquiridos'); // renomear
    await page.locator('#ck-list .btn-rm').nth(2).click();                 // remover
    assert.match(await page.textContent('#ck-count'), /1\/2/);
    await page.click('#modal-save');
    await page.reload();
    const ck = await page.evaluate(() => cur().items[0].checklist.map(c => [c.texto, c.feito]));
    assert.deepEqual(ck, [['Rel. veículos vendidos', true], ['Rel. veículos adquiridos', false]]);
    // desmarcar pelo diálogo
    await page.evaluate(() => showPage('kanban'));
    await page.click('#kanban-body .kcard .kcard-title');
    await page.locator('#ck-list .ck-dot').nth(0).click();
    await page.click('#modal-save');
    assert.equal(await page.evaluate(() => cur().items[0].checklist[0].feito), false);
    assert.deepEqual(errors, []);
    await context.close();
  });

  test('[CHK-01] cancelar o diálogo não altera a lista', async () => {
    const { page, context } = await openPage(browser, URL);
    await novoProjeto(page);
    await comItem(page, [{ id: 'a', texto: 'Um', feito: false }]);
    await page.click('#kanban-body .kcard .kcard-title');
    await page.locator('#ck-list .ck-dot').nth(0).click();
    await page.fill('#ck-new', 'Dois'); await page.press('#ck-new', 'Enter');
    await page.keyboard.press('Escape');
    assert.deepEqual(await page.evaluate(() => cur().items[0].checklist.map(c => [c.texto, c.feito])), [['Um', false]]);
    await context.close();
  });

  test('[CHK-02] cartão mostra feitos/total só quando há lista; checklistProgress é pura', async () => {
    const { page, context } = await openPage(browser, URL);
    await novoProjeto(page);
    const pr = await page.evaluate(() => [
      checklistProgress({ checklist: [] }),
      checklistProgress({}),
      checklistProgress({ checklist: [{ feito: true }, { feito: false }, { feito: false }] })
    ]);
    assert.deepEqual(pr, [null, null, { feitos: 1, total: 3 }]);
    await comItem(page, []);
    assert.equal(await page.locator('#kanban-body .kcheck').count(), 0);
    await page.evaluate(() => { cur().items[0].checklist = Array.from({ length: 13 }, (_, i) => ({ id: 'k' + i, texto: 'R' + i, feito: i < 2 })); persist(); renderKanban(); });
    assert.equal((await page.textContent('#kanban-body .kcheck')).trim(), '☑ 2/13');
    await context.close();
  });

  test('[CHK-04] marcar pelo cartão: o contador abre a lista e o círculo marca sem abrir o diálogo', async () => {
    const { page, context } = await openPage(browser, URL);
    await novoProjeto(page);
    await comItem(page, [{ id: 'a', texto: 'Um', feito: false }, { id: 'b', texto: 'Dois', feito: false }]);
    assert.equal(await page.locator('#kanban-body .kcard-checks').count(), 0);
    await page.click('#kanban-body .kcheck');
    assert.equal(await page.locator('#kanban-body .kcard-checks .ck-row').count(), 2);
    await page.locator('#kanban-body .kcard-checks .ck-dot').nth(1).click();
    assert.ok(!(await page.isVisible('#modal-bg.show')));
    assert.equal((await page.textContent('#kanban-body .kcheck')).trim(), '☑ 1/2');
    await page.reload();
    assert.deepEqual(await page.evaluate(() => cur().items[0].checklist.map(c => c.feito)), [false, true]);
    await context.close();
  });

  test('[CHK-03] item antigo sem os campos novos é normalizado; texto do subitem é escapado', async () => {
    const antigo = JSON.stringify({ version: 1, meta: { current: 'p1' }, projects: { p1: { id: 'p1', nome: 'Antigo',
      items: [{ id: 'i1', titulo: 'Sem lista', col: 'c_todo', hist: [] },
              { id: 'i2', titulo: 'Lista estranha', col: 'c_todo', hist: [], checklist: [null, 'x', { texto: '<img src=x onerror="window.__xss=1">', feito: 1 }] }] } } });
    const { page, context, errors } = await openPage(browser, URL, { seed: { atlas_db_v1: antigo } });
    const its = await page.evaluate(() => cur().items.map(i => ({ ck: i.checklist.map(c => [c.texto, c.feito, !!c.id]), rot: i.rotulos, b: i.bucket, o: i.origem })));
    assert.deepEqual(its[0], { ck: [], rot: [], b: '', o: null });
    assert.deepEqual(its[1].ck, [['<img src=x onerror="window.__xss=1">', true, true]]);
    await page.evaluate(() => showPage('kanban'));
    await page.click('#kanban-body .kcheck');
    await page.locator('#kanban-body .kcard').nth(1).locator('.kcard-title').click();
    assert.equal(await page.locator('#kanban-body img, #modal-content img').count(), 0);
    assert.equal(await page.evaluate(() => window.__xss), undefined);
    assert.deepEqual(errors, []);
    await context.close();
  });
});
