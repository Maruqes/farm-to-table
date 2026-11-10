# Farm to Table — Scoped Requirements & Tech Stack

Digital marketplace for local producers with real-time auctions. Individual university project (IPVC-ESTG, Web & Cloud Development, 7 weeks). This file is the distilled, decided scope: everything not listed here is **not built**.

## 0. What the app is and how it works

Small local producers (vegetables, fruit, honey, wine, cheese, bakery) sell directly to consumers and local restaurants. There are two ways to buy:

1. **Normal shop**: the buyer puts products in a cart and places an order. The producer prepares it and moves it through states. The buyer is told instantly.
2. **Live auction**: for seasonal or surplus lots (e.g. 200 kg of kiwi), the producer opens an auction room. Several buyers bid at the same time, everyone sees the same price and the same countdown. The highest bidder when time runs out wins and gets an order.

Marked **(assumed)** below = a rule I filled in because the PDF is silent; change anything you disagree with.

### Who exists and what they can do

| Actor | How they get it | Can do | Can NOT do |
|---|---|---|---|
| **Visitor** (not logged in) | default | Browse and search the catalog, open product and producer public pages (with map, ratings), watch an auction room read-only **(assumed)**, register | Add to cart, order, bid, rate |
| **Buyer** | registers; active immediately | Everything a visitor does, plus cart and orders, track their own orders, rate, bid, see own bid history and own notifications | See other buyers' orders, edit any product, create auctions |
| **Producer** | registers as producer, then waits for admin approval | After approval: manage **own** products, see and update orders that contain **their** products, create and follow **own** auctions, see **own** sales stats | Touch another producer's data, moderate reviews, see global stats, bid on or buy anything **(assumed)** |
| **Admin** | created by seeding, not by public sign-up | Approve/reject producers, moderate reviews and content (hide products and producer public pages), see global dashboard of users, orders, live auctions, and the service status panel | Edit products or place orders on behalf of users **(assumed)** |

A pending or rejected producer can log in but sees only a "waiting for approval" / "rejected" page and has no products visible to the public.

### What each actor sees (screens)

- **Visitor**: home with the live-auction highlight and the product catalog with filters; product page; producer page (bio, map, rating, product list); register/login.
- **Buyer**: same catalog plus cart, checkout, "My orders" (state timeline per order, contact and map buttons, "Rate" after delivery), auction room, notification toasts, profile (including mock card).
- **Producer**: dashboard (sales, orders to handle, active products, average rating, charts), product manager, orders table with a state dropdown, auction manager (create, follow live), reviews received, edit public page, low-stock list.
- **Admin**: overview counters and charts, producers awaiting approval, reported reviews, content moderation list (products and producer pages with a hide/unhide toggle), users, all orders, live auctions, **service status panel** (see §2).

### Rules of the shop

- **Catalog**: only products from **approved** producers, not hidden, with stock > 0, are listed as buyable. Search by name/ingredient/producer; filters by category, locality, season and organic; sort by nearest/price/rating (nearest only if cheap to do, otherwise cut).
- **Cart**: one cart per logged-in buyer; may mix producers **(assumed)**. Checkout splits it into **one order per producer**, because each producer prepares and updates their own part **(assumed)**.
- **Order**: buyer chooses **pickup** (at the farm) or **delivery** (address). Payment is on pickup/delivery; there is no online payment in the normal shop. Order lines keep a copy of name and price at purchase time, so later price changes do not alter old orders.
- **Stock**: reduced when the order is placed; a product cannot be ordered above its stock. If the order is cancelled stock returns **(assumed; cancel by producer only while `pending`)**.
- **Order states**, in one direction only: `pending → confirmed → ready → delivered`. Only the owning producer changes the state; each change instantly notifies that buyer (live toast, and also visible next time they log in). The producer's own views (orders table, dashboard) also update live, including when the same producer has several tabs open (PDF slide 2: "buyer and producer see state changes as they happen").
- **Ratings**: a buyer can rate a product/producer only for an order that reached `delivered`, once per order **(assumed)**. Anyone can read ratings. Producer or other users can **report** a review; the admin then **keeps** or **hides** it. Hidden reviews disappear from public pages and from the average.

### Rules of the auction

