# Due Board — visual system

## Thesis: brutalist concrete and moss

Due Board should feel like a dependable workshop ledger pinned to a concrete wall: blunt, calm, tactile, and built to be checked every Friday. It avoids fintech gloss and accounting-software chrome. The interface uses hard edges, visible rules, stamped labels, and one restrained patch of living moss as a metaphor for cash pressure becoming manageable. Decoration only appears where it reinforces that world.

This is an intentionally single-mode, warm-light interface. Painting the page explicitly keeps printed and on-screen states predictable; the dark “charcoal slab” header supplies depth without turning the utility into a dashboard theme.

## Palette

All colors are encoded as CSS custom properties.

| Token | Value | Use |
| --- | --- | --- |
| `--concrete-0` | `#F2F0E8` | page and print stock |
| `--concrete-1` | `#E5E1D6` | recessed controls, secondary bands |
| `--concrete-2` | `#C8C2B4` | dividers and disabled structure |
| `--charcoal` | `#20231F` | primary text and header slab |
| `--charcoal-soft` | `#4F544D` | secondary copy; verified for 4.5:1 on concrete-0 |
| `--paper` | `#FFFEF8` | editable and independent bill surfaces |
| `--moss` | `#496327` | primary action and paid status |
| `--moss-deep` | `#2E4517` | hover, focus, high-contrast moss text |
| `--lichen` | `#DCE7BF` | selected/positive wash |
| `--amber` | `#A65312` | due-soon text and warning rule |
| `--rust` | `#8C2F21` | overdue/error text |
| `--focus` | `#176D88` | focus ring, distinct from status color |

Status never relies on color: words, day counts, and icons accompany every hue.

## Typography

- **Display / editorial:** Georgia, `Times New Roman`, serif. It gives “paper ledger” authority and is only used for the single h1, major amounts, and empty-state callouts.
- **Utility / data:** `Arial Narrow`, `Roboto Condensed`, `Segoe UI`, sans-serif. System-hosted to avoid a font payload or remote request. Uppercase tracking is limited to short field and status labels.
- Scale: 14px micro labels, 16px body, 18px action/section copy, 24px section heading, fluid 40–64px h1. Body leading is 1.5; numbers use tabular figures.

## Spacing and shape

- Base rhythm: 4px; primary steps: 8, 12, 16, 24, 32, 48, 64.
- Desktop content max: 1180px. Reading measure: 68ch.
- Corners are 0–4px: square slabs and clipped tags, not friendly SaaS pills. A `clip-path` notch is used sparingly on the add button and hero material sample.
- 2px charcoal rules establish structure. Shadows are hard 4px offsets, suggesting stacked paper rather than floating glass.
- Targets are at least 44×44px. Mobile drops ornamental copy, stacks the totals, and turns the data table into labeled bill sheets.

## Interaction grammar

- “Add bill” opens a modal sheet from the button’s visual layer. Edit reuses the same sheet with a clear title and prefilled values.
- Marking paid reveals a short proof-of-payment step (paid date and optional note), because the record is more useful than an optimistic toggle.
- Destructive deletion names the supplier/invoice in a confirmation, then provides a timed Undo toast.
- Filters behave like a physical index strip. Search, status, and time horizon update the result count immediately.
- Global feedback lives in an assertive/polite toast rail. Storage failures give a recovery path (export what is still in memory and retry).

## Motion

- 180ms for press/focus and filter-state transitions; 240ms sheet entrance; easing `cubic-bezier(.2,.8,.2,1)`.
- Only transform and opacity animate. Bills do not reorder with theatrical movement; after state changes the changed row receives a brief static lichen highlight.
- Under `prefers-reduced-motion: reduce`, transitions and smooth scrolling become instant and no element translates.

## Original asset plan and prompt sheet

One generated asset, `due-board-material.webp`, appears beside the concise product introduction on wider screens and becomes a shallow band on mobile. It establishes the product’s material world without pretending to show a capability.

**Art direction:** overhead still life; a small stack of blank cream invoice slips held by one oxidized steel clip on rough pale concrete; a narrow patch of natural green moss entering from one edge; raking late-afternoon workshop light; hard editorial shadows; tactile macro material photography; warm concrete, charcoal, moss, restrained rust; 50mm lens; asymmetric negative space; quiet and utilitarian.

**Negative list:** no people, hands, currency symbols, legible writing, screens, calculator, logos, brands, watermark, fantasy objects, glossy fintech lighting, gradients, excessive props, mold, dirt, insects, distorted paper, duplicated clips.

**Production prompt:** “Overhead editorial material still life for a local-first supplier invoice due-date utility: a small stack of completely blank cream invoice slips held by a single oxidized steel bulldog clip, resting on rough pale warm concrete, with a narrow natural patch of deep green moss entering from the upper edge. Raking late-afternoon workshop light and crisp hard shadows, tactile macro material photography, warm concrete and charcoal palette with restrained moss and rust, 50mm lens, asymmetrical composition with generous empty area, calm brutalist utility mood. No people, no hands, no currency symbols, no legible text, no screens, no calculator, no logos, no brands, no watermark, no glossy fintech aesthetic, no gradient, no extra props, no insects.”

Generate at 1536×1024 with the factory image model, review at original resolution, retain the chosen PNG and prompt sidecar in `assets/src/`, then export WebP and AVIF variants with the mobile WebP at or below 300 KB.

## Asset provenance

Generated assets are original to Due Board and are disclosed in the footer. Hand-authored interface icons use inline SVG strokes and are MIT-licensed with the application.

- **Retained source:** `assets/src/due-board-material.png`
- **Generator:** factory image model (`factory-image` deployment) through `/opt/fleet/lib/gen-image.sh`; generated 2026-08-28 at 1536×1024, high quality.
- **Prompt:** the production prompt above, stored verbatim in `assets/src/due-board-material.json`.
- **Review:** inspected at original resolution. Blank paper edges and shadows are coherent; the image contains one plausible clip, no lettering, no people, no brand marks, no watermark, and no unintended symbols.
- **Delivery:** responsive 768px and 1536px WebP plus 1536px AVIF. All WebP variants are kept below the 300 KB hero limit. Exact byte sizes are recorded in the handoff after the production build.
