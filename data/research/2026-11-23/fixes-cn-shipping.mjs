// 2026-11-23: CJ stock is China-only for every variant (scripts/cj-stock.mjs). Apply real CN->US
// freight (cj-freight-cn.json), owner-approved price raises (chat: "Fine to raise prices"),
// honest shipping copy, and drop the feeder (18.7% margin at CN freight).
// Run from repo root: node data/research/2026-11-23/fixes-cn-shipping.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const A = JSON.parse(readFileSync('data/assumptions.json', 'utf8'));
const FEE_PCT = A.payment_fee_pct ?? 0.029, FEE_FIX = A.payment_fee_fixed ?? 0.3, CAC = A.est_cac ?? 8;
const F = Object.fromEntries(JSON.parse(readFileSync('data/research/2026-11-23/cj-freight-cn.json', 'utf8')).map((x) => [x.slug, x]));
const NEW_PRICE = { 'adjustable-mesh-cat-harness': 31.95, 'dog-car-seat-belt-tether': 34.95, 'suction-cup-lick-mat': 32.95 };
const P = (s) => `data/products/${s}.json`;
const report = [];

for (const slug of Object.keys(F)) {
  const p = JSON.parse(readFileSync(P(slug), 'utf8'));
  const best = F[slug].best;
  if (slug === 'elevated-cat-feeder-stand') {
    p.status = 'dropped';
    p.dropped_reason = '2026-11-23: CJ stock is China-only; best CN->US freight (LuWei Ordinary US) leaves 18.7% margin at $26.95. Fix needs >15% price rise (gated). Dropped.';
    p.updated_at = new Date().toISOString();
    writeFileSync(P(slug), JSON.stringify(p, null, 2) + '\n');
    report.push({ slug, status: 'dropped' });
    continue;
  }
  const oldRetail = p.pricing.retail;
  const retail = NEW_PRICE[slug] ?? oldRetail;
  const shipBySku = Object.fromEntries(best.variants.map((v) => [v.sku, v.ship]));
  let worst = null;
  for (const v of p.variants) {
    v.ship_cost_us = shipBySku[v.sku];
    const landed = v.unit_cost + v.ship_cost_us + FEE_PCT * retail + FEE_FIX + CAC;
    v.landed = +landed.toFixed(2);
    v.margin_pct = +((retail - landed) / retail).toFixed(3);
    if (!worst || v.margin_pct < worst.margin_pct) worst = v;
  }
  const tMin = best.dmin, tMax = best.dmax;
  p.supplier = { ...p.supplier, ships_from: 'CN', warehouse: 'CJ China Warehouse', shipping_method: best.name,
    ship_cost_us: Math.max(...p.variants.map((v) => v.ship_cost_us)),
    transit_days_min: tMin, transit_days_max: tMax, processing_days_min: 1, processing_days_max: 3,
    delivery_days_min: tMin + 1, delivery_days_max: tMax + 3,
    stock_checked_at: '2026-11-23', stock_note: 'US warehouse 0 for all variants; China warehouse in stock (cj-stock.json).' };
  p.pricing = { ...p.pricing, retail, previous_retail: oldRetail !== retail ? oldRetail : p.pricing.previous_retail,
    landed: worst.landed, margin_pct: worst.margin_pct, margin_basis: 'worst variant, CN freight 2026-11-23',
    breakeven_roas: +(retail / (retail - (worst.landed - CAC))).toFixed(2) };

  const est = `Estimate: ${tMin}–${tMax} days to the US after 1–3 days of processing. Ships from China.`;
  const fix = (s) => typeof s === 'string'
    ? s.replace(/Estimated? ?:? ?3–[78] business days to the US, plus processing 1–3 days\.?/g, est)
       .replace(/^3–[78] business days to the US, plus processing 1–3 days\.?$/g, est)
    : s;
  const walk = (o) => (Array.isArray(o) ? o.map(walk) : o && typeof o === 'object' ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, walk(v)])) : fix(o));
  p.copy = walk(p.copy);
  p.copy.shipping_estimate = est;
  const stale = JSON.stringify(p.copy).match(/3–[78] business days|US warehouse/g);

  // Changed facts invalidate prior verdicts: require a fresh validator pass before the gate.
  for (const k of Object.keys(p.validation ?? {})) p.validation[k] = { ...p.validation[k], verdict: 'PENDING', stale_reason: 'shipping origin/time + price changed 2026-11-23' };
  p.status = 'candidate';
  p.updated_at = new Date().toISOString();
  writeFileSync(P(slug), JSON.stringify(p, null, 2) + '\n');
  report.push({ slug, retail, was: oldRetail, method: best.name, transit: `${tMin}-${tMax}`, worst_margin: worst.margin_pct, stale_copy: stale });
}
console.log(JSON.stringify(report, null, 1));
