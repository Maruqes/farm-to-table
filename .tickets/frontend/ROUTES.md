# Frontend routes

Every page URL that exists in the web app (`http://localhost:5173<route>`), i.e. every route registered in `apps/web/src/app/routes.tsx`. Nothing planned goes here.

- Whenever a route is added to `routes.tsx`, add its line here in the same change. When one is removed, remove its line.

Format: `- route — roles (guard) — FE ticket`

- `/` — all (public) — FE-03
- `/products/:id` — all (public) — FE-04
- `/producers/:id` — all (public) — FE-05
- `/auctions/:id` — all (public; visitors watch read-only) — FE-11
- `/login` — visitor — FE-01
- `/register` — visitor — FE-01
- `/account` — any signed-in role (`RequireRole`) — FE-00
- `/cart` — buyer (`RequireRole`) — FE-06
- `/checkout` — buyer (`RequireRole`) — FE-07
- `/orders` — buyer (`RequireRole`) — FE-08
- `/profile` — buyer, producer (`RequireRole`) — FE-10
- `/producer` — producer (`RequireRole`) — FE-12
- `/producer/products` — producer (`RequireRole`) — FE-13
- `/producer/orders` — producer (`RequireRole`) — FE-14
- `/producer/status` — producer (`RequireRole`; pending/rejected producers land here) — FE-02
- `*` (404) — all — FE-00
