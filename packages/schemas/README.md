# Schemas

## Viewer JSON: `viewer/v1.json`

[`viewer/v1.json`](viewer/v1.json) is the JSON Schema (draft-07) for an experience's viewer options: `packages/packages/experiences/<name>/src/<name>-viewer.json`. It describes the tabs (view blocks), texts and translations that any renderer needs. Its stable URL is its `$id`:

```
https://raw.githubusercontent.com/digipower-academy/hestialabs-experiences/master/packages/schemas/viewer/v1.json
```

`npm test` in `packages/` validates every viewer JSON against it (`validate-viewer.ts`). It also checks rules a schema can't express:
- view block ids are unique;
- every `.vue` visualization exists in `data-experience/src/components/chart/view/`;
- every translated view block (`messages.<lang>.viewBlocks.<id>`) exists.

A block with both `sql` and `customPipeline` only gets a warning, since the runtime ignores `sql` in that case. Every file in `viewer/invalid-examples/` must be rejected, which keeps the rules from silently loosening.

To get autocompletion in your editor, add `"$schema": "<the URL above>"` at the top of a viewer JSON.

### What the schema does not cover

- `vizProps` and translated `vizProps` are free-form objects, because each visualization component expects its own shape. Typing the generic components' props is part of the renderer-neutral charts work (#1422).
- Whether `files`, `customPipeline` and `postprocessor` names resolve. The first is checked by `test.ts`; the other two by `Experience` when the package loads.

## Versioning rules

The viewer format has one integer version: `"version"` in each file, and `loaderOptions.viewerVersion` in each package's `index.ts`, which is the smallest version the loader accepts.

- **Non-breaking** changes keep the version and update `v1.json` in place. Examples: a new optional field, a new allowed value, or a looser constraint that existing renderers ignore safely.
- **Breaking** changes need a new version. Examples: removing or renaming a field, changing a type or meaning, making a field required, or anything an existing renderer would misread. For a breaking change:
  1. Add `viewer/v2.json` next to `v1.json`; never edit the meaning of a published version.
  2. Update the renderers (`data-experience`) to accept both, and bump `viewerVersion` only in packages that need the new format.
  3. Record the change in the changelog below.
- **View block ids are part of the contract.** Translations, shared results and aggregator experiences refer to them, so renaming one is a breaking change for that experience (#1427).

## Changelog

- **v1** (2026-10): first published schema, describing the format all 32 experiences already used.
