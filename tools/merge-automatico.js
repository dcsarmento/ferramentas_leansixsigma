// Merge automático (ADR 11, critérios AUT-01 a AUT-04).
// Chamado pelo workflow .github/workflows/merge-automatico.yml quando "Testes" termina.
// As regras ficam em funções puras para poderem ser testadas sem GitHub.
const fs = require('node:fs');

const BASE = 'main';
const ROTULO_SEGURAR = 'segurar';

// Decide se um PR pode ser mesclado depois de uma execução dos testes.
// pr: objeto da API de pulls; run: objeto workflow_run do evento.
function podeMesclar(pr, run, repo) {
  if (!run || run.conclusion !== 'success') return { ok: false, motivo: 'testes não terminaram verdes' };
  if (!pr || pr.state !== 'open') return { ok: false, motivo: 'PR não está aberto' };
  if (pr.draft) return { ok: false, motivo: 'PR em rascunho' };
  if ((pr.labels || []).some(l => (l.name || '').toLowerCase() === ROTULO_SEGURAR)) return { ok: false, motivo: 'rótulo "segurar"' };
  if (!pr.head || !pr.head.repo || pr.head.repo.full_name !== repo) return { ok: false, motivo: 'PR de fork' };
  if (!pr.base || pr.base.ref !== BASE) return { ok: false, motivo: 'base não é a main (PR empilhado)' };
  if (pr.head.sha !== run.head_sha) return { ok: false, motivo: 'houve commit depois dos testes' };
  if (pr.mergeable === false) return { ok: false, motivo: 'conflito de merge' };
  return { ok: true, motivo: 'testes verdes no último commit' };
}

// PRs abertos empilhados sobre a branch que acabou de ser mesclada.
function filhosDe(prs, branch) {
  return prs.filter(p => p.state === 'open' && p.base && p.base.ref === branch);
}

function cliente(token, repo, fetchFn = fetch) {
  return async function api(method, path, body) {
    const res = await fetchFn(`https://api.github.com/repos/${repo}${path}`, {
      method,
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) throw new Error(`${method} ${path} → ${res.status} ${data && data.message ? data.message : ''}`);
    return data;
  };
}

const espera = ms => new Promise(r => setTimeout(r, ms));

// O GitHub calcula "mergeable" de forma assíncrona: tenta algumas vezes.
async function lerPR(api, numero, tentativas = 5, pausa = 3000) {
  let pr;
  for (let i = 0; i < tentativas; i++) {
    pr = await api('GET', `/pulls/${numero}`);
    if (pr.mergeable !== null && pr.mergeable !== undefined) return pr;
    await espera(pausa);
  }
  return pr;
}

async function executar(evento, { api, repo, log = console.log, pausa = 3000 }) {
  const run = evento.workflow_run;
  if (!run || run.conclusion !== 'success') { log('Testes não verdes: nada a fazer.'); return []; }
  const abertos = await api('GET', '/pulls?state=open&per_page=100');
  // PRs ligados à execução: pelo evento, ou pela branch (execução via workflow_dispatch).
  const ids = new Set((run.pull_requests || []).map(p => p.number));
  for (const p of abertos) if (p.head && p.head.ref === run.head_branch && p.head.sha === run.head_sha) ids.add(p.number);
  const mesclados = [];
  for (const numero of ids) {
    const pr = await lerPR(api, numero, 5, pausa);
    const d = podeMesclar(pr, run, repo);
    if (!d.ok) { log(`#${numero}: não mesclado (${d.motivo}).`); continue; }
    await api('PUT', `/pulls/${numero}/merge`, { merge_method: 'merge', sha: run.head_sha });
    log(`#${numero}: mesclado na ${BASE}.`);
    const branch = pr.head.ref;
    // Redireciona os empilhados ANTES de apagar a branch, senão o GitHub os fecharia.
    for (const filho of filhosDe(abertos, branch)) {
      await api('PATCH', `/pulls/${filho.number}`, { base: BASE });
      await api('POST', '/actions/workflows/testes.yml/dispatches', { ref: filho.head.ref });
      log(`#${filho.number}: base trocada para ${BASE}; testes reexecutados.`);
    }
    await api('DELETE', `/git/refs/heads/${encodeURIComponent(branch)}`);
    log(`Branch ${branch} apagada.`);
    mesclados.push(numero);
  }
  return mesclados;
}

module.exports = { podeMesclar, filhosDe, executar, cliente, BASE, ROTULO_SEGURAR };

if (require.main === module) {
  const evento = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const repo = process.env.GITHUB_REPOSITORY;
  executar(evento, { api: cliente(process.env.GITHUB_TOKEN, repo), repo })
    .catch(e => { console.error(e.message); process.exit(1); });
}
