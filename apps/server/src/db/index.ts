import { PrismaClient } from '@prisma/client'
import { connectMongo, MessageModel, AuditLogModel, ModerationReportModel } from './mongo'
import { redis } from './redis'

const prismaOptions: any = {}
if (process.env.DATABASE_URL) {
  prismaOptions.datasources = {
    db: {
      url: process.env.DATABASE_URL,
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

