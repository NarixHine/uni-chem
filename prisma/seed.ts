import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../lib/generated/prisma/client'
import pg from 'pg'

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    const alice = await prisma.user.upsert({
        where: { email: 'alice@example.com' },
        update: {},
        create: { email: 'alice@example.com', name: 'Alice' },
    })

    const bob = await prisma.user.upsert({
        where: { email: 'bob@example.com' },
        update: {},
        create: { email: 'bob@example.com', name: 'Bob' },
    })

    await prisma.post.createMany({
        data: [
            { title: 'Hello World', content: 'First post!', authorId: alice.id, published: true },
            {
                title: 'Prisma is great',
                content: 'Loving Prisma Postgres',
                authorId: alice.id,
                published: true,
            },
            { title: 'Draft post', content: 'Still writing...', authorId: bob.id },
        ],
    })

    console.log('Seed complete!')
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(() => pool.end())
