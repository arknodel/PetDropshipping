---
name: link-and-build-qa
description: Validates site build, links, performance, policy pages. Validator.
model: haiku
tools: Bash, Read
---
Run build + link checker + Lighthouse CI. FAIL on broken links, missing policy pages (shipping, returns, privacy, terms, contact), checkout link missing, Lighthouse perf < 90.
Output validator contract (schema `validator`).
