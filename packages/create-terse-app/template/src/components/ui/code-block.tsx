import { CheckIcon, CopyIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createHighlighterCore, type HighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import terseGrammar from '@/lib/terse.tmLanguage.json'
import { cn } from '@/lib/utils'

// One highlighter for the page, loaded lazily. Terse uses the VS Code extension's grammar.
let highlighter: Promise<HighlighterCore> | undefined
const load = () =>
  (highlighter ??= createHighlighterCore({
    engine: createJavaScriptRegexEngine(),
    themes: [import('shiki/dist/themes/github-light.mjs'), import('shiki/dist/themes/github-dark-default.mjs')],
    langs: [
      import('shiki/dist/langs/tsx.mjs'),
      import('shiki/dist/langs/typescript.mjs'),
      import('shiki/dist/langs/bash.mjs'),
      import('shiki/dist/langs/markdown.mjs'),
      { ...terseGrammar, name: 'terse' } as never,
    ],
  }))
const ALIAS: Record<string, string> = { ts: 'typescript', sh: 'bash', md: 'markdown' }

export interface CodeBlockProps {
  code?: string
  lang?: string
  title?: string
  className?: string
}

/** A code block for the `code` component: highlighted by shiki, with an optional title and a copy button. */
export function CodeBlock({ code = '', lang, title, className }: CodeBlockProps) {
  const [html, setHtml] = useState<string>()
  const [copied, setCopied] = useState(false)
  const language = lang && (ALIAS[lang] ?? lang)

  useEffect(() => {
    let live = true
    if (!language || language === 'text') return setHtml(undefined)
    load().then((h) => {
      if (!live) return
      const known = h.getLoadedLanguages().includes(language)
      setHtml(known ? h.codeToHtml(code, { lang: language, themes: { light: 'github-light', dark: 'github-dark-default' } }) : undefined)
    })
    return () => {
      live = false
    }
  }, [code, language])

  const copy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div data-slot="code-block" className={cn('group relative min-w-0 overflow-hidden rounded-xl border bg-card text-left', className)}>
      {title && (
        <div className="flex items-center justify-between border-b px-4 py-2 font-mono text-xs text-muted-foreground">
          <span>{title}</span>
        </div>
      )}
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? 'Copied' : 'Copy code'}
        className={cn(
          'absolute right-2 z-10 rounded-md p-1.5 text-muted-foreground opacity-0 transition hover:bg-muted hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100',
          title ? 'top-1' : 'top-2',
        )}
      >
        {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
      </button>
      {html ? (
        <div className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed [&_pre]:!bg-transparent" dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <pre className="overflow-x-auto p-4 font-mono text-[13px] leading-relaxed whitespace-pre">{code}</pre>
      )}
    </div>
  )
}
