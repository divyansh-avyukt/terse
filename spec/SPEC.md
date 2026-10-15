# Terse v0 — language spec

Terse is a presentation-only UI language. You write a `.terse` file; the build compiles it to a
React TSX component (shadcn/ui + Tailwind by default). Use it for **what the screen shows**. Keep
state, data fetching and logic in TSX, and pass data and handlers in as props.

The component vocabulary, with each component's arguments and props, is in [components.md](./components.md).

## A complete example

```
use UserAvatar from "@/components/UserAvatar"
props user, stats, orders, loading, onRefresh

page "Dashboard"
  grid cols=3
    stat "Revenue" @stats.revenue delta=@stats.revenueDelta
    stat "Orders" @stats.orders
  card "Recent orders"
    if @loading
      text "Loading…" tone=muted
    else
      table @orders cols=id,customer,total
  row justify=between
    UserAvatar user=@user size=sm
    button "Refresh" variant=outline on=@onRefresh
```

This compiles to `export default function Dashboard({ user, stats, orders, loading, onRefresh })`.
The component name comes from the file name: `sales-dashboard.terse` becomes `SalesDashboard`.

## Structure

- **One node per line.** Nesting is set by indentation: **exactly 2 spaces per level**. Tabs and
  odd indentation are errors.
- A line is: `name positionalArgs... key=value...`. Positional args and `key=value` props can come
  in any order after the name.
- `#` starts a comment, either at the start of a line or after whitespace. Blank lines are ignored.

## Header lines (top level, usually first)

| Line | Meaning |
|---|---|
| `props a, b, onSave` | The props this component receives. Commas are optional. Every `@ref` must start with one of these names or with a loop variable. |
| `use Name from "path"` | Imports a TSX component (its **default export**) so you can use `Name` as a node. The name must start with a capital letter. |

## Values

| Form | Example | Meaning |
|---|---|---|
| quoted string | `"Recent orders"` or `'x'` | Text. Escapes: `\"` `\\` `\n`. |
| bare word | `md`, `outline`, `id,name` | A string. Use it for tokens and lists. |
| number / boolean | `12`, `true`, `false` | A literal. |
| reference | `@stats.revenue`, `@onSave` | A prop or loop variable, with an optional `.path`. Missing values are safe: `@a.b` compiles to `a?.b`. |

Text literals in `text` and `heading` support inline markup: `**strong**`, `*em*`, `` `code` ``
and `[label](https://…)`, with no nesting. A `**strong**` span inside a heading renders in the accent
colour. References render as plain text.

Lists (such as `cols=id,customer,total`) are comma-separated with no spaces, or quoted if an item
has spaces: `headers="Name,Last seen"`. A `from..to` item is a range: `Thu..Wed` is
`Thu,Fri,Sat,Sun,Mon,Tue,Wed` (weekdays wrap around), `1..5` is `1,2,3,4,5`.

## Control flow

```
each @orders as order          # repeat children for every item; `order` is in scope inside
  text @order.customer

if @loading                    # truthy check; `if not @x` negates
  text "Loading…"
else                           # optional, at the same indentation as its `if`
  table @orders cols=id,total
```

`if` uses JavaScript truthiness, so an empty list `[]` is truthy. To check for an empty list, use
`if not @orders.length`.

## Events

Handler props such as `on=` only take a reference to a function prop: `button "Save" on=@onSave`.
- `button`: `on` becomes `onClick` and receives the click event.
- `input`: `on` receives the **new string value**, not the event.

There is no inline JavaScript. If you need `onSelect(plan.id)`, write that wrapper in the TSX parent.

## Style tokens

These are shared by the layout components. They must be literals, not references:

| Token | Values |
|---|---|
| `gap`, `pad` | `none xs sm md lg xl` |
| `align` | `start center end stretch` |
| `justify` | `start center end between around` |
| `cols` (grid) | `1 2 3 4 5 6 12`: 1 column on small screens. Or a pair `a,b`: a columns below `md`, b from `md` up (`1,2 1,3 1,4 2,3 2,4 2,6 3,6`). |
| `tone` | `default muted primary destructive` |
| `size` | `sm md lg` |

## User components

A capitalized node name is a TSX component imported with `use`. Its props pass through unchanged
(`UserAvatar user=@user size=sm` becomes `<UserAvatar user={user} size="sm" />`). It takes
`key=value` props only, no positional args. It may have children, which become `children`.

## What is not in the language (by design)

There is no state, no hooks, no fetching, no expressions, no string interpolation, no arbitrary
classes or inline styles, and no inline handlers. Put all of that in a TSX parent and pass the
results in as props.

## Errors

Every error has `file:line:col` and a precise message. When there's a close match, the message
suggests it:

```
Dashboard.terse:24:5: unknown component 'buton' — did you mean 'button'?
x.terse:2:6: unknown reference '@stat.revenue' — did you mean '@stats'?
x.terse:1:9: invalid value "huge" for 'gap' on 'row' — expected none|xs|sm|md|lg|xl
x.terse:3:4: indentation must be a multiple of 2 spaces (found 3)
```

## Writing Terse well (for agents)

1. Start with `props`. List every piece of data and every handler the view needs.
2. Use `page "Title"` as the root for a screen. Use `card` or `section` for the root of a widget.
3. Use `row` and `col` for layout, `grid cols=N` for repeated cards, and `justify=between` for
   "left … right" bars.
4. Use a positional argument for a component's main content (`button "Save"`). Use `key=value`
   for everything else.
5. If you'd need logic to express something, put it in a TSX parent instead.

## Project layout

All `.terse` files go under `src/views/`. TSX never does, so a file's folder tells you whether it is
a view or code:

```
src/
  views/
    pages/Dashboard.terse          # a screen's view: rooted at `page`
    components/ProfileCard.terse   # reusable view: rooted at `card`/`section`
  pages/DashboardPage.tsx          # container: state, fetching, handlers → renders the view
  components/UserAvatar.tsx        # TSX components, usable from .terse with `use`
```

- Each `views/pages/X.terse` has a container `pages/XPage.tsx` that imports it as
  `import X from "@/views/pages/X.terse"` and passes in everything listed in `props`.
- `.terse` files import other views by their full alias path:
  `use ProfileCard from "@/views/components/ProfileCard.terse"`.

## Toolchain

- `@terse/vite-plugin` compiles `*.terse` files during the build, with HMR, source maps that point
  to `.terse` lines, and errors in the Vite overlay. Add
  `/// <reference types="@terse/vite-plugin/client" />` (or add it to tsconfig `types`) so that
  `import X from "./x.terse"` type-checks.
- The adapters are set in `terse.config.ts`:
  `defineConfig({ components: shadcn(), style: tailwind() })`. A `ComponentAdapter` maps IR
  components to JSX. A `StyleAdapter` maps tokens to class names. Neither one touches the core.
