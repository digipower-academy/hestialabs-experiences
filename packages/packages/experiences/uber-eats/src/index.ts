import packageJSON from '../package.json'
import { Experience, LoaderOptions, ViewerOptions } from '@/index'
import viewerOptions from './uber-eats-viewer.json'
import viewerFunctions from './viewer-functions'

const loaderOptions: LoaderOptions = {
  viewerVersion: 1,
  files: {
    DriverOnlineOffline: '**/11 - Driver Online Offline.csv',
    DriverPayments: '**/23a - Driver Payments.csv',
    CourierLifetimeTripData: '**/31 - Courier Lifetime Trip Data.csv'
  }
}

export default new Experience(
  loaderOptions,
  viewerOptions as ViewerOptions,
  packageJSON,
  import.meta.url,
  viewerFunctions
)
