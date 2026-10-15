// Builds terse.vsix without vsce: a .vsix is a zip with a manifest and the extension under extension/.
import { execSync } from 'node:child_process'
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const here = import.meta.dirname
const pkg = JSON.parse(readFileSync(join(here, 'package.json'), 'utf8'))
const out = join(here, 'build')
const ext = join(out, 'extension')

execSync('pnpm build', { cwd: join(here, '../..'), stdio: 'inherit' })
rmSync(out, { recursive: true, force: true })
mkdirSync(ext, { recursive: true })
for (const f of ['package.json', 'extension.js', 'language-configuration.json', 'syntaxes']) cpSync(join(here, f), join(ext, f), { recursive: true })
cpSync(join(here, '../../packages/core/dist'), join(ext, 'core'), { recursive: true, filter: (f) => !f.endsWith('.map') && !f.endsWith('.d.ts') })
writeFileSync(join(ext, 'core/package.json'), '{ "type": "module" }\n')

writeFileSync(join(out, '[Content_Types].xml'), `<?xml version="1.0" encoding="utf-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension=".json" ContentType="application/json"/>
  <Default Extension=".js" ContentType="application/javascript"/>
  <Default Extension=".vsixmanifest" ContentType="text/xml"/>
</Types>
`)
writeFileSync(join(out, 'extension.vsixmanifest'), `<?xml version="1.0" encoding="utf-8"?>
<PackageManifest Version="2.0.0" xmlns="http://schemas.microsoft.com/developer/vsx-schema/2011">
  <Metadata>
    <Identity Language="en-US" Id="${pkg.name}" Version="${pkg.version}" Publisher="${pkg.publisher}"/>
    <DisplayName>${pkg.displayName}</DisplayName>
    <Description xml:space="preserve">${pkg.description}</Description>
    <Categories>${pkg.categories.join(',')}</Categories>
    <Properties>
      <Property Id="Microsoft.VisualStudio.Code.Engine" Value="${pkg.engines.vscode}"/>
    </Properties>
  </Metadata>
  <Installation>
    <InstallationTarget Id="Microsoft.VisualStudio.Code"/>
  </Installation>
  <Dependencies/>
  <Assets>
    <Asset Type="Microsoft.VisualStudio.Code.Manifest" Path="extension/package.json" Addressable="true"/>
  </Assets>
</PackageManifest>
`)
rmSync(join(here, 'terse.vsix'), { force: true })
execSync(`zip -qr ../terse.vsix '[Content_Types].xml' extension.vsixmanifest extension`, { cwd: out })
console.log('built terse.vsix')
