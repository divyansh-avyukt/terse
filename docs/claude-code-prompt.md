# Claude Code prompt: start a Terse project

Create an empty folder, open Claude Code in it, and paste the prompt below. Fill in `<APP NAME>` and
`<WHAT THE APP DOES>` first. It sets up the project from the verified guide, installs the agent
instructions, and then builds the app in reviewable steps.

---

```text
Build a new web app called <APP NAME> in this (empty) directory, using Terse for all UI.

What the app does:
<WHAT THE APP DOES — screens, the data on each, the actions a user can take.
 Example: "A personal finance tracker. Screens: Overview (balance, monthly spend
 chart by category, recent transactions table), Transactions (search, list, add
 transaction form), Budgets (a card per category with spent/limit and status badge).
 Use a mock API module with realistic data and simulated latency.">

## Setup (do this first, exactly)
Terse is a presentation-only UI language that compiles .terse files to React TSX
(shadcn/ui + Tailwind) via a Vite plugin. It is checked out locally at
/Users/divyansh/projects/terse and is not published to npm.

1. Read /Users/divyansh/projects/terse/docs/getting-started.md and follow every step in
   order, scaffolding into this directory (`pnpm create vite@latest . ...`) instead of
   `my-app`. Run `pnpm install && pnpm build` in the Terse checkout first.
2. Copy /Users/divyansh/projects/terse/docs/CLAUDE.template.md to ./CLAUDE.md, then read
   /Users/divyansh/projects/terse/spec/SPEC.md and spec/components.md in full. Those are the
   only components and props that exist; don't invent any.
3. Prove the setup works before building features: a throwaway src/views/pages/Home.terse +
   src/pages/HomePage.tsx, then `pnpm exec tsc -b` and `pnpm build` must pass. Run `git init`
   and commit "Project setup".

## Build the app
- Follow ./CLAUDE.md: views in src/views/**.terse, containers in src/pages/*Page.tsx that
  own all state, fetching and handlers, and precompute every displayed string.
- Plain state-based navigation in App.tsx (a nav bar of Buttons) is fine. Don't add a
  router or any other dependency without asking me first.
- One screen at a time. For each screen: write the view and container, make
  `pnpm exec tsc -b` and `pnpm build` pass, check it in the running dev server (use the
  browser if you can), then commit.
- If you hit something Terse can't express, first check whether precomputing in TSX
  solves it. Otherwise write a small TSX component and `use` it from the view, and tell me
  what was missing. That feedback improves the language.

## When done
Report: the screens built, how many .terse vs .tsx files and lines each, any Terse
limitations you worked around (with the workaround), and how to run the app.
```
