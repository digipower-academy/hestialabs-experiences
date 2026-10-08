# Working in hestialabs-experiences

Instructions for coding agents and new contributors. Read this before changing anything.

## What this is

[digipower.academy](https://digipower.academy) lets people explore the personal data they download from platforms (Google, Facebook, Uber, …). Exports are processed **in the visitor's browser**; nothing leaves the device unless the visitor shares results with a *bubble* (see below). The roadmap is #1415.

| Folder | What it is |
|---|---|
| `packages/` | Lerna/TypeScript monorepo. `packages/packages/experiences/<name>/` holds one **experience** per data source (32 of them). `packages/lib/` holds the shared `Experience` class and types. |
| `data-experience/` | Vue 2 component library that loads an export and renders an experience. Published as `@hestia.ai/data-experience`. Has the Jest and Playwright tests. |
| `dc-dashboard/` | Vue 2 dashboard library (dc.js), used by the site. |
| `experiences/` | Nuxt 2 static site that builds digipower.academy. `config/<name>.json` selects experiences and bubbles. |
| `../hestialabs-bubble-server` | Separate repo: Django server storing encrypted submissions for bubbles. Needed only for bubble flows and the Playwright tests. |

## Setup and checks

Node 22 (`.nvmrc`), npm 10+.

```sh
npm run setup              # packages + data-experience: enough for the checks below
npm run setup -- --site    # also dc-dashboard, data-experience library, Nuxt site
npm test                   # the same checks as CI (.github/workflows/ci.yml)
```

**Done means `npm test` passes and CI is green on the PR.** Run focused checks while iterating:

- one experience's config: `cd packages && npm run build && npm run test:ts-node -- <name>`
- one Jest file: `cd data-experience && npx jest src/__tests__/<name>`
- lint one file: `cd data-experience && npx eslint <file>`

Playwright (`data-experience/e2e`) is not in CI yet: it needs `npm run dev:app` in `data-experience` on port 8080 and the bubble server on port 8000. `e2e/fixtures.js` serves CDN assets locally; the Facebook and Google specs still need internet access for the Kepler map (unpkg).

## How an experience works

An experience is `packages/packages/experiences/<name>/`:

- `src/index.ts` builds `new Experience(loaderOptions, viewerOptions, packageJSON, import.meta.url, viewerFunctions)`.
  - `loaderOptions.files`: file id → glob inside the export zip, e.g. `impressions: '**/ad-impressions.js'`.
  - `loaderOptions.databaseConfig` (optional, `src/database.ts`): SQLite tables plus JSONPath getters that turn files into rows. Validated by an Ajv schema in `packages/lib/database-config-validation/`.
  - `preprocessors` (optional): glob → function that fixes file text before parsing.
- `src/<name>-viewer.json`: what the visitor sees. A list of `viewBlocks` (tabs), each with:
  - an `id`;
  - **either** `sql` (run on the database) **or** `customPipeline` (a function name from `viewer-functions.ts`, or a generic one from `data-experience/src/utils/generic-pipelines.js`);
  - optionally a `postprocessor`;
  - a `visualization`: a Vue file under `data-experience/src/components/chart/view/` (e.g. `"ChartViewDashboard.vue"`, `"uberEats/Overview.vue"`, without a `view/` prefix), or an inline Vega spec;
  - `vizProps` for that component.
  - Text and translations go in `messages.{en,fr}` (format: `packages/MESSAGES_JSON.md`).
- Every pipeline returns `{ headers, items }`.
- Types: `packages/lib/types/`.
- A minimal example: `packages/packages/experiences/database-template/`.

When you add an experience, also:
- add it to `packages/packages.ts` (alphabetical; this is what `npm test` validates);
- add it to `experiences/config/dev.json`;
- keep `data-experience/public/<name>-viewer.json` identical to the package's copy (`npm run check:viewer-sync`), or list it in `.viewer-sync-allowlist`.

## Rules

- **Personal data.** Never commit a real person's export unless their consent is recorded. Put real exports for development in `experience-intake/inbox/` (git-ignored). Test fixtures should be synthetic.
- **Anything that changes what leaves the visitor's browser needs a human reviewer.** That includes the consent form (`UnitConsentForm.vue`), encryption (`utils/encryption.js`), uploads to bubbles (`utils/bubble-api.js`), and new network requests.
- **Never skip or disable a failing test to get green.** Fix the cause, or report it.
- **Don't edit generated output:** `packages/packages/experiences/*/dist`, `data-experience/dist`, `experiences/dist`.
- **Don't publish to npm or deploy.** That's done by maintainers (`packages/README.md`, `deploy_digipower.sh`).
- **Keep changes minimal and in scope.** One goal or fix per PR, and say in the PR how you verified it.

## Docs and their status

- `README.md`: setup, current.
- `packages/README.md`: monorepo, creating a package, publishing.
- `how-to-create-an-experience.md` and `README-how-to-create-a-new-experience.md`: authoring guides. The second one is the most recent (bespoke Vue views, stores, tours).
- `packages/MESSAGES_JSON.md`: translation format for viewer JSON.
- `I18N.md`: outdated design notes, kept for history.
