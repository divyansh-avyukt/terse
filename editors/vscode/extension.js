// Live diagnostics: runs the real Terse front end (@terseui/core) on every edit,
// so the editor reports exactly what the compiler would.
const vscode = require('vscode')
const path = require('node:path')
const { pathToFileURL } = require('node:url')

/** @param {vscode.ExtensionContext} context */
async function activate(context) {
  const core = await import(pathToFileURL(path.join(__dirname, 'core', 'index.js')).href)
  const diagnostics = vscode.languages.createDiagnosticCollection('terse')
  context.subscriptions.push(diagnostics)

  const check = (doc) => {
    if (doc.languageId !== 'terse') return
    try {
      core.analyze(doc.getText(), doc.fileName)
      diagnostics.set(doc.uri, [])
    } catch (e) {
      if (!(e instanceof core.TerseError)) throw e
      diagnostics.set(
        doc.uri,
        e.diagnostics.map((d) => {
          const line = Math.min(d.line - 1, doc.lineCount - 1)
          const start = new vscode.Position(line, d.col - 1)
          // Underline the token at the error position (or one character).
          const range = doc.getWordRangeAtPosition(start, /[^\s]+/) ?? new vscode.Range(start, start.translate(0, 1))
          const diag = new vscode.Diagnostic(range, d.message.split('\n')[0], vscode.DiagnosticSeverity.Error)
          diag.source = 'terse'
          return diag
        }),
      )
    }
  }

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(check),
    vscode.workspace.onDidChangeTextDocument((e) => check(e.document)),
    vscode.workspace.onDidCloseTextDocument((doc) => diagnostics.delete(doc.uri)),
  )
  vscode.workspace.textDocuments.forEach(check)
}

module.exports = { activate, deactivate() {} }
