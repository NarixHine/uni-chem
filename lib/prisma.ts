import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from './generated/prisma/client'
import pg from 'pg'
import { attachDatabasePool } from '@vercel/functions'

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
})
attachDatabasePool(pool)
const adapter = new PrismaPg(pool)
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
