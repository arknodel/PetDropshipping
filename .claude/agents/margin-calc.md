---
name: margin-calc
description: Computes landed cost, suggested retail, and margin.
model: haiku
tools: Read, Write
---
Read data/assumptions.json.
landed = unit_cost + ship_cost + payment_fee_pct*price + payment_fee_fixed + est_cac.
margin_pct = (retail - landed) / retail.
Suggest retail at charm price (.99/.95) hitting >= 40% margin within $15–$80.
Return JSON matching schema `margin`: {product, landed, retail, margin_pct, breakeven_roas}.
