# HestiaLabs Experiences

This repo currently contains three projects:
- [packages](packages/README.md): Monorepo for packages used throughout the system, including data experience packages.
- [data-experience](data-experience/README.md): Vue component for the data experience to visualize one data set. 
- [dc-dashboard](dc-dashboard/README.md): A library to generate interactive dashboards.
- [experiences](experiences/README.md): Nuxt app, this builds [digipower.academy](https://digipower.academy).


This repo is also dependent on the [bubble-server](https://github.com/hestiaAI/hestialabs-bubble-server)

## Setup
**This project needs Node 22 (LTS) and npm 10 or later. The version is pinned in [`.nvmrc`](.nvmrc); we recommend using `nvm` ([installation](https://heynode.com/tutorial/install-nodejs-locally-nvm/)).**

**Quick start:** clone this repo and the bubble-server side by side (below), then from this repo's root run `npm run setup -- --all` (or plain `npm run setup` for just what the tests need) and `npm test`. The steps below are what `scripts/setup.sh` does. Agents and new contributors: read [`AGENTS.md`](AGENTS.md).

First create a new directory, and clone this repo and the bubble-server:
```sh
git clone https://github.com/hestiaAI/hestialabs-experiences.git
git clone https://github.com/hestiaAI/hestialabs-bubble-server.git
```

You must use the correct version of node and npm to run the project (note that nvm for Windows may have a different syntax.)
First install `nvm` if you don't have it already: [install instruction](https://github.com/nvm-sh/nvm) or with HomeBrew `brew install nvm`. Then, from the repository root, install and use the version from `.nvmrc`:
```sh
nvm install
nvm use
```

Then install and build the bubble-server:
```sh
cd hestialabs-bubble-server
# This line install Poetry, only needed if you don't have it already
pip install poetry
poetry install
poetry run pre-commit install
```

Then install and build the packages:
```sh
cd ../hestialabs-experiences/packages
npm i
npm run build
npm run prepare
```

Then install and build `dc-dashboard` package:
```sh
cd ../dc-dashboard
npm i
npm run build
```

Then install and build `data-experience`:
```sh
cd ../data-experience
```

Add an extensionless environment file `.env` with the following configuration:

```
echo "NODE_ENV=development" > .env
```

Then run
```sh
npm i
npm run build
```

You can run the data experience module in development mode with
```sh
npm run dev
```

Then install modules for the Nuxt app:
```sh
cd ../experiences
npm i
```

You can run the Nuxt app in development mode with
```sh
npm run dev
```

## Checks (CI)

Every pull request runs [`.github/workflows/ci.yml`](.github/workflows/ci.yml). To run the same checks locally:

```sh
cd packages && npm ci && npm test && npm run lint:all   # build, validate experience configs, lint
cd ../data-experience && npm ci && npx vue-cli-service lint --no-fix && npm test
cd ../experiences && npm ci --ignore-scripts && npm run lint
cd .. && npm run check:viewer-sync
```

The Playwright browser tests (`data-experience/e2e`) are not part of CI yet. They need the dev server and the bubble server running (`npm run dev` in `data-experience`).

## Viewer JSON Sync Check

Run this from the repository root to verify that files in `data-experience/public/*-viewer.json`
match their counterparts in `packages/packages/experiences/*/src/*-viewer.json`:

```sh
npm run check:viewer-sync
```

The check fails on unexpected drift and allows explicit exceptions listed in
`.viewer-sync-allowlist` (one basename per line).

# Credits
The experiences Babysits/Yojoo have been developed by Serhii Moshtakov and Fabian Studer, students at FHNW University of Applied Sciences and Arts Northwestern Switzerland with Prof. Anton Fedosov. 
This project has been improved under SPARK project "Participatory Methodology for AI Accountability in the Gig Economy: A Comparative Study of (Digital)
Labour Conditions Between the French- and German-Speaking Cantons of Switzerland" (Principal Investigator: Jessica Pidoux, University of Neuchatel).
