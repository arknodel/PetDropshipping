#!/usr/bin/env node
// Merge agent outputs (copy/, seo/, alt/, validators/) into data/products/<slug>.json.
// Usage: node scripts/merge-content.mjs data/research/<date>
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2];
const read = (p) => (existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null);
const validators = existsSync(join(dir, 'validators'))
  ? readdirSync(join(dir, 'validators')).filter((f) => f.endsWith('.json'))
      .flatMap((f) => { const name = f.replace(/\.json$/, ''); return (read(join(dir, 'validators', f)) ?? []).map((v) => ({ ...v, validator: name })); })
  : [];

const report = [];
for (const f of readdirSync('data/products').filter((f) => f.endsWith('.json') && !f.startsWith('_'))) {
  const path = join('data/products', f);
  const p = JSON.parse(readFileSync(path, 'utf8'));
  const copy = read(join(dir, 'copy', `${p.slug}.json`));
  const seo = read(join(dir, 'seo', `${p.slug}.json`));
  const alt = read(join(dir, 'alt', `${p.slug}.json`));
  if (copy) {
    const { claims_used, ...rest } = copy;
    p.copy = rest;
    p.copy_claims = claims_used ?? [];
  }
  if (seo) p.seo = seo;
  if (alt?.alts) p.images = p.images.map((img, i) => ({ ...img, alt: alt.alts[i] ?? img.alt }));
  for (const v of validators.filter((v) => v.item_id === p.id)) {
    p.validation[v.validator] = {
      verdict: v.verdict,
      log_path: join(dir, 'validators', `${v.validator}.json`).replace(/\\/g, '/'),
      ...(p.validation[v.validator]?.warn_justification ? { warn_justification: p.validation[v.validator].warn_justification } : {}),
    };
  }
  p.updated_at = new Date().toISOString();
  writeFileSync(path, JSON.stringify(p, null, 2) + '\n');
  report.push({ slug: p.slug, copy: !!copy, seo: !!seo, alt: !!alt, validation: Object.fromEntries(Object.entries(p.validation).map(([k, v]) => [k, v.verdict])) });
}
console.log(JSON.stringify(report, null, 2));
