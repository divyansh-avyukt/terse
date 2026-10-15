# Terse v0 — components

Notation: `name <positional args> [props]`. Positional args fill the props named in `<…>`, in order;
each can also be written as `key=value`. **Required** props are marked `*`.

Prop types: **text** (literal or `@ref`) · **ref** (`@ref` only) · **handler** (`@ref` to a function) ·
**bool** (`true`/`false` or `@ref`) · **literal** (not a `@ref`) · **list** (`a,b,c`; ranges expand:
`Thu..Wed` → Thu,Fri,…,Wed (weekdays wrap), `1..5`) · **numbers** (a list of numbers, `72,68,65.5`) ·
**items** (a list literal, or a `@ref` to an array) · **token** (literal from a fixed set, see SPEC). A token
marked *runtime* also takes a `@ref` whose value is one of the same words (`badge @t.status tone=@t.tone`).

## Universal props

Every built-in component also takes:
| prop | type | notes |
|---|---|---|
| hide | `mobile desktop collapsed` | hide below `md`, from `md` up, or while the enclosing `sidebar` shows icons only |

## Layout

### page
`page <title>` — screen root: centered, max-width column with an `h1`.
| prop | type | default |
|---|---|---|
| title | text | — |
| gap, pad | token | lg, lg |
| size | token — max width: sm `max-w-3xl`, md `max-w-5xl`, lg `max-w-6xl` | lg |

### section
`section <title>` — titled group (`h2`) of content.
| prop | type | default |
|---|---|---|
| title | text | — |
| description | text | — muted line under the title |
| gap, pad | token | md |

### row
`row` — horizontal flex.
| prop | type | default |
|---|---|---|
| gap, pad | token | md |
| align | token | center |
| justify | token | start |
| wrap | `true`/`false` | false |
| grow | `true`/`false` | false — take the remaining space in a parent row/col (`flex-1`) |

### col
`col` — vertical flex. Props: `gap` (md), `pad`, `align`, `justify`, `grow`, `span` (as on `card`), `size` (max width: sm `max-w-xl`, md `max-w-2xl`, lg `max-w-4xl`; default none).

### grid
`grid` — responsive grid. Props: `cols` (3), `gap` (md), `pad`. A single `cols=N` is 1 column on small
screens; a pair `cols=2,4` is 2 columns below `md` and 4 from `md` up; a triple `cols=1,1,2` is 1 column, 1 from
`md`, 2 from `lg` (`1,1,2 1,1,3 1,2,3 1,2,4 2,2,4`).

### spacer
`spacer` — takes the free space in a row or column, pushing what follows to the end. No props.

### card
`card <title>` — shadcn `Card` with an optional header; children go in `CardContent` as a column.
| prop | type |
|---|---|
| title | text |
| description | text |
| gap, pad | token |
| tone | `default transparent destructive` — transparent: no border, shadow or background; destructive: red border |
| on | handler — makes the whole card clickable (and keyboard-focusable) |
| href | text — makes the whole card a link (keyboard-focusable; `http(s)` opens in a new tab) |
| span | `1 2 3` — grid columns it takes from `lg` up, inside a `grid` |

### band
`band` — full-bleed horizontal band for landing pages: background spans the viewport, content is a
centered column. Use bands as top-level nodes (instead of `page`).
| prop | type | default |
|---|---|---|
| id | literal — anchor for `#links` | — |
| tone | `default muted inverse primary` — inverse: the dark theme on the card surface | default |
| pad | token — vertical padding | lg |
| gap | token | lg |
| size | token — content max width (sm `max-w-3xl`, md `max-w-5xl`, lg `max-w-6xl`) | lg |
| align | token — horizontal alignment of the content | stretch |

### code
`code <source*>` — a highlighted code block. Needs `components/ui/code-block` in the app (shadcn has
none; see `docs/code-block.tsx`).
| prop | type |
|---|---|
| source* | text — usually a `@ref` (e.g. a file imported with `?raw`) |
| lang | literal — `terse`, `tsx`, `bash`, `json`, ... |
| title | text — label above the block, e.g. a file name |

