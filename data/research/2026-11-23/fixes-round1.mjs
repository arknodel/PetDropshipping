// Opus fix pass after compliance-checker + claim-fact-checker round 1 (2026-11-23).
// Run from repo root: node data/research/2026-11-23/fixes-round1.mjs
import { readFileSync, writeFileSync, renameSync, existsSync } from 'node:fs';

const P = (s) => `data/products/${s}.json`;
const edit = (slug, fn) => { const p = JSON.parse(readFileSync(P(slug), 'utf8')); fn(p); p.updated_at = new Date().toISOString(); writeFileSync(P(slug), JSON.stringify(p, null, 2) + '\n'); };
const rep = (s, a, b) => { if (!s.includes(a)) throw new Error(`not found: ${a}`); return s.replace(a, b); };

// Harness: no restraint guarantee; SEO matches copy (no leash, no quick-release).
edit('adjustable-mesh-cat-harness', (p) => {
  p.copy.title = 'Breathable Mesh Cat Harness with Reflective Edging';
  p.copy.bullets[1] = 'Locking side buckles and a one-touch release';
  p.copy.bullets[2] = 'Dual side slide adjusters for a range of chest sizes';
  p.copy.description = rep(p.copy.description, 'takes a harness that fits and stays put. This vest-style cat harness has locking safety buckles that stay firmly fastened.', 'starts with a harness that fits. This vest-style cat harness has locking side buckles.');
  p.copy.description = rep(p.copy.description, ' Taking your cat for a walk can be simpler with a harness that adjusts and has locking buckles.', '');
  p.copy.safety_warning = 'Check the fit before every walk and supervise your cat while it wears the harness. No harness can guarantee a pet cannot slip out.';
  p.seo = { meta_title: 'Breathable Mesh Cat Harness | Good Leash Co.', meta_description: 'Adjustable cat vest harness in breathable 3D mesh with stainless steel D-rings, locking side buckles and reflective edging.', primary_keyword: 'cat harness', secondary_keywords: ['breathable mesh cat harness', 'cat walking vest harness', 'reflective cat harness'] };
});

// Feeder: no health or stability claims.
edit('elevated-cat-feeder-stand', (p) => {
  p.images[0].alt = 'Elevated pet feeder stand with a transparent bowl and 15-degree tilted design';
  p.copy.description = rep(p.copy.description, ' The stand is not easy to overturn.', '');
  p.copy.description = rep(p.copy.description, ' A transparent bowl lets you check the food level at a glance.', '');
  p.seo.meta_description = 'Raised feeder stand with a 15 degree tilt and a removable clear bowl for cat food or water. Bowl and base come apart for cleaning.';
});

// Raincoat: no trademark; no unsupported audience claim.
edit('waterproof-reflective-dog-raincoat', (p) => {
  p.images[0].alt = 'Waterproof reflective polyester dog raincoat with hook-and-loop closure, sizes S to XL';
  p.copy.bullets[1] = 'Reflective trim for low-light walks.';
  p.copy.description = rep(p.copy.description, 'The reflective design helps your dog stand out on low-light walks.', 'It has reflective trim for low-light walks.');
  p.seo.meta_description = 'Waterproof dog raincoat with reflective trim and hook-and-loop closure, in sizes S to XL. Made of polyester.';
});

// Cooling mat: do not state cooling as fact; attribute it to the maker's listing.
edit('pet-self-cooling-mat', (p) => {
  p.copy.title = 'Waterproof Summer Sleeping Mat for Cats and Dogs';
  p.copy.bullets[0] = 'Summer sleeping pad the maker lists as self-cooling (no temperature stated).';
  p.copy.description = rep(p.copy.description, 'Warm weather makes a cool place to nap a real priority, and this self-cooling mat gives your cat or dog a spot of their own.', 'This summer sleeping mat gives your cat or dog a spot of their own. The maker lists it as self-cooling but gives no cooling temperature.');
  p.images[0].alt = 'Waterproof summer sleeping mat for cats and dogs';
  p.seo = { ...p.seo, meta_title: 'Waterproof Summer Pet Sleeping Mat | Good Leash Co.', meta_description: 'Waterproof cloth sleeping mat for dogs and cats. Made for summer naps; no cooling temperature is stated by the maker.' };
});

