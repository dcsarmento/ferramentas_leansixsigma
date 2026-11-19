// Visual de software de gestão moderno (ADR 13). Critérios LAY-01 a LAY-04 de docs/ESPECIFICACAO.md.
const { test, before, after, describe } = require('node:test');
const assert = require('node:assert/strict');
const { startServer, launch, openPage } = require('./helpers');

let srv, browser, URL;
before(async () => { srv = await startServer(); browser = await launch(); URL = srv.url + 'gestao.html'; });
after(async () => { await browser.close(); srv.server.close(); });

// Contraste WCAG entre dois tokens de cor do :root.
const contraste = (page, a, b) => page.evaluate(([a, b]) => {
  const cs = getComputedStyle(document.documentElement);
  const lum = hex => {
    const h = cs.getPropertyValue(hex).trim().replace('#', '');
    const c = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255).map(v => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  };
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}, [a, b]);

describe('Layout', () => {
  test('[LAY-01] tema claro com texto legível (contraste AA)', async () => {
    const { page, context, errors } = await openPage(browser, URL);
    const fundo = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    const [r, g, b] = fundo.match(/\d+/g).map(Number);
    assert.ok(r > 230 && g > 230 && b > 230, `fundo claro, veio ${fundo}`);
    for (const fg of ['--text', '--muted2', '--muted', '--accent', '--danger', '--success', '--warn'])
      for (const bg of ['--surface', '--bg']) {
        const c = await contraste(page, fg, bg);
        assert.ok(c >= 4.5, `${fg} sobre ${bg}: ${c.toFixed(2)} < 4.5`);
      }
    assert.ok(await contraste(page, '--accent-ink', '--accent') >= 4.5, 'texto do botão principal');
    assert.deepEqual(errors, []);
    await context.close();
  });

  test('[LAY-02] menu com ícones desenhados, sem códigos de texto', async () => {
    const { page, context, errors } = await openPage(browser, URL);
    const icones = await page.$$eval('#sidebar .nav-icon', els => els.map(e => [e.dataset.icon, !!e.querySelector('svg'), e.textContent.trim()]));
    assert.ok(icones.length >= 15, `itens com ícone: ${icones.length}`);
    for (const [cod, svg, texto] of icones) {
      assert.ok(svg, `ícone ${cod} sem desenho`);
      assert.equal(texto, '', `ícone ${cod} ainda mostra texto`);
    }
    assert.deepEqual(errors, []);
    await context.close();
  });

  test('[LAY-03] rótulos e títulos em texto normal, sem caixa-alta monoespaçada', async () => {
    const { page, context, errors } = await openPage(browser, URL);
    await page.click('#page-painel >> text=Carregar exemplo');
    const seletores = ['.page-header h1', '.card-title', '.kpi-label', 'table.tbl th', '.ref', '.sidebar-section-label', '.btn-sm', '.btn'];
    await page.evaluate(() => showPage('tap'));
    const estilos = await page.evaluate(sels => sels.map(s => {
      const e = document.querySelector('.page.active ' + s) || document.querySelector(s);
      if (!e) return [s, null];
      const cs = getComputedStyle(e);
      return [s, cs.textTransform, cs.fontFamily];
    }), [...seletores, '.field label']);
    for (const [s, tt, ff] of estilos) {
      assert.ok(tt !== null, `${s} não encontrado`);
      assert.equal(tt, 'none', `${s} em caixa-alta`);
      assert.doesNotMatch(ff, /^["']?DM Mono/, `${s} em fonte monoespaçada`);
    }
    assert.deepEqual(errors, []);
    await context.close();
  });

  test('[LAY-04] todas as telas abrem sem erro e o celular não rola na horizontal', async () => {
    const { page, context, errors } = await openPage(browser, URL);
    await page.click('#page-painel >> text=Carregar exemplo');
    const telas = await page.evaluate(() => Object.keys(RENDER));
    for (const largura of [1400, 390]) {
      await page.setViewportSize({ width: largura, height: 900 });
      for (const t of telas) {
        await page.evaluate(x => showPage(x), t);
        const sobra = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        assert.ok(sobra <= 0, `${t} em ${largura}px rola ${sobra}px na horizontal`);
      }
    }
    assert.deepEqual(errors, []);
    await context.close();
  });
});
