import type { FileManager } from '@/types/utils'

async function csv_babysitter_jobs({
  fileManager
}: {
  fileManager: FileManager
}) {
  const csv = (await fileManager.getCsvItemsFromId('BabysitterJobs'))[0] ?? {
    headers: [],
    items: []
  }

  const rows = csv.items

  const parseEuropeanDateSafe = (d: string): Date | null => {
    if (!d) return null
    const parts = d.split('.').map(Number)
    if (parts.length !== 3 || parts.some(isNaN)) return null
    return new Date(parts[2], parts[1] - 1, parts[0])
  }

  const hourToTime = (h: number) => {
    const hours = Math.floor(h)
    const minutes = Math.round((h - hours) * 60)
    return { hours, minutes }
  }

  const formatTime = (d: Date) => {
    const hh = d.getHours().toString().padStart(2, '0')
    const mm = d.getMinutes().toString().padStart(2, '0')
    return `${hh}:${mm}`
  }

  const formatDateLocal = (d: Date) => {
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }

  const items: Record<string, any>[] = []

  for (const r of rows) {
    const dateObj = parseEuropeanDateSafe(r.date)
    if (!dateObj) continue

    const startHour = parseFloat(r.startHour)
    const duration = parseFloat(r.nbHours)
    const price = parseFloat(r.pricePerHour)

    if (isNaN(startHour) || isNaN(duration)) continue

    // compute begin/end timestamps
    const start = hourToTime(startHour)
    const begin = new Date(dateObj)
    begin.setHours(start.hours, start.minutes, 0, 0)

    const endT = hourToTime(startHour + duration)
    const end = new Date(dateObj)
    end.setHours(endT.hours, endT.minutes, 0, 0)

    items.push({
      job_id: r.id,
      date: formatDateLocal(dateObj),
      start_time: formatTime(begin),
      end_time: formatTime(end),
      duration_hours: duration,
      earnings: Number.isFinite(price) ? price * duration : null,
      location: r.cityName || '',
      job_type: r.title || '',
      status: (r.state || '').toLowerCase(),
      category: r.category || ''
    })
  }

  return {
    headers: [
      'job_id',
      'date',
      'start_time',
      'end_time',
      'duration_hours',
      'earnings',
      'location',
      'job_type',
      'status',
      'category'
    ],
    items
  }
}

const viewerFunctions = {
  postprocessors: {},
  customPipelines: {
    csv_babysitter_jobs
  }
}

export default viewerFunctions
