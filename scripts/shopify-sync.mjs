#!/usr/bin/env node
// Push validated products from data/products/*.json to Shopify as DRAFT.
// Usage: node scripts/shopify-sync.mjs            (dry run: prints what would be sent)
//        node scripts/shopify-sync.mjs --apply    (calls Shopify; still DRAFT only)
// Activation (DRAFT -> ACTIVE) is NOT done here: first launch is an approval gate.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadEnv, adminGraphQL, shopifyConfig } from './lib/shopify.mjs';

loadEnv();
const APPLY = process.argv.includes('--apply');
const DIR = 'data/products';
const REQUIRED_VALIDATORS = ['margin-validator', 'compliance-checker', 'listing-qa', 'claim-fact-checker'];

const MUTATION = `
mutation Sync($identifier: ProductSetIdentifiers, $input: ProductSetInput!) {
  productSet(synchronous: true, identifier: $identifier, input: $input) {
    product { id handle status }
    userErrors { field message code }
  }
}`;

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function toInput(p) {
  const c = p.copy ?? {};
  const html = [
    c.description && `<p>${esc(c.description)}</p>`,
    c.bullets?.length && `<ul>${c.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>`,
    c.safety_warning && `<p><strong>Safety:</strong> ${esc(c.safety_warning)}</p>`,
    `<p>Ships in about ${p.supplier.delivery_days_min}–${p.supplier.delivery_days_max} days to the US.</p>`,
  ].filter(Boolean).join('\n');

  const variants = (p.variants?.length ? p.variants : [{ sku: p.id, title: 'Default Title' }]);
  return {
    title: c.title,
    handle: p.slug,
    descriptionHtml: html,
    productType: p.category,
    tags: [...(p.tags ?? []), p.collection].filter(Boolean),
    // New products start as DRAFT; never downgrade a product already set ACTIVE (CJ linking needs ACTIVE).
    status: p.shopify?.status === 'ACTIVE' ? 'ACTIVE' : 'DRAFT',
    seo: { title: p.seo?.meta_title, description: p.seo?.meta_description },
    productOptions: [{ name: 'Title', values: variants.map((v) => ({ name: v.title })) }],
    variants: variants.map((v) => ({
      optionValues: [{ optionName: 'Title', name: v.title }],
      price: String(p.pricing.retail),
      ...(p.pricing.compare_at ? { compareAtPrice: String(p.pricing.compare_at) } : {}),
      // Shopify SKU = CJ variant SKU so CJ's automatic connection matches exactly; our GL- sku stays internal.
      inventoryItem: { sku: v.cj_variant_sku ?? v.sku, ...(v.weight_g ? { measurement: { weight: { value: v.weight_g, unit: 'GRAMS' } } } : {}) },
    })),
    files: (p.images ?? []).filter((i) => i.license_ok).map((i) => ({ originalSource: i.src, alt: i.alt, contentType: 'IMAGE' })),
  };
}

function eligible(p) {
  if (!['validated', 'draft'].includes(p.status)) return 'status not validated';
  for (const v of REQUIRED_VALIDATORS) {
    const r = p.validation?.[v];
    if (!r) return `missing ${v}`;
    if (r.verdict === 'FAIL') return `${v} FAIL`;
    if (r.verdict === 'WARN' && !r.warn_justification) return `${v} WARN without justification`;
  }
  if (!p.copy?.title) return 'no copy';
  return null;
}

const files = readdirSync(DIR).filter((f) => f.endsWith('.json') && !f.startsWith('_'));
const results = [];
for (const f of files) {
  const path = join(DIR, f);
  const p = JSON.parse(readFileSync(path, 'utf8'));
  const why = eligible(p);
  if (why) { results.push({ id: p.id, skipped: why }); continue; }
  const input = toInput(p);
  if (!APPLY) { results.push({ id: p.id, dryRun: true, title: input.title, variants: input.variants.length, images: input.files.length }); continue; }
  const data = await adminGraphQL(MUTATION, { identifier: { handle: p.slug }, input });
  const { product, userErrors } = data.productSet;
  if (userErrors.length) { results.push({ id: p.id, errors: userErrors }); continue; }
  p.status = 'draft';
  p.shopify = { ...(p.shopify ?? {}), product_gid: product.id, handle: product.handle };
  p.updated_at = new Date().toISOString();
  writeFileSync(path, JSON.stringify(p, null, 2) + '\n');
  results.push({ id: p.id, synced: product.id, status: product.status });
}

console.log(JSON.stringify({ apply: APPLY, store_configured: shopifyConfig().ready, results }, null, 2));