// Water cup: plastic variants exist, so no material claim anywhere; no dispenser/fold-out.
edit('portable-stainless-pet-water-cup', (p) => {
  p.slug = 'portable-pet-water-cup';
  p.previous_slugs = ['portable-stainless-pet-water-cup', 'portable-dog-water-bottle-with-fold-out-bowl'];
  p.copy.title = 'Portable Dog Water Cup with Built-In Bowl for Walks';
  p.copy.bullets[1] = 'Leak-proof container, as described by the maker, to keep water in the cup.';
  p.copy.bullets[2] = 'Sized for walks, hikes, and trips.';
  p.copy.bullets[4] = 'Lightweight for carrying on walks.';
  p.copy.description = rep(p.copy.description, 'It has a stainless steel body and a comfortable wrist strap', 'It has a comfortable wrist strap');
  p.copy.description = rep(p.copy.description, ' It is lightweight, so it adds little bulk to your walk gear. The listing names it a small dog water bottle.', ' It is lightweight.');
  p.copy.faq[1].a = 'Material varies by version (metal and plastic versions are offered by the maker); the version you receive is shown at checkout. Every version has a built-in drinking bowl.';
  p.images[0].alt = 'Portable dog water cup with built-in drinking bowl and wrist strap';
  p.seo = { meta_title: 'Portable Dog Water Cup with Bowl | Good Leash Co.', meta_description: 'Portable dog water cup with a built-in drinking bowl and wrist strap for walks, hikes, and travel.', primary_keyword: 'portable dog water bottle', secondary_keywords: ['dog water cup for walks', 'travel dog water bottle with bowl', 'dog walking water bottle'] };
});
if (existsSync(P('portable-stainless-pet-water-cup'))) renameSync(P('portable-stainless-pet-water-cup'), P('portable-pet-water-cup'));

// Seat belt: no safety-performance keywords; owner-fit warning.
edit('dog-car-seat-belt-tether', (p) => {
  p.copy.bullets[0] = 'Adjustable, stretchy length for a range of dog sizes';
  p.copy.bullets[3] = 'Elastic section between the clip and the seat belt buckle';
  p.copy.description = rep(p.copy.description, 'is made for all dog types', 'adjusts for a range of dog sizes');
  p.copy.description = rep(p.copy.description, 'Its stretchy design gives the belt some give, while the adjustable length helps you dial in the fit.', 'The adjustable length helps you set the fit.');
  p.copy.faq[0].a = 'The belt has a minimum size of 70 cm and can stretch to 125 cm. Compare these lengths with your car and your dog before you order.';
  p.copy.safety_warning = 'Attach only to a harness, never a collar. This belt is not a crash-tested restraint. Supervise your dog in the car.';
  p.images[0].alt = 'Adjustable elastic dog car seat belt made of polyester and zinc alloy';
  p.seo = { meta_title: 'Adjustable Dog Car Seat Belt | Good Leash Co.', meta_description: 'Adjustable stretch seat belt for dogs riding in the car. Length adjusts from 70 cm to 125 cm. Polyester and zinc alloy.', primary_keyword: 'dog car seat belt', secondary_keywords: ['dog seat belt for car', 'adjustable dog car seat belt', 'dog seat belt harness clip'] };
});

// Glove: alt wording.
edit('cat-deshedding-grooming-glove', (p) => {
  p.images[3].alt = 'Deshedding glove used for gentle brushing and bath-time cleaning';
});

// Lick mat: concrete spread safety note.
edit('suction-lick-mat-for-crate-and-bath-time', (p) => {
  p.copy.safety_warning = 'Supervise your pet while it uses the mat. Stop use if the mat is torn, cracked, or has damaged or missing suction cups, since loose pieces can be a choking hazard. Only use spreads that are safe for pets; avoid any containing xylitol.';
});

// Scratcher: dropped (supplier material conflict: cardboard vs wood vs felt; decal/set variants).
edit('cat-scratcher-board', (p) => {
  p.status = 'dropped';
  p.dropped_reason = 'claim-fact-checker FAIL: supplier lists three different materials (corrugated cardboard, wood, felt) and decal/set variants; cannot describe truthfully.';
});
console.log('fixes applied');
