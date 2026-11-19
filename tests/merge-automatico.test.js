// Merge automático (ADR 11): regras e passos, sem acessar o GitHub.
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { podeMesclar, executar } = require('../tools/merge-automatico.js');

const ROOT = path.resolve(__dirname, '..');
const REPO = 'dcsarmento/ferramentas_leansixsigma';
const RUN = { conclusion: 'success', head_sha: 'abc', head_branch: 'feat-x', pull_requests: [{ number: 5 }] };
const pr = (extra = {}) => ({
  number: 5, state: 'open', draft: false, labels: [], mergeable: true,
  head: { ref: 'feat-x', sha: 'abc', repo: { full_name: REPO } }, base: { ref: 'main' }, ...extra,
});

test('AUT-01 mescla PR aberto para a main com testes verdes no último commit', () => {
  assert.deepStrictEqual(podeMesclar(pr(), RUN, REPO).ok, true);
});

test('AUT-02 não mescla rascunho, "segurar", fork, empilhado, commit novo, conflito ou testes vermelhos', () => {
  const casos = [
    [pr({ draft: true }), RUN],
    [pr({ labels: [{ name: 'Segurar' }] }), RUN],
    [pr({ head: { ref: 'feat-x', sha: 'abc', repo: { full_name: 'outro/fork' } } }), RUN],
    [pr({ base: { ref: 'atlas-release-1' } }), RUN],
    [pr({ head: { ref: 'feat-x', sha: 'def', repo: { full_name: REPO } } }), RUN],
    [pr({ mergeable: false }), RUN],
    [pr({ state: 'closed' }), RUN],
    [pr(), { ...RUN, conclusion: 'failure' }],
  ];
  for (const [p, r] of casos) assert.strictEqual(podeMesclar(p, r, REPO).ok, false, JSON.stringify(p) + ' ' + r.conclusion);
});

function fakeApi(abertos, detalhes) {
  const chamadas = [];
  const api = async (method, p, body) => {
    chamadas.push([method, p, body]);
    if (method === 'GET' && p.startsWith('/pulls?')) return abertos;
    if (method === 'GET') return detalhes[Number(p.split('/').pop())];
    return {};
  };
  return { api, chamadas };
}

test('AUT-03 depois do merge redireciona os empilhados para a main, reexecuta os testes deles e só então apaga a branch', async () => {
  const filho = pr({ number: 6, head: { ref: 'feat-y', sha: 'zzz', repo: { full_name: REPO } }, base: { ref: 'feat-x' } });
  const { api, chamadas } = fakeApi([pr(), filho], { 5: pr(), 6: filho });
  const feitos = await executar({ workflow_run: RUN }, { api, repo: REPO, log: () => {}, pausa: 0 });
  assert.deepStrictEqual(feitos, [5]);
  const escrita = chamadas.filter(c => c[0] !== 'GET').map(c => c[0] + ' ' + c[1]);
  assert.deepStrictEqual(escrita, [
    'PUT /pulls/5/merge', 'PATCH /pulls/6', 'POST /actions/workflows/testes.yml/dispatches', 'DELETE /git/refs/heads/feat-x',
  ]);
  assert.deepStrictEqual(chamadas.find(c => c[0] === 'PUT')[2], { merge_method: 'merge', sha: 'abc' });
  assert.deepStrictEqual(chamadas.find(c => c[0] === 'PATCH')[2], { base: 'main' });
  assert.deepStrictEqual(chamadas.find(c => c[0] === 'POST')[2], { ref: 'feat-y' });
});

test('AUT-03 execução via workflow_dispatch acha o PR pela branch e pelo commit; testes vermelhos não escrevem nada', async () => {
  const run = { ...RUN, pull_requests: [] };
  let f = fakeApi([pr()], { 5: pr() });
  assert.deepStrictEqual(await executar({ workflow_run: run }, { api: f.api, repo: REPO, log: () => {}, pausa: 0 }), [5]);
  f = fakeApi([pr()], { 5: pr() });
  await executar({ workflow_run: { ...RUN, conclusion: 'failure' } }, { api: f.api, repo: REPO, log: () => {}, pausa: 0 });
  assert.strictEqual(f.chamadas.length, 0);
});

test('AUT-04 workflow dispara ao fim de "Testes", só segue com sucesso, roda o código da main e tem as permissões mínimas', () => {
  const wf = fs.readFileSync(path.join(ROOT, '.github/workflows/merge-automatico.yml'), 'utf8');
  assert.match(wf, /workflow_run:\s*\n\s*workflows: \[Testes\]\s*\n\s*types: \[completed\]/);
  assert.match(wf, /if: github\.event\.workflow_run\.conclusion == 'success'/);
  assert.match(wf, /node tools\/merge-automatico\.js/);
  assert.doesNotMatch(wf, /pull_request_target|ref: \$\{\{ github\.event\.workflow_run\.head/);
  for (const p of ['contents: write', 'pull-requests: write', 'actions: write']) assert.ok(wf.includes(p), p);
  const testes = fs.readFileSync(path.join(ROOT, '.github/workflows/testes.yml'), 'utf8');
  assert.match(testes, /^name: Testes$/m);
  assert.match(testes, /workflow_dispatch:/);
});
