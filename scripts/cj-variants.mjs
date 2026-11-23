#!/usr/bin/env node
// Re-resolve each product by CJ SKU (string-safe ids) and map real supplier variants.
// Variants whose unit cost would push margin under the floor at the current retail are left out.
// Usage: node scripts/cj-variants.mjs
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { cj } from './lib/cj.mjs';

const A = JSON.parse(readFileSync('data/assumptions.json', 'utf8'));
const margin = (unit, ship, retail) => (retail - (unit + ship + A.payment_fee_pct * retail + A.payment_fee_fixed + A.est_cac)) / retail;
const MAX_VARIANTS = 12;

for (const f of readdirSync('data/products').filter((f) => f.endsWith('.json'))) {
  const path = join('data/products', f);
  const p = JSON.parse(readFileSync(path, 'utf8'));
  if (p.status === 'dropped') continue;
  const sku = p.supplier.cj_sku;
  if (!sku) { console.log(`${p.slug}: no cj_sku, skipped`); continue; }
  const d = await cj('/product/query', { query: { productSku: sku } });
  const pid = String(d.pid);
  const ship = p.supplier.ship_cost_us;
  const all = (d.variants ?? []).map((v) => ({
    vid: String(v.vid), key: v.variantKey || v.variantNameEn || 'Default',
    cost: Number(v.variantSellPrice), weight: v.variantWeight != null ? Number(v.variantWeight) : null,
  }));
  const kept = all.filter((v) => margin(v.cost, ship, p.pricing.retail) >= A.min_margin_pct).slice(0, MAX_VARIANTS);
  const dropped = all.length - kept.length;
  if (!kept.length) { console.log(`${p.slug}: no variant meets margin at ${p.pricing.retail}`); continue; }

  const single = kept.length === 1;
  p.supplier.supplier_sku = pid;
  p.supplier.url = `https://cjdropshipping.com/product/-p-${pid}.html`;
  p.supplier.unit_cost = Math.max(...kept.map((v) => v.cost));
  p.variants = kept.map((v, i) => ({
    sku: single ? `GL-${p.id.slice(3).toUpperCase()}` : `GL-${p.id.slice(3).toUpperCase()}-${String(i + 1).padStart(2, '0')}`,
    title: single ? 'Default Title' : v.key,
    weight_g: v.weight,
    supplier_variant_id: v.vid,
    unit_cost: v.cost,
  }));
  const worst = Math.min(...kept.map((v) => margin(v.cost, ship, p.pricing.retail)));
  p.pricing.margin_pct = Math.round(worst * 100) / 100;
  p.pricing.landed = Math.round((p.supplier.unit_cost + ship + A.payment_fee_pct * p.pricing.retail + A.payment_fee_fixed + A.est_cac) * 100) / 100;
  p.variant_note = `${kept.length} of ${all.length} CJ variants mapped${dropped ? ` (${dropped} excluded: margin or cap ${MAX_VARIANTS})` : ''}; shipping quote taken from the base variant.`;
  p.updated_at = new Date().toISOString();
  writeFileSync(path, JSON.stringify(p, null, 2) + '\n');
  console.log(`${p.slug}: pid ${pid}, ${kept.length}/${all.length} variants, worst margin ${worst.toFixed(3)} | ${kept.map((v) => v.key).join(', ').slice(0, 90)}`);
}
