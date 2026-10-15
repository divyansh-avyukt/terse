# Terse stress test: gaps log

Every place where the Terse v0 vocabulary could not express the cafe payments dashboard, and what was
added so the view could stay in `.terse`. Each entry: **what was needed → why v0 couldn't → which file →
what was added**. Grouped by phase in the order they were hit.

Type legend: `core` (language/schema/validator), `compiler` (emitter / adapter contract), `component`
(new vocabulary), `prop` (new prop on an existing component), `token` (new style token value).

## Phase 1: shell + Overview

### Core / compiler

| # | Needed | Why v0 couldn't | File | Added | Type |
|---|---|---|---|---|---|
| 1 | One component placing children in two spots (a menu's trigger vs. its items; a table's header vs. body) | The adapter contract had a single `CHILDREN` placeholder: every child went to one place | `Layout.terse` (avatar menu) | `pick(match)` placeholder + `named(...)` matcher in `compiler/src/adapter.ts`; `fill()` routes each child to the first matching slot. Fragment children (tag `''`) are flattened into their parent | compiler |
| 2 | Status badge colour and KPI delta colour chosen by data | Token props (`tone`) must be literals so classes resolve at compile time, and `if` can only test truthiness (no `== "Failed"`) | `StatRow.terse`, `StatusBadge.terse` | `ComponentSpec.dynamic`: listed token props also accept a `@ref`; the adapter emits a lookup table of every value's literal classes via new `ctx.lookup()` (classes stay scannable). On `badge.tone`, `stat.tone`, `text.tone` | core |
| 3 | Revenue chart whose data changes with a 7d/30d/90d toggle | `chart x=` and `series` values were literal lists only | `Overview.terse` | New prop type `items` (a list literal or a `@ref`); `numbers` also accepts a `@ref`. The chart zips arrays at runtime when any input is a ref | core |
| 4 | A layout that renders whatever page is current | A view had no way to place a React node received as a prop | `Layout.terse` | `slot @content` component | component |
| 5 | Hamburger only on mobile, search only on desktop, labels hidden in an icon rail | No responsive visibility at all | `Layout.terse` | Universal prop `hide=mobile\|desktop\|collapsed` on every component (`UNIVERSAL_PROPS` in schema; merged into the root `className`, or a `display:contents` wrapper for roots without a DOM node) | core / token |
| 6 | Chart card spanning 2 of 3 columns next to the donut | `grid` children were always 1 column | `Overview.terse` | `span=1\|2\|3` token on `card` and `col` | token |
| 7 | `table` with either `rows+cols` or rich children | `required` was unconditional | `TransactionsTable.terse` | `ComponentSpec.requiredWithoutChildren` | core |
| 8 | `trigger` allowed under menu, dialog and sheet | `parent` was a single name | overlays | `parent` takes a list | core |

### Components and props

| # | Needed | File | Added | Group |
|---|---|---|---|---|
| 9 | App frame with sidebar + main column | `Layout.terse` | `shell` | layout |
| 10 | Collapsible sidebar: icon rail on md, full on lg, drawer on mobile | `Layout.terse` | `sidebar collapsed open on` (renders its children twice: rail + `Sheet`) | layout |
| 11 | Nav item with icon, active state, collapsible label | `Layout.terse` | `navitem label icon active on` | layout |
| 12 | Sticky top bar (and later a sticky save bar) | `Layout.terse`, `Settings.terse` | `bar side=top\|bottom` | layout |
| 13 | Push the store switcher to the sidebar bottom | `Layout.terse` | `spacer` | layout |
| 14 | Main column filling the rest of the row | `Layout.terse` | `grow` token on `row`/`col` | layout |
| 15 | Store switcher, status/method filters | `Layout.terse`, `Transactions.terse` | `select` (static or `@ref` options) | input |
| 16 | Icon buttons (theme toggle, bell, menu) + notification count | `Layout.terse` | `button icon=`, `size=icon`, `count=` | input |
| 17 | Avatar with dropdown (Profile, Billing, Sign out) | `Layout.terse` | `avatar`, `menu`, `menuitem`, `trigger` | overlay / data display |
| 18 | 7d/30d/90d range toggle | `Overview.terse` | `tabs` + `tab` (a tab without children is a segmented-control button) | input |
| 19 | Line chart (revenue) and donut (payment mix) | `Overview.terse` | `chart line`, `chart donut` | data display |
| 20 | Top-items table with a progress bar per row, recent payments with avatar + badge | `Overview.terse` | `table` children form: `thead`, `th`, `tr`, `td`; `progress` | data display |
| 21 | Positive/negative KPI deltas need green, warnings amber | `StatRow.terse` | `tone=success\|warning` | token |
| 22 | Search box with a magnifier icon | `Layout.terse` | `input icon=` | input |
| 23 | Two-up cards only on large screens (with the md icon rail, `cols=1,2` crushed tables at 768px) | `Overview.terse` | `cols` triples `a,b,c` (below md / md / lg): `1,1,2 1,1,3 1,2,3 1,2,4 2,2,4`; `span` moved to `lg` so it never adds implicit columns to a narrower grid | token |

### Pain points (worked, but awkward)

- **No equality in `if`:** the status → tone map (`STATUS_TONE`) and the "which nav item is active" flags
  (`nav={{ [section]: true }}`) must be computed in TSX. Every enum-driven UI becomes a TSX lookup.
- **Icons are compile-time literals:** a stat row from data can't carry per-stat icons
  (`StatRow.terse` dropped them), since the adapter imports each lucide icon statically.
- **Per-row handlers need closures built in TSX:** `tr on=@t.onOpen` works only because `txRow()`
  attaches an `onOpen` closure to every row object. There is no `on=@open(t.id)`.
- **`list`/`item` is label-value only:** a "recent payments" list with an avatar, two-line text and a
  badge had to be a header-less `table`.
- **No card header actions:** the range toggle belongs in the card header (right side); it sits at
  the top of the body because `card` has a single children slot.
- **Chart numbers aren't formattable:** the revenue y-axis shows `60000`, not `₹60k`; there's no
  `format=` on `chart`.
- **Long `props` lists:** `Layout.terse` declares 21 props over 5 `props` lines. Grouping them as one
  object (`@shell.search`) would shorten the header but hide what the view needs.
- **Layout gets its page as a JSX prop:** `AppShell.tsx` passes `content={<OverviewPage store=… />}`.
  That's TSX rendering a container rather than markup, but it is the one place a TSX file holds JSX
  besides its single view.

### Compile errors hit

- None from `.terse` this phase. (One TS error in `data.ts`, unrelated.)
- Toolchain bugs found by the snapshot/behaviour tests while adding features: an empty `className=""`
  from a lookup with no match, a stray `text-lg` on icons, and an operator-precedence bug where
  `"cls " + table[x] ?? ""` dropped classes (fixed by parenthesising every runtime lookup).
