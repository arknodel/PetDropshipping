# Round 4 validator input (2026-11-23) — 7 products

Product records (producer output), base dir = repo root:
- data/products/adjustable-mesh-cat-harness.json        spec: data/research/2026-11-23/cj-specs/escape-proof-breathable-mesh-harness.txt
- data/products/cat-deshedding-grooming-glove.json      spec: data/research/2026-11-23/cj-specs/cat-deshedding-grooming-glove.txt
- data/products/dog-car-seat-belt-tether.json           spec: data/research/2026-11-23/cj-specs/dog-car-seat-belt-tether.txt
- data/products/reusable-pet-hair-remover-roller.json   spec: data/research/2026-11-23/cj-specs/reusable-pet-hair-remover-roller.txt
- data/products/suction-cup-lick-mat.json               spec: data/research/2026-11-23/cj-specs/suction-lick-mat-for-crate-and-bath-time.txt
- data/products/summer-pet-sleeping-mat.json            spec: data/research/2026-11-23/cj-specs/pet-self-cooling-mat.txt
- data/products/waterproof-reflective-dog-raincoat.json spec: data/research/2026-11-23/cj-specs/waterproof-reflective-dog-raincoat.txt

Supplier evidence (raw API data):
- Stock by warehouse per variant: data/research/2026-11-23/cj-stock.json
- CN->US freight quotes + chosen method per product: data/research/2026-11-23/cj-freight-cn.json
  (`best.variants[].ship` is the per-variant shipping cost; `best.dmin/dmax` transit days)
- Cost assumptions: data/assumptions.json

Ignore the `validation` block inside each product (it is stale/PENDING).
Ignore any field named `previous_retail`, `stale_reason`, `dropped_reason`.
