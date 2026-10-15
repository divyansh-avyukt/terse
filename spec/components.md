# Terse v0 — components

Notation: `name <positional args> [props]`. Positional args fill the props named in `<…>`, in order;
each can also be written as `key=value`. **Required** props are marked `*`.

Prop types: **text** (literal or `@ref`) · **ref** (`@ref` only) · **handler** (`@ref` to a function) ·
**bool** (`true`/`false` or `@ref`) · **list** (`a,b,c`) · **token** (literal from a fixed set, see SPEC).

## Layout

### page
`page <title>` — screen root: centered, max-width column with an `h1`.
| prop | type | default |
|---|---|---|
| title | text | — |
| gap, pad | token | lg, lg |

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
`col` — vertical flex. Props: `gap` (md), `pad`, `align`, `justify`.

### grid
`grid` — responsive grid (1 column on small screens). Props: `cols` (3), `gap` (md), `pad`.

### card
`card <title>` — shadcn `Card` with an optional header; children go in `CardContent` as a column.
| prop | type |
|---|---|
| title | text |
| description | text |
| gap, pad | token |

### separator
`separator` — horizontal rule. No props, no children.

## Content

### heading
`heading <text*>` — `h1`–`h4`.
| prop | type | default |
|---|---|---|
| text* | text | — |
| level | `1`–`4` | 2 |
| size | token | by level |
| tone | token | default |

### text
`text <text*>` — paragraph. Props: `size` (sm), `tone`.

### badge
`badge <text*>` — shadcn `Badge`. `tone`: default → secondary, muted → outline, primary → default, destructive → destructive.

### stat
`stat <label*> <value*>` — KPI card (Card + description + large title).
| prop | type |
|---|---|
| label*, value* | text |
| delta | text — small caption under the value |
| tone | token — colour of `delta` (muted) |

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

## Input

### button
`button <label*>` — shadcn `Button`.
| prop | type | notes |
|---|---|---|
| label* | text | |
| variant | `default outline secondary ghost destructive link` | |
| size | token | |
| on | handler | becomes `onClick` |
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
