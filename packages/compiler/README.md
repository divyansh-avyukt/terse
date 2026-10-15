# @terseui/compiler

Compiles Terse to React TSX. It talks to UI libraries only through two interfaces, `ComponentAdapter` and `StyleAdapter`.

```ts
import { compile } from '@terseui/compiler'
import { shadcn } from '@terseui/adapter-shadcn'
import { tailwind } from '@terseui/style-tailwind'

const { code, map } = compile(source, { file: 'Dashboard.terse', components: shadcn(), style: tailwind() })
```

Docs, spec and getting started: https://terse-ui.dev · Source: https://github.com/AVYUKT-TECH-LABS/terse

MIT © AVYUKT TECH LABS
