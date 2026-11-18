// Publicação no Vercel (ADR 10): o que vai ao ar e o que não vai.
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync, spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const BUILD = path.join(ROOT, 'tools', 'build.js');
const PAGES = ['dmaic.html', 'gestao.html', 'index.html'];

test('PUB-01 build gera dist só com as três páginas, idênticas às da raiz', () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'atlas-dist-'));
  execFileSync(process.execPath, [BUILD, ROOT, out]);
  assert.deepStrictEqual(fs.readdirSync(out).sort(), PAGES);
  for (const p of PAGES) {
    assert.ok(fs.readFileSync(path.join(out, p)).equals(fs.readFileSync(path.join(ROOT, p))), p + ' difere da raiz');
  }
  fs.rmSync(out, { recursive: true, force: true });
});

test('PUB-02 vercel.json publica dist via npm run build e as páginas não dependem do endereço do GitHub Pages', () => {
  const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
  assert.strictEqual(cfg.outputDirectory, 'dist');
  assert.strictEqual(cfg.buildCommand, 'npm run build');
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  assert.strictEqual(pkg.scripts.build, 'node tools/build.js');
  for (const p of PAGES) {
    const html = fs.readFileSync(path.join(ROOT, p), 'utf8');
    assert.ok(!/href=["']https?:\/\/[^"']*github\.io/i.test(html), p + ' tem link absoluto para github.io');
  }
});

test('PUB-03 build falha e não publica quando falta uma página', () => {
  const src = fs.mkdtempSync(path.join(os.tmpdir(), 'atlas-src-'));
  const out = path.join(src, 'dist');
  for (const p of ['index.html', 'dmaic.html']) fs.copyFileSync(path.join(ROOT, p), path.join(src, p));
  const r = spawnSync(process.execPath, [BUILD, src, out], { encoding: 'utf8' });
  assert.notStrictEqual(r.status, 0);
  assert.match(r.stderr, /gestao\.html/);
  assert.ok(!fs.existsSync(out), 'dist não deveria existir');
  fs.rmSync(src, { recursive: true, force: true });
});