### form
`form` — a form: pressing Enter in a field, or a `button type=submit`, calls `on` (the page doesn't reload).
| prop | type |
|---|---|
| on* | handler — called with the submit event, after any arguments: `form on=@add(@column.id)` |
| gap | token (md) |

### separator
`separator` — horizontal rule. No props, no children.

## Content

### heading
`heading <text*>` — `h1`–`h4`.
| prop | type | default |
|---|---|---|
| text* | text | — |
| level | `1`–`4` | 2 |
| size | token, or `xl` (display headline) | by level |
| tone | token | default |
| align | token — text alignment | start |

`text` supports inline markup in literals (see SPEC); in a heading, `**strong**` renders in the accent colour.

### text
`text <text*>` — paragraph. Props: `size` (sm; also `xl` = display figure, `text-2xl font-bold`), `tone` (*runtime*),
`align` (text alignment). Literals support inline markup: `**strong**`, `*em*`, `` `code` ``, `[label](href)`.

### togglegroup
`togglegroup` — shadcn `ToggleGroup`, for filter chips and segmented controls. Children are `toggle` lines.
| prop | type | notes |
|---|---|---|
| value | text | the selected value; with `multiple=true`, an array of selected values |
| on | handler | called with the new value (or array) |
| multiple | `true`/`false` | allow several at once (false) |
| variant | `default outline` | |
| size | token | |

### toggle
`toggle <label*>` — one option of a `togglegroup`. Props: `value` (literal; defaults to the label), `icon`, `disabled`.

### badge
`badge <text*>` — shadcn `Badge`. `tone` (*runtime*): default → secondary, muted → outline, primary → default,
success/warning → tinted green/amber, destructive → destructive.

### avatar
`avatar <src> fallback=…` — shadcn `Avatar`: the image, or the fallback text (initials) while it loads or when missing.
| prop | type |
|---|---|
| src | text |
| fallback* | text |
| size | token — sm 32px, md 40px, lg 64px (sm) |

### progress
`progress <value*>` — shadcn `Progress` bar. `value` is 0–100.

### skeleton
`skeleton` — loading placeholder bars.
| prop | type |
|---|---|
| lines | literal — number of bars (1) |
| size | token — bar height: sm 16px, md 40px, lg 96px (sm) |

### stat
`stat <label*> <value*>` — KPI card: optional icon, small muted label, large bold value.
| prop | type |
|---|---|
| label*, value* | text |
| delta | text — small caption under the value |
| tone | token, *runtime* — colour of `delta` (muted) |
| icon | literal — lucide icon name, e.g. `droplets` (size md) |
| align | token — horizontal alignment of the content (start) |

### icon
`icon <name*>` — a lucide icon. `name` is the icon name in any case: `sun`, `cloud-rain`, `CloudRain`.
| prop | type |
|---|---|
| name* | literal |
| size | token — sm 16px, md 20px, lg 24px (default 24px) |
| tone | token — colour |

### callout
`callout <title*> <description>` — shadcn `Alert`.
| prop | type |
|---|---|
| title* | text |
| description | text |
| icon | literal — lucide icon name |
| tone | `default destructive` |

Children (buttons) render as an action row under the description.

### image
`image <src*>` — `img`. Props: `alt` (text, default `""`), `size` (md; `fill` = the full width and height of its container),
`ratio` (`square video portrait`: a fixed aspect ratio, e.g. `image @p.img size=fill ratio=square` for product cards).

### link
`link <label*> <href*>` — anchor. Props: `tone` (primary).

## Data

### table
`table <rows>` — shadcn `Table`. Two forms: `rows` + `cols` for a plain table of fields, or children
(`thead`, then `tr` rows, usually through `each`) for cells with any content.
| prop | type | notes |
|---|---|---|
| rows | ref | the list, e.g. `@orders` (required without children) |
| cols | list | fields to show, e.g. `id,customer,total` (required without children) |
| headers | list | header labels; default is the humanized field name (`lastSeen` → "Last seen") |

```
table
  thead
    th "Amount" align=end sort=@sort.amount on=@sortBy.amount
  each @rows as t
    tr on=@t.onOpen
      td @t.amount align=end
```

### thead
`thead` — the header row of a `table`. Children are `th` lines.

### th
`th <label>` — a header cell. Only inside `thead`.
| prop | type | notes |
|---|---|---|
| label | text | |
| align | token | `end` right-aligns (numbers) |
| on | handler | makes the header a sort button |
| sort | text | `asc`, `desc`, or anything else for unsorted: picks the arrow icon and `aria-sort` |

### tr
`tr` — a body row. Only inside `table`. Children are `td` lines. Props: `on` (handler) makes the row clickable.

### td
`td <text>` — a cell. Only inside `tr`. Shows `text`, or its children. Props: `align` (token).

### list
`list` — rows separated by a border. Children are `item` lines (directly or through `each`/`if`).
No props.

### item
`item <label*> <value>` — a `list` row: `label` on the left, `value` right-aligned. Only inside `list`.
| prop | type |
|---|---|
| label* | text |
| value | text |

### chart
`chart <type*>` — shadcn chart (Recharts). Children must be `series` lines; series colours are
`--chart-1`, `--chart-2`, … in order.
| prop | type | notes |
|---|---|---|
| type* | `bar area line donut` | several bar series are grouped; donut uses the first series' values, one slice per `x`, named by `x` |
| x* | items | x-axis categories, e.g. `Thu..Wed`, or `@revenue.labels` |
| xlabel, ylabel | text | axis titles |
| size | token | height: sm 200px, md 260px, lg 320px (md) |
| curve | `linear monotone natural` | area line shape |
| tooltip, legend | `true`/`false` | false |

### series
`series <label*> <values*>` — one data series of a `chart`, one value per `x` category.
| prop | type |
|---|---|
| label* | text |
| values* | numbers — literal, or a `@ref` to an array of numbers |

## Input

### button
`button <label*>` — shadcn `Button`.
| prop | type | notes |
|---|---|---|
| label* | text | with `size=icon`, the accessible name only |
| variant | `default outline secondary ghost destructive link`, *runtime* | |
| size | `sm md lg icon` | `icon`: square, icon only |
| icon | literal | lucide icon name, before the label |
| count | text | small red counter on the corner (hidden when falsy) |
| on | handler | becomes `onClick` |
| href | text | renders a link styled as a button; `http(s)` links open in a new tab |
| pressed | bool | a toggle button: solid while pressed, else `variant` (outline by default); sets `aria-pressed` |
| disabled | bool | |
| type | `button submit` | |

### input
`input <label>` — shadcn `Input`, with a `Label` when `label` is given.
| prop | type | notes |
|---|---|---|
| label | text | |
| placeholder | text | |
| type | `text email password number search tel url date` | |
| value | text | controlled when `on` is set, otherwise the initial value |
| name | text | also used as the element id |
| on | handler | called with the new **string value** |
| disabled | bool | |
| error | text | shown in red under the field (when truthy) and sets `aria-invalid` |
| icon | literal | lucide icon inside the left edge, e.g. `search` |

### textarea
`textarea <label>` — shadcn `Textarea`. Props as `input` (`label placeholder value name on disabled error`), plus
`rows` (literal number).

### select
`select <label>` — shadcn `Select`. Props: `label`, `placeholder`, `value`, `name`, `disabled`, `error` as `input`;
`on` is called with the chosen value.
| prop | type | notes |
|---|---|---|
| options* | items | `All,Success,Failed`, or a `@ref` to strings or `{ value, label }` objects |

### switch
`switch <label>` — shadcn `Switch` with its label on the left (a settings row).
| prop | type | notes |
|---|---|---|
| label | text | |
| description | text | muted line under the label |
| checked | bool | |
| on | handler | called with the new boolean |
| disabled | bool | |

### checkbox
`checkbox <label>` — shadcn `Checkbox` with its label on the right. Props as `switch`: `label`, `description`,
`checked`, `on`, `disabled`.

### tabs
`tabs` — shadcn `Tabs`. Children are `tab` lines. With `value`/`on` it is controlled; `on` gets the tab's value.
Tabs without children are a segmented control: render the content yourself under `if`.
| prop | type |
|---|---|
| value | text |
| on | handler |

### tab
`tab <label*>` — one tab. Its children (if any) are the panel. Only inside `tabs`.
| prop | type | notes |
|---|---|---|
| label* | text | |
| value | literal | default: the label |
| icon | literal | lucide icon name |

## App chrome

### shell
`shell` — full-height app frame: a `sidebar` then the main column (`col grow=true`). No props.

### sidebar
`sidebar` — app navigation. A rail on `md`+ (icons only between `md` and `lg`, or when `collapsed`), and a
left drawer below `md`. The same children render in both, so use `hide=collapsed` on things that need room.
| prop | type | notes |
|---|---|---|
| collapsed | bool | icons only on `lg`+ too |
| open | bool | the mobile drawer is open |
| on | handler | called with the drawer's new open state |

### navitem
`navitem <label*>` — a sidebar link: icon plus label (the label hides when collapsed).
| prop | type |
|---|---|
| label* | text |
| icon | literal |
| active | bool |
| on | handler |

### bar
`bar` — a sticky bar across the top (header) or bottom (action bar) of the main column.
| prop | type | default |
|---|---|---|
| side | `top bottom` | top |
| gap | token | sm |
| justify | token | start |

### slot
`slot <content*>` — renders a React node passed in as a prop, e.g. a layout's page: `slot @content`.

## Overlays

`menu`, `dialog` and `sheet` take an optional `trigger` child that opens them; all their other children are
the content.

### trigger
`trigger` — what opens a `menu`, `dialog` or `sheet` (usually one `button` or `avatar`). No props.

### menu
`menu` — shadcn `DropdownMenu`. Content is `menuitem` and `separator` lines.
| prop | type | default |
|---|---|---|
| label | text | heading above the items |
| align | `start center end` | end |

### menuitem
`menuitem <label*>` — a menu entry. Only inside `menu`.
| prop | type |
|---|---|
| label* | text |
| icon | literal |
| on | handler |
| tone | `default destructive` |

### dialog
`dialog <title*>` — shadcn `Dialog`; children form a column under the title.
| prop | type | notes |
|---|---|---|
| title* | text | |
| description | text | |
| open | bool | controlled when given |
| on | handler | called with the new open state |

### sheet
`sheet <title*>` — shadcn `Sheet` from the right edge. Props as `dialog`: `title`, `description`, `open`, `on`.

## User components

Any `Capitalized` name imported with `use Name from "path"`. Takes `key=value` props only (passed
through unchanged) and may have children.
