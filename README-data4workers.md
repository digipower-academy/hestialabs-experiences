# Data4Workers Experiences (Uber Eats & Babysits)

This document explains how to run and test the **Uber Eats** and **Babysits** worker experiences developed in the Data4Workers project.

The setup is similar to the main repository setup described in the root [README.md](README.md), but **without the Bubble Server**, since these two experiences do not require it. The Bubble Server remains available for internal use within the main platform but is not needed for running or testing these experiences.

---

# Project Structure

## Components

The visualization components for the experiences are implemented in the [data-experience](data-experience) project:

- [`data-experience/src/components/chart/view/uberEats`](data-experience/src/components/chart/view/uberEats)
- [`data-experience/src/components/chart/view/babysits`](data-experience/src/components/chart/view/babysits)

---

## Component Tests

Component tests are located in:

- [`data-experience/src/components/__tests__/uber-eats`](data-experience/src/components/__tests__/uber-eats)
- [`data-experience/src/components/__tests__/babysits`](data-experience/src/components/__tests__/babysits)

These tests verify:

- correct rendering of UI components  
- navigation and filtering interactions  
- stability with empty or incomplete datasets  

---

## Performance and Pipeline Tests

Performance and pipeline tests are stored in:

- [`data-experience/src/__tests__/uber-eats`](data-experience/src/__tests__/uber-eats)
- [`data-experience/src/__tests__/babysits`](data-experience/src/__tests__/babysits)

These tests validate:

- data parsing and normalization  
- pipeline correctness  
- scalability of data aggregation logic  

---

## Experience Configuration

The configuration of the experiences is located in the [packages](packages) project:

- [`packages/packages/experiences/uber-eats`](packages/packages/experiences/uber-eats)
- [`packages/packages/experiences/babysits`](packages/packages/experiences/babysits)

The files:

- `uber-eats-viewer.json`
- `babysits-viewer.json`

define:

- which tabs are shown in the dashboard  
- which data pipeline is executed  
- which visualization component is used for each tab  

---

## Data Processing Pipelines

Data processing is implemented in:

- [`packages/packages/experiences/uber-eats/src/viewer-functions.ts`](packages/packages/experiences/uber-eats/src/viewer-functions.ts)
- [`packages/packages/experiences/babysits/src/viewer-functions.ts`](packages/packages/experiences/babysits/src/viewer-functions.ts)

These pipelines:

- parse uploaded datasets  
- normalize timestamps and fields  
- transform raw data into visualization-ready structures  

---

## How an Experience Works

Each experience consists of three main parts:

1. Data pipeline  
   → transforms raw input data into structured format  
   (viewer-functions.ts)

2. Configuration  
   → defines which views and components are used  
   (viewer.json)

3. Visual components  
   → render the processed data  
   (Vue components in data-experience)

These parts are connected through the experience configuration.

---

## Adding New Experiences

The previous sections **Components**, **Experience Configuration**, and **Data Processing Pipelines** provide a brief overview of how the Uber Eats and Babysits experiences were implemented within the existing project structure. These sections give a glimpse of how a new experience can be integrated following the setup and architectural conventions of the repository.

To understand the full architecture of the project and the complete process for creating and integrating a new experience, refer to the following documentation:

[`how-to-create-an-experience.md`](how-to-create-an-experience.md)

This document explains the architecture and configuration required to integrate a new data experience into the Digipower platform.

---

# Setup

## Node and npm versions

The project uses **Node 22** (pinned in [`.nvmrc`](.nvmrc)) and **npm 10** or later, as described in the root [README.md](README.md).

To switch versions you can install `nvm` if you don't have it already: [install instruction](https://github.com/nvm-sh/nvm) or with HomeBrew `brew install nvm`. Then, from the repository root:
```sh
nvm install
nvm use
```

## Step-by-step guide

Clone the project repository:

```bash
git clone https://github.com/hestiaAI/hestialabs-experiences.git
```

Then install and build the packages:
```sh
cd packages
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

Install dependencies and build
```sh
npm i
npm run build
```

Run the data experience module in development mode
```sh
npm run dev:app
```

# Running Tests
Run all tests (including Uber Eats and Babysits tests):

```sh
cd ../data-experience
npm run test
```

# Running Performance Tests
The performance tests evaluate how the data processing and aggregation logic behaves when handling **large datasets**.  
They are intended to validate that the client-side pipelines and visualizations remain performant even when many records are processed.

Uber Eats performance tests:
```sh
npm run perf:ubereats
```

Babysits performance tests:
```sh
npm run perf:babysits
```

# Notes

## Client-side processing
The Uber Eats and Babysits experiences run **entirely client-side in the browser**.  
This means:

- Personal data is processed locally
- No backend server is required
- No personal data is transmitted externally

This follows the privacy-first architecture used in the Digipower platform.

---

## Bubble server not required
The setup described in this document does **not require the Bubble Server**, which is normally part of the full Digipower platform setup.

The experiences implemented in this project work entirely within the frontend environment and therefore can be tested without running the backend service.

---

## Node and npm versions
See [Node and npm versions](#node-and-npm-versions) above: **Node 22** and **npm 10** or later.

---

## Test datasets
The experiences can be tested using either:

- sample datasets included in the repository  
- personal datasets exported from the respective platforms (Uber Eats or Babysits)

No external data services are required.

---

## Development scope
The Uber Eats and Babysits experiences were implemented as **extensions of the existing Digipower platform**, following the modular architecture of the repository.

Core platform components were not modified, instead the experiences were added through the existing **experience-based extension model**.

---

## CI/CD and Docker setup

This project includes a GitLab CI/CD pipeline configuration and a Dockerfile that were used during development and testing.

- The **GitLab pipeline** was used to automate build and deployment steps in the FHNW environment.
- The **Dockerfile** defines a containerized setup to ensure consistent builds and reproducible environments.

For the final integration into the client’s system, these files are **not required**, as the deployment is handled through the client’s own GitHub-based workflow and infrastructure.

However, the pipeline configuration and Docker setup are intentionally kept in the repository, as they may still be useful:

- for future development or testing setups  
- for recreating a local or independent deployment environment  
- as a reference for alternative CI/CD configurations  

They can therefore be reused or adapted if needed in future extensions of the project.