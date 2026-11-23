// Record US-batch validator verdicts + Opus WARN justifications; gate to validated. Run from repo root.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
const DIR = 'data/research/2026-11-23/us-stock/validators';
const NAMES = ['margin-validator', 'compliance-checker', 'claim-fact-checker', 'listing-qa'];
const SLUG2ID = {};
for (const f of readdirSync('data/products').filter((f) => f.endsWith('.json'))) { const p = JSON.parse(readFileSync(`data/products/${f}`, 'utf8')); SLUG2ID[p.slug] = p.id; for (const s of p.previous_slugs ?? []) SLUG2ID[s] = p.id; }
const V = Object.fromEntries(NAMES.map((n) => [n, Object.fromEntries(JSON.parse(readFileSync(`${DIR}/${n}.json`, 'utf8')).map((x) => [SLUG2ID[x.item_id] ?? x.item_id, x.verdict]))]));

// Harness leash length: use the maker's inch figure.
{
  const path = 'data/products/adjustable-reflective-pet-harness.json';
  const p = JSON.parse(readFileSync(path, 'utf8'));
  p.copy = JSON.parse(JSON.stringify(p.copy).split('1.2 m (about 47 in)').join('1.2 m (48 in, per the maker)'));
  p.copy_claims = (p.copy_claims ?? []).map((c) => c.replace(/about 47 in \(1\.2 m\)/g, '48 in (1.2 m) per spec'));
  writeFileSync(path, JSON.stringify(p, null, 2) + '\n');
}

const SHIP0 = 'CJ US-to-US quote is $0 because shipping is built into the CJ unit price (verified per variant in us-detail.json); margin uses that unit price. Fulfil on the pinned $0 method.';
const J = {
  'margin-validator': (id) => (id === 'gl-u05' ? `${SHIP0} Sensitivity: at USPS $2.30 the margin is ~40.4%, still at the floor.` : SHIP0),
  'compliance-checker': (id) => ({
    'gl-u03': 'Bullet 4 now attributed to the maker (fixes-r1).',
    'gl-u04': "Alt width now 'about 1 inch (25 mm)' (fixes-r1).",
    'gl-u05': 'supplier.cj_title is internal and never rendered (site/Shopify use copy.title).',
    'gl-u06': 'Tangle claim now attributed (fixes-r1).',
  }[id]),
  'claim-fact-checker': (id) => ({
    'gl-u01': 'Sparse spec; copy limited to title, material, weight and colour facts.',
    'gl-u02': "Unsupported 'quick' removed; reuse is the maker's 'Reusable' title claim, attributed.",
    'gl-u03': 'All performance claims attributed to the maker; no health claims.',
    'gl-u04': "Spec lists both Cloth and nylon; copy attributes 'nylon' to the maker's description.",
    'gl-u05': "'Food-grade' and care claims attributed to the maker; health claims excluded; choking warning present.",
    'gl-u06': 'Performance claims attributed to the maker.',
    'gl-u07': 'Performance claims attributed; spec health claims excluded.',
    'gl-u08': "Leash length now '1.2 m (48 in, per the maker)' to match spec; other claims attributed.",
    'gl-u09': 'Copy follows the sold variants (S/M, 4 colours) and listed polyester; spec inconsistencies not repeated.',
  }[id]),
  'listing-qa': (id) => ({ 'gl-u09': 'Repeated 150 g sentence removed (fixes-r2).' }[id]),
};

const out = [];
for (const f of readdirSync('data/products').filter((f) => f.endsWith('.json'))) {
  const path = `data/products/${f}`;
  const p = JSON.parse(readFileSync(path, 'utf8'));
  if (!/^gl-u\d+$/.test(p.id)) continue;
  p.validation = {};
  for (const n of NAMES) {
    const verdict = V[n][p.id];
    const just = verdict === 'WARN' ? J[n](p.id) : undefined;
    p.validation[n] = { verdict, log_path: `${DIR}/${n}.json`, round: 'us-r1/r2 2026-11-23', ...(just ? { warn_justification: just } : {}) };
  }
  const bad = NAMES.filter((n) => !p.validation[n].verdict || p.validation[n].verdict === 'FAIL' || (p.validation[n].verdict === 'WARN' && !p.validation[n].warn_justification));
  p.status = bad.length ? 'candidate' : 'validated';
  p.updated_at = new Date().toISOString();
  writeFileSync(path, JSON.stringify(p, null, 2) + '\n');
  out.push({ id: p.id, slug: p.slug, status: p.status, v: NAMES.map((n) => p.validation[n].verdict).join('/'), blocked_by: bad });
}
console.log(JSON.stringify(out, null, 1));
