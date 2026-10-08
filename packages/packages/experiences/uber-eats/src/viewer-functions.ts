import type { FileManager } from '@/types/utils'

async function combined_data_pipeline({
  fileManager
}: {
  fileManager: FileManager
}) {
  const driverOnlineCsv = (
    await fileManager.getCsvItemsFromId('DriverOnlineOffline')
  )[0] ?? {
    headers: [],
    items: []
  }

  const onlineItems = driverOnlineCsv.items.map(row => {
    const begin = row.beginTimestampLocal
    const end = row.endTimestampLocal
    const hours = row.durationMs ? Number(row.durationMs) / 1000 / 3600 : null
    const state = row.earnerState

    return { begin, end, hours, state }
  })

  // Get driver payments
  const payments = (
    await fileManager.getCsvItemsFromId('DriverPayments')
  )[0] ?? {
    headers: [],
    items: []
  }

  // Get trip data
  const trips = (
    await fileManager.getCsvItemsFromId('CourierLifetimeTripData')
  )[0] ?? {
    headers: [],
    items: []
  }

  return {
    headers: ['online', 'payments', 'trips'],
    items: [
      {
        online: { headers: ['begin', 'end', 'hours'], items: onlineItems },
        payments,
        trips
      }
    ]
  }
}

// courier trips for kepler (return rawCsv + kepler config)
async function csv_courier_trips({
  fileManager
}: {
  fileManager: FileManager
}) {
  const csv = (
    await fileManager.getCsvItemsFromId('CourierLifetimeTripData')
  )[0] ?? { headers: [], items: [] }

  return {
    headers: ['trips'],
    items: [
      {
        trips: csv
      }
    ]
  }
}

const viewerFunctions = {
  postprocessors: {
    // add named postprocessors if needed
  },
  customPipelines: {
    combined_data_pipeline,
    csv_courier_trips
  }
}

export default viewerFunctions
