# Experience Development: Implementation Guide

This document provides comprehensive technical specifications and procedures for the development and deployment of new experiences within the Hestia Labs platform. Procedures described herein are based upon reviewed implementations of existing experiences, including Uber Eats and Babysits.

### Project Structure (Monorepo Layout)

```
root/
├── packages/
│   ├── packages/                    <-- Legacy path
│   │   └── experiences/             <-- Data logic & pipelines
│   │       └── my-experience/
│   └── package.json
├── data-experience/                 <-- UI Layer (Vue components)
│   ├── src/components/chart/view/
│   └── package.json
└── package.json                     <-- Root workspace
```

**Note**: Both `packages/experiences` and `data-experience` are in the same repository. `npm run setup` from the root installs and builds them; `data-experience` resolves `@hestia.ai/*` imports to the local packages (webpack aliases in `vue.config.js`, `moduleNameMapper` in Jest).

---

## 1. Overview and Component Architecture

An experience comprises the following essential components:

1. **Package Module** — TypeScript-based package located at `packages/packages/experiences/<name>/`
2. **Data Configuration** — Specification and mapping of CSV file sources
3. **Data Transformation Pipelines** — Processing functions defined in `viewer-functions.ts`
4. **Visualization Components** — Vue-based client components located at `data-experience/src/components/chart/view/<name>/`
5. **Test Suites** — Unit tests and performance benchmarks
6. **User Onboarding** — Optional interactive tutorial implementations

---

## 2. System Architecture and Data Flow

The experience architecture implements a layered processing model:

```
External Data (CSV files)
        ↓
    FileManager (data loading and parsing)
        ↓
    Data Pipelines (transformation: input → { headers, items })
        ↓
    Vue Components (client-side visualization)
        ↓
    User Interface (interactive dashboard)
```

### 2.1 Architectural Principles

- **Client-side Processing**: All data processing occurs within the browser environment
- **Privacy Compliance**: User data remains local; no external transmission occurs
- **Offline Functionality**: Experiences operate without continuous network connectivity
- **Standalone Deployment**: No backend infrastructure is required

---

## Prerequisites

Before starting development, ensure the following prerequisites are met:

- **Node.js 22** installed (see `.nvmrc`)
- **Git** configured for repository access
- Dependencies installed and packages built: run `npm run setup` from the repository root

If you encounter build errors, verify all prerequisites are satisfied before proceeding.

---

## 3. Implementation Phase 1: Package Structure Initialization

**Duration**: Approximately 5 minutes

### 3.1 Directory Structure Creation

Initialize the package directory structure as follows:

```bash
cd packages/packages/experiences
mkdir my-experience
cd my-experience
mkdir src
```

### 3.2 Package Metadata Configuration

Generate the package metadata file at `packages/packages/experiences/my-experience/package.json` with the following configuration:

```json
{
  "name": "@hestia.ai/my-experience",
  "version": "0.0.1",
  "main": "dist/index.mjs",
  "type": "module",
  "files": ["dist", "src/my-experience-viewer.json"],
  "repository": {
    "type": "git",
    "url": "https://github.com/hestiaai/hestialabs-experiences",
    "directory": "packages/packages/experiences/my-experience"
  },
  "publishConfig": {
    "access": "public"
  },
  "author": "",
  "license": "UNLICENSED"
}
```

**Dependencies Note**: An experience package contains no Vue code and needs no dependencies. Libraries used by the visualizations (`dayjs`, `vue-apexcharts`, `shepherd.js`, …) are dependencies of `data-experience`, where the Vue 2 components live.

---

## 4. Implementation Phase 2: Data Source Definition

**Duration**: Approximately 5 minutes

### 4.1 Entry Point Configuration

Create the package entry point file at `packages/packages/experiences/my-experience/src/index.ts`:

```typescript
import packageJSON from '../package.json'
import { Experience, LoaderOptions, ViewerOptions } from '@/index'
import viewerOptions from './my-experience-viewer.json'
import viewerFunctions from './viewer-functions'

const loaderOptions: LoaderOptions = {
  viewerVersion: 1,
  files: {
    // Map identifiers to CSV file patterns
    // The glob pattern matches files in the user's export
    PaymentsFile: '**/payments.csv',
    TransactionsFile: '**/transactions.csv',
    DetailsFile: '**/details.csv'
  }
}

export default new Experience(
  loaderOptions,
  viewerOptions as ViewerOptions,
  packageJSON,
  import.meta.url,
  viewerFunctions
)
```

