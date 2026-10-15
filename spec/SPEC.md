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
| `use { A, B } from "path"` | Named imports, e.g. shadcn parts: `use { SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar"`. |

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

each @tasks as task key=id     # key=field: a stable React key; use it when items move or hold state
  text @task.title

if @loading                    # truthy check; `if not @x` negates
  text "Loading…"
else                           # optional, at the same indentation as its `if`
  table @orders cols=id,total
```

`if` uses JavaScript truthiness, so an empty list `[]` is truthy. To check for an empty list, use
`if not @orders.length`.

## Events

Handler props such as `on=` take a reference to a function prop: `button "Save" on=@onSave`.
- `button`: `on` becomes `onClick` and receives the click event.
- `input`: `on` receives the **new string value**, not the event.

A handler can take **arguments**: `on=@move(@task.id, 1)`. Arguments are `@references` or literals
(`"text"`, numbers, `true`/`false`, bare words); there are no expressions or nested calls. The handler
gets your arguments first, then whatever the component normally passes:

```
each @tasks as task key=id
  button "→" on=@move(@task.id, 1)          # move(task.id, 1, event)
  input "Title" on=@rename(@task.id)        # rename(task.id, value)
```

Arguments are only allowed on handler props. Anything more than picking a function and its arguments
belongs in the TSX parent.

## Style tokens

These are shared by the layout components. They must be literals, not references:

| Token | Values |
|---|---|
| `gap`, `pad` | `none xs sm md lg xl` |
| `align` | `start center end stretch` |
| `justify` | `start center end between around` |
| `cols` (grid) | `1 2 3 4 5 6 12`: 1 column on small screens. Or a pair `a,b`: a columns below `md`, b from `md` up (`1,2 1,3 1,4 2,3 2,4 2,6 3,6`), or a triple `a,b,c` that adds `lg` (`1,1,2 1,1,3 1,2,3 1,2,4 2,2,4`). |
| `tone` | `default muted primary success warning destructive` |
| `size` | `sm md lg` |
| `grow` (row, col) | `true false`: take the remaining space |
| `span` (card, col) | `1 2 3`: grid columns taken from `lg` up |
| `hide` (any component) | `mobile` (below md), `desktop` (md and up), `collapsed` (inside an icons-only `sidebar`) |

A few token props are marked *runtime* in components.md (`tone` on `badge`, `stat` and `text`). They also
take a `@ref` whose value is one of the same words, so a status can pick its colour:
`badge @t.status tone=@t.tone`. The class for every possible value is still written out at compile time.

## Slots: overlays and tables

Some components place different children in different spots. `menu`, `dialog` and `sheet` take an optional
`trigger` child (what opens them); every other child is the content. A `table` with children takes one
`thead` and then `tr` rows:

```
menu label="My account"
  trigger
    avatar @user.photo fallback=@user.initials
  menuitem "Sign out" on=@onSignOut
```

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

## Typed props

The Vite plugin writes a `X.d.terse.ts` next to every view, with the props interface inferred from
how the view uses them:

| In the view | In the generated type |
|---|---|
| `text @task.title` | `task?: { title?: ReactNode }` |
| `each @tasks as task` | `tasks?: Array<{ ... }>` |
| `on=@onSave`, `on=@move(@id, 1)` | `onSave?: (...args: any[]) => void` |
| `disabled=@busy`, `pressed=@on` | `busy?: boolean` |
| `tone=@t` | `t?: "default" \| "muted" \| … \| (string & {})` |
| `table @rows cols=id,total` | `rows?: Array<{ id?: ReactNode; total?: ReactNode }>` |
| `slot @content` | `content?: ReactNode` |
| only passed to your own component, or unused | `unknown` |

Every prop is optional, so loading states are fine. A misspelled prop or a wrong shape (an object
where a list is expected) is a type error in the TSX container. This needs `"allowArbitraryExtensions":
true` in tsconfig (create-terse-app sets it). Generated files are gitignored and rewritten on every build.

## Toolchain

- `@terseui/vite-plugin` compiles `*.terse` files during the build, with HMR, source maps that point
  to `.terse` lines, and errors in the Vite overlay. Add
  `/// <reference types="@terseui/vite-plugin/client" />` (or add it to tsconfig `types`) so that
  `import X from "./x.terse"` type-checks.
- The adapters are set in `terse.config.ts`:
  `defineConfig({ components: shadcn(), style: tailwind() })`. A `ComponentAdapter` maps IR
  components to JSX. A `StyleAdapter` maps tokens to class names. Neither one touches the core.
