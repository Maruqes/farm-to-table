# Design — Farm to Table (web)

The single visual reference for `apps/web`. Every page ticket follows it; change it only on purpose, never per page.

**Direction:** bold market: chunky type, produce colours, friendly rounded controls. Produce leads; chrome stays quiet. Mode: *Operate* for buyer/producer/admin screens. No marketing hero: the home page opens on the catalog. Live auctions run in a fixed ticker at the bottom of the catalog page only.

## Tokens (source: `src/styles/globals.css`)
- **Paper** `--background` off-white; **ink** `--foreground` warm near-black; `--card` white.
- **Beet** `--primary`: brand, primary actions, current-page markers.
- **Produce tiles** `--tile-veg|fruit|honey|wine|cheese|bakery`: only as the image area of a product with no photo, chosen by category. Never on chrome or text.
- **Carrot** `--live` / `--live-foreground`: means **"live auction"** and nothing else (live badge, countdown, current bid). Never decorative.
- `--destructive` for errors and cancel only. Order states use text plus a neutral or leaf badge, never colour alone.
- Use tokens via Tailwind (`bg-primary`, `text-muted-foreground`, `bg-live`). No raw hex/oklch in components.

## Theme
- Light and dark are both first-class. Initial theme follows the OS; the header toggle overrides and is stored in `localStorage.theme`. Every token has a `.dark` value; never hard-code a light-only colour.

## Type
- Display: **Bricolage Grotesque** (`font-display`), h1–h3 weight 800, tracking −0.03em; prices on product cards use it too.
- Body/UI: Figtree regular/medium. Body ≥16px, prose ≤ 60–70ch.
- Numbers that change or align (prices, stock, bids, countdowns): `tabular` class or `<data>`/`<time>`.
- Money and dates only through `services/format.ts` (English, €).

## Layout & components
- Container `mx-auto max-w-6xl px-4`; mobile first; breakpoints `md` 768 / `lg` 1024 / `xl` 1280.
- shadcn/ui first (`npx shadcn add …`, then fix its `cn` import to `@/components/ui/utils`). Don't hand-roll a control shadcn has.
- Radius: cards 18px (`rounded-xl`); buttons are pills (`rounded-full`); pills only for small badges.
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
