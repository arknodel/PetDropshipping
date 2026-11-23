#!/usr/bin/env node
// Save CJ product spec text per product (for copywriter + claim-fact-checker).
// Usage: node scripts/cj-specs.mjs data/research/<date>
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { loadEnv } from './lib/shopify.mjs';
loadEnv();
const out = join(process.argv[2], 'cj-specs'); mkdirSync(out, { recursive: true });
const B = 'https://developers.cjdropshipping.com/api2.0/v1';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const tok = (await (await fetch(B + '/authentication/getAccessToken', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ apiKey: process.env.CJ_API_KEY }) })).json()).data.accessToken;
const strip = (h) => String(h ?? '').replace(/<img[^>]*>/gi, '').replace(/<br\s*\/?>|<\/p>|<\/li>/gi, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\n{3,}/g, '\n\n').trim();
for (const f of readdirSync('data/products').filter((f) => f.endsWith('.json'))) {
  const p = JSON.parse(readFileSync(join('data/products', f), 'utf8'));
  await sleep(1200);
  const u = new URL(B + '/product/query'); u.searchParams.set('pid', p.supplier.supplier_sku);
  const d = (await (await fetch(u, { headers: { 'CJ-Access-Token': tok } })).json()).data ?? {};
  const txt = [`TITLE: ${d.productNameEn}`, `MATERIAL: ${d.materialNameEn ?? ''}`, `PACKING: ${d.packingNameEn ?? ''}`,
    `WEIGHT_G: ${d.productWeight ?? ''}`, `VARIANTS: ${(d.variants ?? []).map((v) => v.variantNameEn ?? v.variantKey).filter(Boolean).slice(0, 12).join('; ')}`,
    '', 'DESCRIPTION:', strip(d.description).slice(0, 4000)].join('\n');
  writeFileSync(join(out, `${p.slug}.txt`), txt + '\n');
  console.log(p.slug, txt.length);
}
