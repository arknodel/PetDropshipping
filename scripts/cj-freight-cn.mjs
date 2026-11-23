#!/usr/bin/env node
// Real CN->US freight per variant (stock is CN-only as of 2026-11-23), pick a method per product,
// and recompute margin per variant with the same formula as data/assumptions.json.
// Usage: node scripts/cj-freight-cn.mjs > data/research/2026-11-23/cj-freight-cn.json
import { readdirSync, readFileSync } from 'node:fs';
import { loadEnv } from './lib/shopify.mjs';
import { cj } from './lib/cj.mjs';

loadEnv();
const A = JSON.parse(readFileSync('data/assumptions.json', 'utf8'));
const S = JSON.parse(readFileSync('data/scoring.json', 'utf8'));
const FEE_PCT = A.payment_fee_pct ?? 0.029, FEE_FIX = A.payment_fee_fixed ?? 0.3, CAC = A.est_cac ?? 8;
const MAX_DAYS = (S.hard_filters ?? S).max_delivery_days ?? 12;
const aging = (s) => { const m = String(s ?? '').match(/(\d+)\s*-\s*(\d+)/); return m ? [Number(m[1]), Number(m[2])] : [null, null]; };

const out = [];
for (const f of readdirSync('data/products').filter((f) => f.endsWith('.json'))) {
  const p = JSON.parse(readFileSync(`data/products/${f}`, 'utf8'));
  if (p.status === 'dropped') continue;
  const retail = p.pricing.retail;
  const perVariant = [];
  for (const v of p.variants) {
    const q = await cj('/logistic/freightCalculate', { method: 'POST', body: { startCountryCode: 'CN', endCountryCode: 'US', products: [{ quantity: 1, vid: v.supplier_variant_id }] } }).catch((e) => ({ error: e.message }));
    const opts = (Array.isArray(q) ? q : []).map((o) => { const [a, b] = aging(o.logisticAging); return { name: o.logisticName, price: Number(o.logisticPrice), dmin: a, dmax: b }; });
    perVariant.push({ sku: v.sku, title: v.title, unit_cost: v.unit_cost, opts, error: q?.error });
  }
  // Method must be one that every variant can use, within MAX_DAYS; choose lowest worst-case landed.
  const names = [...new Set(perVariant.flatMap((r) => r.opts.map((o) => o.name)))];
  const candidates = names.map((name) => {
    const rows = perVariant.map((r) => ({ ...r, o: r.opts.find((o) => o.name === name) }));
    if (rows.some((r) => !r.o || r.o.dmax == null || r.o.dmax > MAX_DAYS)) return null;
    const vs = rows.map((r) => {
      const landed = r.unit_cost + r.o.price + FEE_PCT * retail + FEE_FIX + CAC;
      return { sku: r.sku, title: r.title, ship: r.o.price, landed: +landed.toFixed(2), margin: +((retail - landed) / retail).toFixed(3) };
    });
    return { name, dmin: Math.min(...rows.map((r) => r.o.dmin)), dmax: Math.max(...rows.map((r) => r.o.dmax)), min_margin: Math.min(...vs.map((x) => x.margin)), variants: vs };
  }).filter(Boolean).sort((a, b) => b.min_margin - a.min_margin || a.dmax - b.dmax);
  out.push({
    slug: p.slug, retail, old_method: p.supplier.shipping_method, old_days: `${p.supplier.delivery_days_min}-${p.supplier.delivery_days_max}`,
    best: candidates[0] ?? null,
    alternatives: candidates.slice(1, 4).map(({ variants, ...c }) => c),
    all_method_names: names, errors: perVariant.filter((r) => r.error).map((r) => r.sku),
  });
}
console.log(JSON.stringify(out, null, 1));
