// Fails when a className in the given .tsx paths uses a class the compiled SASS does not define
// (e.g. a leftover Tailwind utility). Usage: node scripts/check-classes.mjs src/features/admin [more paths]
// shortcut: only string literals inside className={...} / className="..." are checked; classes built from variables are not.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import * as sass from 'sass'

const css = sass.compile('src/styles/main.scss', {
  loadPaths: ['node_modules'],
  quietDeps: true,
  silenceDeprecations: ['import', 'global-builtin', 'color-functions', 'if-function'],
  logger: sass.Logger.silent,
}).css
const known = new Set([...css.matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((m) => m[1]))
// Third-party classes that are not in our SASS.
const ALLOW = /^(leaflet-|toaster$)/

function files(path) {
  if (statSync(path).isFile()) return path.endsWith('.tsx') ? [path] : []
  return readdirSync(path).flatMap((name) => files(join(path, name)))
}

// The text of one className attribute: a quoted string, or a balanced {...} expression.
function attribute(source, start) {
  const open = source[start]
  if (open === '"' || open === "'") return source.slice(start + 1, source.indexOf(open, start + 1))
  let depth = 0
  for (let i = start; i < source.length; i++) {
    if (source[i] === '{') depth++
    if (source[i] === '}' && --depth === 0) return source.slice(start, i + 1)
  }
  return ''
}

let bad = 0
for (const file of process.argv.slice(2).flatMap(files)) {
  const source = readFileSync(file, 'utf8')
  for (const match of source.matchAll(/className=/g)) {
    const start = match.index + match[0].length
    const text = attribute(source, start)
    const literals = source[start] === '{' ? [...text.matchAll(/'([^']*)'|"([^"]*)"|`([^`]*)`/g)].map((m) => m[1] ?? m[2] ?? m[3]) : [text]
    for (const token of literals.join(' ').replace(/\$\{[^}]*\}/g, ' ').split(/\s+/)) {
      if (!token || known.has(token) || ALLOW.test(token)) continue
      const line = source.slice(0, start).split('\n').length
      console.log(`${file}:${line}  unknown class "${token}"`)
      bad++
    }
  }
}
console.log(bad ? `${bad} unknown classes` : 'all classes known')
process.exit(bad ? 1 : 0)
