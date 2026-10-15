# Terse stress test: a cafe payments dashboard

A five-page app (Overview, Transactions, Customers + detail, Menu, Settings) with every visible view
written in Terse. TSX only does routing, state, derived data, and passing props into one `.terse` view
per container. It works at 390 / 768 / 1280px in light and dark. The run took five phases, one commit
each, on branch `stress-test`.

- App: `examples/playground` → `pnpm dev`, then open `/` (the earlier demo pages moved to `/demo/*`).
  Views are in `src/views/cafe/`, containers in `src/pages/cafe/`, mock data in `src/app/data.ts` (204
  transactions, 50 customers, 20 menu items). Screenshot-only flags: `/transactions?state=loading|error`,
  `/menu?add=invalid`, `?theme=dark|light`.
- Log of every gap, by phase: [GAPS.md](GAPS.md). Screenshots: [screenshots/](screenshots/) (each page at
  1280-light, 768-dark, 390-light; the full 48-shot matrix was checked during the run).
- Numbers: `node benchmarks/results/stress/count.ts` → [counts.json](counts.json).

## 1. Token counts

> **Approximation.** `ANTHROPIC_API_KEY` wasn't set and no `ant` login was available, so every count
> below uses **js-tiktoken `o200k_base`**, not Claude's tokenizer. `count.ts` switches to Anthropic
> `messages.countTokens` (`claude-opus-5-5`) when a key and `@anthropic-ai/sdk` are present. Ratios between
> files should hold up better than absolute numbers.

| What | Files | Tokens |
|---|---|---|
| `.terse` views (431 lines) | 12 | **4,743** |
| Compiled TSX for those views | 12 | **17,910** (3.8× the `.terse`) |
| TSX containers (state, derivation, props) | 7 | **7,584** |
| Shared TS helpers (`app/`: data, format, router, sort) | 4 | 4,344 (mostly mock data; not counted below) |

Per view, compiled ÷ `.terse` ranges from 2.3× (`EmptyState`) to 6.1× (`Layout`, where the sidebar renders
its children twice, once for the rail and once for the drawer).

## 2. What the same views would cost as hand-written TSX

Calibrated, not guessed. Two views were rewritten by hand as idiomatic shadcn/Tailwind TSX
([`src/calibration/`](../../../examples/playground/src/calibration/)): Overview (charts + tables) and
Settings (a long form). To make sure the calibration measures the same UI, each container was pointed at
the hand version and screenshotted next to the Terse version. **Both pairs are pixel-identical at 390 and
1280px.**

| View | `.terse` | Hand TSX | Compiled TSX | Hand ÷ `.terse` |
|---|---|---|---|---|
| Overview | 391 | 1,611 | 1,481 | 4.12× |
| Settings | 1,115 | 3,278 | 3,865 | 2.94× |
| Both | 1,506 | 4,889 | 5,346 | **3.25×** |

The hand Settings is *smaller* than the compiled one because a person extracts `Field` / `SwitchRow`
helpers for repeated form rows, and the compiler inlines them. Forms compress least; layout- and chart-heavy
screens compress most.

**Estimate for all 12 views by hand: ~15,400 tokens** (4,743 × 3.25), or ~16,400 using hand ÷ compiled
(0.91 × 17,910). Terse views are **69–71% smaller.**

Fair whole-app comparison: Terse makes you split every screen into a view and a container. The
containers' render calls (`<View a={…} b={…} />`) total ~2,000 tokens, and the views' `props` headers
~350. A hand-written app wouldn't need that plumbing, but it would still need the state and derivation code.

| | Terse app | Hand-written app (estimate) |
|---|---|---|
| UI | 4,743 | 15,400–16,400 |
| State / derivation | 7,584 | 5,200–7,600 (containers minus 0–2,400 of plumbing) |
| **Total** | **12,327** | **20,600–24,000** → Terse is **40–49% smaller** |

## 3. What had to be added (GAPS.md, summarised)

The vocabulary went from **22 to 46 components**. The toolchain diff is +1,522 / −224 lines across
`packages/` and `spec/`, all documented in `spec/components.md` and covered by snapshot tests (83 → 137
tests). **Phase 1 needed nearly everything; Phases 3–5 (Customers, Menu, Settings) needed nothing new.**

