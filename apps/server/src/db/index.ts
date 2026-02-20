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

let prisma: PrismaClient
try {
	prisma = new PrismaClient(prismaOptions)
} catch (err) {
	console.error('Prisma client initialization failed, creating fallback client:', err)
	prisma = new PrismaClient()
}

export { prisma }

export { connectMongo, redis, MessageModel, AuditLogModel, ModerationReportModel }

