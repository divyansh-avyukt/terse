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

## Phase 2: Transactions

The vocabulary for this page was designed with Phase 1 (same commit), from the spec's list; these are
the rows this page actually depends on, plus what only showed up once it rendered.

| # | Needed | File | Added | Type / group |
|---|---|---|---|---|
| 24 | Sortable column headers with direction arrows and `aria-sort` | `TransactionsTable.terse` | `th sort= on=` (button + runtime arrow choice) | data display |
| 25 | Clickable, keyboard-reachable rows that open a sheet | `TransactionsTable.terse` | `tr on=` (role=button, Enter/Space) | data display |
| 26 | Side sheet with details, a timeline and actions | `TransactionSheet.terse` | `sheet` (controlled `open`/`on`) | overlay |
| 27 | Loading skeleton | `Transactions.terse` | `skeleton lines= size=` | state |
| 28 | Error state with a Retry action inside the alert | `Transactions.terse` | `callout tone=destructive` + children as an action row | state |
| 29 | Hide the ID / Time / Method / avatar columns on phones | `TransactionsTable.terse` | `hide` merges into the root element's `className` instead of wrapping (shipped in the Phase 1 commit, caught while designing this table) (a `<div>` inside `<tr>` is invalid DOM); the wrapper is kept only for roots with no DOM node (fragments, Radix `Select`/`Dialog`/…) | core |
| 30 | Date range, status and method filters with labels | `Transactions.terse` | `input type=date` (existing), `select` | input |

### Pain points

- **if/else ladders for page states.** loading → error → empty → data is four levels deep:
  `if @loading / else / if @error / else / if @empty / else`. Proposed: `elif @error` (or a `switch @state`
  block with `case loading` lines).
- **No negation in props.** `disabled=` needs `noPrev`, `noNext`, `noFilters`, `cannotRefund` computed in
  TSX because `disabled=@hasPrev` can't be flipped. Proposed: `disabled=!@hasPrev`, which is the same
  truthiness rule `if not` already uses.
- **Icon only before the label.** "Next ›" can't have a trailing chevron (`button icon=` always leads), so
  the Next button has no icon and looks unbalanced next to "‹ Previous". Proposed: `iconEnd=`.
- **Timeline markers can't vary by event.** Same root cause as Phase 1's icons: every event gets
  `circle-dot` because `icon` must be a literal.
- **No responsive spacing.** At 390px the default `page pad=lg` (24px) plus card padding pushed the status
  badge out of the table. Every cafe page now uses `pad=md` at all widths. Proposed: a pair like
  `pad=sm,lg` (below md / from md), matching `cols`.
- **Repeated sort wiring.** Each sortable column repeats `sort=@sort.x on=@sortBy.x`. Proposed: `th "Amount"
  sortable=amount` with one `sort=@sort` on `thead`, so the adapter derives both.

### Compile errors hit

- None. All four new views compiled first time. The TSX side needed one fix (a `TransactionsPage`
  props rename when the store filter was added).
- Not a Terse error, but found by screenshots: native date inputs showed black calendar icons in dark
  mode until `.dark { color-scheme: dark }` was added to `index.css`.

## Phase 3: Customers

**No new components or props.** The grid/list toggle is `tabs` without panels (+ `tab icon=`), the
detail page's Overview / Transactions / Notes are `tabs` with panels, clickable customer cards use
`card on=`, the visit chart is `chart bar` fed by a `@ref`, the Notes form is `textarea error=` +
`button`, and the Transactions tab reuses `TransactionsTable.terse` unchanged. Phases 1–2 had already
paid for this page.

### Pain points

- **Third enum-as-booleans workaround.** Grid vs list is driven by `isGrid={view === 'grid'}` passed next
  to `view` itself, because `if` can't compare. Same for tier → badge tone (`TIER_TONE`). Proposed:
  `if @view is grid` (literal-only right side, so it stays a simple check).
- **Two renderings of one list.** The grid and the table iterate the same `@customers`, with the same
  avatar/name/badge cells written twice. A local, parameterised fragment (a `def CustomerName c` block
  in the same file) would remove it without a new file.
- **Count charts get fractional ticks.** "Visits by weekday" shows 0.5, 1.5 on the y-axis. Proposed:
  `chart … ticks=integer` (or infer it from integer literal data, impossible for `@ref` data).
- **Shared-table plumbing.** Reusing `TransactionsTable` means every container repeats the `sort` / `sortBy`
  props, now behind a `useTxSort()` hook. That's TSX-side and fine, but it shows that a reusable view's
  contract is "whatever props it lists", with no types at the boundary (`props` compile to `any`).

### Compile errors hit

- None in `.terse`. One playwright script bug: tab triggers have role `tab`, so clicking "Transactions"
  as a `button` hit the sidebar's nav item instead.

## Phase 4: Menu

**No new components or props.** Category tabs are `tabs` without panels; item cards compose `card`,
`heading`, `text`, `badge`, `switch`; the "Add item" form is a `dialog` with a `trigger` and inline errors
via the `error=` prop on `input` / `select` / `textarea` (all added in Phase 1). The only fix was outside
Terse: the playground's `input.tsx` predated shadcn v4's `aria-invalid:` styles, so invalid text inputs
had no red border while the select did.

### Pain points

- **The dialog's form sits in the middle of the page's tree.** Because the trigger has to be a child of
  `dialog`, the dialog (form fields and all) is nested inside the toolbar `row`, 3 levels in, between the
  category tabs and the item grid. Proposed: allow `trigger for=addItem` elsewhere, or let a top-level
  `dialog id=addItem` be opened by `button opens=addItem`.
- **Eleven props for one form.** `form`, `errors` and one handler per field (`onName`, `onPrice`, …).
  Proposed: `form @form on=@onField` on a container component that binds every child field by `name=`,
  calling `onField(name, value)`, so the view shrinks to field lines and the container keeps one handler.
- **Per-item handlers again.** Each card's availability `switch on=@m.onToggle` needs a closure built per
  item in TSX.
- **A card can't have a full-bleed image header.** `image` only has square sizes (`sm md lg`); a menu card
  photo across the top isn't expressible, so new items show a 48px thumbnail beside the name.

### Compile errors hit

- None in `.terse`. One TSX bug (`m.soldTodayCount()`, caught by `tsc`).
