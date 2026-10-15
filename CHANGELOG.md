# Changelog

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
