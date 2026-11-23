// Recorrência de itens do Kanban (REC). Critérios na seção 13 de docs/ESPECIFICACAO.md (ADR 15).
const { test, before, after, describe } = require('node:test');
const assert = require('node:assert/strict');
const { startServer, launch, openPage } = require('./helpers');

let srv, browser, URL;
before(async () => { srv = await startServer(); browser = await launch(); URL = srv.url + 'gestao.html'; });
after(async () => { await browser.close(); srv.server.close(); });

const novoProjeto = page => page.evaluate(() => {
  const p = makeProject({ nome: 'BI' });
  db.projects[p.id] = p; db.meta.current = p.id; persist(); rerender(); return p.id;
});
const comItem = (page, extra) => page.evaluate(x => {
  cur().items.push(normalizeItem(Object.assign({ id: 'it1', titulo: 'Importação', desc: 'Atualizar relatórios', tipo: 'Tarefa', classe: 'data',
    pontos: 2, resp: 'Diego', prazo: '2027-01-31', col: 'c_doing', hist: [], rotulos: ['BI'], bucket: 'Rotina',
    checklist: [{ id: 'a', texto: 'Frota', feito: true }, { id: 'b', texto: 'Combustível', feito: true }] }, x)));
  persist(); showPage('kanban');
}, extra || {});
const concluir = (page, id = 'it1') => page.evaluate(i => { dragId = i; dropOn('c_done'); }, id);

describe('Recorrência de itens', () => {
  test('[REC-01] nextDue avança diária, semanal, mensal e anual sem pular o fim do mês', async () => {
    const { page, context, errors } = await openPage(browser, URL);
    const r = await page.evaluate(() => [
      nextDue('2027-01-31', 'diaria'), nextDue('2026-12-28', 'semanal'), nextDue('2026-12-15', 'mensal'),
      nextDue('2027-01-31', 'mensal'), nextDue('2027-02-28', 'mensal', 31), nextDue('2028-02-29', 'anual'),
      nextDue('', 'mensal'), nextDue('2027-01-10', 'quinzenal')]);
    assert.deepEqual(r, ['2027-02-01', '2027-01-04', '2027-01-15', '2027-02-28', '2027-03-31', '2029-02-28', null, null]);
    assert.deepEqual(errors, []);
    await context.close();
  });

  test('[REC-02] o diálogo grava a frequência, que persiste e aparece no cartão', async () => {
    const { page, context, errors } = await openPage(browser, URL);
    await novoProjeto(page); await comItem(page);
    await page.locator('#kanban-body .kcard-title').first().click();
    await page.selectOption('#it-rec', 'mensal');
    await page.click('#modal-save');
    await page.reload();
    assert.deepEqual(await page.evaluate(() => cur().items[0].recorrencia), { freq: 'mensal', dia: null, proxima: null });
    await page.evaluate(() => showPage('kanban'));
    assert.match(await page.locator('#kanban-body .krec').first().innerText(), /Mensal/);
    await page.locator('#kanban-body .kcard-title').first().click();
    await page.selectOption('#it-rec', '');
    await page.click('#modal-save');
    assert.equal(await page.evaluate(() => cur().items[0].recorrencia), null);
    assert.equal(await page.locator('#kanban-body .krec').count(), 0);
    assert.deepEqual(errors, []);
    await context.close();
  });

  test('[REC-03] concluir cria uma única próxima ocorrência, com a lista desmarcada e a nova data', async () => {
    const { page, context, errors } = await openPage(browser, URL);
    await novoProjeto(page); await comItem(page, { recorrencia: { freq: 'mensal' }, sprint: 'sp1' });
    await concluir(page);
    let its = await page.evaluate(() => cur().items.map(i => ({ id: i.id, t: i.titulo, col: i.col, prazo: i.prazo, ck: i.checklist.map(c => [c.texto, c.feito]),
      rec: i.recorrencia, sprint: i.sprint, resp: i.resp, classe: i.classe, rot: i.rotulos, b: i.bucket, fim: !!i.fim, commit: !!i.commit })));
    assert.equal(its.length, 2);
    const [velho, novo] = its;
    assert.deepEqual([velho.col, velho.ck, velho.fim], ['c_done', [['Frota', true], ['Combustível', true]], true]);
    assert.equal(velho.rec.proxima, novo.id);
    assert.deepEqual(novo, { id: novo.id, t: 'Importação', col: 'c_todo', prazo: '2027-02-28', ck: [['Frota', false], ['Combustível', false]],
      rec: { freq: 'mensal', dia: 31, proxima: null }, sprint: null, resp: 'Diego', classe: 'data', rot: ['BI'], b: 'Rotina', fim: false, commit: true });
    // Reabrir e concluir de novo não duplica
    await page.evaluate(() => { dragId = 'it1'; dropOn('c_doing'); dragId = 'it1'; dropOn('c_done'); });
    assert.equal(await page.evaluate(() => cur().items.length), 2);
    // A ocorrência seguinte volta ao dia 31 em março
    await concluir(page, novo.id);
    await page.reload();
    its = await page.evaluate(() => cur().items.map(i => i.prazo));
    assert.deepEqual(its, ['2027-01-31', '2027-02-28', '2027-03-31']);
    assert.deepEqual(errors, []);
    await context.close();
  });

  test('[REC-03] concluir pelo diálogo também gera a próxima; sem data limite, conta a partir de hoje', async () => {
    const { page, context, errors } = await openPage(browser, URL);
    await novoProjeto(page); await comItem(page, { prazo: '', recorrencia: { freq: 'semanal' } });
    await page.locator('#kanban-body .kcard-title').first().click();
    await page.selectOption('#it-col', 'c_done');
    await page.click('#modal-save');
    const r = await page.evaluate(() => ({ n: cur().items.length, prazo: cur().items[1].prazo, esperado: nextDue(today(), 'semanal') }));
    assert.equal(r.n, 2);
    assert.equal(r.prazo, r.esperado);
    assert.deepEqual(errors, []);
    await context.close();
  });

  test('[REC-04] item antigo ou sem recorrência continua igual; valor inválido vira null', async () => {
    const antigo = JSON.stringify({ version: 1, meta: { current: 'p1' }, projects: { p1: { id: 'p1', nome: 'Antigo',
      items: [{ id: 'i1', titulo: 'Sem recorrência', col: 'c_todo', hist: [] },
              { id: 'i2', titulo: 'Lixo', col: 'c_todo', hist: [], recorrencia: { freq: '<b>x</b>' } },
              { id: 'i3', titulo: 'Texto', col: 'c_todo', hist: [], recorrencia: 'mensal' }] } } });
    const { page, context, errors } = await openPage(browser, URL, { seed: { atlas_db_v1: antigo } });
    assert.deepEqual(await page.evaluate(() => cur().items.map(i => i.recorrencia)), [null, null, null]);
    await page.evaluate(() => showPage('kanban'));
    assert.equal(await page.locator('#kanban-body .krec').count(), 0);
    await concluir(page, 'i1');
    assert.deepEqual(await page.evaluate(() => cur().items.map(i => [i.id, i.col])), [['i1', 'c_done'], ['i2', 'c_todo'], ['i3', 'c_todo']]);
    assert.deepEqual(errors, []);
    await context.close();
  });
});
