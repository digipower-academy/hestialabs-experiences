// Validates every viewer JSON against packages/schemas/viewer/v1.json,
// plus the cross-file rules a JSON Schema cannot express.
import Ajv from 'ajv'
import { existsSync, readdirSync, readFileSync } from 'fs'
import { dirname, join, relative } from 'path'
import { fileURLToPath } from 'url'

const packagesDir = dirname(fileURLToPath(import.meta.url))
const experiencesDir = join(packagesDir, 'packages/experiences')
const viewComponentsDir = join(
  packagesDir,
  '../data-experience/src/components/chart/view'
)
const schema = JSON.parse(
  readFileSync(join(packagesDir, 'schemas/viewer/v1.json'), 'utf8')
)

type ViewBlockJson = {
  id: string
  sql?: string
  customPipeline?: string
  visualization?: string | object
}
type ViewerJson = {
  viewBlocks: ViewBlockJson[]
  messages?: { [lang: string]: { viewBlocks?: { [id: string]: object } } }
}

const ajv = new Ajv({
  allErrors: true,
  strict: true,
  strictRequired: false,
  allowUnionTypes: true
})
const validateSchema = ajv.compile(schema)

/** Returns the problems found in one viewer JSON file. */
function check(path: string): { errors: string[]; warnings: string[] } {
  const json = JSON.parse(readFileSync(path, 'utf8'))
  if (!validateSchema(json)) {
    return {
      errors: (validateSchema.errors ?? []).map(
        e => `${e.instancePath || '/'} ${e.message} ${JSON.stringify(e.params)}`
      ),
      warnings: []
    }
  }
  const { viewBlocks, messages = {} } = json as ViewerJson
  const errors: string[] = []
  const warnings: string[] = []
  const ids = new Set<string>()
  for (const { id, sql, customPipeline, visualization } of viewBlocks) {
    if (ids.has(id)) errors.push(`duplicate view block id "${id}"`)
    ids.add(id)
    if (
      typeof visualization === 'string' &&
      visualization.endsWith('.vue') &&
      !existsSync(join(viewComponentsDir, visualization))
    ) {
      errors.push(
        `view block "${id}": visualization ${visualization} not found in ${relative(
          packagesDir,
          viewComponentsDir
        )}`
      )
    }
    if (sql && customPipeline) {
      warnings.push(
        `view block "${id}" has both sql and customPipeline; sql is ignored`
      )
    }
  }
  for (const [lang, { viewBlocks: translated = {} }] of Object.entries(
    messages
  )) {
    for (const id of Object.keys(translated)) {
      if (!ids.has(id)) {
        errors.push(`messages.${lang}.viewBlocks.${id}: no view block "${id}"`)
      }
    }
  }
  return { errors, warnings }
}

/** Throws if any experience's viewer JSON is invalid. */
export function validateAllViewerJson(): void {
  const failures: string[] = []
  let count = 0
  for (const name of readdirSync(experiencesDir)) {
    const path = join(experiencesDir, name, 'src', `${name}-viewer.json`)
    if (!existsSync(path)) continue
    count++
    const { errors, warnings } = check(path)
    warnings.forEach(w => console.warn(`[${name}] warning: ${w}`))
    errors.forEach(e => failures.push(`[${name}] ${e}`))
  }
  if (failures.length) {
    throw new Error(
      `Invalid viewer JSON (packages/schemas/viewer/v1.json):\n${failures.join(
        '\n'
      )}`
    )
  }
  console.info(`Validated ${count} viewer JSON files`)

  // every file in invalid-examples/ must be rejected, so the rules can't silently loosen
  const invalidDir = join(packagesDir, 'schemas/viewer/invalid-examples')
  const accepted = readdirSync(invalidDir).filter(
    file => check(join(invalidDir, file)).errors.length === 0
  )
  if (accepted.length) {
    throw new Error(
      `These invalid viewer JSON examples were accepted: ${accepted.join(', ')}`
    )
  }
}
