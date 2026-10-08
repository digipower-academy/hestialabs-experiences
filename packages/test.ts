import type { ViewBlock } from './lib/types'
import { error } from './lib/utils'
import {
  validateDatabaseConfigIntegrity,
  validateDatabaseConfigSchema
} from './lib/database-config-validation/'
import { Experience } from './lib/'
import { validateAllViewerJson } from './validate-viewer'
import * as packages from './packages'

import camelCase from 'lodash/camelCase'

function test([
  name,
  {
    loaderOptions: { files, disabled, databaseConfig },
    viewerOptions: { viewBlocks, url }
  }
]: [name: string, experience: Experience]): void {
  if (!disabled && !url && !viewBlocks.length) {
    error(`[${name}] viewBlocks should not be empty`)
  }
  if (files && !('$DYNAMIC_FILES' in files)) {
    // validate file ids
    viewBlocks.forEach(({ id, files: viewFiles }: Partial<ViewBlock>) => {
      if (viewFiles) {
        const fileId = viewFiles.find((f: string) => !(f in files))
        if (fileId) {
          error(
            `[${name}] ViewBlock ${id} has an unconfigured file id ${fileId}`
          )
        }
      }
    })
    if (databaseConfig) {
      validateDatabaseConfigSchema(name, databaseConfig)
      validateDatabaseConfigIntegrity(name, databaseConfig, files)
    }
  }
}
if (process.argv.length > 2) {
  // test one or more packages
  const names: string[] = process.argv.slice(2)
  names.map(camelCase).forEach(name => {
    // we expect the name to be camelCased
    const module = (packages as { [key: string]: Experience })[name]
    if (module) {
      test([name, module])
    } else {
      throw new Error(`The name "${name}" does not match any package.`)
    }
  })
} else {
  // test all packages
  Object.entries(packages).forEach(test)
  validateAllViewerJson()
}
