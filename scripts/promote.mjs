#!/usr/bin/env node
// Turn the top N passing rows of scored.json into canonical product records
// (data/products/<slug>.json, status "candidate"). Copy/SEO/alt are filled by agents later.
// Usage: node scripts/promote.mjs data/research/<date> [N=10]
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2];
const N = Number(process.argv[3] ?? 10);
const rows = JSON.parse(readFileSync(join(dir, 'scored.json'), 'utf8')).filter((r) => r.pass).slice(0, N);

const slugify = (s) => s.toLowerCase().replace(/\(.*?\)/g, '').replace(/&/g, 'and')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

const written = [];
for (const r of rows) {
  const s = r.supplier;
  const slug = slugify(r.name);
  const path = join('data/products', `${slug}.json`);
  if (existsSync(path)) { written.push({ slug, skipped: 'exists' }); continue; }
  const rec = {
    id: `gl-${r.id}`,
    slug,
    status: 'candidate',
    category: r.category === 'both' ? (r.collection === 'cats' ? 'cat' : 'dog') : r.category,
    collection: r.collection,
    tags: [r.category === 'both' ? 'dogs-and-cats' : `${r.category}s`],
    score: r.score,
    research: { name: r.name, factors: r.factors, needs_choking_warning: r.needs_choking_warning },
    supplier: {
      name: s.supplier, app: 'CJ', url: s.supplier_url, supplier_sku: s.cj_pid,
      unit_cost: s.unit_cost, ship_cost_us: s.ship_cost_us, ships_from: s.ships_from,
      shipping_method: s.shipping_method,
      delivery_days_min: s.delivery_days_min, delivery_days_max: s.delivery_days_max,
      rating: s.supplier_rating, orders_count: s.orders_count, flags: s.flags ?? [],
    },
    pricing: { retail: r.retail, compare_at: null, landed: r.landed, margin_pct: r.margin_pct, breakeven_roas: r.breakeven_roas },
    variants: [{ sku: `GL-${r.id.toUpperCase()}`, title: 'Default Title', weight_g: s.weight_g, supplier_variant_id: s.cj_vid }],
    images: (s.images ?? []).map((src) => ({ src, alt: '', license_ok: Boolean(s.image_license_ok) })),
    copy: {},
    seo: {},
    validation: {},
    updated_at: new Date().toISOString(),
  };
  writeFileSync(path, JSON.stringify(rec, null, 2) + '\n');
  written.push({ slug, retail: r.retail, margin: r.margin_pct, days: `${s.delivery_days_min}-${s.delivery_days_max}` });
}
console.log(JSON.stringify(written, null, 2));