**Important**: File patterns use glob syntax:
- `**/file.csv` - Match "file.csv" at any folder level
- `**/*payments*.csv` - Match any file with "payments" in name
- `**/2024/*.csv` - Match files in "2024" folder

---

## 5. Implementation Phase 3: Viewer Configuration

**Duration**: Approximately 5 minutes

### 5.1 Viewer Configuration File

Create the viewer configuration file at `packages/packages/experiences/my-experience/src/my-experience-viewer.json`:

```json
{
  "title": "My Experience",
  "icon": "https://raw.githubusercontent.com/hestiaAI/hestialabs-experiences/master/packages/lib/icons/my-icon.png",
  "version": 1,
  "messages": {
    "en": {
      "viewBlocks": {}
    }
  },
  "viewBlocks": [
    {
      "id": "overview",
      "customPipeline": "overviewPipeline",
      "files": ["PaymentsFile", "TransactionsFile"],
      "visualization": "myExperience/Overview.vue",
      "title": "Overview",
      "showTable": false
    },
    {
      "id": "details",
      "customPipeline": "detailsPipeline",
      "files": ["DetailsFile"],
      "visualization": "myExperience/Details.vue",
      "title": "Details",
      "showTable": false
    }
  ],
  "dataSamples": [
    "https://raw.githubusercontent.com/hestiaAI/hestialabs-experiences/master/packages/lib/data-samples/my-experience-sample.zip"
  ],
  "dataPortal": "https://example.com/privacy/download"
}
```

**Critical**: Before deployment, verify that:
- Icon URL (`icon` property) is publicly accessible and resolves correctly
- Data sample ZIP file exists in repository at specified path
- Both URLs use raw.githubusercontent.com for direct file access

If either URL is broken, the experience will not appear in the UI experience selector.

**viewBlock properties**:
- `id` - Unique identifier
- `customPipeline` - Function name from viewer-functions.ts
- `files` - Which CSV identifiers to pass to pipeline
- `visualization` - Vue component path (relative to `data-experience/src/components/chart/`)
- `title` - Tab title
- `showTable` - Show raw data table below viz

---

## 6. Implementation Phase 4: Data Pipeline Development

**Duration**: Approximately 15 minutes

### 6.1 Pipeline Function Specification

Create the data transformation module at `packages/packages/experiences/my-experience/src/viewer-functions.ts`:

```typescript
import type { FileManager } from '@/types/utils'

// Pipeline = async function that transforms CSV → structured data
// Input: { fileManager }
// Output: { headers: string[], items: any[] }

async function overviewPipeline({ fileManager }: { fileManager: FileManager }) {
  // Load CSV files by identifier
  // Note: getCsvItemsFromId() always returns an array (glob pattern may match multiple files)
  // Access first match with [0], fallback with ?? if no files matched the glob pattern
  const payments = (await fileManager.getCsvItemsFromId('PaymentsFile'))[0] ?? {
    headers: [],
    items: []
  }
  const transactions = (await fileManager.getCsvItemsFromId('TransactionsFile'))[0] ?? {
    headers: [],
    items: []
  }

  // Transform data
  const paymentItems = payments.items.map(row => ({
    date: row.date,
    amount: parseFloat(row.amount),
    currency: row.currency
  }))

  const transactionItems = transactions.items.map(row => ({
    id: row.id,
    status: row.status,
    timestamp: row.timestamp
  }))

  // Return structured format
  return {
    headers: ['payments', 'transactions'],
    items: [
      {
        payments: { headers: ['date', 'amount', 'currency'], items: paymentItems },
        transactions: { headers: ['id', 'status', 'timestamp'], items: transactionItems }
      }
    ]
  }
}

async function detailsPipeline({ fileManager }: { fileManager: FileManager }) {
  const details = (await fileManager.getCsvItemsFromId('DetailsFile'))[0] ?? {
    headers: [],
    items: []
  }

  return {
    headers: details.headers,
    items: [{ details: details.items }]
  }
}

const viewerFunctions = {
  postprocessors: {},
  customPipelines: {
    overviewPipeline,
    detailsPipeline
  }
}

export default viewerFunctions
```

