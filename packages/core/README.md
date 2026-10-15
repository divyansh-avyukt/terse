# @terseui/core

Language core for [Terse](https://terse-ui.dev): lexer, parser, IR, validator and the component schema. No React dependency.

```ts
import { analyze, TerseError } from '@terseui/core'

try {
  const ir = analyze(source, 'Dashboard.terse')
} catch (e) {
  if (e instanceof TerseError) console.error(`${e.file}:${e.line}:${e.col} ${e.message}`)
}
```

Docs, spec and getting started: https://terse-ui.dev · Source: https://github.com/AVYUKT-TECH-LABS/terse

MIT © AVYUKT TECH LABS
