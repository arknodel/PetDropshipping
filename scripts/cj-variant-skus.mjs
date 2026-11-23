#!/usr/bin/env node
// Fetch each mapped CJ variant's own SKU (variantSku) by vid and store it as variant.cj_variant_sku.
// Shopify variant SKUs are then set to these so CJ's automatic connection matches exactly by SKU.
// Usage: node scripts/cj-variant-skus.mjs [--write]
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { loadEnv } from './lib/shopify.mjs';
import { cj } from './lib/cj.mjs';

loadEnv();
const WRITE = process.argv.includes('--write');
const report = [];
for (const f of readdirSync('data/products').filter((f) => f.endsWith('.json'))) {
  const path = `data/products/${f}`;
  const p = JSON.parse(readFileSync(path, 'utf8'));
  if (p.status === 'dropped') continue;
  const d = await cj('/product/query', { query: { productSku: p.supplier.cj_sku } });
  const byVid = Object.fromEntries((d?.variants ?? []).map((v) => [String(v.vid), v]));
  for (const v of p.variants) {
    const cv = byVid[String(v.supplier_variant_id)];
    v.cj_variant_sku = cv?.variantSku ?? null;
    report.push({ slug: p.slug, sku: v.sku, title: v.title, cj_title: cv?.variantNameEn ?? cv?.variantKey ?? null, cj_variant_sku: v.cj_variant_sku, cj_price: cv ? Number(cv.variantSellPrice) : null, our_cost: v.unit_cost });
  }
  if (WRITE) writeFileSync(path, JSON.stringify(p, null, 2) + '\n');
}
const missing = report.filter((r) => !r.cj_variant_sku);
console.log(JSON.stringify({ write: WRITE, variants: report.length, missing: missing.length, rows: report }, null, 1));
