// Round-4 fixes (2026-11-23): stale internal copy_claims (fact-check FAIL) + cheap listing-qa items.
// No new product claims. Run from repo root.
import { readFileSync, writeFileSync } from 'node:fs';
const P = (s) => `data/products/${s}.json`;
const edit = (slug, fn) => { const p = JSON.parse(readFileSync(P(slug), 'utf8')); fn(p); p.updated_at = new Date().toISOString(); writeFileSync(P(slug), JSON.stringify(p, null, 2) + '\n'); };
const SLUGS = ['adjustable-mesh-cat-harness', 'cat-deshedding-grooming-glove', 'dog-car-seat-belt-tether', 'reusable-pet-hair-remover-roller', 'suction-cup-lick-mat', 'summer-pet-sleeping-mat', 'waterproof-reflective-dog-raincoat'];

for (const slug of SLUGS) edit(slug, (p) => {
  const s = p.supplier;
  const ship = `Shipping ${s.transit_days_min}–${s.transit_days_max} days transit (${s.shipping_method}) plus 1–3 days processing, from CJ China Warehouse: data/research/2026-11-23/cj-freight-cn.json best.dmin/dmax; US stock 0 per data/research/2026-11-23/cj-stock.json`;
  p.copy_claims = (p.copy_claims ?? [])
    .filter((c) => !/^Shipping\b/i.test(c) && !/^Single version/i.test(c))
    .map((c) => c.replace(/data\/products\/[a-z0-9-]+\.json/g, `data/products/${slug}.json`));
  p.copy_claims.push(ship);
  if (slug === 'summer-pet-sleeping-mat') p.copy_claims.push('Four XS colour variants (GL-C06-01..04): this record variants + cj-stock.json');
});

edit('adjustable-mesh-cat-harness', (p) => {
  p.copy.description = p.copy.description.replace(' The adjusters cover various chest sizes across small, medium, and large cats.', ' It comes in sizes S to XL.');
});
edit('summer-pet-sleeping-mat', (p) => {
  p.copy.description = p.copy.description
    .replace(' This page does not list exact dimensions or a cooling temperature, so measure your space before you order.', ' The maker does not list exact dimensions, so check that it suits your pet before you order.')
    .replace('It is a simple, no-fuss addition to the spots you already use.', 'It is a simple, no-fuss addition to the places your pet already rests.');
});
edit('suction-cup-lick-mat', (p) => { if (!p.tags.includes('cats')) p.tags.push('cats'); });
edit('reusable-pet-hair-remover-roller', (p) => { p.images[0].alt = p.images[0].alt.replace('Reusable 2-in-1 pet hair remover roller', 'Reusable pet hair remover roller'); });
// Compliance WARN: unattributed maker claims in title/meta/first alt -> drop the claim words there.
edit('summer-pet-sleeping-mat', (p) => {
  p.copy.title = 'Summer Sleeping Mat for Cats and Dogs';
  p.seo.meta_title = 'Summer Pet Sleeping Mat for Cats and Dogs | Fondly Pet';
  p.images[0].alt = p.images[0].alt.replace(/^Waterproof summer sleeping mat/i, 'Summer sleeping mat');
});
edit('waterproof-reflective-dog-raincoat', (p) => {
  p.copy.title = 'Dog Raincoat with Hook-and-Loop Closure, Sizes S to XL';
  p.seo.meta_title = 'Dog Raincoat, Sizes S to XL | Fondly Pet';
  p.images[0].alt = p.images[0].alt.replace(/^Reflective polyester dog raincoat/i, 'Polyester dog raincoat');
});
console.log('r4 fixes applied');
