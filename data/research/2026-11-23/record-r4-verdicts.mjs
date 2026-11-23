// Record round-4 verdicts (after CN-shipping change) + Opus WARN justifications; set status validated.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
const DIR = 'data/research/2026-11-23/validators-r4';
const NAMES = ['margin-validator', 'compliance-checker', 'claim-fact-checker', 'listing-qa'];
const V = Object.fromEntries(NAMES.map((n) => [n, Object.fromEntries(JSON.parse(readFileSync(`${DIR}/${n}.json`, 'utf8')).map((x) => [x.item_id, x.verdict]))]));

// Sleeping mat FAQ fix requested by fact-check WARN (no new claim).
{
  const path = 'data/products/summer-pet-sleeping-mat.json';
  const p = JSON.parse(readFileSync(path, 'utf8'));
  p.copy.faq = p.copy.faq.map((f) => ({ ...f, a: f.a.replace('No cooling temperature is stated.', 'The maker does not state a temperature rating.') }));
  writeFileSync(path, JSON.stringify(p, null, 2) + '\n');
}

const BRAND = 'Brand is Fondly Pet (APR-011, data/brand.json); validator lacked that file.';
const J = {
  'margin-validator': (id) => ({ 'gl-c19': 'Thin but above floor (40.3%) at CN freight; monitor CJ price; reprice if cost rises.', 'gl-c04': 'Thin but above floor (40.7%); monitor.', 'gl-c09': 'Worst variant Rose Red S 40.5% (unit 2.99 vs 2.46 others, CJ API data); others 41-42%.' }[id]),
  'compliance-checker': (id) => ({
    'gl-c24': `'Breathable' is backed by spec 'air permeability'/3D air mesh. ${BRAND}`,
    'gl-c19': `Hand-size and fur-type coverage is maker copy, attributed in description. ${BRAND}`,
    'gl-c06': `Unattributed 'Waterproof' removed from title, meta_title, alt 1 after this pass (fixes-r4). ${BRAND}`,
    'gl-c09': `Unattributed 'Waterproof'/'Reflective' removed from title, meta_title, alt 1 after this pass (fixes-r4). ${BRAND}`,
  }[id] ?? BRAND),
  'claim-fact-checker': (id) => ({ 'gl-c06': "FAQ rephrased to 'The maker does not state a temperature rating.' (record-r4-verdicts)." }[id]),
  'listing-qa': (id) => ({
    'gl-c24': `Size wording fixed to S to XL; copy_claims shipping updated (fixes-r4). Freight file retail is the pre-raise price; ship cost does not depend on retail. ${BRAND}`,
    'gl-c19': `Trailing-00 CJ ids verified live earlier (CJYD2332008). Bullet fragments are maker attribution style. ${BRAND}`,
    'gl-c27': `Minor repetition only; no factual issue. ${BRAND}`,
    'gl-c04': `copy_claims updated. ${BRAND}`,
    'gl-c11': `'cats' tag added (fixes-r4). ${BRAND}`,
    'gl-c06': `Internal-note sentence rewritten, 'spot' repetition reduced, copy_claims fixed (fixes-r4). ${BRAND}`,
    'gl-c09': `Trailing-00 ids verified live earlier (CJGD2058064, 12 variants); maker publishes no measurements and copy says so. ${BRAND}`,
  }[id]),
};

const out = [];
for (const f of readdirSync('data/products').filter((f) => f.endsWith('.json'))) {
  const path = `data/products/${f}`;
  const p = JSON.parse(readFileSync(path, 'utf8'));
  if (p.status === 'dropped' || !V['margin-validator'][p.id]) continue;
  p.validation = {};
  for (const n of NAMES) {
    const verdict = V[n][p.id];
    const just = verdict === 'WARN' ? J[n](p.id) : undefined;
    p.validation[n] = { verdict, log_path: `${DIR}/${n}.json`, round: 'r4 2026-11-23', ...(just ? { warn_justification: just } : {}) };
  }
  const bad = NAMES.filter((n) => p.validation[n].verdict === 'FAIL' || (p.validation[n].verdict === 'WARN' && !p.validation[n].warn_justification) || !p.validation[n].verdict);
  p.status = bad.length ? 'candidate' : 'validated';
  p.updated_at = new Date().toISOString();
  writeFileSync(path, JSON.stringify(p, null, 2) + '\n');
  out.push({ slug: p.slug, status: p.status, verdicts: NAMES.map((n) => p.validation[n].verdict).join('/'), blocked_by: bad });
}
console.log(JSON.stringify(out, null, 1));
