// Infraestrutura comum dos testes: servidor estático local + navegador.
// Roda com o test runner nativo do Node (node --test), sem framework extra.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };

function startServer() {
  return new Promise(resolve => {
    const server = http.createServer((req, res) => {
      const file = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
      if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => resolve({ server, url: `http://127.0.0.1:${server.address().port}/` }));
  });
}

async function launch() {
  const opts = { args: ['--no-sandbox'] };
  if (process.env.CHROME_PATH) opts.executablePath = process.env.CHROME_PATH;
  return chromium.launch(opts);
}

// Abre uma página nova, com localStorage limpo, coletando erros de script.
// dialogs: 'accept' (padrão) ou 'dismiss' para confirm()/alert().
async function openPage(browser, url, { dialogs = 'accept', seed } = {}) {
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 }, acceptDownloads: true });
  // Fontes do Google não são necessárias e não existem offline no CI.
  await context.route(/fonts\.(googleapis|gstatic)\.com/, r => r.fulfill({ status: 200, body: '' }));
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const dialogLog = [];
  page.on('dialog', d => { dialogLog.push(d.message()); return page._dialogMode === 'dismiss' ? d.dismiss() : d.accept(); });
  page._dialogMode = dialogs;
  if (seed) await page.addInitScript(s => { if (!sessionStorage.getItem('__seeded')) { for (const [k, v] of Object.entries(s)) localStorage.setItem(k, v); sessionStorage.setItem('__seeded', '1'); } }, seed);
  await page.goto(url);
  return { page, context, errors, dialogLog };
}

const DAY = 864e5;
const ago = n => new Date(Date.now() - n * DAY).toISOString();

module.exports = { startServer, launch, openPage, ago, DAY };