| Group | Added | Recommendation |
|---|---|---|
| **Language mechanics** | `pick()`/`named()` multi-slot placeholders in the adapter contract; runtime tokens (`dynamic` + `ctx.lookup()`); `items` prop type and `@ref` data for `numbers`; `requiredWithoutChildren`; `parent` lists; universal props (`hide`); nested-fragment flattening | **Core.** Every adapter needs these; without them overlays, data-driven charts and status colours can't be expressed at all. |
| **Layout** | `spacer`, `slot @content`; tokens `grow`, `span`, `cols` triples (`1,1,2`…), `hide=mobile\|desktop`; `section description` | **Core.** Library-neutral primitives. |
| **Layout (app chrome)** | `shell`, `sidebar` (rail + drawer), `navitem`, `bar side=top\|bottom`; `hide=collapsed` | **Plugin ("app-shell").** Opinionated: one sidebar behaviour, and a `hide` value that only means something inside it. |
| **Input** | `select` (static or `@ref` options), `textarea`, `switch`, `checkbox`, `tabs`/`tab` (panels or segmented control); `button icon count size=icon`; `input icon error` (and `error` on every field) | **Core.** Universal form controls. |
| **Overlay** | `dialog`, `sheet`, `menu`, `menuitem`, `trigger` | **Core** (built on `pick`). |
| **Data display** | `avatar`, `progress`; `table` children form (`thead th tr td`, sortable `th`, clickable `tr`); `chart line\|donut`; tones `success\|warning`; runtime `tone` on `badge`/`stat`/`text`; `icon tone` | **Core**, except charts: **plugin ("charts")**, since they pull in Recharts and their own option surface. |
| **State** | `skeleton`; `callout tone=destructive` with an action row; `card tone=destructive` | **Core.** Empty states needed nothing new: `EmptyState.terse` is composition. |

The plugin split needs an extension point that doesn't exist yet. Today `COMPONENTS` is one record in
`core`. A plugin would register a schema fragment, a components.md section and adapter cases together.

## 4. Pain points (worked, but awkward) and proposed fixes

Ranked by how often they forced TSX workarounds in this app.

| # | Pain point (examples) | Proposed fix |
|---|---|---|
| 1 | **No equality in `if`**: status → tone map, active nav item, grid vs list (`isGrid`), tier tone. 5 lookup tables or booleans in TSX. | `if @view is grid` (literal right-hand side only), and `match @status` / `case Failed` lines. |
| 2 | **Per-row handlers need closures built in TSX**: `onOpen`, `onToggle`, `onRole`, `onRemove` added to every row object. | `on=@open with=@t.id`: binds one argument, still no expressions. |
| 3 | **if/else ladders**: loading → error → empty → data is 4 levels deep in `Transactions.terse`. Views reach depth 9–10 (`Customers.terse`). | `elif @error` at the same indent; `switch @state` with `case` lines. |
| 4 | **No negation in props**: `noPrev`, `noNext`, `noFilters`, `cannotRefund`, `cannotClose`, `cannotSave`. | `disabled=!@hasPrev` (same truthiness as `if not`). |
| 5 | **No string interpolation**: per-row accessible names ("Remove Ritu Menon"), "Type “Indiranagar” to confirm.", "Showing 1–20 of 72", all assembled in TSX. A literal `"{m.name}"` compiles silently. | `"Remove {m.name}"` with refs only; reject `{` in strings until then. |
| 6 | **Icons are compile-time literals**: no per-stat icons in `StatRow`, one marker for every timeline event. | `icon @ev.icon from=check,x,undo-2`: declare the finite set so imports stay static, like runtime tokens. |
| 7 | **Form wiring by hand**: `value=@form.x on=@set.x` ×14 in Settings, plus 11 props for one dialog form in Menu. | `form @form on=@onField` binding child fields by `name=` and calling `onField(name, value)`. |
| 8 | **Single-slot `card`**: the range toggle can't sit in the card header next to the title. | A `card` `actions` slot (`pick(named('actions'))`, now possible). |
| 9 | **Overlays live where their trigger is**: the whole Add-item form nests inside the toolbar row. | `dialog id=addItem` at top level, opened by `button opens=addItem`. |
| 10 | **Handler argument shapes are invisible**: reusing a dialog's `on` (boolean) for a Cancel button (click event, truthy) kept it open. | Document argument types per handler; `button close=true` inside an overlay. |
| 11 | **No responsive spacing**: `pad=lg` overflowed tables at 390px, so every page uses `pad=md`. | Pairs like `cols`: `pad=sm,lg`. |
| 12 | **Repeated sort wiring**: `sort=@sort.x on=@sortBy.x` per column. | `thead sort=@sort on=@onSort` + `th sortable=amount`. |
| 13 | **Duplicated markup in one file**: the customer grid and list render the same avatar/name/badge twice. | Local fragments: `def CustomerName c` … then `CustomerName c=@c`. |
| 14 | **Chart formatting**: y-axis shows `60000` and `0.5 visits`. | `chart format=currency\|integer`. |
| 15 | **Long `props` headers** (Layout: 21 names over 5 lines), and props compile to `any`. | Keep explicit `props`, but emit types from usage (`@x.length` → array, `on=@x` → function). |
| 16 | **Leading icon only**: "Next ›" can't have a trailing chevron. | `iconEnd=`. |

