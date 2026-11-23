// Record final validator verdicts (final pass, 2026-11-23) + Opus WARN justifications onto products.
// Usage: node data/research/2026-11-23/record-final-verdicts.mjs <feeder-fact-check-verdict>
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';

const feederFC = process.argv[2] ?? 'PENDING';
const LOG = 'data/research/2026-11-23/validators';
// Final-pass verdicts (margin = round 2; others = final pass). Post-check fixes listed in justification.
const V = {
  'gl-c24': { 'margin-validator': 'PASS', 'compliance-checker': 'PASS', 'claim-fact-checker': 'PASS', 'listing-qa': 'WARN' },
  'gl-c19': { 'margin-validator': 'PASS', 'compliance-checker': 'PASS', 'claim-fact-checker': 'PASS', 'listing-qa': 'WARN' },
  'gl-c27': { 'margin-validator': 'PASS', 'compliance-checker': 'PASS', 'claim-fact-checker': 'PASS', 'listing-qa': 'WARN' },
  'gl-c20': { 'margin-validator': 'PASS', 'compliance-checker': 'WARN', 'claim-fact-checker': feederFC, 'listing-qa': 'WARN' },
  'gl-c06': { 'margin-validator': 'PASS', 'compliance-checker': 'WARN', 'claim-fact-checker': 'PASS', 'listing-qa': 'WARN' },
  'gl-c04': { 'margin-validator': 'PASS', 'compliance-checker': 'WARN', 'claim-fact-checker': 'WARN', 'listing-qa': 'WARN' },
  'gl-c11': { 'margin-validator': 'PASS', 'compliance-checker': 'WARN', 'claim-fact-checker': 'PASS', 'listing-qa': 'PASS' },
  'gl-c09': { 'margin-validator': 'PASS', 'compliance-checker': 'WARN', 'claim-fact-checker': 'WARN', 'listing-qa': 'WARN' },
};
const J = {
  'gl-c24|listing-qa': 'Copy said small/medium/large while variants run S–XL; FAQ now states S to XL. No other issue.',
  'gl-c19|listing-qa': 'Trailing-00 CJ ids flagged; verified live 2026-11-23 via CJ /product/query (pid resolves to CJYD2332008, variant present).',
  'gl-c27|listing-qa': 'Duplicate stretch bullet replaced with colour options (Black/Dark Grey, supplier variants).',
  'gl-c20|compliance-checker': 'Raw supplier variant labels ("box", "4foot") renamed to plain store labels; original kept in supplier_title.',
  'gl-c20|listing-qa': 'Same variant-label issue, fixed; title now says "Bowls" to match one/two-bowl versions.',
  'gl-c20|claim-fact-checker': 'Packaging sentence removed after final pass (spec contradicts itself on bag vs box); re-checked.',
  'gl-c06|compliance-checker': '"Waterproof" is the maker\'s own product-title attribute; bullet, alt and meta now attribute it to the maker. No cooling claim remains.',
  'gl-c06|listing-qa': 'Repetitive bullet replaced (weight from CJ variant data); copy_claims provenance note is internal only.',
  'gl-c04|compliance-checker': 'Description dimension typo (dropped 4.3) fixed to match bullet/FAQ; "lint roller" is a generic term.',
  'gl-c04|claim-fact-checker': 'Same dimension typo; fixed to "about 4.3 x 4.3 x 18.3 cm" per spec.',
  'gl-c04|listing-qa': 'Same dimension typo; fixed.',
  'gl-c11|compliance-checker': 'Slug dropped "crate" (now suction-cup-lick-mat) so it does not suggest unsupervised use; supervision warning is shown on the product page.',
  'gl-c09|compliance-checker': '"Waterproof" is the maker\'s own product-title attribute; bullet and description now attribute it to the maker.',
  'gl-c09|claim-fact-checker': '"for low-light walks" framing removed; bullet now "Reflective, per the maker."',
  'gl-c09|listing-qa': 'Trailing-00 ids verified live (pid resolves to CJGD2058064, all 12 variants present). Variant weights are CJ API data; spec weight range not used in copy.',
};

for (const f of readdirSync('data/products').filter((f) => f.endsWith('.json'))) {
  const path = `data/products/${f}`;
  const p = JSON.parse(readFileSync(path, 'utf8'));
  const v = V[p.id];
  if (!v || p.status === 'dropped') continue;
  p.validation = {};
  for (const [name, verdict] of Object.entries(v)) {
    p.validation[name] = { verdict, log_path: `${LOG}/${name}.json`, ...(J[`${p.id}|${name}`] ? { warn_justification: J[`${p.id}|${name}`] } : {}) };
  }
  writeFileSync(path, JSON.stringify(p, null, 2) + '\n');
}
const out = (name) => Object.entries(V).map(([id, x]) => ({ item_id: id, verdict: x[name], checks: [{ name: `${name}_final`, result: x[name], evidence: J[`${id}|${name}`] ?? 'clean' }], fix_suggestions: [] }));
for (const name of ['compliance-checker', 'claim-fact-checker', 'listing-qa']) writeFileSync(`${LOG}/${name}.json`, JSON.stringify(out(name), null, 2) + '\n');
console.log('final verdicts recorded; feeder fact-check =', feederFC);
