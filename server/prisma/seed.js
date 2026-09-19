const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

const ADMIN_USERNAME = 'HotSa1t'
const ADMIN_PASSWORD = '735123'

async function main() {
  const existing = await prisma.admin.count()
  if (existing > 0) {
    console.log('Admin already exists, skipping seed.')
    return
  }

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10)
  await prisma.admin.create({ data: { username: ADMIN_USERNAME, password: hashedPassword } })
  console.log(`Seeded admin: ${ADMIN_USERNAME} (password: ${ADMIN_PASSWORD})`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())