#!/usr/bin/env node
// Validator gate. FAIL anywhere -> status "blocked". WARN needs validation[v].warn_justification.
// All required validators PASS (or justified WARN) -> status "validated".
// Usage: node scripts/gate.mjs
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const REQUIRED = ['margin-validator', 'compliance-checker', 'listing-qa', 'claim-fact-checker'];
const out = [];
for (const f of readdirSync('data/products').filter((f) => f.endsWith('.json') && !f.startsWith('_'))) {
  const path = join('data/products', f);
  const p = JSON.parse(readFileSync(path, 'utf8'));
  if (['draft', 'active', 'archived', 'dropped'].includes(p.status)) { out.push({ slug: p.slug, status: p.status, unchanged: true }); continue; }
  const problems = [];
  for (const v of REQUIRED) {
    const r = p.validation?.[v];
    if (!r) problems.push(`${v}: missing`);
    else if (r.verdict === 'FAIL') problems.push(`${v}: FAIL`);
    else if (r.verdict === 'WARN' && !r.warn_justification) problems.push(`${v}: WARN unjustified`);
  }
  const fail = problems.some((x) => x.endsWith('FAIL'));
  p.status = problems.length === 0 ? 'validated' : fail ? 'blocked' : 'candidate';
  p.gate = { checked_at: new Date().toISOString(), problems };
  writeFileSync(path, JSON.stringify(p, null, 2) + '\n');
  out.push({ slug: p.slug, status: p.status, problems });
}
for (const o of out) console.log(`${o.status.padEnd(10)} ${o.slug}${o.problems?.length ? '  <- ' + o.problems.join('; ') : ''}`);
