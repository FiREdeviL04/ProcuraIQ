import { Queue } from 'bullmq'

let queue: Queue | null = null

export function getExportQueue() {
  if (!process.env.REDIS_HOST && !process.env.REDIS_URL) {
    return null
  }

  const connection = process.env.REDIS_URL
    ? { url: process.env.REDIS_URL }
    : {
        host: process.env.REDIS_HOST!,
        port: Number(process.env.REDIS_PORT || 6379),
      }

  if (!queue) {
    queue = new Queue('exportJobs', { connection })
  }
  return queue
}
