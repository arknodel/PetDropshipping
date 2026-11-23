#!/usr/bin/env node
// Supplier vetting via the official CJdropshipping API (replaces web scraping, which
// hits bot walls). Writes supplier-batch-cj.json in data/schemas/supplier shape.
// Usage: node scripts/cj-vet.mjs data/research/<date> [--limit 5]
// Env: CJ_API_KEY (from CJ dashboard > Authorization > API). Never logged.
// NOTE: endpoint paths/fields follow CJ API v2 docs; verify on first live run.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadEnv } from './lib/shopify.mjs';

loadEnv();
const dir = process.argv[2];
if (!dir) { console.error('usage: node scripts/cj-vet.mjs data/research/<date> [--limit N]'); process.exit(1); }
const limitArg = process.argv.indexOf('--limit');
const PER_PRODUCT = limitArg > 0 ? Number(process.argv[limitArg + 1]) : 5;
const BASE = 'https://developers.cjdropshipping.com/api2.0/v1';
const KEY = process.env.CJ_API_KEY;
if (!KEY) { console.log(JSON.stringify({ skipped: 'CJ_API_KEY not set (APR-010)' })); process.exit(0); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function cj(path, { method = 'GET', token, body, query } = {}) {
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(query ?? {})) url.searchParams.set(k, v);
  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { 'CJ-Access-Token': token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  await sleep(1100); // CJ free tier is rate limited (~1 req/s)
  if (!res.ok || json.result === false || (json.code && json.code !== 200)) {
    throw new Error(`CJ ${path}: HTTP ${res.status} ${json.message ?? ''}`.trim());
  }
  return json.data;
}

const parseAging = (s) => {
  const m = String(s ?? '').match(/(\d+)\s*-\s*(\d+)/);
  return m ? [Number(m[1]), Number(m[2])] : [null, null];
};

const { accessToken } = await cj('/authentication/getAccessToken', { method: 'POST', body: { apiKey: KEY } });
const candidates = JSON.parse(readFileSync(join(dir, 'candidates.json'), 'utf8'));
const out = [];

for (const c of candidates) {
  const query = c.name.replace(/\(.*?\)/g, '').trim();
  let best = null;
  try {
    // /product/list ignores name filters; listV2 + keyWord does real keyword search.
    const list = await cj('/product/listV2', { token: accessToken, query: { keyWord: query, page: 1, size: PER_PRODUCT } });
    const products = (list?.content ?? []).flatMap((x) => x.productList ?? []);
    for (const p of products) {
      const pid = p.id ?? p.pid;
      const detail = await cj('/product/query', { token: accessToken, query: { pid } });
      const variant = detail?.variants?.[0];
      if (!variant) continue;
      // US warehouse first; fall back to CN. Record which origin actually quoted.
      let origin = 'US';
      let freight = await cj('/logistic/freightCalculate', {
        method: 'POST', token: accessToken,
        body: { startCountryCode: 'US', endCountryCode: 'US', products: [{ quantity: 1, vid: variant.vid }] },
      }).catch(() => null);
      if (!freight?.length) {
        origin = 'CN';
        freight = await cj('/logistic/freightCalculate', {
          method: 'POST', token: accessToken,
          body: { startCountryCode: 'CN', endCountryCode: 'US', products: [{ quantity: 1, vid: variant.vid }] },
        }).catch(() => null);
      }
      const cheapest = [...(freight ?? [])].sort((a, b) => a.logisticPrice - b.logisticPrice)[0];
      if (!cheapest) continue;
      const [dmin, dmax] = parseAging(cheapest.logisticAging);
      const row = {
        id: c.id, product: c.name, supplier: 'CJdropshipping',
        cj_name: p.nameEn ?? detail?.productNameEn ?? null,
        supplier_url: `https://cjdropshipping.com/product/-p-${pid}.html`,
        cj_pid: pid, cj_vid: variant.vid, cj_sku: p.sku ?? null,
        unit_cost: Number(variant.variantSellPrice ?? p.sellPrice),
        ship_cost_us: Number(cheapest.logisticPrice),
        ships_from: origin,
        shipping_method: cheapest.logisticName,
        delivery_days_min: dmin, delivery_days_max: dmax,
        // CJ is the supplier of record; no per-seller star rating. Use listing stats if present.
        supplier_rating: detail?.productScore != null ? Number(detail.productScore) : null,
        // CJ exposes no order counts; listedNum = number of stores listing it (demand proxy).
        orders_count: p.listedNum != null ? Number(p.listedNum) : detail?.listedNum != null ? Number(detail.listedNum) : null,
        image_license_ok: true,
        images: (detail?.productImageSet ?? []).slice(0, 6),
        weight_g: variant.variantWeight != null ? Number(variant.variantWeight) : null,
        flags: [],
      };
      const landedBase = row.unit_cost + row.ship_cost_us;
      if (!best || (row.delivery_days_max ?? 99) < (best.delivery_days_max ?? 99) ||
          ((row.delivery_days_max === best.delivery_days_max) && landedBase < best.unit_cost + best.ship_cost_us)) best = row;
    }
  } catch (e) {
    out.push({ id: c.id, product: c.name, error: e.message, unit_cost: null, ship_cost_us: null, delivery_days_max: null, supplier_rating: null, orders_count: null, flags: [] });
    continue;
  }
  out.push(best ?? { id: c.id, product: c.name, error: 'no CJ match', unit_cost: null, ship_cost_us: null, delivery_days_max: null, supplier_rating: null, orders_count: null, flags: [] });
}

writeFileSync(join(dir, 'supplier-batch9-cj.json'), JSON.stringify(out, null, 2) + '\n');
console.log(JSON.stringify({ written: join(dir, 'supplier-batch9-cj.json'), matched: out.filter((r) => r.unit_cost != null).length, total: out.length }));
