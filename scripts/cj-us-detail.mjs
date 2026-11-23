#!/usr/bin/env node
// For a fit-reviewed US shortlist: pull CJ product detail, per-variant US stock, and US->US freight.
// Writes <dir>/us-detail.json and <dir>/specs/<cj_sku>.txt (raw maker text for fact-checking).
// Usage: node scripts/cj-us-detail.mjs data/research/2026-11-23/us-stock
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { loadEnv } from './lib/shopify.mjs';
import { cj } from './lib/cj.mjs';

loadEnv();
const dir = process.argv[2];
mkdirSync(`${dir}/specs`, { recursive: true });
const fit = JSON.parse(readFileSync(`${dir}/fit-review.json`, 'utf8'));
const aging = (s) => { const m = String(s ?? '').match(/(\d+)\s*-\s*(\d+)/); return m ? [Number(m[1]), Number(m[2])] : [null, null]; };
const strip = (h) => String(h ?? '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\n{3,}/g, '\n\n').trim();

const out = [];
for (const s of fit.shortlist) {
  const d = await cj('/product/query', { query: { productSku: s.cj_sku } }).catch((e) => ({ error: e.message }));
  if (!d || d.error) { out.push({ ...s, error: d?.error ?? 'no data' }); continue; }
  const variants = [];
  for (const v of d.variants ?? []) {
    const st = await cj('/product/stock/queryByVid', { query: { vid: v.vid } }).catch(() => []);
    const us = (Array.isArray(st) ? st : []).filter((x) => x.countryCode === 'US').reduce((a, x) => a + Number(x.totalInventoryNum ?? 0), 0);
    if (us <= 0) continue; // list only US-stocked variants
    const fr = await cj('/logistic/freightCalculate', { method: 'POST', body: { startCountryCode: 'US', endCountryCode: 'US', products: [{ quantity: 1, vid: v.vid }] } }).catch(() => []);
    const opts = (Array.isArray(fr) ? fr : []).map((o) => { const [a, b] = aging(o.logisticAging); return { name: o.logisticName, price: Number(o.logisticPrice), dmin: a, dmax: b }; }).sort((a, b) => a.price - b.price);
    variants.push({ vid: String(v.vid), cj_variant_sku: v.variantSku, name: v.variantNameEn ?? v.variantKey, key: v.variantKey, unit_cost: Number(v.variantSellPrice), weight_g: Number(v.variantWeight ?? 0), image: v.variantImage, us_stock: us, freight: opts });
  }
  const spec = [`TITLE: ${d.productNameEn}`, `CATEGORY: ${d.categoryName}`, `MATERIAL: ${JSON.stringify(d.materialNameEn ?? d.materialName ?? '')}`,
    `PACKING: ${JSON.stringify(d.packingNameEn ?? d.packingName ?? '')}`, `WEIGHT: ${d.productWeight}`, `VARIANT KEYS: ${(d.variants ?? []).map((v) => v.variantKey).join(' | ')}`,
    '', 'DESCRIPTION:', strip(d.description)].join('\n');
  writeFileSync(`${dir}/specs/${s.cj_sku}.txt`, spec + '\n');
  let images = d.productImageSet ?? d.productImage ?? [];
  if (typeof images === 'string') { try { images = JSON.parse(images); } catch { images = [images]; } }
  out.push({ ...s, pid: String(d.pid), title: d.productNameEn, category: d.categoryName, listed_stores: Number(d.listedNum ?? 0),
    images: images.slice(0, 8), variants_total: (d.variants ?? []).length, variants });
}
writeFileSync(`${dir}/us-detail.json`, JSON.stringify(out, null, 1) + '\n');
for (const p of out) {
  const vs = p.variants ?? [];
  console.log(p.cj_sku, p.slug, '| US variants', vs.length + '/' + p.variants_total, '|', vs.map((v) => `${v.name}: $${v.unit_cost} + ${v.freight[0] ? v.freight[0].price + ' ' + v.freight[0].name + ' ' + v.freight[0].dmin + '-' + v.freight[0].dmax : 'NO FREIGHT'} (stock ${v.us_stock})`).join(' ; '), p.error ?? '');
}
