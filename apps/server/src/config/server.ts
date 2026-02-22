import os from 'os'

export const serverConfig = {
  workers: 1,
  maxConnections: 100,
  wsHeartbeatInterval: 60000,
  wsMaxPayloadSize: 102400,
  gcInterval: 300000,
  redis: {
    maxMemoryPolicy: 'allkeys-lru',
    maxMemory: '50mb',
    ttl: { session: 3600, permissions: 300, presence: 60 }
  },
  postgres: { max: 5, idleTimeoutMillis: 30000, connectionTimeoutMillis: 2000 },
  mongodb: { maxPoolSize: 5, minPoolSize: 1, maxIdleTimeMS: 30000 }
}

if (process.env.NODE_ENV === 'production') {
  setInterval(() => {
    if (global.gc) global.gc()
  }, serverConfig.gcInterval)
}

setInterval(() => {
  const used = process.memoryUsage()
  const mb = (bytes: number) => Math.round(bytes / 1024 / 1024)
  console.log(`[Memory] RSS: ${mb(used.rss)}MB, Heap: ${mb(used.heapUsed)}/${mb(used.heapTotal)}MB`)
  if (mb(used.heapUsed) > 350) console.warn('[Memory] High usage!')
}, 60000)

export default serverConfig
