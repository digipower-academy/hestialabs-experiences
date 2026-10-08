
# How to create an experience  

An experience is a visualization of personal data collected by a company on a user.

For an overview of the system see the [README](README.md)

An experience lives in the subproject *packages*. For example [instagram is here](packages/packages/experiences/instagram). You can see all the parts of the experience in the [src/index.ts](packages/packages/experiences/instagram/src/index.ts) file.

It's made up of **loader options** and **viewer options**. The loader options contain the code. The viewer options can be changed by the developer who uses this package. There are default viewer options in file [src/instagram-viewer.json](packages/packages/experiences/instagram/src/instagram-viewer.json)

## Running an experience in development mode

The experience are run in the project *data-experience*. You first need to follow the setup instructions in the  [README](data-experience/README.md)

To run it go to folder *data-experience* and 

``` sh
cd ../data-experience
npm run dev
```

This will open a developement view of the experiences. The app is defined in file [data-experience/dev/App.vue](data-experience/dev/App.vue). To make your life easier while developing the instagram, make it the initialExperience in App.vue:

``` javascript
// const initialExperience = 'uber-driver'
const initialExperience = 'instagram'
```

You can also change the default locale to english:

``` javascript
  // i18nLocales: ['fr', 'en'],
  i18nLocales: ['en', 'fr'],
```

The web page should instantly reflect your change.

## Viewer options (instagram-viewer.json)
The experience's viewer options are taken from the folder *data-experience/public*. The instagram viewer options are in [data-experience/public/instagram-viewer.json](data-experience/public/instagram-viewer.json)

Change the property "dataPortalMessage":

``` json
"dataPortalMessage": "<strong>VERY VERY Important:"
```

The change should be reflected automatically on your web page.

If you want to test the default viewer.json, rename or delete *data-experience/public/instagram-viewer.json*. Then you need to stop and restart your server.

``` sh
npm run dev
```

Now changes in instagram experience's default [instagram-viewer.json](packages/packages/experiences/instagram/src/instagram-viewer.json) should be reflected automatically on the web page.

(Don't bother about the *messages.json* file in the instagram experience; its content has been copied into *instagram-viewer.json* and it's almost certainly no longer being used anywhere).

The tabs in the experience are configured by the root property *viewBlocks* in the viewer.json. Try to remove one. Note: under the property *messages* there are other *viewBlock* properties which only affect the text that a tab displays.

 ``` json
  "viewBlocks": [
    {
      "showTable": false,
      "id": "consumption",
      "sql": "SELECT accountName, datetime AS actionDate, 'Post Viewed' AS actionType FROM InstagramPostViewed UNION SELECT accountName, datetime AS actionDate, 'Video Watched' AS actionType FROM InstagramVideoWatched UNION SELECT accountName, datetime AS actionDate, 'Ad Viewed' AS actionType FROM InstagramAdViewed; ",
      "files": ["postsViewed", "videosWatched", "adsViewed"],
      "visualization": "ChartViewDashboard.vue",
      "vizProps": {
        "graphs": [
          {
            "title": "Content viewed",
            "valueLabel": "views",
            "cols": "12",
            "type": "TimelineChart.vue",
            "dateAccessor": "actionDate"
          },
          {
            "valueLabel": "interactions",
            "title": "Type of content",
            "cols": "6",
            "height": 220,
            "type": "PieChart.vue",
            "valueAccessor": "actionType"
          },
          {
            "valueLabel": "interactions",
            "title": "Top Account",
            "cols": "6",
            "height": 220,
            "type": "TopChart.vue",
            "isScrollable": true,
            "topK": 100,
            "valueAccessor": "accountName"
          }
        ]
      },
      "title": "Consumption",
      "text": "See how much content you watch over time."
    },
 
 ```

Looking at the viewBlock of the first tab *consumption* you notice:
- **files** are the files needed in the user's data for displaying this tab. If one is missing, an error is shown to the user.
- **sql** is a request on a database created by the experience's pipeline.
- **vizualization** tells the experience what visualization component to use. In this case it's [chart/view/ChartViewDashboard.vue](data-experience/src/components/chart/view/ChartViewDashboard.vue).