- **Who can create**: approved producers, for their own product. Fields: product, lot quantity, base price, minimum increment, duration (15 min / 30 min / 1 h / custom), start time. It can be saved as a draft, then published.
- **States**: `draft` → `scheduled` → `active` → `ended`.
- **Who can bid**: only logged-in buyers, not the producer who owns the lot. Bid must be at least current price + increment. Quick buttons +5 / +10 / +25 € add to the current price.
- **What everybody sees in the room**: current price and who leads (highest bidder name), countdown (same for all), number of people watching, history of bids updating live. A bid that arrives too late or too low is refused and only that bidder gets an error.
- **Simultaneous bids**: the server accepts only one; the other is rejected, and everyone sees the same final state. The server is the single source of truth, not the browser.
- **Ending (assumed)**: no extra time added at the last second; when the clock hits zero the auction closes, bids stop being accepted.
- **Cancelling (assumed)**: a producer can cancel only before the first bid.
- **Winning and payment (mock)**: the highest bidder is charged with the mock card in their profile. The card is valid unless it is flagged "simulate invalid card" or fails a simple number check. If it fails, they are skipped and the next-highest bidder is tried, and so on. The first success wins and an order (pickup or delivery) is created for them and the producer is notified. If everybody fails or there were no bids, the auction ends with no winner and the stock is not touched.
- **Winner notification**: the winner gets a notification; the skipped bidders also get one saying why **(assumed)**.

### Notifications (what triggers a message)

- Order state changed → buyer (toast) and producer (live refresh of their orders views, no toast).
- New order received → producer **(assumed)**.
- Auction won / payment failed and skipped → bidder.
- Producer approved / rejected → producer **(assumed)**.
- Review reported/moderated → not notified, admin sees it in the queue.
- Product or producer page hidden by the admin → the owning producer is notified **(assumed)**.

### Typical flows in plain words

1. **Buy something**: visitor finds kiwi → registers as buyer → adds 3 kg to cart → checks out choosing pickup → producer sees the new order → confirms, then marks ready → buyer sees "ready to pick up" instantly → after delivery buyer rates.
2. **Become a producer**: register as producer → admin approves → create products → they now appear in the catalog.
3. **Run an auction**: producer creates a lot, publishes → at start time the room opens → buyers join and bid → clock ends → highest valid payer wins → order is created.

---

## 1. Decided tech stack

| Layer | Choice | Notes |
|---|---|---|
| Frontend | **React + Vite, TypeScript** | SPA, `react-router`, Context (cart/session) |
| Styling | **Bootstrap 5 + SASS**, Mobile First | ≥ 3 breakpoints (768 / 1024 / 1280 px) via `min-width` media queries; SASS partials (`_variables`, `_mixins`), semantic HTML (`header`, `nav`, `main`, `article`) |
| API | **Node.js + Express, TypeScript** | REST, correct verbs and status codes |
| Database | **MongoDB (self-hosted container) + Mongoose** | No Atlas |
| Real time | **Socket.io** | Same JWT as the API; room per auction + personal room per user |
| API docs | **OpenAPI 3 + Swagger UI** at `/api-docs` | All endpoints, `components.schemas`, `bearerAuth` |
| Auth/security | **JWT (expiry 2h) + bcrypt (cost 12)**, role middleware (buyer / producer / admin) | 401/403, secrets in env vars (never in Git), HTTPS via reverse proxy (to be added at deploy time) |
| Images | **Silo (pgsty/silo, MinIO-compatible S3, self-hosted in compose)** via `@aws-sdk/client-s3` (`forcePathStyle`), upload via `multer` (user decision) | Image URL stored on the product doc |
| Maps | **Leaflet + OpenStreetMap** | One pin from lat/lng on the producer; no geocoding, no distance |
| Backoffice (bonus +1) | **Laravel** (MVC, Blade, Eloquent) | Admin panel on the same MongoDB/API |
| Packaging/hosting | **Docker Compose** on a self-hosted VM, later Kubernetes | Cloud (Azure/AWS/GCP, PaaS, Atlas, Blob) is **out** |
| Elasticity (bonus +0.5) | Load test against replicated API containers, then K8s HPA | Plus a CapEx vs OpEx cost analysis in the report |

Compose services: `web` (SPA static), `api` (Express + Socket.io), `mongo`, `backoffice` (Laravel).

## 2. Roles and features (in scope)

- **Visitor**: browse catalog (filter by category, producer, locality, season, organic; search by name/ingredient/producer); public producer page with Leaflet map, ratings and products; register as buyer or producer.
- **Buyer**: cart and orders (pickup or delivery); follow order states `pending → confirmed → ready → delivered`; rate products and producers; bid in live auctions.
- **Producer**: manage catalog (price, stock, photos, public page); update order status (buyer notified in real time); create and follow auctions; sales statistics.
- **Admin**: approve/reject new producers; moderate reported reviews (keep/hide); **moderate content** (PDF slide 4 "reviews and content"): hide or unhide any product or producer public page, which removes it from the public catalog without deleting it or editing its text; global dashboard of users, orders, live auctions.
- **Admin service status panel** (PDF slide 12, adapted to our stack): one card per service with a status (`operational` / `degraded` / `down`) and a short detail. Services: **API** (always up if it answers), **Socket.io** (number of connected sockets), **MongoDB** (ping + latency), **Image storage (Silo)** (reachability check on the bucket), **Swagger UI** (`/api-docs` responds). Served by `GET /api/admin/status` (admin only), each check with a short timeout; a check slower than ~1 s is `degraded`, a failed or timed-out check is `down`. The PDF's Azure/Atlas/Blob names are replaced by our own services.
- **Dashboards with charts** (user decision): producer sales stats and admin overview use charts (sales over time, orders by state, etc.), not only counters. Low-stock alert list on the producer dashboard.