**Always remember**:
- Use `?? { headers: [], items: [] }` to handle missing CSVs
- Return format: `{ headers: string[], items: any[] }`
- Each item in `items` represents one row of data

---

## 7. Implementation Phase 5: Component Development

**Duration**: Approximately 45 minutes

### 7.1 Component Directory Structure

Initialize the component directory hierarchy:

```bash
mkdir -p data-experience/src/components/chart/view/myExperience/charts
mkdir -p data-experience/src/components/chart/view/myExperience/store
mkdir -p data-experience/src/components/chart/view/myExperience/onboarding
```

### 7.2 Primary Overview Component

Implement the primary interface component at `data-experience/src/components/chart/view/myExperience/Overview.vue`:

```vue
<template>
  <div class="overview-container">
    <!-- Period selector -->
    <div class="controls">
      <button
        v-for="period in ['week', 'month', 'all']"
        :key="period"
        :class="{ active: selectedPeriod === period }"
        @click="selectedPeriod = period"
        class="btn"
      >
        {{ period.toUpperCase() }}
      </button>
    </div>

    <!-- Main content -->
    <div class="content">
      <!-- Summary metrics -->
      <div class="metric-box">
        <h3>Total Amount</h3>
        <p class="value">{{ totalAmount }}</p>
      </div>

      <!-- Chart -->
      <div class="chart-box">
        <ChartComponent :data="chartData" />
      </div>

      <!-- Table -->
      <div class="table-box">
        <TableComponent :items="tableItems" />
      </div>
    </div>
  </div>
</template>

<script>
import dayjs from 'dayjs'
import ChartComponent from './charts/Chart.vue'
import TableComponent from './charts/Table.vue'
import mixin from '@/components/chart/view/mixin'

export default {
  name: 'OverviewComponent',
  components: { ChartComponent, TableComponent },
  mixins: [mixin],  // Mixin provides data reactivity & connects pipeline output (values prop) to component
  props: {
    values: {
      type: Array,
      required: true  // Populated by pipeline: { headers, items } from customPipeline
    }
  },
  data() {
    return {
      selectedPeriod: 'week'
    }
  },
  computed: {
    data() {
      return this.values[0] || {}
    },

    totalAmount() {
      const payments = this.data.payments?.items || []
      return payments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)
    },

    chartData() {
      const payments = this.data.payments?.items || []
      return payments.map(p => ({
        date: dayjs(p.date).format('MMM DD'),
        amount: p.amount
      }))
    },

    tableItems() {
      return this.data.transactions?.items || []
    }
  }
}
</script>

<style scoped>
.overview-container {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.controls {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.btn {
  padding: 8px 16px;
  border: 1px solid #ccc;
  background: white;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.3s;
}

.btn.active {
  background: #2196f3;
  color: white;
  border-color: #2196f3;
}

.content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.metric-box,
.chart-box,
.table-box {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  background: white;
}

.value {
  font-size: 32px;
  font-weight: bold;
  color: #2196f3;
  margin: 10px 0;
}

@media (max-width: 768px) {
  .content {
    grid-template-columns: 1fr;
  }
}
</style>
```

### 7.3 Data Visualization Component

Implement the chart visualization component at `data-experience/src/components/chart/view/myExperience/charts/Chart.vue`:

```vue
<template>
  <ApexChart
    type="bar"
    :height="300"
    :options="chartOptions"
    :series="chartSeries"
  />
</template>

<script>
import VueApexCharts from 'vue-apexcharts'

export default {
  name: 'ChartComponent',
  components: { ApexChart: VueApexCharts },
  props: {
    data: {
      type: Array,
      required: true
    }
  },
  computed: {
    chartSeries() {
      return [
        {
          name: 'Amount',
          data: this.data.map(d => d.amount)
        }
      ]
    },

    chartOptions() {
      return {
        chart: {
          type: 'bar',
          toolbar: { show: false }
        },
        xaxis: {
          categories: this.data.map(d => d.date)
        },
        yaxis: {
          title: { text: 'Amount' }
        }
      }
    }
  }
}
</script>

<style scoped>
:deep(.apexcharts-canvas),
:deep(.apexcharts-inner),
:deep(svg) {
  width: 100% !important;
}
</style>
```

