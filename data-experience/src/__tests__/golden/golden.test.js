/**
 * Golden tests: every experience runs on its data samples, and each view
 * block's output is compared with a saved snapshot (__snapshots__/).
 * After an intended change, review the diff and run `npm run test:golden -- -u`.
 */
import { readFileSync, readdirSync } from 'fs'
import { resolve } from 'path'
import NodeFile from '~/utils/node-file'
import { participantZip } from './participant-zip.helpers'
import { runExperience, summarize } from './run-experience.helpers'

const packagesDir = resolve(__dirname, '../../../../packages')
const experiencesDir = resolve(packagesDir, 'packages/experiences')
const samplesDir = resolve(packagesDir, 'lib/data-samples')

// local sample file names, from the dataSamples URLs (…?filename=<name>)
function sampleFiles(name) {
  const viewer = JSON.parse(
    readFileSync(resolve(experiencesDir, name, 'src', `${name}-viewer.json`), 'utf8')
  )
  return (viewer.dataSamples || []).map(url => new URL(url).searchParams.get('filename'))
}

const cases = readdirSync(experiencesDir)
  .sort()
  .flatMap(name => sampleFiles(name).map(sample => [name, sample]))

jest.setTimeout(120000)

// data-mapping warnings are logged, not thrown; the snapshots record their effect
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  jest.spyOn(console, 'warn').mockImplementation(() => {})
})
afterAll(() => jest.restoreAllMocks())

describe.each(cases)('%s with %s', (name, sample) => {
  test('view block outputs match the snapshots', async() => {
    const { default: experience } = await import(`@hestia.ai/${name}`)
    const file = new NodeFile(sample, readFileSync(resolve(samplesDir, sample)))
    const { outputs } = await runExperience(experience, [file])
    for (const [blockId, result] of Object.entries(outputs)) {
      expect(summarize(result)).toMatchSnapshot(blockId)
    }
  })
})

/**
 * Aggregators read what participants share, not a platform export. Their
 * input is generated: each participant experience runs on its sample and
 * its results are packaged as two participants' ZIPs, as the consent form does.
 * [aggregator, [[participant experience, sample, raw files to include]]]
 */
const aggregators = [
  ['google-agg', [['google', 'google-takeout.zip']]],
  ['her-tinder-agg', [['her', 'her.zip'], ['tinder', 'tinder.json']]],
  ['linkedin-agg', [['linkedin', 'linkedin.zip']]],
  ['tracker-control-agg', [['tracker-control', 'tracker-control.csv']]],
  ['twitter-agg', [['twitter', 'twitter-small.zip', ['personalization.js']]]]
]

async function sharedZips(participant, sample, rawFileNames = []) {
  const { default: experience } = await import(`@hestia.ai/${participant}`)
  const file = new NodeFile(sample, readFileSync(resolve(samplesDir, sample)))
  const { raw, fileManager } = await runExperience(experience, [file])
  const rawFiles = Object.fromEntries(
    rawFileNames.map((name) => {
      const path = Object.keys(fileManager.fileDict).find(p => p.endsWith(`/${name}`))
      // the app passes the File itself to JSZip; in Node, its buffer
      return [name, fileManager.fileDict[path].blob]
    })
  )
  return Promise.all(
    [1, 2].map(n => participantZip(`${participant}_participant${n}.zip`, experience, raw, { rawFiles }))
  )
}

describe.each(aggregators)('%s with generated participant data', (name, participants) => {
  test('view block outputs match the snapshots', async() => {
    const files = (
      await Promise.all(participants.map(args => sharedZips(...args)))
    ).flat()
    const { default: experience } = await import(`@hestia.ai/${name}`)
    const { outputs } = await runExperience(experience, files)
    for (const [blockId, result] of Object.entries(outputs)) {
      expect(summarize(result)).toMatchSnapshot(blockId)
    }
  })
})

const covered = new Set(aggregators.map(([name]) => name))
const withoutSamples = readdirSync(experiencesDir)
  .sort()
  .filter(name => sampleFiles(name).length === 0 && !covered.has(name))

describe('experiences without data samples (no golden test yet)', () => {
  test.each(withoutSamples)('%s', (name) => {
    // listed so the gap stays visible; add a sample or a generator to cover it
    expect(sampleFiles(name)).toEqual([])
  })
})
