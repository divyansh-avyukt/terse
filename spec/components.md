# Terse v0 — components

Notation: `name <positional args> [props]`. Positional args fill the props named in `<…>`, in order;
each can also be written as `key=value`. **Required** props are marked `*`.

Prop types: **text** (literal or `@ref`) · **ref** (`@ref` only) · **handler** (`@ref` to a function) ·
**bool** (`true`/`false` or `@ref`) · **literal** (not a `@ref`) · **list** (`a,b,c`; ranges expand:
`Thu..Wed` → Thu,Fri,…,Wed (weekdays wrap), `1..5`) · **numbers** (a list of numbers, `72,68,65.5`) ·
**token** (literal from a fixed set, see SPEC).

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
| gap, pad | token | md |

### row
`row` — horizontal flex.
| prop | type | default |
|---|---|---|
| gap, pad | token | md |
| align | token | center |
| justify | token | start |
| wrap | `true`/`false` | false |

### col
`col` — vertical flex. Props: `gap` (md), `pad`, `align`, `justify`, `size` (max width: sm `max-w-xl`, md `max-w-2xl`, lg `max-w-4xl`; default none).

### grid
`grid` — responsive grid. Props: `cols` (3), `gap` (md), `pad`. A single `cols=N` is 1 column on small
screens; a pair `cols=2,4` is 2 columns below `md` and 4 from `md` up.

### card
`card <title>` — shadcn `Card` with an optional header; children go in `CardContent` as a column.
| prop | type |
|---|---|
| title | text |
| description | text |
| gap, pad | token |
| tone | `default transparent` — transparent: no border, shadow or background |

### band
`band` — full-bleed horizontal band for landing pages: background spans the viewport, content is a
centered column. Use bands as top-level nodes (instead of `page`).
| prop | type | default |
|---|---|---|
| id | literal — anchor for `#links` | — |
| tone | `default muted inverse primary` — inverse flips to the dark theme | default |
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
`text <text*>` — paragraph. Props: `size` (sm; also `xl` = display figure, `text-2xl font-bold`), `tone`,
`align` (text alignment). Literals support inline markup: `**strong**`, `*em*`, `` `code` ``, `[label](href)`.

### badge
`badge <text*>` — shadcn `Badge`. `tone`: default → secondary, muted → outline, primary → default, destructive → destructive.

### stat
`stat <label*> <value*>` — KPI card: optional icon, small muted label, large bold value.
| prop | type |
|---|---|
| label*, value* | text |
| delta | text — small caption under the value |
| tone | token — colour of `delta` (muted) |
| icon | literal — lucide icon name, e.g. `droplets` (size md) |
| align | token — horizontal alignment of the content (start) |

### icon
`icon <name*>` — a lucide icon. `name` is the icon name in any case: `sun`, `cloud-rain`, `CloudRain`.
| prop | type |
|---|---|
| name* | literal |
| size | token — sm 16px, md 20px, lg 24px (default 24px) |

### callout
`callout <title*> <description>` — shadcn `Alert`.
| prop | type |
|---|---|
| title* | text |
| description | text |
| icon | literal — lucide icon name |

### image
`image <src*>` — `img`. Props: `alt` (text, default `""`), `size` (md).

### link
`link <label*> <href*>` — anchor. Props: `tone` (primary).

## Data

### table
`table <rows*>` — shadcn `Table` with one row per item.
| prop | type | notes |
|---|---|---|
| rows* | ref | the list, e.g. `@orders` |
| cols* | list | fields to show, e.g. `id,customer,total` |
| headers | list | header labels; default is the humanized field name (`lastSeen` → "Last seen") |

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
| type* | `bar area` | several bar series are grouped |
| x* | list | x-axis categories, e.g. `Thu..Wed` |
| xlabel, ylabel | text | axis titles |
| size | token | height: sm 200px, md 260px, lg 320px (md) |
| curve | `linear monotone natural` | area line shape |
| tooltip, legend | `true`/`false` | false |

### series
`series <label*> <values*>` — one data series of a `chart`, one value per `x` category.
| prop | type |
|---|---|
| label* | text |
| values* | numbers |

## Input

### button
`button <label*>` — shadcn `Button`.
| prop | type | notes |
|---|---|---|
| label* | text | |
| variant | `default outline secondary ghost destructive link` | |
| size | token | |
| on | handler | becomes `onClick` |
| href | text | renders a link styled as a button; `http(s)` links open in a new tab |
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

## User components

Any `Capitalized` name imported with `use Name from "path"`. Takes `key=value` props only (passed
through unchanged) and may have children.
