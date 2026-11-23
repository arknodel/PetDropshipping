#!/usr/bin/env node
// Build candidate product records for US-stock shortlist (only US-stocked variants), priced for >=45% margin.
// Usage: node scripts/us-promote.mjs data/research/2026-11-23/us-stock [--write]
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const dir = process.argv[2];
const WRITE = process.argv.includes('--write');
const A = JSON.parse(readFileSync('data/assumptions.json', 'utf8'));
const FEE_PCT = A.payment_fee_pct ?? 0.029, FEE_FIX = A.payment_fee_fixed ?? 0.3, CAC = A.est_cac ?? 8;
const TARGET = 0.45, MIN_STOCK = 20;
const charm = (x) => Math.ceil(x) - 0.05;
const DROP = { CJJT1705040: 'US stock 9 units', CJHS1704134: 'US stock 2-5 units', CJYZ3560724: 'US stock 6 units' };
const CHOKING = new Set(['CJPB3207940']); // suction-cup lick mat
const TAG = { dogs: ['dogs'], cats: ['cats'] };
const SPECIES = { CJPL2458437: ['dogs', 'cats'], CJJT2334420: ['dogs', 'cats'], CJHR2994197: ['dogs', 'cats'], CJPL2422930: ['dogs', 'cats'], CJPB3207940: ['dogs', 'cats'], CJPC3147743: ['dogs', 'cats'], CJPL2662514: ['cats', 'dogs'] };
const CATEGORY = { dogs: 'dog', cats: 'cat' };

const detail = JSON.parse(readFileSync(`${dir}/us-detail.json`, 'utf8'));
const report = [];
let n = 0;
for (const d of detail) {
  if (DROP[d.cj_sku]) { report.push({ cj_sku: d.cj_sku, dropped: DROP[d.cj_sku] }); continue; }
  n += 1;
  const id = `gl-u${String(n).padStart(2, '0')}`;
  const vs = d.variants.filter((v) => v.us_stock >= MIN_STOCK && v.freight[0]);
  const worstBase = Math.max(...vs.map((v) => v.unit_cost + v.freight[0].price));
  const retail = charm((worstBase + FEE_FIX + CAC) / (1 - TARGET - FEE_PCT));
  const variants = vs.map((v, i) => {
    const ship = v.freight[0].price;
    const landed = v.unit_cost + ship + FEE_PCT * retail + FEE_FIX + CAC;
    return { sku: `GL-U${String(n).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`, title: vs.length === 1 ? 'Default Title' : String(v.key).replace(/-/g, ' / '),
      supplier_title: v.key, weight_g: v.weight_g, supplier_variant_id: v.vid, cj_variant_sku: v.cj_variant_sku, unit_cost: v.unit_cost,
      ship_cost_us: ship, shipping_method: v.freight[0].name, us_stock: v.us_stock, landed: +landed.toFixed(2), margin_pct: +((retail - landed) / retail).toFixed(3) };
  });
  const worst = variants.reduce((a, b) => (a.margin_pct < b.margin_pct ? a : b));
  const tMin = Math.min(...vs.map((v) => v.freight[0].dmin)), tMax = Math.max(...vs.map((v) => v.freight[0].dmax));
  const est = `Estimate: ${tMin}–${tMax} days to the US after 1–3 days of processing. Ships from a US warehouse.`;
  const rec = {
    id, slug: d.slug, status: 'candidate', category: CATEGORY[d.collection], collection: d.collection, tags: SPECIES[d.cj_sku] ?? TAG[d.collection],
    research: { name: d.slug.replace(/-/g, ' '), source: 'cj-us-search 2026-11-23', listed_stores: d.listed_stores, needs_choking_warning: CHOKING.has(d.cj_sku) },
    supplier: { name: 'CJdropshipping', app: 'CJ', url: `https://cjdropshipping.com/product/-p-${d.pid}.html`, supplier_sku: d.pid, cj_sku: d.cj_sku, cj_title: d.title,
      unit_cost: Math.max(...variants.map((v) => v.unit_cost)), ship_cost_us: Math.max(...variants.map((v) => v.ship_cost_us)),
      ships_from: 'US', warehouse: 'CJ US Warehouse', shipping_method: worst.shipping_method,
      shipping_note: variants.some((v) => v.ship_cost_us === 0) ? 'CJ US-to-US quote returned $0 freight (shipping included in CJ unit price).' : undefined,
      transit_days_min: tMin, transit_days_max: tMax, processing_days_min: 1, processing_days_max: 3, delivery_days_min: tMin + 1, delivery_days_max: tMax + 3,
      orders_count: d.listed_stores, rating: null, flags: CHOKING.has(d.cj_sku) ? ['choking_hazard'] : [], stock_checked_at: '2026-11-23',
      spec_path: `${dir}/specs/${d.cj_sku}.txt` },
    pricing: { retail, compare_at: null, landed: worst.landed, margin_pct: worst.margin_pct, margin_basis: 'worst variant, US->US freight 2026-11-23',
      breakeven_roas: +(retail / (retail - (worst.landed - CAC))).toFixed(2) },
    variants,
    images: d.images.slice(0, 6).map((src) => ({ src, alt: '', license_ok: true })),
    copy: { shipping_estimate: est }, seo: {}, validation: {}, updated_at: new Date().toISOString(),
  };
  const path = `data/products/${d.slug}.json`;
  if (WRITE) { if (existsSync(path)) throw new Error(`exists: ${path}`); writeFileSync(path, JSON.stringify(rec, null, 2) + '\n'); }
  report.push({ id, slug: d.slug, retail, worst_margin: worst.margin_pct, variants: variants.length, transit: `${tMin}-${tMax}`, images: rec.images.length });
}
console.log(JSON.stringify({ write: WRITE, report }, null, 1));