## 5. Compile errors

**Hit while building: none in `.terse`.** All 12 views compiled on first write. The build-time
failures were elsewhere:

- **Toolchain bugs caught by the new tests**:
  - runtime class lookups dropped their classes (`"x " + t[k] ?? ""` precedence)
  - an empty `className=""`
  - a stray `text-lg` on icons
  - a double root fragment
- **Bugs caught only by looking at the pages**:
  - `hide` as a wrapping `<div>` was invalid inside `<tr>`
  - duplicate React keys in donut legends
  - dark-mode checkboxes rendering unchecked
  - black native date pickers in dark mode
  - missing `aria-invalid` styling
- **Caught only by the calibration pixel diff**: every icon-only button was 16px wide (`w-fit` beat
  `size-9`).

The tests and validator were good at the shape of the code; the visual bugs took screenshots and the
calibration diff.

**Probe.** To judge the messages, 16 likely mistakes were compiled on purpose:

| Mistake | Message | Enough to fix it? |
|---|---|---|
| `navItem "Overview"` | `unknown component 'navItem' — did you mean 'navitem'?` | Yes |
| `text @tz.amount` | `unknown reference '@tz.amount' — did you mean '@tx'?` | Yes |
| `td` outside `tr` / `trigger` outside an overlay | `'td' must be inside a 'tr'` / `… inside a 'menu' or a 'dialog' or a 'sheet'` | Yes |
| `select` without `options`; `hide=tablet`; 3-space indent | names the prop / lists valid values / `multiple of 2 spaces (found 3)` | Yes |
| `cols=1,1,4` | suggests `1,1,2` then lists all 19 values | Yes, but noisy |
| `icon @m.icon`, `heading tone=@t.tone` | `must be a literal, not a reference` | Says *what*, not *how*: doesn't mention computing it in TSX, or that `tone` is runtime-capable on `badge`/`stat`/`text` |
| `if @status == "Failed"`, `disabled=!@hasPrev`, `on=@open(t.id)` | `expected: if @condition`, `must be true, false or a reference`, `invalid reference` | Accurate, but each is an unsupported feature (pain points 1, 4, 2) and the message doesn't say "compute this in the container" |
| `row span=2` | `unknown prop 'span' on 'row' — did you mean 'pad'?` | Misleading; should say `span` exists on `card`/`col` |
| `text @tx.amout` | **no error**, renders empty | Only the ref's root is checked |
| `button "Remove {m.name}"` | **no error**, renders the braces | No interpolation and no warning |

Recommendations:
- For a feature Terse leaves out on purpose, the message should point to the container pattern ("compute
  `isFailed` in TSX and use `if @isFailed`").
- "did you mean" should offer props from other components when the name exists elsewhere.
- Typed `props` (pain point 15) would catch path typos.