## 3. Auctions (core technical challenge)

- Each auction = a Socket.io room `auction:<id>`; every user also joins `user:<id>`.
- Server is the source of truth. A bid is validated with **one atomic `findOneAndUpdate`**: auction `active`, not past `endsAt`, and `amount >= currentPrice + increment`. Only then is a `Bid` stored and the new state broadcast to the room. Losing racer gets a `bid-rejected` event.
- `currentBid.amount` starts at the base price. Presence count updated on join and on `disconnecting`.
- Server sends `endsAt`; clients compute the countdown locally.
- Producer creates an auction: product, lot quantity, base price, minimum increment, duration (15 min / 30 min / 1 h / **custom**), start time, and may save it as a **draft** (user decision).
- Client hook `useAuction(id, token)`: joins on mount, disconnects on unmount, shows rejected-bid errors; quick bid buttons (+5 / +10 / +25 €) with validated minimum.
- **Winner payment (mock, user addition)**: at close, the highest bidder is charged via a mock card form. Pass/fail is decided by a "simulate invalid card" checkbox or a simple card-number validity check (e.g. 4×4 digits / Luhn). On failure the bidder is skipped and the next-highest distinct bidder is charged, repeating down the bid list until one succeeds, otherwise the auction ends with no winner. The winning payment creates an order.
- The report must discuss auction consistency (concurrent bids, atomicity, broadcast, clock sync).

## 4. Real-time notifications

- When a producer `PATCH /api/orders/:id/status`, the server emits `order-updated` to the buyer's `user:<id>` room **and** to the producer's own `user:<id>` room.
- Buyer sees the live toast and updated state without refresh; the producer's orders table and dashboard update without refresh too.

## 5. Data model (MongoDB)

Collections: `users`, `products`, `orders`, `auctions`, `bids`.

- **Embed** order lines (always read with the order; copy name and unit price at purchase time).
- **Reference** buyer and producer (`User`), product (`Product`), and bids (own collection since they grow without limit).
- Schema validation: `required`, `enum`, `min`.
- At least one query using `$regex`, `$gte`, `$lte` or `$lt` (e.g. product name search, price ceiling, auctions ending within the next hour).
- Every embedding vs linking decision is justified in the report.

## 6. REST API (minimum)

- `GET /api/products` (200, filters `q`, `category`, `maxPrice`, `organic`), `POST` (201 + `Location`), `PUT` (200), `DELETE` (204).
- Producers, orders (`POST /api/orders`, `PATCH /api/orders/:id/status`), reviews, auctions, auth (`/register`, `/login`).
- `GET /api/admin/status` (admin only): per-service status for the admin panel (§2).
- Errors: 400 invalid data, 401, 403, 404.

## 7. Cut list (explicitly NOT built)

From the PDF, removed as slop or mockup-only detail:

- Cloud: Azure/AWS/GCP, App Service, Azure Blob/AWS S3 (self-hosted Silo is the one allowed exception), MongoDB Atlas, IaaS/PaaS/BaaS justification, student credits.
- All PDF code samples as a source of truth (re-implement in TypeScript instead).
- Follower notifications and "delivery to winner" surcharge on auctions.
- Producer document upload for validation (admin just approves/rejects).
- Distance from user ("32 km from you") and geocoding.
- Marketing/pitch decor: hero copy, producer-count banners, category tags like "SEASON/NEW", pixel-level mockup fidelity.
- Real payments (only the mock card in §3; the normal cart checkout is pay on pickup/delivery).
- Plagiarism/AI-usage rules, calendar and grading weights are course logistics, not product scope (the AI-use declaration still goes in the report).

Kept despite being "extras" (user decision): draft auctions, custom duration, charts on dashboards, auction payment cascade, both bonus components.

## 8. Deliverables (course side, not product)

Git repo with README (install/run), running app + Swagger URLs until the defense, report (max 20 pages: architecture, framework and data-model decisions, hosting choice, auction consistency, difficulties, declared AI usage), demo video (max 5 min). Individual 15-minute defense; grade may be adjusted by commit history.

## 9. Milestones

- **M1 (end of week 2)**: responsive frontend and navigable SPA on mock data; OpenAPI sketch.
- **M2 (end of week 4)**: documented API with MongoDB and auth, integrated in the SPA.
- **M3 (end of week 7)**: full app with real time, containerised and running; report and video.