### 7.4 Data Table Component

Implement the table display component at `data-experience/src/components/chart/view/myExperience/charts/Table.vue`:

```vue
<template>
  <div>
    <h3>Transactions</h3>
    <table v-if="items.length">
      <thead>
        <tr>
          <th>ID</th>
          <th>Status</th>
          <th>Time</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in items" :key="item.id">
          <td>{{ item.id }}</td>
          <td>{{ item.status }}</td>
          <td>{{ item.timestamp }}</td>
        </tr>
      </tbody>
    </table>
    <p v-else>No data</p>
  </div>
</template>

<script>
export default {
  name: 'TableComponent',
  props: {
    items: {
      type: Array,
      required: true
    }
  }
}
</script>

<style scoped>
table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

th {
  background-color: #f5f5f5;
  font-weight: 600;
}
</style>
```

---

## 8. Implementation Phase 6: State Management (Optional)

**Duration**: Approximately 10 minutes

### 8.1 Reactive State Store

Implement state management at `data-experience/src/components/chart/view/myExperience/store/myStore.js`:

```javascript
import { reactive } from 'vue'
import dayjs from 'dayjs'

export const myStore = reactive({
  selectedPeriod: 'week',
  periodStart: null,
  periodEnd: null,
  allTimeStart: null,
  allTimeEnd: null,

  setPeriod(start, end) {
    this.periodStart = start
    this.periodEnd = end
  },

  setMode(mode) {
    this.selectedPeriod = mode
  },

  initFromData(items) {
    if (!items || !items.length) return

    let earliest = null
    let latest = null

    items.forEach(item => {
      const d = dayjs(item.timestamp)
      if (!d.isValid()) return

      if (!earliest || d.isBefore(earliest)) earliest = d
      if (!latest || d.isAfter(latest)) latest = d
    })

    if (!latest) return

    this.allTimeStart = earliest.startOf('day').toISOString()
    this.allTimeEnd = latest.endOf('day').toISOString()

    const start = latest.startOf('week').add(1, 'day')
    const end = start.add(6, 'day').endOf('day')
    this.setPeriod(start.toISOString(), end.toISOString())
  }
})
```

### 8.2 Store Integration

Integrate the store into component logic:

```javascript
import { myStore } from './store/myStore'

export default {
  mounted() {
    myStore.initFromData(this.data.payments?.items || [])
  }
}
```

---

## 9. Implementation Phase 7: User Onboarding (Optional)

**Duration**: Approximately 15 minutes

### 9.1 Interactive Tutorial Implementation

Implement user onboarding at `data-experience/src/components/chart/view/myExperience/onboarding/tour.js`:

```javascript
export function createTour() {
  const tour = new Shepherd.Tour({
    useModalOverlay: true,
    defaultStepOptions: {
      scrollTo: true,
      cancelIcon: { enabled: true },
      classes: 'shadow-lg bg-white rounded'
    }
  })

  tour.addStep({
    id: 'intro',
    text: 'Welcome! Let me show you around.',
    buttons: [
      { text: 'Skip', action: tour.cancel },
      { text: 'Start', action: tour.next }
    ]
  })

  tour.addStep({
    id: 'controls',
    attachTo: { element: '.controls', on: 'bottom' },
    text: 'Use these buttons to filter by time period.',
    buttons: [{ text: 'Next', action: tour.next }]
  })

  tour.addStep({
    id: 'chart',
    attachTo: { element: '.chart-box', on: 'top' },
    text: 'This chart shows your data over time.',
    buttons: [{ text: 'Done', action: tour.complete }]
  })

  return tour
}
```

### 9.2 Tour Integration

Integrate the onboarding tour into component lifecycle:

```javascript
import { createTour } from './onboarding/tour'

export default {
  mounted() {
    const tour = createTour()
    // tour.start() // Uncomment to auto-start
  }
}
```

---

## 10. Implementation Phase 8: Test Suite Development

**Duration**: Approximately 20 minutes

### 10.1 Unit Test Specification

Implement unit tests at `data-experience/src/__tests__/my-experience/pipeline.test.js`:

```javascript
import { experience } from '@hestia.ai/my-experience'
import { FileManager } from '@/utils/FileManager'

describe('my-experience pipelines', () => {
  let fileManager

  beforeEach(() => {
    const preprocessors = experience.options.preprocessors
    const files = experience.options.files
    fileManager = new FileManager(preprocessors, null, files)

    jest.spyOn(fileManager, 'getCsvItemsFromId').mockImplementation(async id => {
      if (id === 'PaymentsFile') {
        return [{
          headers: ['date', 'amount', 'currency'],
          items: [
            { date: '2026-01-01', amount: '100.00', currency: 'USD' },
            { date: '2026-01-02', amount: '150.00', currency: 'USD' }
          ]
        }]
      }
      if (id === 'TransactionsFile') {
        return [{
          headers: ['id', 'status', 'timestamp'],
          items: [
            { id: 'TXN001', status: 'completed', timestamp: '2026-01-01' }
          ]
        }]
      }
      return []
    })
  })

  test('overviewPipeline returns correct structure', async () => {
    const pipeline = experience.options.customPipelines.overviewPipeline
    const result = await pipeline({ fileManager })

    expect(result.headers).toEqual(['payments', 'transactions'])
    expect(result.items).toHaveLength(1)
    expect(result.items[0].payments).toBeDefined()
    expect(result.items[0].transactions).toBeDefined()
  })
})
```

### 10.2 Performance Benchmark Tests

Implement performance tests at `data-experience/src/__tests__/my-experience/performance.test.js`:

```javascript
import { mount } from '@vue/test-utils'
import Overview from '@/components/chart/view/myExperience/Overview.vue'

function generateMockData(count) {
  return Array.from({ length: count }, (_, i) => ({
    date: new Date(2026, 0, 1 + i % 30).toISOString(),
    amount: Math.random() * 1000,
    currency: 'USD'
  }))
}

const describeIfPerf = process.env.RUN_PERF === 'true' ? describe : describe.skip

describeIfPerf('Overview performance', () => {
  it('mounts with 10000 items in < 2s', () => {
    const t0 = performance.now()

    mount(Overview, {
      propsData: {
        values: [{
          payments: { items: generateMockData(10000) },
          transactions: { items: [] }
        }]
      },
      stubs: { ApexChart: true }
    })

    const duration = performance.now() - t0
    expect(duration).toBeLessThan(2000)
  })
})
```

Run tests:

```bash
cd data-experience
npm run test
RUN_PERF=true npm run test -- my-experience
```

---

## 11. Implementation Phase 9: Experience Registration

**Duration**: Approximately 5 minutes

### 11.1 Package Export Registration

Register the experience in `packages/packages.ts`:

```typescript
export { default as MyExperience } from './experiences/my-experience/src/index'
```

### 11.2 Development Configuration

Update the development configuration file `experiences/config/dev.json`:

```json
{
  "experiences": ["my-experience", "uber-eats", "babysits"]
}
```

---

## 12. Implementation Phase 10: Build and Verification

**Duration**: Approximately 10 minutes

### 12.1 Build Process

Execute the complete build process:

```bash
# From project root
npm run setup

cd data-experience
npm run dev:app
```

Access the development environment at http://localhost:8080 and verify experience functionality.

---

## 13. Deployment Verification Checklist

Verify the following requirements before deployment:

- [ ] Package structure created according to specification
- [ ] `index.ts` contains mappings for all required CSV files
- [ ] `viewer.json` configured with all required viewBlocks
- [ ] Data pipelines correctly load and transform source data
- [ ] Vue components render without runtime errors
- [ ] Standard test suite passes: `npm run test`
- [ ] Performance benchmark suite passes: `RUN_PERF=true npm run test`
- [ ] Sample data loads and processes correctly
- [ ] Browser console contains no errors or warnings
- [ ] User interface displays responsive design correctly on all devices

---

## 14. Common Implementation Patterns

### 14.1 CSV Data Loading Pattern

```typescript
const csv = await fileManager.getCsvItemsFromId('FileIdentifier')[0] ?? {
  headers: [],
  items: []
}
```

### 14.2 Date Transformation Pattern

```javascript
import dayjs from 'dayjs'
dayjs(timestamp).format('DD.MM.YYYY')
```

