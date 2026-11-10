# Design — Farm to Table (web)

The single visual reference for `apps/web`. Every page ticket follows it; change it only on purpose, never per page.

**Direction:** a local market stall, not a SaaS dashboard. Produce, producers and prices lead; chrome stays quiet. Mode: *Operate* for buyer/producer/admin screens, light *Persuade* only on the home hero.

## Tokens (source: `src/styles/globals.css`)
- **Paper** `--background` warm off-white; **ink** `--foreground` deep green-black; `--card` pure white.
- **Leaf** `--primary`: brand, primary actions, current-page markers.
- **Amber** `--live` / `--live-foreground`: means **"live auction"** and nothing else (live badge, countdown, current bid). Never decorative.
- `--destructive` for errors and cancel only. Order states use text plus a neutral or leaf badge, never colour alone.
- Use tokens via Tailwind (`bg-primary`, `text-muted-foreground`, `bg-live`). No raw hex/oklch in components.

## Type
- Display: **Bricolage Grotesque** (`font-display`), applied to h1–h3 automatically, tracking −0.025em, `text-balance`.
- Body/UI: **Figtree** (`font-sans`, default). Body ≥16px, prose ≤ 60–70ch.
- Numbers that change or align (prices, stock, bids, countdowns): `tabular` class or `<data>`/`<time>`.
- Money and dates only through `services/format.ts` (English, €).

## Layout & components
- Container `mx-auto max-w-6xl px-4`; mobile first; breakpoints `md` 768 / `lg` 1024 / `xl` 1280.
- shadcn/ui first (`npx shadcn add …`, then fix its `cn` import to `@/components/ui/utils`). Don't hand-roll a control shadcn has.
- Radius: cards 12–16px (`rounded-xl`); pills only for small badges.
- Elevation: border **or** shadow, never both. Default is a 1px border on white cards.
- Choose the structure from the content: tables for comparing rows (orders, users), lists for sequences, cards only for self-contained items (a product, a lot). No grids of identical icon+title+text cards.
- Every data screen uses `PageState` for loading / empty / error; empty copy says what to do next.
- Icons: `lucide-react` only, `aria-hidden` when decorative, labelled when icon-only. No emoji as icons.
- Touch targets ≥40px on primary controls; visible focus (global `:focus-visible` ring) is never removed.
- Motion: 150–250 ms ease-out on state changes only; reduced motion is honoured globally.

## Banned (fails review)
Eyebrow/kicker labels above headings · gradient text · glass/blur as decoration · coloured left-border callouts · hero-metric stat strips · nested cards · section numbers 01/02/03 · monospace as decoration · purple/pink AI gradients · stock "card soup" landing layouts · placeholder-only form labels.

## Copy
English, plain and specific. Buttons name the action ("Add to cart", not "OK"). Errors say what failed and how to recover. State values are English in data too (`pending`, `confirmed`, `ready`, `delivered`); labels come from one shared map per feature (Pending, Confirmed, Ready, Delivered).
