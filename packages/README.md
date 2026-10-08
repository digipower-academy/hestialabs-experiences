<p align="center">
  <img alt="HestiaLabs" src="https://hestialabs.org/assets/img/hestialabs-logo+text.svg" width="480">
</p>

<br>

<p align="center">
  <a href="https://lerna.js.org/"><img alt="Lerna" src="https://img.shields.io/badge/Lerna-3E3E3E?style=for-the-badge&logo=lerna&logoColor=white"></a>
  <a href="https://www.typescriptlang.org/"><img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white"></a>
  <a href="https://webpack.js.org/"><img alt="webpack" src="https://img.shields.io/badge/Webpack-8DD6F9?style=for-the-badge&logo=Webpack&logoColor=white"></a>
  <a href="https://eslint.org"><img alt="ESLint" src="https://img.shields.io/badge/eslint-3A33D1?style=for-the-badge&logo=eslint&logoColor=white"></a>
  <a href="https://prettier.io/"><img alt="Prettier" src="https://img.shields.io/badge/prettier-1A2C34?style=for-the-badge&logo=prettier&logoColor=F7BA3E"></a>
  <a href="https://babeljs.io/"><img alt="Babel" src="https://img.shields.io/badge/Babel-F9DC3E?style=for-the-badge&logo=babel&logoColor=white"></a>

</p>

# Instructions

Read the following instructions carefully before getting started.

```bash
# All commands are run in the same folder as this readme
$ cd packages
```

## Setup

Install all packages:

```sh
npm install
```

Build all packages:

```sh
npm run build
```

Set up pre-commit hooks:

```
npm run prepare
```

## Develop

Start developing:

```sh
npm run dev
```

This runs webpack in watch mode, building the packages once and then watching all files for changes. If one file is updated, the code is recompiled so you don’t have to run the full build manually.

## Build

Build all packages:

```sh
npm run build
```

## Test

Run tests for all packages in `packages/experiences/`:

```sh
npm test
```

Run test for one or more packages:

```sh
npm run test:ts-node -- <package1> [<package2> ...]
```

## Usage

Refer to [packages/experiences/README.md](packages/experiences/README.md)

## Package management

This section explains how packages for experiences are created and updated. Similar principles apply to other packages.

### Create a new package

1. Create a new folder in the `packages/experiences` directory. By convention, the folder name is also the package name.

2. Add a `src` folder with the required `index.ts` entry file.

3. Add a `package.json` that looks like this:

```json
{
  "name": "@hestia.ai/<NAME>",
  "version": "0.0.0",
  "main": "dist/index.mjs",
  "type": "module",
  "files": ["dist", "src/<NAME>-viewer.json"],
  "repository": {
    "type": "git",
    "url": "https://github.com/hestiaai/hestialabs-experiences",
    "directory": "packages/packages/experiences/<NAME>"
  },
  "publishConfig": {
    "access": "public"
  },
  "author": "",
  "license": "UNLICENSED"
}
```

Replace `<NAME>` with the package name.

4. Add the package name to the `experiences` Array in [dev.json](https://github.com/hestiaAI/hestialabs-experiences/blob/master/experiences/config/dev.json).

5. Add an export statement for the package in [`packages.ts`](./packages.ts). This ensures [tests](./test.ts) are run for the package.

6. Rebuild and re-link the packages (from the repository root):

```sh
npm run setup -- --site
```

### Login to npm

1. Get an npm account and ask Paul-Olivier to add you to the hestia.ai organization in npm.

2. Add the following file to your `~/.npmrc` file in your **home directory**. Your `~/.npmrc` should look like this:

```
@hestia.ai:registry=https://registry.npmjs.org/
```

3. Run the following command to login to npm:

```sh
npm login --scope=@hestia.ai --registry=https://registry.npmjs.org/
```

### Bump version of packages changed since the last release

Create a new branch and commit your changes:

```sh
git checkout -b <name-of-your-new-branch>
git push origin <name-of-your-new-branch>
git commit ...
```

Update the package version

```sh
npm run lerna:version
```

[Documentation of lerna’s `version` command](https://github.com/lerna/lerna/tree/main/libs/commands/version#readme)

You can pass extra arguments to the npm script:

```sh
npm run lerna:version -- --no-push
npm run lerna:version -- minor --force-publish=*
```

Please update versions with a meaningful [semantic versioning](https://docs.npmjs.com/about-semantic-versioning) (semver) bump depending on the size/importance of the package changes.

- `patch`: 1.2.3 -> 1.2.4
- `minor`: 1.2.3 -> 1.3.0
- `major`: 1.2.3 -> 2.0.0

You can either input the new version manually or provide a semver [bump](https://github.com/lerna/lerna/tree/main/libs/commands/version#semver-bump) positional argument.

**NOTE: You cannot version and publish packages on the master branch**

### Publish packages

```sh
npm run lerna:publish
```

[Documentation of lerna’s `publish` command](https://github.com/lerna/lerna/tree/main/libs/commands/publish#readme)
**NOTE: You cannot version and publish packages on the master branch**

# Sources

- [Lerna docs](https://lerna.js.org/docs/introduction)
- [lerna github](https://github.com/lerna/lerna)
- [webpack docs](https://webpack.js.org/concepts/)
- [TypeScript docs](https://www.typescriptlang.org/docs/)

# Notes

- Passing arguments from the command line to npm scripts works in PowerShell if you [enclose the `--` in quotation marks](https://stackoverflow.com/a/65530483/8238129). For example,

```sh
$ npm run lerna:version "--" --force-publish
```
