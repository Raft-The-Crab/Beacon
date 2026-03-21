import { PrismaClient } from '@prisma/client'
import { connectMongo, MessageModel, AuditLogModel, ModerationReportModel } from './mongo'
import { redis } from '../services/redis'
import { logger } from '../services/logger'

const prismaOptions: any = {
  log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['warn', 'error'],
}
const url = process.env.DATABASE_URL
if (url) {
  let finalUrl = url
  if (!finalUrl.includes('connection_limit')) {
    finalUrl += finalUrl.includes('?') ? '&connection_limit=50' : '?connection_limit=50'
  }
  if (!finalUrl.includes('pool_timeout')) {
    finalUrl += '&pool_timeout=30'
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
    logger.success('Prisma client initialized')
  } else {
    logger.warn('DATABASE_URL not set, Prisma disabled')
  }
} catch (err: any) {
  logger.error('Prisma client initialization failed: ' + err.message)
  prisma = null
}

export { prisma, connectMongo, redis, MessageModel, AuditLogModel, ModerationReportModel }