The visualization components are a part of *data-experience*, the experiences only refer to them by name. The visualization is configured by vizProps that depend on the type of the visualization component. ChartViewDashboard.vue can contain graphs that are also components like [chart/view/dc/TimelineChart.vue](data-experience/src/components/chart/view/dc/TimelineChart.vue). I suspect that only components in the dc folder can be used inside the dashboard.

### Viewer functions

The second tab in the instagram experience defines a postprocessor.

``` json
    {
      "showTable": false,
      "id": "consumption-time",
      "postprocessor": "makeSessions",
```

The postprocessor refers by name to a function called *makeSessions*. This function needs to be defined in instagram's [index.ts](packages/packages/experiences/instagram/src/index.ts) viewerFunctions. Here they are imported from [viewer-functions.ts](packages/packages/experiences/instagram/src/viewer-functions.ts) which takes makeSessions from postprocessors.ts.

The postprocessor is run on the result of the sql query. It's useful for doing things that are hard in SQL and easy in javascript.

## Loader options 

The loader options in [src/index.ts](packages/packages/experiences/instagram/src/index.ts) define most of the processing done in an experience when you click the button *explore your data*. Here's how they look for instagram:

``` json

const loaderOptions: LoaderOptions = {
  viewerVersion: 1,
  databaseConfig,
  files: {
    messages: '**/messages/inbox/**/message_*.json',
    followers: '**/followers.json',
    followings: '**/following.json',
    ...
  },
  preprocessors: {
    '**/*.json': preprocessor
  }
}
```

- *files* names the files from the user's zipped data that are needed for this experience. The glob syntax matches files and folders. (The name given to the file here serves as id for the filemanager).
- *databaseConfig* defines how the files are mapped to database tables. Here it imported from *database.ts*
- *preprocessors* defines functions that need to be run on files that match a glob expression. (In instragram, the preprocessor is imported from the neighbouring facebook experience; that is a bad idea, in js you should only import from projects defined in the package.json dependencies.)

### experience without database (uber)

The uber experience has much simpler loader options in its [index.ts](packages/packages/experiences/uber/src/index.ts):

``` typescript
const loaderOptions: LoaderOptions = {
  viewerVersion: 1,
  files: {
    trips: '**/Rider/trips_data.csv'
  }
}
```
There are no databaseOptions. The data from uber comes in a csv format which is close enough to what we need for the visualization, so we skip the step where we map the data to a database, populate it and query it with sql. 

## The pipeline 

The pipeline is the process that takes a zip file of the user's data and turns into javascript objects that can be used by a chart component.

To start developing a pipeline, it's useful to run it separately from the whole application in the browser. For this you can use tests.

The tests for the experiencs live in project *data-experience* because it has all the machinery for running them.

``` sh
$ cd data-experience
$ npm run test
...
 PASS  src/__tests__/twitter/database.test.js (60.832 s)
 PASS  src/__tests__/facebook/database.test.js (50.432 s)
 PASS  src/__tests__/twitter-agg/database.test.js (60.768 s)
 PASS  src/__tests__/her/database.test.js
 PASS  src/__tests__/uber/pipeline.test.js
 PASS  src/__tests__/tinder/database.test.js
```

## Example: creating a experience for Wolt (customPipeline)
We start with a zip file of a Wolt courier's data. There's one interesting csv file **courier_tasks** with a date in colum *Task completion time*. We would like to display it a bit uber-driver's trips. 

Let's look at the uber-driver experience to find out what charts it's using, in the default values defined in [uber-driver-viewer.json](packages/packages/experiences/uber-driver/src/uber-driver-viewer.json) (in subproject *packages* where the experiences are defined).

It's the second tab of the experience, so it's configured as the second element of the root property *viewBlocks*:

``` json
  "viewBlocks": [
    {
      "id": "driverHeatMap",
      ...
    },
    {
      "id": "driverTrips",
      "customPipeline": "csv_driver_trips",
      "files": ["driver_trips"],
      "title": "Trips",
      "postprocessor": "driverTripsPostProcessor",
      "visualization": "ChartViewDashboard.vue",
      "vizProps": {
        "graphs": [
          {
            "title": "Number of trips",
            "valueLabel": "trips",
            "cols": "12",
            "type": "BarTimelineChart.vue",
            "dateAccessor": "begin_date"
          },
          {
            "valueLabel": "trips",
            "type": "WeekChart.vue",
            "cols": "4",
            "dateAccessor": "begin_date"
          },
          {
            "valueLabel": "trips",
            "type": "HourChart.vue",
            "cols": "4",
            "dateAccessor": "begin_date"
          },
          {
            "valueLabel": "trips",
            "title": "Status of the trip",
            "cols": "4",
            "height": 220,
            "type": "TopChart.vue",
            "valueAccessor": "status"
          }
        ]
      },
      "text": "< TO DEFINE IN TRANSLATIONS >",
      "showTable": false
    },
```

