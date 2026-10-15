# Changelog

## 0.3.0

Driven by feedback from a developer building an e-commerce app and a kanban board in Terse.

**Language**
- **Handler arguments:** `on=@move(@task.id, 1)`. Arguments are `@references` or literals, with no
  expressions. The handler gets your arguments first, then what the component passes: the event for
  `button`, the value for `input`, the submit event for `form`. This removes the per-item callbacks
  containers used to build.
- **Stable keys:** `each @tasks as task key=id` keys items by a field instead of their position, so
  items that move or hold local state keep the right element.
- **Named imports:** `use { SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar"`.

**Components and props**
- `togglegroup` / `toggle`, for filter chips and segmented controls (single or `multiple=true`)
- `form on=@submit`: Enter submits, and the page doesn't reload
- `button pressed=@active`: a toggle button in one line (solid when pressed, sets `aria-pressed`);
  `variant` can also be a `@ref`
- `card href=`: the whole card is a link (it carries the grid `span`)
- `image size=fill` and `ratio=square|video|portrait`

**create-terse-app**
- The template adds shadcn `toggle` and `toggle-group` (23 components).

## 0.2.0

The vocabulary grows from 24 to 48 components, from the payments-dashboard stress test.

**New components**
- Layout and app chrome: `spacer`, `shell`, `sidebar`, `navitem`, `bar`
- Inputs: `textarea`, `select`, `switch`, `checkbox`, `tabs` / `tab`
- Overlays: `menu` / `menuitem`, `dialog`, `sheet`, `trigger`
- Display: `avatar`, `progress`, `skeleton`
- Tables with custom cells: `thead`, `th` (sortable), `tr` (clickable), `td`
- `slot`, which places a React element passed in as a prop (e.g. `slot @children`)

**New props and language features**
- `card on=` (clickable, keyboard-accessible) and `card span=1|2|3` for unequal grid columns
- `col span=`, `row grow=` / `col grow=`
- Universal `hide=mobile|desktop|collapsed` on every component
- Runtime tokens: `tone=@x` on `badge`, `stat` and `text`, resolved from the same fixed set
- `chart line` and `chart donut`; chart `x` and `series` values can be `@refs`
- `success` and `warning` tones
- `grid cols=1,2,3` (three breakpoints)

**Compiler**
- Compiled modules import only the components they use.
- `th` with a runtime `sort` emits a correctly typed `aria-sort`.

**create-terse-app**
- The template now includes every shadcn/ui component Terse renders to (21 files).

## 0.1.0

First release: 24 components, the Vite plugin (HMR, source maps, error overlay), shadcn/ui and
Tailwind adapters, `band`, `code` and inline markup, and `create-terse-app`.
