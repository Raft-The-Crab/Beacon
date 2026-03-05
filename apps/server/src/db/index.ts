import { PrismaClient } from '@prisma/client'
import { connectMongo, MessageModel, AuditLogModel, ModerationReportModel } from './mongo'
import { redis } from '../services/redis'

const prismaOptions: any = {
  log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['warn', 'error'],
}
const url = process.env.DATABASE_URL
if (url) {
  let finalUrl = url
  if (!finalUrl.includes('connection_limit')) {
    finalUrl += finalUrl.includes('?') ? '&connection_limit=20' : '?connection_limit=20'
  }
  if (!finalUrl.includes('pool_timeout')) {
    finalUrl += '&pool_timeout=10'
  }
  prismaOptions.datasources = {
    db: {
      url: finalUrl,
    },
  }
}

let prisma: PrismaClient | null = null

try {
  if (process.env.DATABASE_URL) {
    prisma = new PrismaClient(prismaOptions)
    console.log('✅ Prisma client initialized')
  } else {
    console.warn('⚠️  DATABASE_URL not set, Prisma disabled')
  }
} catch (err) {
  console.error('❌ Prisma client initialization failed:', err)
  prisma = null
}

export { prisma, connectMongo, redis, MessageModel, AuditLogModel, ModerationReportModel }

