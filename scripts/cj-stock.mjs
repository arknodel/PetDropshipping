#!/usr/bin/env node
// Per-variant CJ stock by warehouse country for all non-dropped products.
// Usage: node scripts/cj-stock.mjs   -> JSON summary (US vs CN units per variant)
import { readdirSync, readFileSync } from 'node:fs';
import { loadEnv } from './lib/shopify.mjs';
import { cj } from './lib/cj.mjs';

loadEnv();
const out = [];
for (const f of readdirSync('data/products').filter((f) => f.endsWith('.json'))) {
  const p = JSON.parse(readFileSync(`data/products/${f}`, 'utf8'));
  if (p.status === 'dropped') continue;
  const rows = [];
  for (const v of p.variants) {
    try {
      const r = await cj('/product/stock/queryByVid', { query: { vid: v.supplier_variant_id } });
      const by = {};
      for (const s of (Array.isArray(r) ? r : r?.data ?? [])) by[s.countryCode] = (by[s.countryCode] ?? 0) + Number(s.totalInventoryNum ?? s.storageNum ?? 0);
      rows.push({ sku: v.sku, title: v.title, US: by.US ?? 0, CN: by.CN ?? 0, other: Object.fromEntries(Object.entries(by).filter(([k]) => !['US', 'CN'].includes(k))) });
    } catch (e) { rows.push({ sku: v.sku, error: e.message }); }
  }
  out.push({ slug: p.slug, cj_sku: p.supplier.cj_sku, us_variants: rows.filter((r) => r.US > 0).length, total: rows.length, rows });
}
console.log(JSON.stringify(out, null, 1));