We'll start by creating the first chart. It's a *BarTimelineChart* inside a *ChartViewDashboard*. There is no database, instead there is a *customPipeline* called *csv_driver_trips*. This is named function from a viewer.json, so you can find it's implementation in the experience's [viewer-functions.ts](packages/packages/experiences/uber-driver/src/viewer-functions.ts). 

### Creating the package
Create a git branch.
``` sh
git checkout -b wolt-experience
```

Follow the documentation in the [packages README](packages/README.md#create-a-new-package). 

Things you can skip:
- don't bother changing anything in the top-level *experiences* project 
- don't log in to npm yet, that's for later).


### Creating a customPipeline

In the wolt experience, add code to the index.ts by copying what you need from the uber-driver experience. You'll need to create viewer options and viewer functions.

``` typescript
import packageJSON from '../package.json'
import viewerFunctions from './viewer-functions'
import { Experience, LoaderOptions, ViewerOptions } from '@/index'
import viewerOptions from './wolt-viewer.json'

const loaderOptions: LoaderOptions = {
  viewerVersion: 1,
  files: {
    courier_tasks: 'courier_tasks.csv'
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

### Creating a test
Before running the experience in the browser, we can execute just it's pipeline in a test. Let's start by copying  [data-experience/src/__tests__/uber/pipeline.test.js](data-experience/src/__tests__/uber/pipeline.test.js) to **wolt/pipeline.test.js**. Also copy **samples.helpers.js**.

The tests should still run.
``` sh
npm run test
```

You can run an interactive version of the test runner that lets you choose what tests to run
``` sh
npm run test -- --watch
```

Replace the first line to import the wolt experience, and check the test now fails.

``` javascript
// import experience from '@hestia.ai/uber'
import experience from '@hestia.ai/wolt
```

Add some anonymized test data to *samples.helpers.js*

``` js
// input of the test
export const courierTasks = `"Task creation time ","Task completion time","Is pickup task","Completed with vehicle type","Arrived at","Started at","Arrival time","Departed at"
"2021-04-24 16:19:34.025","2021-04-24 17:13:35.463",TRUE,"BICYCLE","2021-04-24 16:56:59.914","2021-04-24 16:55:03.975","2021-04-24 17:12:54",
"2021-05-07 15:07:02.476","2021-05-07 15:26:22.875",FALSE,"BICYCLE","2021-05-07 15:24:14.696","2021-05-07 15:19:55.534","2021-05-07 15:25:54",`

// expected output of the test
export const courierTasksHeaders = [
  'begin_date'
]
export const courierTasksItems = [
  {
    begin_date: '2021-04-24 16:19:34.025'
  },
  {
    begin_date: '2021-05-07 15:07:02.476'
  }
]
```

Adapt **wolt/pipeline.test.js**
```
import experience from '@hestia.ai/wolt'
import { courierTasksHeaders, courierTasksItems, courierTasks } from './samples.helpers'
import FileManager from '~/utils/file-manager'
import NodeFile from '~/utils/node-file'
import { arrayEqualNoOrder, getViewBlock } from '~/utils/test-utils'

const { preprocessors, files, keepOnlyFiles } = experience.options
const fileManager = new FileManager(
  preprocessors,
  null,
  files,
  keepOnlyFiles
)
// courier_tasks.csv is at the root of the zip
const fileTasks = new NodeFile('courier_tasks.csv', courierTasks)

