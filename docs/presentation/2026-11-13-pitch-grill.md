# Farm to Table pitch deck + README: Grill / Discovery Notes
Date: 2026-11-13 · Goal: settle content and structure of an English pitch-style, DevOps-heavy presentation (ending in a live DEMO slide) and the README rewrite.

## Summary / key decisions
- Structure (from brief): pitch (problem, name, both sides win) -> "How we solve it" (screens, ranked features, stack) -> DevOps deep dive (Kubernetes, live URLs, Jenkins, GitHub Actions) -> final slide "DEMO".
- Audience: class/jury, ~10 min + demo, ~12-15 slides.
- Hook: middleman margin as rough % (supermarkets keep ~x%, we don't), plus freshness and trust.
- Revenue: ~5% fee per sale.
- Infra: 2-node k3s cluster (both schedule pods); nginx proxy routes / and /backoffice to NodePorts.
- Format: HTML slides -> PDF.
- Style: app's price-board look.
- Features ranked: auctions > shop/orders > producer dashboard > reviews+map > notifications > backoffice.
- Screenshots: from local `make dev` (newer than live).
- README: developer setup guide.
- Outline approved (14 slides, see Q12).
- Live: https://farm-to-table.maruqes.com/ and /backoffice. Do not mention AI; code light, DevOps heavy.

## Q&A log

### Q1 — Audience & length
- Captured: class/jury grading the project, ~10 min talk + live demo. Target ~12-15 slides.
### Q2 — Opening hook
- Captured: lead with middleman margin, as a rough % ("normally supermarkets get about x% we do not"), then also freshness, trust, etc.
- Flags: pick a defensible ballpark % figure (e.g. farmer gets ~20-30% of shelf price) -> Claude to source
### Q3 — Revenue
- Captured: small platform fee ~5% per sale (vs supermarket ~70% margin).
### Facts read from the repo (no question needed)
- GitHub Actions `images.yml`: on push to main, matrix builds api/web/backoffice, pushes `ghcr.io/maruqes/farm-to-table-<app>:latest`.
- Jenkins: pollSCM every 2 min -> waits for the GH image run for that SHA -> SSH to node -> git pull -> check .env -> apply namespace, Secret from .env, recreate silo-init Job, apply manifests with NodePorts from .env (30080/30081) -> rollout restart -> rollout status; on failure dumps pods + events.
- k8s namespace farm-to-table: Deployments api/web/backoffice, StatefulSets mongo + silo (S3 storage), Job silo-init, 5 Services, 1 replica each.
### Q4 — Cluster & traffic
- Captured: "k8s on 2 servers", nginx proxy in front routing `/backoffice` -> backoffice and `/` -> web (NodePorts).
- Flags: k8s flavour (k3s/kubeadm?), server names/roles, where TLS terminates -> user
### Q5 — Nodes
- Captured: k3s, 2 nodes, both run workloads (control-plane also schedules pods).
### Q6 — AI-written code
- Captured: do NOT mention AI in the deck. Just keep code slides light and DevOps heavy.
### Q7 — Format
- Captured: HTML web slides, exported to PDF (present from the PDF).
### Q8 — Visual style
- Captured: match the web app's price-board style (apps/web/DESIGN.md, RULES.md tokens).
### Q9 — Feature ranking
- Captured: 1 live auctions, 2 shop/cart/orders w/ status, 3 producer dashboard, 4 reviews + producer map, 5 notifications, 6 admin backoffice.
### Q10 — Screenshots
- Captured: take screenshots from LOCAL dev (user made recent changes not yet live), seeded demo accounts.
### Q11 — README
- Captured: README = developer setup guide (run, test, deploy).
### Q12 — Outline (approved)
1 Title · 2 Problem: middleman margin · 3 Freshness & trust · 4 Both sides win (5% fee) · 5 How we solve it · 6 Features ranked · 7 Screens · 8 Tech stack · 9 Architecture (proxy, k3s 2 nodes) · 10 Inside the cluster · 11 CI: GitHub Actions -> ghcr.io · 12 CD: Jenkins · 13 Commit-to-prod flow · 14 DEMO

## Open flags (pending input)
