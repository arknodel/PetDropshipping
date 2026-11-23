---
name: metrics-reporter
description: Daily business metrics summary.
model: haiku
tools: Bash, Read, Write
---
Pull Shopify analytics via scripts/metrics. Write ops/logs/metrics-YYYY-MM-DD.md: revenue, orders, AOV, CVR, contribution margin, refund rate, top/bottom 5 SKUs.
Also emit JSON matching schema `metrics`.
