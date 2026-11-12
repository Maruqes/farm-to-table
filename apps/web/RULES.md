# Frontend rules — Farm to Table (web)

The visual rules for `apps/web`. **Direction: the painted price board.** The site looks like a market's price board and its crate labels, not like an online shop template. Where this file and [DESIGN.md](DESIGN.md) disagree, this file wins; DESIGN.md's non-visual rules (shadcn first, `PageState`, copy, accessibility, formatting through `services/format.ts`) still apply.

Reference prototypes (static HTML, open in a browser): [painted board](../../docs/design-directions/axc-painted-board.html) for lists, [crate label](../../docs/design-directions/c3-crate-label.html) for product detail, [auction clock](../../docs/design-directions/a3-auction-clock.html) for the auction room.

## The three ideas
1. **Lists are board rows, never card grids.** Catalog, producers, orders, auctions, admin tables: one row per item, separated by a 1px rule, under a thick top rule.
2. **A product is a crate label.** The product detail page (and a producer's public page header) is one big flat-colour label: producer line, huge uppercase name, origin and lot number on a double rule, a round stamp, a tilted price tag.
3. **Everything for sale has a lot number.** Three digits, shown first in every row and on every label. Auctions use the same numbering ("lot 009").

## Tokens
Defined once in `src/styles/globals.css` (CSS variables, light and dark, exposed as Tailwind colours: `paper`, `ink`, `dim`, `tag`, `tag-ink`, `wash`, `alarm`, `crate-ink`, `board`, `board-ink`, `amber`, `tile-*`); use them through Tailwind utilities (`text-dim`, `border-ink`, `bg-wash`) or the classes below, never raw colours in components.

| Token | Light | Dark | Use |
|---|---|---|---|
| paper (`--paper`) | `#f6ecd6` | `#16130e` | page |
| ink (`--ink`) | `#14301b` | `#f3e9d2` | text, rules, borders, primary buttons |
| dim (`--dim`, `text-body-secondary`) | `#5d6b55` | `#a39c88` | secondary text, row rules |
| tag (`--tag`) | `#c8102e` | `#ff5a6e` | price tags, "live"; nothing else |
| tag ink (`--tag-ink`) | `#ffffff` | `#20040a` | text on tag |
| crate colours (`--tile-*`) | cheese `#f2c14e`, honey `#e8962e`, bakery `#d9a066`, wine `#a8496c`, fruit `#a8c256`, veg `#5c9e4a` | same hues, darker | category chips and label backgrounds only |

- Light and dark are both first-class; every token has both values. Text on a crate colour is always dark (`#14301b`), in both themes.
- There is no white card surface: no `.card`, shadows, rounded corners or white backgrounds.
- Dark mode follows the existing theme toggle and the tokens in `globals.css`.

## Type
- **Display: Big Shoulders Display 800**, uppercase, tight leading (0.85–0.95). Page titles, label names, prices in rows, price tags.
- **Everything else: Azeret Mono** 400/600. Body 15–16px. Numbers are always tabular.
- No third font. No italics. Uppercase only in the display font and on small label lines.

## Shape
- **Radius is 0 everywhere.** The only round thing is the label stamp (a full circle).
- **Borders, not shadows.** 2px ink on controls and chips, 4px on labels, the header rule and the live strip. No shadows, no blur, no gradients.
- **Tilt is reserved for the price tag and the stamp** (−4° to −6° for tags, about 12° for stamps). At most one tilted tag per row, label or strip. Nothing else rotates.

## Components
- **Board row:** crate chip (square, category colour) · lot number · name with producer and place underneath in dim · price in display type with "per unit" underneath · one action button. On phones the row keeps chip, lot, name, price and action; secondary columns drop.
- **Category filter:** square chips filled with the crate colour when on, outlined when off (`aria-pressed`).
- **Buttons:** square, 2px ink border, ink fill with paper text; hover inverts. Minimum height 40px (52px for the main action on a label page).
- **Live strip:** 4px ink border, one line of mono text (lot, item, time left) and the current bid as a tilted tag. It links to the auction room.
- **Crate label:** flat crate colour of the product's category, 4px ink border, content pinned top and bottom, tag overlapping the right edge.
- **Auction room:** the one dark surface in both themes: board `#1c1b18`, amber `#f5a623` for the countdown ring, current bid and bid button. Amber exists only there.
- **Tables (orders, admin):** the same rows; column headers in dim mono, no zebra stripes, no cards around the table.
- **Forms:** square inputs with 2px ink border on paper, label above in small uppercase mono.

## Motion
150–250ms ease-out on state changes only. The countdown ring and a changing bid may animate; honour `prefers-reduced-motion`.

## Banned (fails review)
Rounded corners · pill buttons or badges · card grids for lists · white cards on a tinted page · shadows · gradients · the tag red or a crate colour used as decoration · a second tilted element in the same block · any font besides the two above · Bricolage Grotesque, Figtree, Inter · plus everything already banned in DESIGN.md.

## Vocabulary
The app is **Tailwind v4** (`src/styles/globals.css`). Layout, spacing and type use Tailwind utilities. Breakpoints: `sm` 576, `md` 768, `lg` 1024, `xl` 1280.

Shared classes from `globals.css` (compose these, do not restyle them per page):
- **Type:** `h1`-`h3` are already the display face (uppercase); `font-display` puts it on other text; `tabular`, `measure` (65ch), `label-line`.
- **Rules and frames:** `rule` (2px ink top rule), `rule-thick` (4px), `rule-dim` (1px), `frame` (2px ink border), `frame-thick` (4px), `frame-alarm`, `ink-fill` (ink background, paper text).
- **Board:** `board`, `board-row`, `lot`, `price`, `price-tag`, `crate-chip`, `crate-label`, `stamp`, `double-rule`, `bg-tile-veg|fruit|honey|wine|cheese|bakery`.
- **Controls:** `Button` (`variant`: default, outline, secondary, ghost, link, destructive, amber; `size`: sm, lg = 52px main action, icon), `Badge` (`variant`: default, outline, secondary, destructive, live), `Input`; or the raw classes `form-control`, `form-select`, `form-check` + `form-check-input` + `form-check-label`, `form-label`, `form-text`, `is-invalid` + `invalid-feedback`, `table` (already board-styled).
- **Dialogs:** radix `Dialog.Overlay className="dialog-overlay"` and `Dialog.Content className="dialog-panel"`.
- **Icons:** lucide with the `size` prop (`<Star size={16} />`), not size classes.
- **Page-specific styles** are inline Tailwind utilities with the tokens above. No inline `style` except computed values (a bar width, a chart height).

## Status
Shared pieces: `src/styles/globals.css` (tokens and the shared classes above); `CrateChip` in `src/components/board.tsx`; `crateClass` and `lotNumber` in `src/components/crate.ts`. New UI composes these instead of restyling per page. Lot numbers are derived from the id in the frontend until the API has a field for them.
