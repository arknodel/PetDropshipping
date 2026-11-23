#!/usr/bin/env node
// Set Shopify product status for synced products (does NOT publish to any sales channel).
// Usage: node scripts/shopify-set-status.mjs ACTIVE|DRAFT [--apply]
// Owner approved ACTIVE-but-unpublished in chat 2026-11-23 so CJ can sync/link products.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { loadEnv, adminGraphQL } from './lib/shopify.mjs';

loadEnv();
const status = process.argv[2];
const APPLY = process.argv.includes('--apply');
if (!['ACTIVE', 'DRAFT'].includes(status)) { console.error('status must be ACTIVE or DRAFT'); process.exit(1); }

const M = `mutation($p: ProductUpdateInput!) { productUpdate(product: $p) {
  product { id handle status onlineStoreUrl } userErrors { field message } } }`;

const out = [];
for (const f of readdirSync('data/products').filter((f) => f.endsWith('.json'))) {
  const path = `data/products/${f}`;
  const p = JSON.parse(readFileSync(path, 'utf8'));
  const gid = p.shopify?.product_gid;
  if (!gid || p.status === 'dropped') continue;
  if (!APPLY) { out.push({ handle: p.slug, would_set: status }); continue; }
  const d = await adminGraphQL(M, { p: { id: gid, status } });
  const r = d.productUpdate;
  if (r.userErrors.length) { out.push({ handle: p.slug, errors: r.userErrors }); continue; }
  p.shopify.status = r.product.status;
  p.updated_at = new Date().toISOString();
  writeFileSync(path, JSON.stringify(p, null, 2) + '\n');
  out.push({ handle: r.product.handle, status: r.product.status, onlineStoreUrl: r.product.onlineStoreUrl });
}
console.log(JSON.stringify({ apply: APPLY, results: out }, null, 2));
