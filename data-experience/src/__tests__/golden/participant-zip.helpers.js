import JSZip from 'jszip'
import NodeFile from '~/utils/node-file'

/**
 * The ZIP a participant shares with an aggregator bubble, built like
 * UnitConsentForm.vue's generateZIP (unencrypted): experience.json,
 * consent.json, one blockNN.json per shared view block (the block's
 * config plus its raw `result` and `index`), and selected raw files.
 */
export async function participantZip(zipName, experience, raw, { rawFiles = {}, k = 2 } = {}) {
  const { viewBlocks, slug, version } = experience.options
  const zip = new JSZip()
  zip.file('experience.json', JSON.stringify({ experience: slug, timestamp: 0, version }))
  const shared = viewBlocks.map(({ id }) => id).filter(id => id in raw)
  const consent = [
    { title: 'Select which tabs to share', type: 'data', value: shared },
    { title: 'Give consent', type: 'checkbox', value: ['I agree'] },
    { name: 'k', type: 'number', value: k }
  ]
  zip.file('consent.json', JSON.stringify(consent))
  viewBlocks.forEach((block, index) => {
    if (block.id in raw) {
      // functions (resolved pipelines) are dropped, as JSON.stringify does in the app
      const content = { ...JSON.parse(JSON.stringify(block)), result: raw[block.id], index }
      zip.file(`block${String(index).padStart(2, '0')}.json`, JSON.stringify(content))
    }
  })
  for (const [name, content] of Object.entries(rawFiles)) {
    zip.folder('files').file(name, content)
  }
  return new NodeFile(zipName, await zip.generateAsync({ type: 'nodebuffer' }))
}
