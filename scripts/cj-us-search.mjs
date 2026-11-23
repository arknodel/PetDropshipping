#!/usr/bin/env node
// Find CJ pet products with REAL US-warehouse stock (verified per variant), quote US->US freight,
// and compute margin at a charm price. Output feeds Opus fit review + validators.
// Usage: node scripts/cj-us-search.mjs <outdir>   (writes <outdir>/us-candidates.json)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { loadEnv } from './lib/shopify.mjs';
import { cj } from './lib/cj.mjs';

loadEnv();
const outdir = process.argv[2] ?? 'data/research/us-stock';
mkdirSync(outdir, { recursive: true });
const A = JSON.parse(readFileSync('data/assumptions.json', 'utf8'));
const FEE_PCT = A.payment_fee_pct ?? 0.029, FEE_FIX = A.payment_fee_fixed ?? 0.3, CAC = A.est_cac ?? 8;
const KEYWORDS = ['dog harness', 'cat harness', 'dog leash', 'dog collar', 'pet grooming brush', 'cat brush', 'pet hair remover',
  'lick mat', 'slow feeder bowl', 'pet water bottle', 'dog bowl', 'cat bowl', 'pet bed', 'cat bed', 'dog toy', 'cat toy',
  'cat scratcher', 'pet car seat', 'dog raincoat', 'pet cooling mat', 'dog poop bag', 'pet nail clipper', 'cat litter mat', 'pet blanket'];
const aging = (s) => { const m = String(s ?? '').match(/(\d+)\s*-\s*(\d+)/); return m ? [Number(m[1]), Number(m[2])] : [null, null]; };
const charm = (x) => Math.ceil(x) - 0.05;

const seen = new Set();
const rows = [];
for (const kw of KEYWORDS) {
  let list;
  try { list = await cj('/product/listV2', { query: { keyWord: kw, countryCode: 'US', page: 1, size: 10 } }); }
  catch (e) { rows.push({ kw, error: e.message }); continue; }
  const products = (list?.content ?? []).flatMap((x) => x.productList ?? []);
  for (const lp of products.slice(0, 6)) {
    const pid = lp.id ?? lp.pid;
    if (!pid || seen.has(pid)) continue;
    seen.add(pid);
    const d = await cj('/product/query', { query: { pid } }).catch(() => null);
    const vars = d?.variants ?? [];
    if (!vars.length) continue;
    let usVariants = 0, checked = 0, firstUsVid = null;
    for (const v of vars.slice(0, 8)) {
      const st = await cj('/product/stock/queryByVid', { query: { vid: v.vid } }).catch(() => []);
      const us = (Array.isArray(st) ? st : []).filter((s) => s.countryCode === 'US').reduce((a, s) => a + Number(s.totalInventoryNum ?? 0), 0);
      checked++;
      if (us > 0) { usVariants++; firstUsVid ??= v.vid; }
    }
    if (!usVariants) { rows.push({ kw, pid, name: d.productNameEn, us_stock: false }); continue; }
    const fr = await cj('/logistic/freightCalculate', { method: 'POST', body: { startCountryCode: 'US', endCountryCode: 'US', products: [{ quantity: 1, vid: firstUsVid }] } }).catch(() => []);
    const best = (Array.isArray(fr) ? fr : []).sort((a, b) => a.logisticPrice - b.logisticPrice)[0];
    const v0 = vars.find((v) => v.vid === firstUsVid);
    const unit = Number(v0?.variantSellPrice ?? d.sellPrice);
    const ship = best ? Number(best.logisticPrice) : null;
    const [dmin, dmax] = aging(best?.logisticAging);
    // Retail needed for 45% margin: r = (unit+ship+fix+CAC)/(1-0.45-fee_pct)
    const target = ship != null ? charm((unit + ship + FEE_FIX + CAC) / (1 - 0.45 - FEE_PCT)) : null;
    const landed = ship != null ? unit + ship + FEE_PCT * target + FEE_FIX + CAC : null;
    rows.push({ kw, pid, cj_sku: d.productSku, name: d.productNameEn, category: d.categoryName, us_stock: true,
      us_variants: usVariants, variants_checked: checked, variants_total: vars.length, listed_stores: Number(d.listedNum ?? lp.listedNum ?? 0),
      unit_cost: unit, ship_us: ship, method: best?.logisticName ?? null, transit: dmin != null ? `${dmin}-${dmax}` : null,
      suggested_retail: target, margin_at_suggested: landed ? +((target - landed) / target).toFixed(3) : null,
      in_band: target != null && target >= 15 && target <= 80, url: `https://cjdropshipping.com/product/-p-${pid}.html` });
  }
}
writeFileSync(`${outdir}/us-candidates.json`, JSON.stringify(rows, null, 1) + '\n');
const ok = rows.filter((r) => r.us_stock && r.in_band && r.listed_stores >= 20);
console.log(JSON.stringify({ scanned: rows.length, us_stock: rows.filter((r) => r.us_stock).length, passing_band_and_stores: ok.length,
  top: ok.sort((a, b) => b.listed_stores - a.listed_stores).slice(0, 25).map((r) => ({ name: r.name.slice(0, 60), sku: r.cj_sku, retail: r.suggested_retail, transit: r.transit, stores: r.listed_stores, us_var: `${r.us_variants}/${r.variants_total}` })) }, null, 1));
