// Symlink monorepo experience packages into a project's node_modules/@hestia.ai/,
// replacing the global `npm link` step. Safe to run repeatedly.
const { existsSync, lstatSync, mkdirSync, readdirSync, rmSync, symlinkSync } = require('fs')
const { join, relative, resolve } = require('path')

const experiencesDir = resolve(__dirname, '../packages/packages/experiences')

function localExperienceNames() {
  return readdirSync(experiencesDir).filter(name => existsSync(join(experiencesDir, name, 'package.json')))
}

function linkLocalExperiences(projectDir, names = localExperienceNames()) {
  const scopeDir = join(projectDir, 'node_modules', '@hestia.ai')
  mkdirSync(scopeDir, { recursive: true })
  const linked = []
  for (const name of names) {
    const target = join(experiencesDir, name)
    if (!existsSync(join(target, 'package.json'))) {
      console.warn(`Skipping @hestia.ai/${name}: no package at ${relative(projectDir, target)}`)
      continue
    }
    const linkPath = join(scopeDir, name)
    try {
      lstatSync(linkPath)
      rmSync(linkPath, { recursive: true, force: true })
    } catch {
      // nothing to replace
    }
    symlinkSync(relative(scopeDir, target), linkPath, 'junction')
    linked.push(name)
  }
  console.info(`Linked ${linked.length} local experience packages into ${relative(process.cwd(), scopeDir) || scopeDir}`)
  return linked
}

module.exports = { linkLocalExperiences, localExperienceNames }
