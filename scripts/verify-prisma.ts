import 'dotenv/config'
import { prisma } from '../lib/prisma'

async function main() {
    const userCount = await prisma.user.count()
    const postCount = await prisma.post.count()
    console.log(`✅ Connected (${userCount} users, ${postCount} posts)`)
}

main().catch(e => {
    console.error('❌ Connection failed:', e)
    process.exit(1)
})