describe('with complete samples', () => {
  beforeAll(async() => await fileManager.init([fileTasks]))
  test('pipeline courierTasks returns the correct items', async() => {
    const blockId = 'courierTasks'
    const viewBlock = getViewBlock(experience, blockId)
    const pipeline = viewBlock.customPipeline
    const postprocessor = viewBlock.postprocessor
    const pipelineResult = await pipeline({ fileManager })
    const result = await postprocessor(pipelineResult)
    const expected = {
      headers: courierTasksHeaders,
      items: courierTasksItems
    }
    arrayEqualNoOrder(result.headers, expected.headers)
    arrayEqualNoOrder(result.items, expected.items)
  })
})
```

Once the pipeline test works, you can try to run it in development
### Running the experience in development mode

Create some fake sample data in a wolt.zip and save it as **data-experience/public/data-samples/wolt.zip**, so when the dev app is running it will be able to access it with the at [http://localhost:8080/data-samples/wolt.zip](http://localhost:8080/data-samples/wolt.zip)

Configure the data-samples in the experience's [wolt-viewer.json](packages/packages/experiences/wolt/src/wolt-viewer.json). For some reason, you absolutely need to add a parameter with the file name.

``` json
  "dataSamples": [
    "http://localhost:8080/data-samples/wolt.zip?filename=wolt.zip"
  ],
```

Make sure that the experience's [index.ts](packages/packages/experiences/wolt/src/index.ts), the loaderOptions configure the right file:

``` typescript
const loaderOptions: LoaderOptions = {
  viewerVersion: 1,
  files: {
    courier_tasks: '**/courier_tasks.csv'
  }
}
```


Import the new experience in [data-experience/dev/App.vue](data-experience/dev/App.vue)
``` javascript
import wolt from '@hestia.ai/wolt'

const experienceObjects = [
//...
  wolt
]
```

``` sh
cd ../data-experience
npm run dev
```

The new experience should be available in the Experience dropdown.

### Publishing the package to npm

Move your anonymized data sample *wolt.zip* to [packages/lib](packages/lib). Once committed and pushed to github, this is were the experience will download it from.

Change the address of your dataSamples in [wolt-viewer.json](packages/packages/experiences/wolt/src/wolt-viewer.json). For some reason, you absolutely need to add a parameter with the file name. (The contenthash is probably just for cache busting, change it in case you update the wolt.zip).

``` json
  "dataSamples": [
  "https://raw.githubusercontent.com/hestiaAI/hestialabs-experiences/master/packages/lib/data-samples/wolt.zip?contenthash=c03f3fb83b90ecaa150a&filename=wolt.zip"
  ],
```

You can also delete the temporary **data-experience/public/data-samples/wolt.zip** now.

Check that all tests pass.

``` sh
cd ./packages
npm run test
cd ./data-experience
npm run test
```

Follow the documentation in the [packages README](packages/README.md#login-to-npm) and follow the steps:
- Login to npm
- Publish packages

``` sh
git push --set-upstream origin wolt-experience
```
On github repo [hestialabs-experiences](https://github.com/hestiaAI/hestialabs-experiences/) go to your branch click on contribute and create a pull request.

Wait until all the tests have passed, ask for a code review or not, and merge the pull request.

### Add the experience to digipower.academy

The website digipower.academy is built from subproject *experiences*. It imports *data-experience* so you need to build it first (I think).

For an experience to look nice on experiences, you want set a logo icon in [wolt-viewer.json](packages/packages/experiences/wolt/src/wolt-viewer.json), and republish the experience.

As explained in the [packages README](packages/README.md#create-a-new-package),
add the name of the new package to the `experiences` Array in [dev.json](https://github.com/hestiaAI/hestialabs-experiences/blob/master/experiences/config/dev.json).

``` sh
cd ../data-experience
npm run build
cd ../dc-dashboard
npm i
npm run build
cd ../experiences
npm i
npm run dev
```

If it looks like what you like, ask François to configure the prod version to show your experience and deploy it on digipower.academy. It's documented in the readmes, but somewhat complicated and you need access to netlify.


## Example: creating experience that works with a (database)

Let's use the same data as the previous example and store it in a database instead. We can follow the example of the her experience, which reads csv files and stores the data in a database. 

Let's call it **database-template**. It's going to serve as an example for creating other experiences that would be named after an organization like **wolt** or **her**.

Looking at the her experience, we find that matches have a similar shape as the tasks in the previous example. In [her-viewer.json](packages/packages/experiences/her/src/her-viewer.json) we see it configured like this:

``` json
    {
      "showTable": false,
      "id": "matches",
      "sql": "SELECT * FROM HerLike; ",
      "files": ["liked"],
      "visualization": "ChartViewOverviewHer.vue",
      "title": "Matches",
      "text": "Look at the likes you've made that have become matches or not."
    }
