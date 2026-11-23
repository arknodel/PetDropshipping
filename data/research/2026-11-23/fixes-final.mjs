// Cosmetic + attribution fixes from final compliance/listing-qa passes (2026-11-23).
// No new claims; only typo, labels, attribution, duplicate removal, slug.
import { readFileSync, writeFileSync, renameSync, existsSync } from 'node:fs';
const P = (s) => `data/products/${s}.json`;
const edit = (slug, fn) => { const p = JSON.parse(readFileSync(P(slug), 'utf8')); fn(p); p.updated_at = new Date().toISOString(); writeFileSync(P(slug), JSON.stringify(p, null, 2) + '\n'); };

edit('reusable-pet-hair-remover-roller', (p) => {
  p.copy.description = p.copy.description.replace('At about 4.3 x 18.3 cm', 'At about 4.3 x 4.3 x 18.3 cm');
});
edit('elevated-cat-feeder-stand', (p) => {
  const labels = { 'Double bowl box': 'Double Bowl', '4foot single bowl box': 'Single Bowl, Four-Leg Base', 'U bottom single bowl box': 'Single Bowl, U-Shaped Base' };
  p.variants.forEach((v) => { v.supplier_title = v.title; v.title = labels[v.title] ?? v.title; });
  p.copy.title = 'Elevated Cat Feeder Stand with Transparent Bowls';
});
edit('dog-car-seat-belt-tether', (p) => { p.copy.bullets[3] = 'Available in black or dark grey'; });
edit('adjustable-mesh-cat-harness', (p) => {
  p.copy.faq[0].a = p.copy.faq[0].a.replace('it is made for small, medium, and large cats', 'it comes in sizes S to XL for small to large cats');
});
edit('summer-pet-sleeping-mat', (p) => {
  p.copy.bullets = p.copy.bullets.map((b) => b.replace(/^Waterproof, so/, 'Listed by the maker as waterproof, so'));
  p.copy.bullets[4] = 'Lightweight at about 60 g, easy to move between rooms.';
  p.images = p.images.map((i) => ({ ...i, alt: i.alt.replace(/a waterproof mat/i, 'a mat') }));
  p.seo.meta_description = 'Cloth summer sleeping mat for cats and dogs, listed by the maker as waterproof. Size XS in four colors.';
});
edit('waterproof-reflective-dog-raincoat', (p) => {
  p.copy.bullets[0] = 'Raincoat the maker lists as waterproof, for rainy walks.';
  p.copy.description = p.copy.description.replace('This waterproof dog raincoat is made for wet days.', 'This dog raincoat, which the maker lists as waterproof, is made for wet days.');
  p.images = p.images.map((i) => ({ ...i, alt: i.alt.replace(/^Waterproof reflective polyester/, 'Reflective polyester').replace(/a waterproof raincoat/i, 'a raincoat') }));
});
// Lick mat: slug without "crate" (supervision required).
edit('suction-lick-mat-for-crate-and-bath-time', (p) => {
  p.slug = 'suction-cup-lick-mat';
  p.previous_slugs = [...(p.previous_slugs ?? []), 'suction-lick-mat-for-crate-and-bath-time'];
});
if (existsSync(P('suction-lick-mat-for-crate-and-bath-time'))) renameSync(P('suction-lick-mat-for-crate-and-bath-time'), P('suction-cup-lick-mat'));
console.log('final fixes applied');
