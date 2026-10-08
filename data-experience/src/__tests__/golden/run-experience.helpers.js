import { createHash } from 'crypto'
import { cloneDeep } from 'lodash-es'
import DBMS from '~/utils/sql'
import FileManager from '~/utils/file-manager'
import * as genericPipelines from '~/utils/generic-pipelines'

/**
 * Runs every view block of an experience on the given files, the way
 * UnitPipeline.vue and UnitPipelineViewBlock.vue do in the browser:
 * customPipeline (a function, or a generic pipeline by name) else sql,
 * then the postprocessor.
 * Returns { outputs, raw, fileManager }: outputs are what the tabs show
 * ({ [blockId]: result | { error } }); raw are the results before the
 * postprocessor, which is what a participant shares with a bubble.
 */
export async function runExperience(experience, files) {
  const { preprocessors, files: fileGlobs, keepOnlyFiles, databaseConfig, viewBlocks } =
    experience.options
  const fileManager = new FileManager(preprocessors, null, fileGlobs, keepOnlyFiles)
  await fileManager.init(files)
  let db
  if (databaseConfig) {
    db = await DBMS.createDB(databaseConfig)
    DBMS.insertRecords(db, await DBMS.generateRecords(fileManager, databaseConfig))
  }
  const outputs = {}
  const raw = {}
  for (const { id, customPipeline, customPipelineOptions, sql, postprocessor } of viewBlocks) {
    try {
      const pipeline =
        typeof customPipeline === 'string' ? genericPipelines[customPipeline] : customPipeline
      let result
      if (pipeline) {
        result = await pipeline({ fileManager, options: customPipelineOptions })
      } else if (sql) {
        result = db.select(sql)
      } else {
        throw new Error('Misconfigured pipeline')
      }
      raw[id] = result
      outputs[id] = typeof postprocessor === 'function' ? postprocessor(cloneDeep(result)) : result
    } catch (error) {
      outputs[id] = { error: error instanceof Error ? error.message : String(error) }
    }
  }
  db?.close()
  return { outputs, raw, fileManager }
}

function truncate(value) {
  if (typeof value === 'string') {
    return value.length > 80 ? `${value.slice(0, 80)}…` : value
  }
  if (Array.isArray(value)) {
    return value.slice(0, 5).map(truncate)
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, truncate(v)]))
  }
  return value
}

/**
 * A readable, stable summary of a block's output for snapshots:
 * headers, row count, the first rows (truncated) and a hash of everything.
 */
export function summarize(result) {
  if (result?.error) {
    return { error: result.error }
  }
  const json = JSON.stringify(result) ?? 'undefined'
  const summary = { sha256: createHash('sha256').update(json).digest('hex') }
  if (result && Array.isArray(result.items)) {
    summary.headers = result.headers
    summary.count = result.items.length
    summary.firstItems = truncate(result.items.slice(0, 3))
  } else {
    summary.value = truncate(result)
  }
  return summary
}
