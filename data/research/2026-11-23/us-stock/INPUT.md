# US-stock batch (2026-11-23) — 9 new products

Brand + voice rules: data/brand.json (brand name "Fondly Pet").
Each product: record = data/products/<slug>.json, maker spec = data/research/2026-11-23/us-stock/specs/<CJ_SKU>.txt

| slug | CJ_SKU | spec |
|---|---|---|
| car-seat-leash-for-dogs-and-cats | CJPL2458437 | specs/CJPL2458437.txt |
| mini-pet-hair-remover-tool | CJJT2334420 | specs/CJJT2334420.txt |
| slicker-brush-with-release-button | CJHR2994197 | specs/CJHR2994197.txt |
| pet-car-seatbelt-2-pack | CJPL2422930 | specs/CJPL2422930.txt |
| four-zone-silicone-lick-mat | CJPB3207940 | specs/CJPB3207940.txt |
| six-foot-rope-dog-leash | CJFU2651741 | specs/CJFU2651741.txt |
| two-mode-cat-slow-feeder-bowl | CJPB2835255 | specs/CJPB2835255.txt |
| adjustable-reflective-pet-harness | CJPC3147743 | specs/CJPC3147743.txt |
| kitten-harness-vest | CJPL2662514 | specs/CJPL2662514.txt |

(spec paths are relative to data/research/2026-11-23/us-stock/)

Rules for every writer:
- Use ONLY facts in the spec file and the product record (variants, weights, colors, shipping). Attribute maker claims ("per the maker", "the maker lists it as").
- NEVER: health/vet/medical/calming/anxiety/digestion/choking-prevention/bloat claims, "escape-proof", "no-pull", "crash-tested", safety guarantees, brand names or trademarks (write "hook-and-loop" not Velcro), fake urgency, reviews, unverifiable superlatives.
- Shipping: copy the product record's copy.shipping_estimate text exactly; ships from a US warehouse.
- Car seat restraints: must say attach to a harness, not a collar, and that it is not a crash restraint.
- Lick mat: supervision + stop-use-if-damaged warning (choking hazard), avoid xylitol.
- Harnesses: supervise, check fit before each walk; no harness guarantees a pet cannot slip out.
