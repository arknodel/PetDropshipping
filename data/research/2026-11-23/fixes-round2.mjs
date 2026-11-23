// Opus fix pass after round-2 compliance + listing-qa (2026-11-23). Wording reductions only.
// Run from repo root: node data/research/2026-11-23/fixes-round2.mjs
import { readFileSync, writeFileSync, renameSync, existsSync } from 'node:fs';

const P = (s) => `data/products/${s}.json`;
const edit = (slug, fn) => { const p = JSON.parse(readFileSync(P(slug), 'utf8')); fn(p); p.updated_at = new Date().toISOString(); writeFileSync(P(slug), JSON.stringify(p, null, 2) + '\n'); };
const strip = (obj, re, to) => JSON.parse(JSON.stringify(obj).replace(re, to));

// Water cup: dropped (3 validators: mixed metal/plastic variants, unverifiable material, leak-proof claim).
edit('portable-pet-water-cup', (p) => {
  p.status = 'dropped';
  p.dropped_reason = 'Round 2: compliance FAIL (leak-proof guarantee), listing-qa FAIL, supplier mixes stainless and plastic versions under one listing; cannot state material truthfully.';
});

edit('cat-deshedding-grooming-glove', (p) => {
  p.copy = strip(p.copy, /quickly removes/g, 'helps remove');
});

edit('dog-car-seat-belt-tether', (p) => {
  p.copy.safety_warning = 'Attach only to a harness, never a collar. This belt is not designed as a crash restraint. Supervise your dog in the car.';
  p.copy = strip(p.copy, /weighs about 185 g net/g, 'has a listed net weight of about 185 g (about 208 g packed)');
});

edit('elevated-cat-feeder-stand', (p) => {
  p.copy.bullets[1] = 'Transparent bowl you can lift out of the stand';
  p.copy.description = p.copy.description.replace('The transparent bowl is made of food-grade material. ', '');
  p.seo.meta_title = 'Elevated Cat Bowl Stand With Clear Bowl | Good Leash Co.';
});

edit('pet-self-cooling-mat', (p) => {
  p.slug = 'summer-pet-sleeping-mat';
  p.previous_slugs = [...(p.previous_slugs ?? []), 'pet-self-cooling-mat'];
  p.copy.bullets[0] = 'Summer sleeping pad for cats and small dogs.';
  p.copy = strip(p.copy, /,? ?(and )?self-cooling/gi, '');
  p.copy.faq[1].a = 'It is made of cloth and the maker lists it as waterproof. No cooling temperature is stated.';
  p.images = strip(p.images, /self-cooling |cooling /gi, '');
  p.seo = { meta_title: 'Waterproof Summer Pet Sleeping Mat | Good Leash Co.', meta_description: 'Waterproof cloth sleeping mat for cats and small dogs, size XS in four colors.', primary_keyword: 'summer pet sleeping mat', secondary_keywords: ['pet sleeping pad', 'cat sleeping mat', 'small dog sleeping mat'] };
});
if (existsSync(P('pet-self-cooling-mat'))) renameSync(P('pet-self-cooling-mat'), P('summer-pet-sleeping-mat'));

edit('reusable-pet-hair-remover-roller', (p) => {
  p.seo.meta_description = 'Reusable pet hair remover with a swivel brush head and built-in dustbin for sofas, clothes, and bedding.';
  p.seo.secondary_keywords = p.seo.secondary_keywords.map((k) => (/self.cleaning/i.test(k) ? 'reusable lint roller for pet hair' : k));
  p.copy = strip(p.copy, /works on most surfaces/gi, 'works on cotton, linen, and wool');
});

edit('suction-lick-mat-for-crate-and-bath-time', (p) => {
  p.seo.meta_description = 'Silicone lick mat with 64 suction cups that help it stay put on smooth, clean surfaces. For cats and small to medium dogs.';
  p.copy = strip(p.copy, /food grade silicone/gi, 'silicone (listed by the maker as food grade)');
});

edit('waterproof-reflective-dog-raincoat', (p) => {
  p.copy.bullets[2] = 'Hook-and-loop closure in three colors.';
  p.copy.description = p.copy.description
    .replace(', and it is also snowproof for cold weather', '')
    .replace(' The listed weight range is 57 to 94 grams.', '');
  p.copy.faq[1].a = 'It is made of polyester. The maker lists it as waterproof and reflective.';
  p.images[4].alt = 'Dog raincoat shown from the side';
});
console.log('round-2 fixes applied');
