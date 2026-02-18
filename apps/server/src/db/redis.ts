import Redis from 'ioredis'

// Use the environment variable or fallback to the specific cloud instance if env is missing for some reason
const REDIS_URL = process.env.REDIS_URL || 'redis://default:Wh7HUP8L8HeCkfh84fsHwdkkgnskerhp@redis-12216.c51.ap-southeast-2-1.ec2.cloud.redislabs.com:12216'

export const redis = new Redis(REDIS_URL)

redis.on('connect', () => {
  console.log('Redis connected successfully')
})

redis.on('error', (err) => {
  console.error('Redis connection error:', err)
})

export default redis
