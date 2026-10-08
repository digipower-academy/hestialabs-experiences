# Golden tests

`golden.test.js` runs every experience the way the app does (`run-experience.helpers.js`): `customPipeline`, or else `sql`, then the `postprocessor`. It then compares each view block's output with `__snapshots__/golden.test.js.snap`.

Each snapshot records the headers, the row count, the first rows (truncated), and a SHA-256 hash of the whole output. Any change to any value shows up, and the diff stays readable. A block that throws is recorded as `{ error }`.

## Inputs

- **Experiences with `dataSamples`** run on each of their samples in `packages/lib/data-samples/`.
- **Aggregators** (`*-agg`) run on generated input. The participant experience runs on its sample, and its raw results are packaged into two participants' ZIPs (`participant-zip.helpers.js`), the way `UnitConsentForm.vue` does: `blockNN.json`, `consent.json`, and the selected raw files. This also checks the participant → aggregator handoff, so reordering a participant's tabs will show here (#1427).
- **Experiences with neither** are listed as passing placeholder tests, so the gap stays visible. Cover one by adding a sample, or an entry in `aggregators`.

Tests run in UTC (`jest.global-setup.cjs`), so results don't depend on the machine's timezone.

## Commands

```sh
npm run test:golden            # in data-experience/; also part of `npm test`
npm run test:golden -- -u      # accept intended changes, then review the snapshot diff in your PR
npx jest src/__tests__/golden -t twitter    # one experience
```

A snapshot diff in a PR is the point: explain in the PR why each changed output is right.