```

It's using a chart made specifically for Her, **ChartViewOverviewHer**. Instead we will use the same generic chart as the previous example.

There is an **sql** property that's set to an SQL query on table HerLike. That table is created by migration tool that lives in [data-experience/src/utils/sql.js](data-experience/src/utils/sql.js).

The migration for Her is configured by the databaseConfig in the loader options of its [index.ts](packages/packages/experiences/her/src/index.ts)

``` typescript
import databaseConfig from './database'

const loaderOptions: LoaderOptions = {
  viewerVersion: 1,
  databaseConfig,
  //...
```

The config itself comes from [database.ts](packages/packages/experiences/her/src/database.ts)

Where you can see a definition of table HerLike with three columns:

``` typescript
const config: DatabaseConfig = {
  tables: [
    {
      name: 'HerLike',
      columns: [
        ['name', TEXT],
        ['likedAt', TEXT],
        ['matched', TEXT]
      ]
    },
   //...
```

And getters that specify where the data from the columns is taken from.
``` typescript
   //...
  getters: [
    {
      // This is the file
      fileId: 'liked',
      
      // This is the path to the items
      path: '$.items[*]',
      table: 'HerLike',
      getters: [
        {
          column: 'name',
          // This is how we get from the item 
          // to the value we want for the column
          path: '$.name'
        },
        {
          column: 'likedAt',
          path: '$.likedAt'
        },
        {
          column: 'matched',
          path: '$.matched'
        }
      ]
    },
```

The fileId refers to a file in the loaderOptions of [index.ts](packages/packages/experiences/her/src/index.ts)

``` typescript
const loaderOptions: LoaderOptions = {
  viewerVersion: 1,
  databaseConfig,
  files: {
    liked: '**/liked.csv',
    //...
```

### Creating the package
Follow the documentation in the [packages README](packages/README.md#create-a-new-package). 

Things you can skip:
- don't bother changing anything in the top-level *experiences* project 
- don't log in to npm yet, that's for later).

### Create the database pipeline

In the database-template experience, add code to the index.ts by copying what you need from the her experience. You'll need to create viewer options and viewer functions.

The file is the same as in the previous wolt experience.
``` typescript
import packageJSON from '../package.json'
import { Experience, LoaderOptions, ViewerOptions } from '@/index'
import viewerOptions from './database-template-viewer.json'
import databaseConfig from './database'

const loaderOptions: LoaderOptions = {
  viewerVersion: 1,
  databaseConfig,
  files: {
    courier_tasks: '**/courier_tasks.csv'
  }
}

export default new Experience(
  loaderOptions,
  viewerOptions as ViewerOptions,
  packageJSON,
  import.meta.url
)
```

Create database-template-viewer.json from wolt. We change the visualization to use **ChartViewDashboard.vue**. To see an example of a ChartViewDashboard that uses a database pipeline, we look at [instagram-viewer.json](packages/packages/experiences/instagram/src/instagram-viewer.json) and see the *sql* attribute lives next to the id.

``` json
{
  "title": "Database template",
  "version": 1,
  "hideFileExplorer": false,
  "hideEmptyTabs": true,
  "dataPortal": "https://example.com/en/isl/courier-privacy-policy",
  "dataSamples": [
    "https://raw.githubusercontent.com/hestiaAI/hestialabs-experiences/master/packages/lib/data-samples/wolt.zip?contenthash=c03f3fb83b90ecaa150a&filename=wolt.zip"
  ],
  "icon": "https://raw.githubusercontent.com/hestiaAI/hestialabs-experiences/master/packages/lib/icons/uber.png",
  "viewBlocks": [
    {
      "id": "courierTasks",
      "sql": "SELECT begin_date FROM CourierTasks; ",
      "customPipeline": "csv_tasks",
      "files": ["courier_tasks"],
      "title": "Tasks",
      "postprocessor": "courierTasksPostProcessor",
      "visualization": "ChartViewDashboard.vue",
      "vizProps": {
        "graphs": [
          {
            "title": "Number of tasks",
            "valueLabel": "tasks",
            "cols": "12",
            "type": "BarTimelineChart.vue",
            "dateAccessor": "begin_date"
```

We change the sql to a query similar to the one in 
[her-viewer.json](packages/packages/experiences/her/src/her-viewer.json)

 ``` sql
      SELECT begin_date FROM CourierTasks;
 ```

So we need a table CourierTasks with a column begin_date. We define them in the database configuration [database.ts](packages/packages/experiences/her/src/database.ts).

We assume this will allow the script to read the column *taskCreationTime* which is not camecased in the csv.

``` typescript

const config: DatabaseConfig = {
  tables: [
    {
      name: 'CourierTasks',
      columns: [['begin_date', TEXT]]
    }
  ],
  getters: [
    {
      fileId: 'courier_tasks',
      path: '$.items[*]',
      table: 'CourierTasks',
      getters: [
        {
          column: 'begin_date',
          path: '$.taskCreationTime'
        }
      ]
    }
  ]
}
```

Paths are using the syntax of [JSONPath plus](https://github.com/JSONPath-Plus/JSONPath).

Note that getters can also be configured by code for difficult cases like an instagram property with a name that changes according to the user's language. See [instagram's database.ts](packages/packages/experiences/instagram/src/database.ts)

``` typescript
    {
      fileId: 'personalInfos',
      path: '$.profile_user[*].string_map_data',
      table: 'InstagramInfo',
      options: {
        callback: output => {
          const o = output as JSONPathRecord
          // Get 4th value == Name, language dependent
          o['name'] = Object.values(o)[3].value
        }
      },
      getters: [
        {
          column: 'name',
          path: 'name'
        }
      ]
    },

```

This snippet in 
[tinder's database.ts](packages/packages/experiences/tinder/src/database.ts)
 creates a new property on items and populates it with a string extracted from a property on their grandParent

``` typescript

  getters: [
    {
      fileId: 'tinder',
      path: '$.Usage.[*]@number()',
      table: 'TinderUsage',
      options: {
        resultType: JSONPathResultType.all,
        callback: output => {
          const o = output as JSONPathReturnObject
          o['grandparentProperty'] = o.pointer.split('/')[2]
        }
      },
      getters: [
        {
          column: 'actionType',
          path: '$.grandparentProperty'
        },
```

This will validate the database config and run some checks on the experiences 

``` typescript
cd ../packages
npm run test
```

### Creating a database test 
Start by installing the new experience package

``` sh
cd ../data-experience 
npm i
```

Copy  [data-experience/src/__tests__/her/database.test.js](data-experience/src/__tests__/her/database.test.js) to **database-template/database.test.js**. Also copy the samples from the wolt test **wolt/samples.helpers.js**. Change the names of fields and tables.


### Running the experience in development mode

We are using the wolt.zip as dummy data, so the configuration is already done.

Import the new experience in [data-experience/dev/App.vue](data-experience/dev/App.vue)
``` javascript
import databaseTemplate from '@hestia.ai/database-template'

const experienceObjects = [
//...
  databaseTemplate
]
```

``` sh
cd ../data-experience
npm run dev
```

The new experience should be available in the Experience dropdown.

## A quick list for all the files that needed to be changed in data-experience when creating a new experience

- **[data-experience](data-experience/)** package (runs the packages):

- [ ] [dev/App.vue](data-experience/dev/App.vue): we need to add the newly created experience so that it gets displayed.
- [ ] [public/other-viwer.json](data-experience/public/other-viwer.json): (optional) renders the default view/visual for that experience. If that doesn't exists, it searches in the packages.
- [ ] [src/_tests__/wolt](data-experience/src/_tests__/wolt): test. you should start with the test for the experience you want to create and test either the custom pipeline or the database


- **[experiences](experiences/)** package (that runs the digipower.academy):
- [ ] [config/dev.json](experiences/config/dev.json): we add the new experience there so it gets displayed to digipower.academy

- **[packages](packages/)** package (where you develop the code for the new experience, ex. 'wolt'):

- [ ] [packages/experiences/wolt/](packages/packages/experiences/wolt/): the folder that creates everything on the new experience (and everything below)
- [ ] [packages/experiences/wolt/package.json](packages/packages/experiences/wolt/package.json): we need to add the newly created experience so that it gets displayed.
- [ ] [lib/data-samples/](packages/lib/data-samples/): the folder where we put the sample/default data for each experience
- [ ] [packages.ts](packages/packages.ts): exports the code to the world