### 14.3 Aggregation Pattern

```javascript
const total = items.reduce((sum, item) => sum + parseFloat(item.amount), 0)
```

### 14.4 Responsive Layout Pattern

```css
display: grid;
grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
gap: 20px;
```

---

## 15. Troubleshooting and Error Resolution

| Problem | Solution |
|---------|----------|
| Component not rendering | Check visualization path in viewer.json is correct |
| Files not loading | Check file patterns match actual data export structure |
| Pipeline returns null | Use `?? { headers: [], items: [] }` fallback |
| Build fails | Run `npm run setup` from the repository root |
| Tests timeout | Optimize computed properties, profile with DevTools |
| Tour doesn't show | Call `tour.start()` in mounted hook, check selectors |
| Import errors in tests (e.g., `@hestia.ai/my-experience` not found) | Run `npm run setup` (Jest maps `@hestia.ai/<name>` to `packages/packages/experiences/<name>/dist/index.mjs`, so the package must be built), and add the package to `packages/packages.ts` |

---

## 16. Performance Specifications

The following performance targets define acceptable thresholds for production deployment:

| Operation | Specification | Context |
|-----------|---------------|---------|
| Pipeline execution | < 300 ms | Data transformation |
| Component mount (1K items) | < 500 ms | Standard dataset |
| Component mount (10K items) | < 2000 ms | Large dataset |
| Tour initialization | < 100 ms | Onboarding flow |

---

## 17. References and External Documentation

- [Vue 3 Official Documentation](https://vuejs.org/)
- [TypeScript Language Reference](https://www.typescriptlang.org/docs/)
- [Jest Testing Framework Documentation](https://jestjs.io/docs/getting-started)
- [ApexCharts Visualization Library](https://apexcharts.com/docs/react/)
- [dayjs Date Utility Library](https://day.js.org/)
- [Shepherd.js Tutorial Framework](https://shepherdjs.dev/)

---

## 18. Maintenance and Expansion of Existing Experiences

This section provides guidance for maintaining and extending the existing Uber Eats and Babysits experiences within the platform.

### 18.1 Schema Evolution and Format Changes

When the data export format changes (e.g., new columns or reorganized structure):

**Update File Patterns**: Modify glob patterns in `src/index.ts` to match the new export structure:
```typescript
const loaderOptions: LoaderOptions = {
  files: {
    NewFilePattern: '**/updated-export-*.csv'  // Adjust to new naming convention
  }
}
```

**Revise Transformation Logic**: Update mapping functions in `src/viewer-functions.ts` to parse new CSV columns and maintain backward compatibility when possible.

### 18.2 Adding New Analytics and Visualizations

To extend an experience with new metrics or charts (e.g., "Tips over Time" for Uber Eats):

1. **Create Pipeline Function**: Add new async function in `viewer-functions.ts`:
   ```typescript
   async function tipsPipeline({ fileManager }) {
     const data = (await fileManager.getCsvItemsFromId('PaymentsFile'))[0] ?? { items: [] }
     return { headers: ['date', 'tip_amount'], items: data.items }
   }
   ```

2. **Register in Viewer Configuration**: Add viewBlock in `viewer.json`:
   ```json
   {
     "id": "tips-analytics",
     "customPipeline": "tipsPipeline",
     "visualization": "myExperience/charts/TipsChart.vue"
   }
   ```

3. **Implement Component**: Create new Vue component in `charts/` subdirectory following existing component patterns.

### 18.3 File Locations for Existing Experiences

| Experience | Data Logic Path | UI Components Path |
|------------|-----------------|-------------------|
| **Uber Eats** | `packages/packages/experiences/uber-eats/src/` | `data-experience/src/components/chart/view/uberEats/` |
| **Babysits** | `packages/packages/experiences/babysits/src/` | `data-experience/src/components/chart/view/babysits/` |

### 18.4 Updating Onboarding Tours

Interactive tours for each experience are managed in the onboarding subdirectory:

```
data-experience/src/components/chart/view/[experience-name]/onboarding/tour.js
```

Modify tour steps by editing the `addStep()` calls in the tour.js file. Update selectors if UI elements have been restructured, and test the tour in development mode before deployment.

