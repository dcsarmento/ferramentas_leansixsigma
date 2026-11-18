// Monta a pasta publicada (dist/) com as três páginas e nada mais.
// Uso: node tools/build.js [pasta-de-origem] [pasta-de-saída]
// Falha (código 1) se faltar alguma página: poka-yoke contra publicação incompleta (PUB-03).
const fs = require('node:fs');
const path = require('node:path');

const PAGES = ['index.html', 'dmaic.html', 'gestao.html'];

function build(src, out) {
  const missing = PAGES.filter(p => !fs.existsSync(path.join(src, p)));
  if (missing.length) throw new Error('Página ausente, publicação cancelada: ' + missing.join(', '));
  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(out, { recursive: true });
  for (const p of PAGES) fs.copyFileSync(path.join(src, p), path.join(out, p));
  return PAGES.slice();
}

if (require.main === module) {
  const root = path.resolve(__dirname, '..');
  const src = path.resolve(process.argv[2] || root);
  const out = path.resolve(process.argv[3] || path.join(root, 'dist'));
  try {
    const pages = build(src, out);
    console.log('dist pronto: ' + pages.join(', '));
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}

module.exports = { build, PAGES };
