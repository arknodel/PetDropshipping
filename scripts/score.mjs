#!/usr/bin/env node
// Phase 1 scoring: candidates + supplier data -> margin, hard filters, weighted score.
// Usage: node scripts/score.mjs data/research/<date>
// Deterministic; replaces the margin-calc agent (same formulas as data/assumptions.json).
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2];
if (!dir) { console.error('usage: node scripts/score.mjs data/research/<date>'); process.exit(1); }
const A = JSON.parse(readFileSync('data/assumptions.json', 'utf8'));
const S = JSON.parse(readFileSync('data/scoring.json', 'utf8'));
const candidates = JSON.parse(readFileSync(join(dir, 'candidates.json'), 'utf8'));
const suppliers = readdirSync(dir).filter((f) => /^supplier-batch\d+\.json$/.test(f))
  .flatMap((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')));
const byId = Object.fromEntries(suppliers.map((s) => [s.id, s]));

const F = S.hard_filters;
const SAFETY_REJECT = ['battery_lithium', 'chemical', 'ingestible', 'trademark_risk'];
const clamp = (x) => Math.max(0, Math.min(10, x));
const round2 = (x) => Math.round(x * 100) / 100;

export function landed(unit, ship, retail) {
  return unit + ship + A.payment_fee_pct * retail + A.payment_fee_fixed + A.est_cac;
}

// Smallest charm price (x.99 / x.95) whose margin >= min_margin_pct.
function charmRetail(unit, ship) {
  const need = (unit + ship + A.payment_fee_fixed + A.est_cac) / (1 - A.min_margin_pct - A.payment_fee_pct);
  for (let dollars = Math.floor(A.price_band.min); dollars <= A.price_band.max; dollars++) {
    for (const end of [0.95, 0.99]) {
      const p = dollars + end;
      if (p >= need && p >= A.price_band.min && p <= A.price_band.max) return round2(p);
    }
  }
  return null;
}

const rows = candidates.map((c) => {
  const s = byId[c.id] ?? {};
  const reasons = [];
  const req = ['unit_cost', 'ship_cost_us', 'delivery_days_max', 'supplier_rating', 'orders_count'];
  for (const k of req) if (s[k] === null || s[k] === undefined) reasons.push(`unverified ${k}`);
  const flags = s.flags ?? [];
  if (flags.some((f) => F.reject_flags.includes(f))) reasons.push(`flag ${flags.filter((f) => F.reject_flags.includes(f))}`);
  if (flags.some((f) => SAFETY_REJECT.includes(f))) reasons.push(`safety ${flags.filter((f) => SAFETY_REJECT.includes(f))}`);

  let retail = null, land = null, margin = null, roas = null;
  if (s.unit_cost != null && s.ship_cost_us != null) {
    retail = charmRetail(s.unit_cost, s.ship_cost_us);
    if (retail == null) reasons.push('cannot hit 40% margin within $15–$80');
    else {
      land = round2(landed(s.unit_cost, s.ship_cost_us, retail));
      margin = round2((retail - land) / retail);
      roas = round2(retail / (retail - (land - A.est_cac)));
    }
  }
  if (s.delivery_days_max != null && s.delivery_days_max > F.max_delivery_days) reasons.push(`delivery ${s.delivery_days_max}d > ${F.max_delivery_days}`);
  if (s.supplier_rating != null && s.supplier_rating < F.min_supplier_rating) reasons.push(`rating ${s.supplier_rating} < ${F.min_supplier_rating}`);
  if (s.orders_count != null && s.orders_count < F.min_orders_or_reviews) reasons.push(`orders ${s.orders_count} < ${F.min_orders_or_reviews}`);

  const d = s.delivery_days_max;
  const factors = {
    demand: c.demand,
    margin: retail ? clamp(10 - (retail - 15) / 6.5) : 0,
    shipping_speed: d == null ? 0 : d <= 5 ? 10 : d <= F.preferred_delivery_days ? 8 : d <= 10 ? 5 : 3,
    supplier_quality: s.supplier_rating == null ? 0 : clamp((s.supplier_rating - 4.0) * 20),
    low_competition: c.competition,
    problem_solving: c.problem_solving,
    wow_factor: c.wow,
  };
  const score = round2(Object.entries(S.weights).reduce((sum, [k, w]) => sum + w * factors[k], 0));
  return {
    id: c.id, name: c.name, category: c.category, collection: c.collection,
    pass: reasons.length === 0, reasons, score, factors,
    retail, landed: land, margin_pct: margin, breakeven_roas: roas,
    needs_choking_warning: flags.includes('choking_hazard'),
    supplier: s,
  };
}).sort((a, b) => (b.pass - a.pass) || (b.score - a.score));

writeFileSync(join(dir, 'scored.json'), JSON.stringify(rows, null, 2) + '\n');
const passing = rows.filter((r) => r.pass);
console.log(`candidates=${rows.length} pass=${passing.length}`);
for (const r of rows) console.log(`${r.pass ? 'PASS' : 'fail'} ${r.score.toFixed(2)} ${r.id} ${r.retail ?? '-'} ${r.margin_pct ?? '-'} ${r.name}${r.pass ? '' : '  <- ' + r.reasons.join('; ')}`);
